/**
 * Install receipts — what an install touched, and what was there before it.
 *
 * The old installer removed things by *inferring* what it must have written:
 * it deleted the keys it knew it set, and left anything it was unsure about.
 * That is safe only while the inference stays true, and it silently is not
 * whenever a user edits a value the installer later removes wholesale.
 *
 * A receipt records the prior state instead, so `revert` restores rather than
 * guesses. The invariant this exists to make testable: **install then remove
 * leaves the tree and every touched config byte-identical.**
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
} from "node:fs";
import { dirname } from "node:path";
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
 * **Every kind is still read; only three are still written.**
 *
 * The statusline is the one thing this CLI installs, and it writes `file`, `dir`
 * and `configKey` alone. `tree` and `command` were the plugin adapters' — a
 * copied render tree, a `claude plugin install` paired with its uninstall — and
 * those adapters are gone. The kinds stay because `revert` still meets them:
 * `uninstall.ts` reads the receipts an older multi-target install left behind,
 * which is the whole reason a machine carrying an OpenCode bundle or an Oh-My-Pi
 * bar can be cleaned rather than orphaned. Dropping them from `revert` would
 * turn those receipts into files nothing can undo.
 *
 * `ReceiptBuilder` therefore has no `tree`, `command` or `ownedDir` method: a
 * builder method with no caller is dead weight, and a legacy receipt is JSON on
 * disk rather than something this version constructs.
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

/** Accumulates entries during an install. One per run. */
export class ReceiptBuilder {
  private readonly entries: Entry[] = [];

  /** Record a file write, capturing its prior contents if it existed. */
  file(path: string, mode?: number): this {
    const previous = existsSync(path)
      ? readFileSync(path, "utf8")
      : undefined;
    this.entries.push(
      previous === undefined
        ? { kind: "file", path, ...(mode === undefined ? {} : { mode }) }
        : {
          kind: "file",
          path,
          previous,
          ...(mode === undefined ? {} : { mode }),
        },
    );
    return this;
  }

  /**
   * Record a file as **created**, whatever is already at that path.
   *
   * For a path this tool owns outright — `~/.claude/scripts/statusline` — a file
   * already holding our bytes is ours, whichever run put it there. Recording it
   * as pre-existing instead would make an uninstall *after a second install*
   * restore the script rather than remove it, because the second install found
   * the first one's output sitting there and dutifully captured it as prior
   * state.
   */
  createdFile(path: string, mode?: number): this {
    this.entries.push({
      kind: "file",
      path,
      ...(mode === undefined ? {} : { mode }),
    });
    return this;
  }

  /** Record a directory we are about to create. Existing dirs are not recorded. */
  dir(path: string): this {
    if (!existsSync(path)) {
      this.entries.push({ kind: "dir", path });
    }
    return this;
  }

  /** Record a config key, capturing whether it existed and its prior value. */
  configKey(
    file: string,
    path: readonly (string | number)[],
    current: { readonly present: boolean; readonly value?: unknown; },
  ): this {
    this.entries.push({
      kind: "configKey",
      file,
      path,
      hadKey: current.present,
      ...(current.present ? { previous: current.value } : {}),
    });
    return this;
  }

  build(
    installedAt: string,
    plugins?: readonly { readonly name: string; readonly scope: Scope; }[],
  ): Receipt {
    return {
      version: RECEIPT_VERSION,
      installedAt,
      entries: [...this.entries],
      ...(plugins === undefined ? {} : { plugins: [...plugins] }),
    };
  }
}

/**
 * Write a receipt, **merged with whatever is already at that path**.
 *
 * A receipt describes an install, not a run — and those came apart the moment
 * anyone installed twice. Each run used to overwrite the record wholesale, so
 * installing `identity` after `datastore` produced a receipt naming only
 * `identity`: the uninstall then removed half the install and reported success.
 * Every adapter had this, because every
 * adapter got its own fresh `ReceiptBuilder` and none of them could see what an
 * earlier run had claimed.
 *
 * Merging here rather than at each call site is deliberate, and stays that way
 * now that one writer is left. Four reached this function — the adapters and the
 * three statusline surfaces — and the receipt-completeness bug recurred across
 * all of them precisely because each site decided for itself; the statusline
 * still needs it, since install → install → uninstall is the sequence that
 * exposed it and the bar is installed repeatedly by design.
 *
 * **The older entry wins a collision.** Two runs claiming the same path differ
 * only in what they captured as prior state, and the earlier capture is the
 * truer one: run 2 read a machine run 1 had already changed. Entry order is
 * preserved oldest-first, so revert — which replays backwards — undoes the most
 * recent claims before the ones underneath them.
 */
export function writeReceipt(path: string, receipt: Receipt): void {
  const merged = mergeReceipts(readReceipt(path), receipt);
  mkdirSync(dirname(path), { recursive: true });
  writeFileAtomic.sync(path, `${JSON.stringify(merged, null, 2)}\n`);
}

/**
 * What makes two entries the same claim.
 *
 * Deliberately not the whole entry: the point is to recognise a path this tool
 * has already claimed *whatever it captured about it*, so the captured state is
 * excluded from the identity and the older one is kept.
 */
function identity(entry: Entry): string {
  switch (entry.kind) {
    case "command":
      return `command ${entry.ran.join(" ")}`;
    case "configKey":
      return `configKey ${entry.file} ${entry.path.join(" ")}`;
    default:
      return `${entry.kind} ${entry.path}`;
  }
}

export function mergeReceipts(
  previous: Receipt | undefined,
  current: Receipt,
): Receipt {
  if (previous === undefined) {
    return current;
  }
  const seen = new Set(previous.entries.map(identity));
  const entries = [
    ...previous.entries,
    ...current.entries.filter(entry => !seen.has(identity(entry))),
  ];

  // Union by name+scope, current last: a plugin installed by an earlier run is
  // still installed, so this run's list must not narrow the record.
  const plugins = [...previous.plugins ?? [], ...current.plugins ?? []];
  const unique = plugins.filter((plugin, index) =>
    plugins.findIndex(other =>
      other.name === plugin.name && other.scope === plugin.scope
    ) === index
  );

  return {
    ...current,
    entries,
    ...(unique.length === 0 ? {} : { plugins: unique }),
  };
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
