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

export const RECEIPT_VERSION = 1;

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
  };

export interface Receipt {
  readonly version: number;
  /** Passed in rather than read from the clock, so runs are reproducible. */
  readonly installedAt: string;
  readonly entries: readonly Entry[];
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

  build(installedAt: string): Receipt {
    return {
      version: RECEIPT_VERSION,
      installedAt,
      entries: [...this.entries],
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
    }
  }
}
