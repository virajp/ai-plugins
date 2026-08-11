/**
 * OpenCode.
 *
 * The adapter that justifies the whole architecture. `bin/opencode.mjs` is 1189
 * lines because it *renders* Claude-shaped plugins into OpenCode's shape on the
 * user's machine — after release, where nothing has tested the result. All of
 * that now happens at build time, so this file copies a validated tree and
 * merges some config keys.
 *
 * OpenCode has no plugin or marketplace concept: skills, commands, agents and
 * plugins each live in a well-known directory under the config dir, and
 * everything else is config the installer merges. The build emits exactly that
 * shape, plus a per-plugin `opencode.config.json` fragment holding the `lsp`
 * and `mcp` entries — the fragment is the contract between the two halves, so
 * this file never has to know what an LSP server looks like.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import writeFileAtomic from "write-file-atomic";
import {
  appendToJsonArray,
  getPath,
  readJsonc,
  removeFromJsonArray,
  setJsonPath,
} from "../config/json.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "../receipt.ts";
import {
  hasBin,
  shallowestNew,
} from "./support.ts";
import { copyTree } from "./tree.ts";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
  ApplyResult,
  Scope,
} from "./types.ts";
import { planPlugins } from "./types.ts";

/** Named after the marketplace, mirroring where the plugins come from. */
const BUNDLE_DIR = "virajp-plugins";

/**
 * The installed ownership record, kept in the bundle root because that is the
 * one directory here this tool owns outright.
 */
const OWNERSHIP = ".ownership.json";

/**
 * OpenCode merges every config filename in a directory, with `opencode.jsonc`
 * winning over `opencode.json` on conflicting keys. So edits target an existing
 * jsonc first, an existing json next, and a new file is created as jsonc. All
 * names accept JSONC syntax.
 */
const CONFIG_FILES = ["opencode.jsonc", "opencode.json"] as const;

/** Flat directories OpenCode discovers globally, outside the bundle. */
const FLAT_DIRS = ["agent", "command", "plugin"] as const;

export const opencode: Adapter = {
  id: "opencode",
  displayName: "OpenCode",
  scopes: ["user", "project"],

  detect(): boolean {
    return hasBin("opencode");
  },

  configPaths(context, scope): string[] {
    return CONFIG_FILES.map(name => join(configDir(context, scope), name));
  },

  plan(context, plan): readonly Action[] {
    return run(context, plan, true).actions;
  },

  apply(context, plan): ApplyResult {
    return run(context, plan, false);
  },

  verify(context, receipt): string[] {
    void context;
    const missing: string[] = [];
    for (const entry of receipt.entries) {
      if (entry.kind === "file" && !existsSync(entry.path)) {
        missing.push(entry.path);
      }
    }
    return missing;
  },

  revert(context, receipt): void {
    void context;
    revertReceipt(receipt, {
      restoreKey(file, path, hadKey, previous) {
        if (!existsSync(file)) {
          return;
        }
        const text = readFileSync(file, "utf8");
        const parsed = readJsonc<Record<string, unknown>>(text);
        // Deleting a path whose parent is already gone throws rather than
        // no-opping, and that is reachable: an earlier entry in the same
        // receipt may have removed the parent.
        if (
          !hadKey && (parsed === undefined
            || getPath(parsed, path) === undefined)
        ) {
          return;
        }
        writeFileAtomic.sync(
          file,
          setJsonPath(text, path, hadKey ? previous : undefined),
        );
      },
    });
  },
};

/**
 * One code path for planning and applying, so `--dry-run` cannot describe
 * something other than what happens.
 */
function run(
  context: AdapterContext,
  plan: AdapterPlan,
  dryRun: boolean,
): ApplyResult {
  const receipt = new ReceiptBuilder();
  const actions: Action[] = [];

  for (const scope of ["user", "project"] as const) {
    const plugins = scope === "user" ? plan.user : plan.project;
    if (plugins.length === 0) {
      continue;
    }
    actions.push(...installScope(context, scope, plugins, receipt, dryRun));
  }

  return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
}

function installScope(
  context: AdapterContext,
  scope: Scope,
  plugins: readonly string[],
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const actions: Action[] = [];
  const tree = join(context.sourceRoot, "opencode");
  const target = configDir(context, scope);
  const bundleRoot = join(target, BUNDLE_DIR);
  const ownership = readOwnership(tree);

  const rootFor = (plugin: string) => join(bundleRoot, plugin);

  actions.push(
    ...prune(tree, bundleRoot, plugins, ownership, dryRun),
  );

  for (const plugin of plugins) {
    actions.push(...copyTree(
      {
        from: join(tree, BUNDLE_DIR, plugin),
        to: rootFor(plugin),
        rootPath: rootFor(plugin),
        siblingRoot: rootFor,
      },
      receipt,
      dryRun,
    ));
  }

  // The flat directories are global, so their files are selected by owner
  // rather than by path — an agent filename carries no plugin prefix, because
  // OpenCode keys agents by filename and a prefix would rename them.
  const selected = new Set(plugins);
  for (const [path, owner] of Object.entries(ownership)) {
    if (!selected.has(owner)) {
      continue;
    }
    if (!FLAT_DIRS.some(dir => path.startsWith(`${dir}/`))) {
      continue;
    }
    actions.push(...copyTree(
      {
        from: join(tree, path),
        to: join(target, path),
        rootPath: rootFor(owner),
        siblingRoot: rootFor,
      },
      receipt,
      dryRun,
    ));
  }

  // The record the *next* run prunes against. Merged with what was already
  // there rather than replacing it: a partial install must not forget the
  // files a different plugin owns, or the run after it would sweep them.
  const record = { ...readInstalledOwnership(bundleRoot) };
  for (const [path, owner] of Object.entries(ownership)) {
    if (plugins.includes(owner)) {
      record[path] = owner;
    }
  }
  const recordPath = join(bundleRoot, OWNERSHIP);
  actions.push({ summary: `write ${recordPath}`, path: recordPath });
  if (!dryRun) {
    receipt.createdFile(recordPath);
    mkdirSync(bundleRoot, { recursive: true });
    writeFileAtomic.sync(
      recordPath,
      `${JSON.stringify(record, null, 2)}\n`,
    );
  }

  actions.push(
    ...mergeConfig(context, scope, plugins, tree, receipt, dryRun),
  );
  return actions;
}

/**
 * Merge each plugin's config fragment into the user's OpenCode config.
 *
 * Every write is recorded with the key's prior state, so uninstall restores a
 * value the user had rather than deleting a key we merely wrote over.
 */
function mergeConfig(
  context: AdapterContext,
  scope: Scope,
  plugins: readonly string[],
  tree: string,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const file = configFile(context, scope);
  const existed = existsSync(file);
  const before = existed ? readFileSync(file, "utf8") : "";
  const parsed = readJsonc<Record<string, unknown>>(before);

  if (before.length > 0 && parsed === undefined) {
    throw new Error(
      `refusing to edit malformed OpenCode config: ${file}`,
    );
  }

  let text = before;
  // A file we create is undone by deleting it; a file that was already there
  // is undone key by key, so a concurrent edit by another tool survives our
  // uninstall. Recording both would have revert fight itself — restoring the
  // whole file and then deleting keys out of the restored copy.
  const note = existed
    ? (path: readonly (string | number)[]) => {
      // Record the SHALLOWEST key that did not already exist. Setting
      // `skills.paths` on a config with no `skills` creates the whole object,
      // so undoing only `paths` leaves an orphaned `"skills": {}` behind —
      // close to byte-identical, which is not the same thing.
      const owned = shallowestNew(parsed, path);
      const present = parsed !== undefined
        && getPath(parsed, owned) !== undefined;
      receipt.configKey(
        file,
        owned,
        present
          ? { present, value: getPath(parsed, owned) }
          : { present: false },
      );
    }
    : () => {};

  for (const plugin of plugins) {
    const fragmentPath = join(tree, BUNDLE_DIR, plugin, "opencode.config.json");
    if (!existsSync(fragmentPath)) {
      continue;
    }
    const fragment = readJsonc<Record<string, unknown>>(
      readFileSync(fragmentPath, "utf8"),
    );
    if (fragment === undefined) {
      continue;
    }

    for (const key of ["mcp", "lsp"] as const) {
      const section = fragment[key];
      if (section === undefined || section === null) {
        continue;
      }
      for (const [id, value] of Object.entries(section)) {
        note([key, id]);
        text = setJsonPath(text, [key, id], value);
      }
    }
  }

  // Portable spelling, so the config stays movable between machines.
  const skillsPath = scope === "project"
    ? `.opencode/${BUNDLE_DIR}`
    : `~/.config/opencode/${BUNDLE_DIR}`;
  note(["skills", "paths"]);
  text = appendToJsonArray(text, ["skills", "paths"], [skillsPath]);

  if (text === before) {
    return [];
  }

  const action: Action = {
    summary: `update ${file}`,
    path: file,
    diff: { before, after: text },
  };
  if (!dryRun) {
    if (!existed) {
      receipt.file(file);
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileAtomic.sync(file, text);
  }
  return [action];
}

/** Remove our own `skills.paths` entry, leaving foreign ones alone. */
export function removeSkillsPath(text: string, scope: Scope): string {
  const skillsPath = scope === "project"
    ? `.opencode/${BUNDLE_DIR}`
    : `~/.config/opencode/${BUNDLE_DIR}`;
  return removeFromJsonArray(text, ["skills", "paths"], [skillsPath]);
}

/**
 * Where OpenCode reads its config from.
 *
 * Exported because the OpenCode status line writes into the same directory —
 * `tui.json` sits beside `opencode.jsonc` — and the two disagreeing would put a
 * TUI plugin somewhere OpenCode never looks.
 */
export function configDir(context: AdapterContext, scope: Scope): string {
  return scope === "project"
    ? join(context.cwd, ".opencode")
    : join(context.home, ".config", "opencode");
}

/** An existing jsonc, else an existing json, else a new jsonc. */
function configFile(context: AdapterContext, scope: Scope): string {
  const dir = configDir(context, scope);
  for (const name of CONFIG_FILES) {
    const path = join(dir, name);
    if (existsSync(path)) {
      return path;
    }
  }
  return join(dir, CONFIG_FILES[0]);
}

/**
 * Remove what this installer left behind and no longer emits.
 *
 * Copying is not idempotent on its own: it writes what the render contains and
 * says nothing about what it used to contain. Three things go stale, and they
 * need three different rules because they differ in **who else writes there**.
 *
 * 1. **A plugin's own bundle** (`virajp-plugins/<plugin>/`) is exclusively
 *    ours, so it is cleared wholesale before the copy — the same rule
 *    `plugins:build` follows for the rendered trees. Per plugin, never the
 *    whole directory: a partial install (`--user vwf`) must not delete a
 *    bundle some earlier run installed.
 * 2. **A retired plugin's bundle** — a directory under `virajp-plugins/`
 *    naming no plugin this build ships. Nothing else writes there, so it can
 *    only be something we left; `claude-design`, `markdown`, `mise`,
 *    `mempalace` and `github-actions` all sat there for months after being
 *    renamed or absorbed.
 * 3. **Flat files** (`agent/`, `command/`, `plugin/`) are shared with OpenCode
 *    itself and with other tools — graphify writes `plugin/graphify.js` — so
 *    they are pruned by *ownership*, never swept. A file is removed only when
 *    the record we wrote last time says it was ours and this render no longer
 *    emits it. That covers both a retired plugin and, less obviously, a skill
 *    whose `invocation:` flipped from `user` to `both`: its `command/` wrapper
 *    stops being emitted while the plugin is very much still installed, which
 *    is how nine orphaned `vwf-*.md` commands accumulated.
 *
 * The previous ownership record is the copy of `.ownership.json` this function
 * leaves in the bundle root — not the receipt, which only knows the last run
 * and so cannot see a file orphaned three releases ago.
 */
function prune(
  tree: string,
  bundleRoot: string,
  plugins: readonly string[],
  ownership: Record<string, string>,
  dryRun: boolean,
): Action[] {
  const actions: Action[] = [];
  const remove = (path: string, why: string) => {
    if (!existsSync(path)) {
      return;
    }
    actions.push({ summary: `remove ${path} (${why})`, path });
    if (!dryRun) {
      rmSync(path, { recursive: true, force: true });
    }
  };

  // (1) and (2): everything under the bundle root is ours to reason about.
  const shipped = new Set(
    Object
      .keys(readOwnership(tree))
      .filter(p => p.startsWith(`${BUNDLE_DIR}/`))
      .map(p => p.split("/")[1] ?? ""),
  );
  if (existsSync(bundleRoot)) {
    for (const entry of readdirSync(bundleRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (plugins.includes(entry.name)) {
        remove(join(bundleRoot, entry.name), "replaced by this install");
      }
      else if (!shipped.has(entry.name)) {
        remove(join(bundleRoot, entry.name), "no longer a plugin");
      }
    }
  }

  // (3): only files a previous run recorded as ours, and only for plugins this
  // run is responsible for. A plugin we are not installing keeps its files.
  const previous = readInstalledOwnership(bundleRoot);
  const emitted = new Set(Object.keys(ownership));
  const scope = new Set(plugins);
  for (const [path, owner] of Object.entries(previous)) {
    if (path.startsWith(`${BUNDLE_DIR}/`) || emitted.has(path)) {
      continue;
    }
    if (scope.has(owner) || !shipped.has(owner)) {
      remove(join(configRoot(bundleRoot), path), `${owner} no longer emits it`);
    }
  }

  return actions;
}

/** The OpenCode config dir — the bundle root's parent. */
function configRoot(bundleRoot: string): string {
  return dirname(bundleRoot);
}

/** The ownership record a previous install left, or empty on a first run. */
function readInstalledOwnership(bundleRoot: string): Record<string, string> {
  const path = join(bundleRoot, OWNERSHIP);
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
  }
  catch {
    // A corrupt record prunes nothing rather than everything.
    return {};
  }
}

function readOwnership(tree: string): Record<string, string> {
  const path = join(tree, ".ownership.json");
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
}
