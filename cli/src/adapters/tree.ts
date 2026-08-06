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

/** Mirrors `ROOT_TOKEN` / `siblingRootToken` in `build/src/target.ts`. */
const ROOT_TOKEN = "%%AI_PLUGINS_ROOT%%";
const SIBLING_TOKEN = /%%AI_PLUGINS_ROOT:([a-z0-9-]+)%%/g;

/** Text files get token substitution; everything else is copied byte-for-byte. */
const TEXT = /\.(md|json|jsonc|ya?ml|toml|js|mjs|ts|sh|txt)$/;

export interface CopyOptions {
  /** Directory inside `dist/<target>/` to copy, e.g. `vwf`. */
  readonly from: string;
  /** Absolute destination. */
  readonly to: string;
  /** Absolute path a plugin's own `%%AI_PLUGINS_ROOT%%` resolves to. */
  readonly rootPath: string;
  /** Resolves a sibling plugin's root, for cross-plugin references. */
  readonly siblingRoot: (plugin: string) => string;
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
  const actions: Action[] = [];
  if (!existsSync(options.from)) {
    throw new Error(`missing rendered tree: ${options.from}`);
  }

  for (const relPath of walk(options.from)) {
    const source = join(options.from, relPath);
    const destination = join(options.to, relPath);

    if (TEXT.test(relPath)) {
      const before = existsSync(destination)
        ? readFileSync(destination, "utf8")
        : "";
      const after = substitute(
        readFileSync(source, "utf8"),
        options.rootPath,
        options.siblingRoot,
      );
      actions.push({
        summary: `write ${destination}`,
        path: destination,
        diff: { before, after },
      });
      if (!dryRun) {
        receipt.dir(dirOf(destination));
        receipt.file(destination);
        mkdirSync(dirOf(destination), { recursive: true });
        writeFileAtomic.sync(destination, after);
      }
    }
    else {
      actions.push({ summary: `copy ${destination}`, path: destination });
      if (!dryRun) {
        receipt.dir(dirOf(destination));
        receipt.file(destination);
        mkdirSync(dirOf(destination), { recursive: true });
        cpSync(source, destination);
      }
    }
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
