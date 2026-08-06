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
  readFileSync,
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
import { copyTree } from "./tree.ts";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
  ApplyResult,
  Scope,
} from "./types.ts";

/** Named after the marketplace, mirroring where the plugins come from. */
const BUNDLE_DIR = "virajp-plugins";

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

  return { receipt: receipt.build(context.now), actions };
}

function installScope(
  context: AdapterContext,
  scope: Scope,
  plugins: readonly string[],
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const actions: Action[] = [];
  const dist = join(context.sourceRoot, "dist", "opencode");
  const target = configDir(context, scope);
  const bundleRoot = join(target, BUNDLE_DIR);
  const ownership = readOwnership(dist);

  const rootFor = (plugin: string) => join(bundleRoot, plugin);

  for (const plugin of plugins) {
    actions.push(...copyTree(
      {
        from: join(dist, BUNDLE_DIR, plugin),
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
        from: join(dist, path),
        to: join(target, path),
        rootPath: rootFor(owner),
        siblingRoot: rootFor,
      },
      receipt,
      dryRun,
    ));
  }

  actions.push(
    ...mergeConfig(context, scope, plugins, dist, receipt, dryRun),
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
  dist: string,
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
    const fragmentPath = join(dist, BUNDLE_DIR, plugin, "opencode.config.json");
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

function configDir(context: AdapterContext, scope: Scope): string {
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

function readOwnership(dist: string): Record<string, string> {
  const path = join(dist, ".ownership.json");
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
}

function hasBin(bin: string): boolean {
  const path = process.env["PATH"] ?? "";
  return path
    .split(process.platform === "win32" ? ";" : ":")
    .some(dir => dir.length > 0 && existsSync(join(dir, bin)));
}

/**
 * The shortest prefix of `path` that is absent from the document.
 *
 * That prefix is what this install creates, and therefore what an uninstall
 * has to remove to leave the file as it found it.
 */
function shallowestNew(
  parsed: Record<string, unknown> | undefined,
  path: readonly (string | number)[],
): readonly (string | number)[] {
  for (let i = 1; i <= path.length; i++) {
    const prefix = path.slice(0, i);
    if (parsed === undefined || getPath(parsed, prefix) === undefined) {
      return prefix;
    }
  }
  return path;
}
