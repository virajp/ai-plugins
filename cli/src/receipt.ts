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
import type { Scope } from "./adapters/types.ts";

/**
 * 2 added the `command` entry. A v1 receipt still reverts correctly, so the
 * guard in `readReceipt` only refuses receipts from a *future* version.
 */
export const RECEIPT_VERSION = 2;

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
   * Recorded only when the command actually changed something: re-registering
   * an already-registered marketplace is a no-op whose "undo" would remove one
   * the user set up themselves.
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
   * What was installed, as opposed to which bytes moved — the record `--upgrade`
   * replays so it can refresh what is here without being told the names again.
   *
   * **Deliberately not a version bump.** `RECEIPT_VERSION` guards *revert*, and
   * `readReceipt` refuses a future version because reverting under rules that do
   * not match how a receipt was written is worse than declining. This field
   * changes nothing about revert, so bumping for it would strand receipts an
   * older CLI could undo perfectly well. Absent on every pre-existing receipt,
   * which `--upgrade` reports rather than treating as "nothing installed".
   */
  readonly plugins?: readonly {
    readonly name: string;
    readonly scope: Scope;
  }[];
}

/** Accumulates entries during an apply. One per adapter run. */
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

  /** Record a command we ran, together with the command that undoes it. */
  command(ran: readonly string[], undo: readonly string[]): this {
    this.entries.push({ kind: "command", ran: [...ran], undo: [...undo] });
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

export function writeReceipt(path: string, receipt: Receipt): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileAtomic.sync(path, `${JSON.stringify(receipt, null, 2)}\n`);
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
