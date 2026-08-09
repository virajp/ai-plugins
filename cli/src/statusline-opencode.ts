/**
 * The OpenCode statusline.
 *
 * Like its Claude and Oh-My-Pi siblings this is **not a plugin, and therefore
 * not an adapter** — it installs no bundle and is wired straight from the
 * router, with a receipt of its own so uninstalling one surface never touches
 * another.
 *
 * Where it lands between the two: Claude has a config key to point at a script,
 * Oh-My-Pi has a renderer of its own to configure, and OpenCode has neither — it
 * has an **extension point**. So the install is a file copy plus one array
 * entry: `tools/statusline/opencode-tui.tsx` goes into the config dir and its
 * path is appended to `tui.json`'s `plugin` list. The bar itself — what it
 * draws, and why the rate-limit windows are absent — is documented in that file,
 * which is the authority on its own behaviour.
 *
 * Four things about this are load-bearing, all verified against OpenCode 1.18.15
 * rather than read from its docs:
 *
 * - **`tui.json`, not `opencode.json`.** OpenCode routes plugins by kind: a
 *   `server` plugin goes in `opencode.json`, everything else in `tui.json`, a
 *   separate file with its own schema. Writing this into `opencode.json` would
 *   be accepted and never loaded.
 * - **TUI plugins are not auto-discovered.** The `{plugin,plugins}/*.{ts,js}`
 *   glob the OpenCode *adapter* relies on — how vwf's mempalace auto-save loads
 *   — does not reach them. The `tui.json` entry is the registration; without it
 *   the copied file is inert.
 * - **The path is relative to the config dir**, so the entry stays the same
 *   string on every machine and the config remains movable.
 * - **No build step.** The plugin ships as authored `.tsx` — OpenCode's loader
 *   is Bun, which honours the JSX pragma and resolves the two imports itself.
 *   Nothing here transpiles, bundles or installs a dependency.
 *
 * **User scope only**, matching both siblings: a status line is a property of
 * the terminal you are looking at, not of one checkout.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import writeFileAtomic from "write-file-atomic";
import { configDir } from "./adapters/opencode.ts";
import { shallowestNew } from "./adapters/support.ts";
import type {
  Action,
  AdapterContext,
  ApplyResult,
} from "./adapters/types.ts";
import type { FormatOptions } from "./config/json.ts";
import {
  appendToJsonArray,
  getPath,
  readJsonc,
  setJsonPath,
} from "./config/json.ts";
import type { Receipt } from "./receipt.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "./receipt.ts";

/** The bundled asset, under `tools/` and therefore inside the npm package. */
const ASSET = "opencode-tui.tsx";

/**
 * What it is called once installed.
 *
 * Prefixed rather than named `tui-statusline.tsx`: the config dir is the user's,
 * and a name carrying the package is one a hand-written plugin will not collide
 * with.
 */
const INSTALLED = "ai-plugins-statusline.tsx";

/** Relative, so the entry reads the same on every machine. */
const ENTRY = `./${INSTALLED}`;

/** Where TUI plugins are registered — a different file from `opencode.json`. */
const TUI_CONFIG = "tui.json";

/** Written only into a `tui.json` this CLI creates; never added to the user's. */
const SCHEMA = "https://opencode.ai/tui.json";

/** The one array this touches. */
const PLUGIN_PATH = ["plugin"] as const;

/** Only ever applied to a `tui.json` this CLI authored — see `register`. */
const NEW_FILE_FORMAT: FormatOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

/** What `install` would do, without doing it. Drives `--dry-run`. */
export function planStatuslineOpencode(
  context: AdapterContext,
): readonly Action[] {
  return run(context, true).actions;
}

/** Copy the TUI plugin in and register it in `tui.json`. */
export function installStatuslineOpencode(
  context: AdapterContext,
): ApplyResult {
  return run(context, false);
}

/**
 * Undo an install from its receipt.
 *
 * A `tui.json` this CLI created is undone by deleting it; one that was already
 * there is undone key by key, so a plugin the user registered themselves — or
 * one another tool added between install and uninstall — survives. Restoring the
 * whole file in that case would fight the same receipt's own file entry.
 */
export function revertStatuslineOpencode(receipt: Receipt): void {
  revertReceipt(receipt, {
    restoreKey(file, path, hadKey, previous) {
      if (!existsSync(file)) {
        return;
      }
      const text = readFileSync(file, "utf8");
      const parsed = readJsonc<Record<string, unknown>>(text);
      // Deleting a path whose parent is already gone throws rather than
      // no-opping, and that is reachable: an earlier entry in the same receipt
      // may have removed the parent.
      if (
        !hadKey
        && (parsed === undefined || getPath(parsed, path) === undefined)
      ) {
        return;
      }
      writeFileAtomic.sync(
        file,
        setJsonPath(text, path, hadKey ? previous : undefined),
      );
    },
  });
}

/**
 * One code path for planning and applying, so `--dry-run` cannot describe
 * something other than what happens.
 */
function run(context: AdapterContext, dryRun: boolean): ApplyResult {
  const receipt = new ReceiptBuilder();
  // Sequenced before `build()`, which snapshots the entries — evaluating both
  // in one object literal would capture an empty receipt.
  const actions = [
    ...copyPlugin(context, receipt, dryRun),
    ...register(context, receipt, dryRun),
  ];
  return { receipt: receipt.build(context.now), actions };
}

/** Copy the plugin into the config dir. */
function copyPlugin(
  context: AdapterContext,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const source = join(context.sourceRoot, "tools", "statusline", ASSET);
  if (!existsSync(source)) {
    throw new Error(`missing bundled asset: ${source}`);
  }
  const destination = pluginFile(context);

  const action: Action = {
    summary: `install ${destination}`,
    path: destination,
  };
  if (!dryRun) {
    receipt.dir(dirname(destination));
    // `createdFile`, not `file`: this path is ours outright, so a copy already
    // sitting there is one of our own earlier runs. Capturing it as prior state
    // would make an uninstall *after a second install* restore the plugin
    // instead of removing it.
    receipt.createdFile(destination);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }
  return [action];
}

/** Append the plugin's path to `tui.json`, creating the file if it is absent. */
function register(
  context: AdapterContext,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const file = tuiConfigFile(context);
  const existed = existsSync(file);
  const before = existed ? readFileSync(file, "utf8") : "";
  const parsed = readJsonc<Record<string, unknown>>(before);

  if (before.trim().length > 0 && parsed === undefined) {
    throw new Error(`refusing to edit malformed OpenCode TUI config: ${file}`);
  }

  // `$schema` only on a file we are creating. Adding it to one the user already
  // has would be an edit they did not ask for, and an extra key to undo.
  //
  // The formatting pass is likewise creation-only, and that asymmetry is the
  // point: on a file we author there is no existing layout to preserve and the
  // compact splice `modify` emits by default is unreadable, while on the user's
  // file the pass would reflow the array it touches — and an install/uninstall
  // round-trip has to come back byte-identical.
  const text = existed
    ? appendToJsonArray(before, [...PLUGIN_PATH], [ENTRY])
    : `${
      appendToJsonArray(
        setJsonPath("", ["$schema"], SCHEMA, NEW_FILE_FORMAT),
        [...PLUGIN_PATH],
        [ENTRY],
        NEW_FILE_FORMAT,
      )
    }\n`;

  if (text === before) {
    // Already registered. Recording the key here would capture an array that
    // *includes our own entry* as the prior state, so a later uninstall would
    // dutifully put it back.
    return [];
  }

  const action: Action = {
    summary: `update ${file}`,
    path: file,
    diff: { before, after: text },
  };
  if (!dryRun) {
    // Directory before file: revert replays in reverse, so recording it second
    // would try to remove the directory while the file was still inside it.
    receipt.dir(dirname(file));
    if (existed) {
      // Record the SHALLOWEST key that did not already exist. Setting `plugin`
      // on a config that has no such key means the key itself is ours; undoing
      // only its contents would leave an orphaned `"plugin": []` behind.
      const owned = shallowestNew(parsed, [...PLUGIN_PATH]);
      const previous = getPath(parsed, owned);
      receipt.configKey(
        file,
        owned,
        previous === undefined
          ? { present: false }
          : { present: true, value: previous },
      );
    }
    else {
      receipt.file(file);
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileAtomic.sync(file, text);
  }
  return [action];
}

function pluginFile(context: AdapterContext): string {
  return join(configDir(context, "user"), INSTALLED);
}

function tuiConfigFile(context: AdapterContext): string {
  return join(configDir(context, "user"), TUI_CONFIG);
}
