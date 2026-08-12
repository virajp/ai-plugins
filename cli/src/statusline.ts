/**
 * The powerline statusline.
 *
 * **Not a plugin, and therefore not an adapter.** It installs no bundle, is
 * registered in no marketplace, and exists for Claude Code alone — so it is
 * wired straight from the router instead of being smuggled through
 * `AdapterPlan`. What it does share is the receipt, so `--uninstall` undoes it
 * exactly as it undoes a target.
 *
 * **Two roots, deliberately.** The settings file follows `CLAUDE_CONFIG_DIR`
 * like every other Claude write, because that is where Claude reads it back
 * from. The script and the hook do not: the values written *into* settings are
 * the literal strings below, expanded by Claude Code at run time, so those two
 * files have to land under `$HOME` wherever the config itself lives.
 *
 * The caps hook ships with the main bar rather than the subagent panel because
 * the bar's writer is its sensor — the statusline mirrors each session's
 * `context_window` / `rate_limits` under `AI_PLUGINS_USAGE_DIR` and the hook
 * reads them back — so it is inert until that bar runs.
 *
 * One behaviour differs from `bin/claude.mjs`, and the receipt is why. The old
 * installer *prompted* before overwriting a `statusLine` it did not recognise,
 * because it had no way to put one back. This overwrites and says so: the
 * previous value is captured, and `--uninstall` restores it byte for byte.
 */
import {
  chmodSync,
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
import {
  claudeConfigDir,
  shallowestNew,
} from "./adapters/support.ts";
import type {
  Action,
  AdapterContext,
  ApplyResult,
} from "./adapters/types.ts";
import type { FormatOptions } from "./config/json.ts";
import {
  getPath,
  readJsonc,
  setJsonPath,
} from "./config/json.ts";
import { deepMerge } from "./config/merge.ts";
import type { Receipt } from "./receipt.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "./receipt.ts";

/**
 * Written verbatim, per `docs/plugins/statusline.md`. `${HOME}` is expanded by
 * the shell Claude Code runs the command through, not by us — which is what
 * ties both installed files to `$HOME` rather than to the config dir.
 */
const COMMAND = "${HOME}/.claude/scripts/statusline";
const HOOK_COMMAND = "node ${HOME}/.claude/hooks/context-caps.js";
const USAGE_ENV_KEY = "AI_PLUGINS_USAGE_DIR";
const USAGE_DIR = "${HOME}/.claude/usage";

/** Both bar keys, in the order they are written. One flag installs the pair. */
const BAR_KEYS = [
  ["statusLine", {
    type: "command",
    command: COMMAND,
    padding: 0,
    refreshInterval: 4,
  }],
  ["subagentStatusLine", { type: "command", command: COMMAND }],
] as const;

const HOOK_ENTRY = {
  hooks: [{ type: "command", command: HOOK_COMMAND }],
};

/**
 * Formatting for **array-element** edits, and only those.
 *
 * `config/json.ts` omits `formattingOptions` by default because the pass
 * reflows the region it touches, and an add-then-remove round-trip has to be
 * byte-identical. For an object key that works: `modify` deletes a key cleanly.
 * For an array element it does not — removing one leaves the separator
 * whitespace behind (`}\n    ]` comes back as `} ]`), so install-then-uninstall
 * is a diff.
 *
 * With the pass on, the element round-trips exactly. What it costs is scoped:
 * sibling keys keep their own formatting — a neighbouring inline
 * `"env": { "A": 1 }` survives untouched — but an array whose elements were
 * written inline comes back expanded. That is confined to the one array being
 * edited, and settings.json is written by Claude Code with two-space
 * indentation, so in practice it is a no-op.
 *
 * Verified by round-tripping `modify` both ways, with and without the pass.
 */
const ARRAY_EDIT_FORMAT: FormatOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

/** Array elements are addressed by index; object keys never are. */
function isArrayEdit(path: readonly (string | number)[]): boolean {
  return typeof path.at(-1) === "number";
}

/** What `install` would do, without doing it. Drives `--dry-run`. */
export function planStatusline(
  context: AdapterContext,
  configure = true,
): readonly Action[] {
  return run(context, true, configure).actions;
}

/** Install the bar, the config defaults and the caps hook. */
export function installStatusline(
  context: AdapterContext,
  configure = true,
): ApplyResult {
  return run(context, false, configure);
}

/**
 * The statusline Claude is pointed at, when it is not ours.
 *
 * `undefined` means there is nothing to consent to: either no bar at all, or
 * one already running our command. **Ownership, not existence** — the value is
 * compared against what we would write, so a second run recognises the first
 * run's output instead of asking about it.
 *
 * Only `statusLine` is inspected, not `subagentStatusLine`: the pair is set by
 * one flag, and a user who has configured the main bar has expressed the
 * preference this gate exists to respect.
 */
export function claudeStatuslineConflict(
  context: AdapterContext,
): string | undefined {
  const file = settingsFile(context);
  if (!existsSync(file)) {
    return undefined;
  }
  const parsed = readJsonc<Record<string, unknown>>(readFileSync(file, "utf8"));
  const current = getPath(parsed ?? {}, ["statusLine"]);
  if (current === undefined) {
    return undefined;
  }
  const command = getPath(parsed ?? {}, ["statusLine", "command"]);
  if (command === COMMAND) {
    return undefined;
  }
  return typeof command === "string"
    ? `${file} → statusLine.command = ${command}`
    : `${file} → statusLine`;
}

/**
 * Undo an install from its receipt.
 *
 * `~/.config/statusline.json` is deliberately not among the entries, so it
 * survives — it is seeded once and edited by the user thereafter.
 */
export function revertStatusline(receipt: Receipt): void {
  revertReceipt(receipt, {
    restoreKey(file, path, hadKey, previous) {
      if (!existsSync(file)) {
        return;
      }
      const text = readFileSync(file, "utf8");
      const parsed = readJsonc<Record<string, unknown>>(text);
      // Deleting a path whose parent is already gone throws rather than
      // no-opping, and an earlier entry in this same receipt may have removed
      // that parent.
      if (
        !hadKey
        && (parsed === undefined || getPath(parsed, path) === undefined)
      ) {
        return;
      }
      writeFileAtomic.sync(
        file,
        setJsonPath(
          text,
          path,
          hadKey ? previous : undefined,
          isArrayEdit(path) ? ARRAY_EDIT_FORMAT : undefined,
        ),
      );
    },
  });
}

/**
 * One code path for planning and applying, so `--dry-run` cannot describe
 * something other than what happens.
 */
function run(
  context: AdapterContext,
  dryRun: boolean,
  configure: boolean,
): ApplyResult {
  const receipt = new ReceiptBuilder();
  // Sequenced before `build()`: it snapshots the entries, so evaluating both in
  // one object literal would capture an empty receipt.
  //
  // `configure` splits the two halves the consent gate distinguishes. The
  // script, the caps hook and the user's own config are ours to place and
  // displace nothing; `mergeSettings` is the one step that overwrites a bar the
  // user may have chosen, so a declined surface stops short of exactly that and
  // leaves a machine one `--statusline` from a working bar.
  const actions = [
    ...copyAsset(context, receipt, dryRun, "statusline", scriptFile(context)),
    ...copyAsset(
      context,
      receipt,
      dryRun,
      "context-caps.js",
      hookFile(context),
    ),
    ...seedUserConfig(context, dryRun),
    ...(configure ? mergeSettings(context, receipt, dryRun) : []),
  ];
  return { receipt: receipt.build(context.now), actions };
}

/** Copy one bundled asset to a path we own, executable. */
function copyAsset(
  context: AdapterContext,
  receipt: ReceiptBuilder,
  dryRun: boolean,
  name: string,
  destination: string,
): Action[] {
  const source = asset(context, name);
  if (!existsSync(source)) {
    throw new Error(`missing bundled asset: ${source}`);
  }

  const action: Action = {
    summary: `install ${destination}`,
    path: destination,
  };
  if (!dryRun) {
    // Outermost first: revert replays in reverse, so the deepest is removed
    // first and each level is gone by the time its parent is reached.
    receipt.dir(dirname(dirname(destination)));
    receipt.dir(dirname(destination));
    receipt.createdFile(destination, 0o755);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
    chmodSync(destination, 0o755);
  }
  return [action];
}

/**
 * Seed `~/.config/statusline.json`, deep-merging so user edits survive.
 *
 * **Nothing here is recorded.** The file is seeded once and then belongs to the
 * user; an uninstall that deleted it would throw away their palette because
 * they once ran `--uninstall --all`.
 */
function seedUserConfig(context: AdapterContext, dryRun: boolean): Action[] {
  const file = userConfigFile(context);
  const defaults = JSON.parse(
    readFileSync(asset(context, "statusline.json"), "utf8"),
  ) as Record<string, unknown>;

  const before = existsSync(file) ? readFileSync(file, "utf8") : "";
  const existing = before.trim().length === 0
    ? {}
    : readJsonc<Record<string, unknown>>(before);
  if (existing === undefined) {
    throw new Error(`refusing to overwrite malformed ${file}`);
  }

  const after = `${JSON.stringify(deepMerge(defaults, existing), null, 2)}\n`;
  if (after === before) {
    return [];
  }

  const action: Action = {
    summary: `seed ${file}`,
    path: file,
    diff: { before, after },
  };
  if (!dryRun) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileAtomic.sync(file, after);
  }
  return [action];
}

/** Set both bar keys, the usage-dir env var and the caps hook entry. */
function mergeSettings(
  context: AdapterContext,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const file = settingsFile(context);
  const existed = existsSync(file);
  const before = existed ? readFileSync(file, "utf8") : "";
  const parsed = readJsonc<Record<string, unknown>>(before);

  if (before.trim().length > 0 && parsed === undefined) {
    throw new Error(`refusing to edit malformed Claude settings: ${file}`);
  }

  let text = before;

  /** Capture what is there, then set it. */
  const set = (path: readonly (string | number)[], value: unknown): void => {
    // A file we create is undone by deleting it; one that already existed is
    // undone key by key, so another tool's concurrent edit survives our
    // uninstall. Recording both would have revert fight itself.
    if (existed) {
      const owned = shallowestNew(parsed, path);
      const previous = getPath(parsed, owned);
      receipt.configKey(
        file,
        owned,
        previous === undefined
          ? { present: false }
          : { present: true, value: previous },
      );
    }
    text = setJsonPath(
      text,
      path,
      value,
      isArrayEdit(path) ? ARRAY_EDIT_FORMAT : undefined,
    );
  };

  for (const [key, value] of BAR_KEYS) {
    const current = getPath(parsed, [key]);
    // Same script already wired: leave the bytes alone, so a user's tuned
    // `padding` / `refreshInterval` is not reset by a re-install — and so the
    // second install is a genuine no-op rather than a reformat.
    if (isSameBar(current, value)) {
      continue;
    }
    if (current !== undefined) {
      context.log(
        `statusline: replacing the \`${key}\` already in ${file} — `
          + "`--uninstall` puts the previous one back",
      );
    }
    set([key], value);
  }

  if (getPath(parsed, ["env", USAGE_ENV_KEY]) !== USAGE_DIR) {
    set(["env", USAGE_ENV_KEY], USAGE_DIR);
  }

  const existingHooks = getPath(parsed, ["hooks", "PostToolUse"]);
  const post = Array.isArray(existingHooks) ? existingHooks : [];
  // Matched by command, not by deep equality: a user who reordered the entry's
  // own fields still has our hook, and appending a second one would run it
  // twice per tool call.
  if (!post.some(isCapsHook)) {
    // Appended by index when the array is already there, so uninstall removes
    // one element rather than rewriting the whole list — restoring a list
    // wholesale re-serialises every entry in it compactly. When there is no
    // array yet the key itself is ours, and deleting a key is already clean.
    set(
      Array.isArray(existingHooks)
        ? ["hooks", "PostToolUse", post.length]
        : ["hooks", "PostToolUse"],
      Array.isArray(existingHooks) ? HOOK_ENTRY : [HOOK_ENTRY],
    );
  }

  if (text === before) {
    return [];
  }

  const action: Action = {
    summary: `update ${file}`,
    path: file,
    diff: { before, after: text },
  };
  if (!dryRun) {
    // Directory before file: revert replays in reverse, so recording it second
    // would try to remove the directory while our file was still inside it.
    receipt.dir(dirname(file));
    if (!existed) {
      receipt.file(file);
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileAtomic.sync(file, text);
  }
  return [action];
}

/**
 * Is this already our bar?
 *
 * Compared on `type` + `command` alone — the statusline's identity. `padding`
 * and `refreshInterval` are the user's to tune, so a difference there must not
 * read as a foreign statusline to be replaced.
 */
function isSameBar(
  current: unknown,
  ours: { readonly type: string; readonly command: string; },
): boolean {
  if (typeof current !== "object" || current === null) {
    return false;
  }
  const bar = current as { type?: unknown; command?: unknown; };
  return bar.type === ours.type && bar.command === ours.command;
}

function isCapsHook(entry: unknown): boolean {
  const hooks = (entry as { hooks?: unknown; })?.hooks;
  return Array.isArray(hooks)
    && hooks.some(h => (h as { command?: unknown; })?.command === HOOK_COMMAND);
}

function asset(context: AdapterContext, name: string): string {
  return join(context.sourceRoot, "tools", "statusline", name);
}

/** Anchored to `$HOME`, because `COMMAND` names that path literally. */
function scriptFile(context: AdapterContext): string {
  return join(context.home, ".claude", "scripts", "statusline");
}

/** Likewise — `HOOK_COMMAND` names it literally. */
function hookFile(context: AdapterContext): string {
  return join(context.home, ".claude", "hooks", "context-caps.js");
}

function userConfigFile(context: AdapterContext): string {
  return join(context.home, ".config", "statusline.json");
}

/** Where Claude actually reads settings from, which may not be under `$HOME`. */
function settingsFile(context: AdapterContext): string {
  return join(claudeConfigDir(context.home), "settings.json");
}
