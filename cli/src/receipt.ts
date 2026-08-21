/**
 * Install receipts — what an install touched, and what was there before it.
 *
 * The old installer removed things by *inferring* what it must have written:
 * it deleted the keys it knew it set, and left anything it was unsure about.
 * That is safe only while the inference stays true, and it silently is not
 * whenever a user edits a value the installer later removes wholesale.
 *
 * A receipt records the prior state instead, so `revert` restores rather than
 * guesses. The invariant it exists to make testable: **install then remove
 * leaves the tree and every touched config byte-identical.**
 *
 * **This module is read-only now.** Nothing this version installs writes a
 * receipt — plugins go in through `claude plugin install` and graphify through
 * its own CLI, and both tools keep their own records, which is what
 * `--uninstall` reads live. So the builder and the writer are gone, and what is
 * left is the reader and `revert`, for the receipts *older* versions left on
 * disk: the statusline's, and the multi-target adapters' before it. Every
 * `Entry` kind stays reachable in `revert` for that reason — dropping one would
 * turn an existing receipt into a file nothing can undo.
 *
 * If something here ever writes again, `writeReceipt` is in git and its merge
 * semantics are the part worth recovering rather than re-deriving: an install
 * is not a run, and each run overwriting the record wholesale is the
 * receipt-completeness bug that recurred across all four adapters.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
} from "node:fs";
import writeFileAtomic from "write-file-atomic";
import type { Scope } from "./context.ts";

/**
 * 2 added the `command` entry; 3 added `tree`. A v1 or v2 receipt still reverts
 * correctly, so the guard in `readReceipt` only refuses receipts from a *future*
 * version.
 *
 * 3 is the first bump that had to happen. An older CLI meeting a `tree` entry
 * would fall through its `switch` and silently leave the whole directory behind
 * — a half-revert reported as a clean uninstall. Refusing the receipt outright
 * is the honest failure, and that is what the version guard buys.
 */
export const RECEIPT_VERSION = 3;

/**
 * **Every kind is still read; none are written any more.**
 *
 * The statusline wrote `file`, `dir` and `configKey`; `tree` and `command` were
 * the plugin adapters' — a copied render tree, a `claude plugin install` paired
 * with its uninstall. All of those writers are gone. The kinds stay because
 * `revert` still meets them: `uninstall.ts` reads the receipts older versions
 * left behind, which is the whole reason a machine carrying an OpenCode bundle,
 * an Oh-My-Pi bar or this toolkit's statusline can be cleaned rather than
 * orphaned. Dropping one from `revert` would turn those receipts into files
 * nothing can undo.
 */
export type Entry =
  /** A file we wrote. `previous` is absent when we created it. */
  | {
    readonly kind: "file";
    readonly path: string;
    readonly previous?: string;
    readonly mode?: number;
  }
  /** A directory we created; removed on revert only if it is empty. */
  | { readonly kind: "dir"; readonly path: string; }
  /**
   * A directory this tool owns **outright**, removed recursively on revert.
   *
   * The distinction from `dir` is who else writes there. `dir` guards a
   * directory the user shares — `~/.claude/scripts` — so it is removed only
   * when empty. A `tree` is a path nothing but this tool ever writes to, which
   * is what makes recursive removal safe rather than reckless.
   *
   * It also exists to keep a payload out of the entry list. Recording the
   * Claude marketplace file by file would be 527 entries and 527 lines of run
   * report for one logical action, and an uninstall would still have to trust
   * that the list was complete — where removing the root cannot miss a file
   * a later version added.
   */
  | { readonly kind: "tree"; readonly path: string; }
  /**
   * A key we set inside someone else's config. `previous` is absent when the
   * key did not exist — that is the signal to delete rather than restore, and
   * it is why `hadKey` is separate from a `previous` of literal `undefined`.
   */
  | {
    readonly kind: "configKey";
    readonly file: string;
    readonly path: readonly (string | number)[];
    readonly hadKey: boolean;
    readonly previous?: unknown;
  }
  /**
   * A command we ran, and the command that undoes it.
   *
   * The marketplace targets install by driving their own CLI, which owns
   * bookkeeping this tool has no business editing — Oh-My-Pi's `node_modules`
   * and lockfile. Undoing those by deleting the files we can see would leave
   * the tool's own records claiming an install that is no longer there, so the
   * CLI has to unmake what it made.
   *
   * Recorded when the command changed something, **or when the state it would
   * have produced is provably this tool's** — not merely whenever the command
   * was skipped. The distinction is ownership, not activity.
   *
   * The original rule was activity alone, and it broke as soon as a receipt
   * mixed activity-gated entries with unconditional ones: a no-op re-install
   * wrote a receipt naming the payload and nothing else, so an uninstall
   * removed the payload and left the registration pointing at it. Since every
   * run overwrites the receipt, what a *no-op* run records is what an
   * uninstall gets.
   *
   * What the original rule protects is still protected: a marketplace pin
   * naming a path outside this tool's own directories is the user's, is never
   * re-pointed, and never gets an undo recorded for it.
   */
  | {
    readonly kind: "command";
    readonly ran: readonly string[];
    readonly undo: readonly string[];
  };

export interface Receipt {
  readonly version: number;
  /** Passed in rather than read from the clock, so runs are reproducible. */
  readonly installedAt: string;
  readonly entries: readonly Entry[];
  /**
   * What was installed, as opposed to which bytes moved.
   *
   * Written by every plugin adapter, and for two versions read by nothing: it
   * was added for `--upgrade`, which replayed it rather than being told the names
   * again, and that flag was retired once re-running the install *was* the
   * upgrade. Nothing writes it now — no adapter is left to — but it finally has
   * a **reader**: `uninstall.ts` uses it to describe a legacy receipt in the
   * list it asks the user to confirm, so a row can say *which* plugins an old
   * multi-target install put there instead of only naming a file.
   */
  readonly plugins?: readonly {
    readonly name: string;
    readonly scope: Scope;
  }[];
}

/**
 * Read a receipt, or `undefined` when there is none or it is unreadable.
 *
 * A receipt from a future version is refused rather than half-applied: reverting
 * with rules that do not match how it was written is worse than declining.
 */
export function readReceipt(path: string): Receipt | undefined {
  if (!existsSync(path)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Receipt;
    return parsed.version > RECEIPT_VERSION ? undefined : parsed;
  }
  catch {
    return undefined;
  }
}

export interface RevertHooks {
  /**
   * Restore one config key. Given `previous === undefined` and
   * `hadKey === false`, the key must be deleted.
   *
   * Config formats differ enough (JSONC vs YAML vs TOML) that the adapter owns
   * the actual edit; the receipt only says what to restore it to.
   */
  restoreKey(
    file: string,
    path: readonly (string | number)[],
    hadKey: boolean,
    previous: unknown,
  ): void;

  /**
   * Run a recorded undo command. Absent for adapters that never record one, in
   * which case a `command` entry is skipped rather than treated as an error.
   */
  runUndo?(undo: readonly string[]): void;
}

/**
 * Undo a receipt, in reverse order.
 *
 * Reverse matters: a later entry may sit inside a directory an earlier one
 * created, and removing the directory first would strand it.
 */
export function revert(receipt: Receipt, hooks: RevertHooks): void {
  for (const entry of [...receipt.entries].reverse()) {
    switch (entry.kind) {
      case "file": {
        if (entry.previous === undefined) {
          rmSync(entry.path, { force: true });
        }
        else {
          writeFileAtomic.sync(entry.path, entry.previous);
        }
        break;
      }
      case "dir": {
        // Only if empty — the user may have put their own files inside.
        try {
          if (existsSync(entry.path) && readdirSync(entry.path).length === 0) {
            rmdirSync(entry.path);
          }
        }
        catch {
          // A directory we cannot remove is not a failed uninstall.
        }
        break;
      }
      case "tree": {
        // Recursive, because nothing but this tool writes here. `force` covers
        // the path already being gone, which an interrupted uninstall or a
        // hand-deleted payload both produce.
        rmSync(entry.path, { recursive: true, force: true });
        break;
      }
      case "configKey": {
        hooks.restoreKey(entry.file, entry.path, entry.hadKey, entry.previous);
        break;
      }
      case "command": {
        hooks.runUndo?.(entry.undo);
        break;
      }
    }
  }
}
