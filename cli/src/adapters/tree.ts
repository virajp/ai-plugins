/**
 * Copying a rendered target tree onto disk.
 *
 * This is most of what an adapter does now, and it is the whole point of the
 * template layer: `bin/opencode.mjs` was 1189 lines because it *rendered*
 * Claude-shaped plugins into OpenCode's shape on the user's machine. That work
 * moved to build time, so installing is copying — the bytes shipped are the
 * bytes CI validated, rather than the output of a renderer that only ever ran
 * after release.
 *
 * The one substitution left is the install-time root token, which cannot be
 * resolved earlier because it is an absolute path on a machine the build has
 * never seen.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import {
  join,
  relative,
  resolve,
} from "node:path";
import writeFileAtomic from "write-file-atomic";
import { ReceiptBuilder } from "../receipt.ts";
import type { Action } from "./types.ts";

/** Mirrors `ROOT_TOKEN` / `siblingRootToken` in `renderer/src/target.ts`. */
const ROOT_TOKEN = "%%AI_PLUGINS_ROOT%%";
const SIBLING_TOKEN = /%%AI_PLUGINS_ROOT:([a-z0-9-]+)%%/g;

/** Text files get token substitution; everything else is copied byte-for-byte. */
const TEXT = /\.(md|json|jsonc|ya?ml|toml|js|mjs|ts|sh|txt)$/;

export interface CopyOptions {
  /** Directory inside `<repo>/<target>/` to copy, e.g. `vwf`. */
  readonly from: string;
  /** Absolute destination. */
  readonly to: string;
  /** Absolute path a plugin's own `%%AI_PLUGINS_ROOT%%` resolves to. */
  readonly rootPath: string;
  /** Resolves a sibling plugin's root, for cross-plugin references. */
  readonly siblingRoot: (plugin: string) => string;
  /**
   * How the copy is recorded, which is dictated by **who else writes to `to`**.
   *
   * `files` (the default) records one `file` entry per write plus the directory
   * chain, so an uninstall removes exactly what it wrote and removes a directory
   * only when empty. That is the only safe shape for a destination shared with
   * another writer.
   *
   * `tree` records the destination as a single recursive entry and emits one
   * summary action. Only correct when `to` is a directory nothing but this tool
   * writes to — the same precondition `receipt.tree` carries — and it is what
   * keeps a 250-file bundle from becoming 250 lines of run report and 380
   * receipt entries, where one genuine change is indistinguishable from the
   * copy that happens every run.
   */
  readonly record?: "files" | "tree";
}

/**
 * Copy one rendered plugin, substituting root tokens, recording every write.
 *
 * Returns the actions taken so the same function can describe a dry run and
 * perform a real one — one code path, so `--dry-run` cannot drift from what
 * actually happens.
 */
export function copyTree(
  options: CopyOptions,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  if (!existsSync(options.from)) {
    throw new Error(`missing rendered tree: ${options.from}`);
  }

  // `from` may name a single file — the flat `agent/`, `command/` and
  // `plugin/` entries are selected individually by owner, since their paths
  // carry no plugin prefix.
  const files = statSync(options.from).isDirectory()
    ? walk(options.from).map(rel =>
      [join(options.from, rel), join(options.to, rel)] as const
    )
    : [[options.from, options.to] as const];

  return copyFiles(files, options, receipt, dryRun);
}

function copyFiles(
  files: readonly (readonly [string, string])[],
  options: CopyOptions,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const actions: Action[] = [];
  const asTree = options.record === "tree";

  // Recorded once, before any write, so an interrupted install still has the
  // whole destination in its receipt rather than the prefix it managed to copy.
  if (asTree && !dryRun) {
    receipt.tree(options.to);
  }

  for (const [source, destination] of files) {
    const relPath = source;

    if (TEXT.test(relPath)) {
      const before = existsSync(destination)
        ? readFileSync(destination, "utf8")
        : "";
      const after = substitute(
        readFileSync(source, "utf8"),
        options.rootPath,
        options.siblingRoot,
      );
      if (!asTree) {
        actions.push({
          summary: `write ${destination}`,
          path: destination,
          diff: { before, after },
        });
      }
      if (!dryRun) {
        const mode = statSync(source).mode & 0o777;
        if (!asTree) {
          recordDirs(receipt, options.to, destination);
          receipt.file(destination, mode);
        }
        mkdirSync(dirOf(destination), { recursive: true });
        // `mode` is passed explicitly because `writeFileAtomic` writes through
        // a temp file and renames: without it the result carries the default
        // mode, not the source's. Every rendered hook script is a `.sh`, which
        // `TEXT` matches, so this branch is exactly where an executable bit
        // goes missing — and a hook that is not executable does not run.
        writeFileAtomic.sync(destination, after, { mode });
      }
    }
    else {
      if (!asTree) {
        actions.push({ summary: `copy ${destination}`, path: destination });
      }
      if (!dryRun) {
        if (!asTree) {
          recordDirs(receipt, options.to, destination);
          receipt.file(destination, statSync(source).mode & 0o777);
        }
        mkdirSync(dirOf(destination), { recursive: true });
        // `cpSync` carries the mode itself — the mode-carrying files with no
        // extension (mise task scripts) survive here, which is why the bug
        // only ever showed on the branch above.
        cpSync(source, destination);
      }
    }
  }

  // One line for the whole bundle. No per-file diff: the destination is
  // exclusively ours and is rewritten wholesale every run, so the diff was
  // always the entire tree rather than the change worth reading.
  if (asTree) {
    actions.push({
      summary: `copy ${files.length} files to ${options.to}`,
      path: options.to,
    });
  }
  return actions;
}

/**
 * Replace the build's placeholders with real paths.
 *
 * Sibling references are resolved first: `%%AI_PLUGINS_ROOT:vwf%%` contains the
 * bare token as a prefix, so substituting the bare one first would corrupt it
 * into `<path>:vwf%%`.
 */
export function substitute(
  text: string,
  rootPath: string,
  siblingRoot: (plugin: string) => string,
): string {
  return text
    .replace(SIBLING_TOKEN, (_, plugin: string) => siblingRoot(plugin))
    .replaceAll(ROOT_TOKEN, rootPath);
}

/** Every file under `root`, as paths relative to it, depth-first and sorted. */
export function walk(root: string): string[] {
  const out: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        visit(full);
      }
      else {
        out.push(relative(root, full));
      }
    }
  };
  visit(root);
  return out;
}

function dirOf(path: string): string {
  return resolve(path, "..");
}

/**
 * Record every directory this write brings into existence, outermost first.
 *
 * `mkdirSync(..., { recursive: true })` creates a whole chain, so recording
 * only the immediate parent leaves the intermediate levels untracked and an
 * uninstall strands them — the bundle root survives with empty directories
 * inside it. Outermost-first matters because revert replays in reverse, which
 * then removes the deepest first.
 */
function recordDirs(
  receipt: ReceiptBuilder,
  root: string,
  destination: string,
): void {
  const chain: string[] = [];
  for (let dir = dirOf(destination); dir.startsWith(root); dir = dirOf(dir)) {
    chain.unshift(dir);
    if (dir === root) {
      break;
    }
  }
  for (const dir of chain) {
    receipt.dir(dir);
  }
}
