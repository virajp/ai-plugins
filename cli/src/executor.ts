/**
 * Running a resolved plan across adapters, and rendering what happened.
 *
 * One executor drives every target, so `--dry-run` and a real run walk the same
 * code: an adapter's `plan()` and `apply()` already share one implementation,
 * and this keeps the layer above from growing a second path of its own.
 *
 * **A failing adapter does not abort the others.** Targets are independent —
 * Codex failing says nothing about OpenCode — and stopping halfway would leave
 * some installed, some not, with no receipt for the ones that succeeded. Each
 * target's outcome is collected and reported, and the caller exits non-zero if
 * any failed.
 */
import type { TargetId } from "@ai-plugins/schema";
import { rmSync } from "node:fs";
import { join } from "node:path";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
} from "./adapters/types.ts";
import { isEmptyPlan } from "./adapters/types.ts";
import type { Receipt } from "./receipt.ts";
import {
  readReceipt,
  writeReceipt,
} from "./receipt.ts";
import {
  installStatusline,
  planStatusline,
  revertStatusline,
} from "./statusline.ts";

/**
 * What an outcome can be about. The statusline is not a target — it is not a
 * plugin and belongs to Claude Code alone — but it is reported beside them, so
 * the reporter needs one row type rather than two.
 */
export type OutcomeId = TargetId | "statusline";

export interface TargetOutcome {
  readonly target: OutcomeId;
  readonly actions: readonly Action[];
  /** Absent on success; the failure message otherwise. */
  readonly error?: string;
  readonly skipped?: "empty" | "not-installed";
}

export interface ExecuteOptions {
  readonly context: AdapterContext;
  readonly dryRun: boolean;
  /** Where per-target receipts live. */
  readonly receiptDir: string;
  /** Install into a target whose tool is not on PATH. Off by default. */
  readonly force?: boolean;
}

export function receiptPath(receiptDir: string, target: TargetId): string {
  return join(receiptDir, `${target}.json`);
}

/**
 * Install one plan per adapter.
 *
 * A receipt is written **per target**, so uninstalling one leaves the others
 * intact — and so a partially failed run still records what did land.
 */
export function execute(
  jobs: readonly (readonly [Adapter, AdapterPlan])[],
  options: ExecuteOptions,
): TargetOutcome[] {
  const outcomes: TargetOutcome[] = [];

  for (const [adapter, plan] of jobs) {
    if (isEmptyPlan(plan)) {
      outcomes.push({ target: adapter.id, actions: [], skipped: "empty" });
      continue;
    }
    if (options.force !== true && !adapter.detect(options.context)) {
      // Not an error: `--platform` defaults to every tool present, so a machine
      // without Codex should say so and move on, not fail the run.
      outcomes.push({
        target: adapter.id,
        actions: [],
        skipped: "not-installed",
      });
      continue;
    }

    try {
      if (options.dryRun) {
        outcomes.push({
          target: adapter.id,
          actions: adapter.plan(options.context, plan),
        });
        continue;
      }
      const result = adapter.apply(options.context, plan);
      writeReceipt(
        receiptPath(options.receiptDir, adapter.id),
        result.receipt,
      );
      outcomes.push({ target: adapter.id, actions: result.actions });
    }
    catch (error) {
      outcomes.push({
        target: adapter.id,
        actions: [],
        error: (error as Error).message,
      });
    }
  }

  return outcomes;
}

/**
 * Undo a previous install, per target.
 *
 * Reverting without a receipt is refused rather than guessed at: the whole
 * point of a receipt is that uninstall restores what was there instead of
 * inferring what it must have written.
 */
export function revert(
  adapters: readonly Adapter[],
  options: ExecuteOptions,
): TargetOutcome[] {
  const outcomes: TargetOutcome[] = [];

  for (const adapter of adapters) {
    const path = receiptPath(options.receiptDir, adapter.id);
    const receipt = readReceipt(path);
    if (receipt === undefined) {
      outcomes.push({ target: adapter.id, actions: [], skipped: "empty" });
      continue;
    }
    try {
      adapter.revert(options.context, receipt);
      // Consume it. A receipt describes an install that exists; leaving it
      // behind after undoing one makes every later command believe in it —
      // `--upgrade` would cheerfully re-install exactly what was just removed,
      // and `verify` would report the whole thing as missing files.
      rmSync(path, { force: true });
      outcomes.push({
        target: adapter.id,
        actions: [{ summary: `reverted ${adapter.displayName}`, path }],
      });
    }
    catch (error) {
      // Kept on failure, deliberately: a half-reverted install still has state
      // to undo, and throwing the record away would strand it.
      outcomes.push({
        target: adapter.id,
        actions: [],
        error: (error as Error).message,
      });
    }
  }

  return outcomes;
}

/**
 * Rebuild a target's plan from what its receipt says it installed.
 *
 * This is what `--upgrade` replays. It works because **installing is already
 * upgrading**: every target either reads `<target>/` in place or copies it,
 * so re-running the recorded plan against a newer package is the upgrade. There
 * is no separate update command to drive and no per-tool version to query.
 *
 * `undefined` for a receipt written before plans were recorded, or one that
 * installed nothing — the caller reports that rather than silently doing
 * nothing.
 */
export function planFromReceipt(
  target: TargetId,
  receipt: Receipt,
): AdapterPlan | undefined {
  if (receipt.plugins === undefined || receipt.plugins.length === 0) {
    return undefined;
  }
  return {
    target,
    user: receipt.plugins.filter(p => p.scope === "user").map(p => p.name),
    project: receipt
      .plugins
      .filter(p => p.scope === "project")
      .map(p => p.name),
  };
}

/**
 * Re-install what each target's receipt recorded.
 *
 * A target with no receipt is skipped rather than installed: `--upgrade`
 * refreshes what is here, and deciding what *should* be here is what the
 * install flags are for.
 */
export function upgradeJobs(
  adapters: readonly Adapter[],
  options: ExecuteOptions,
): { jobs: (readonly [Adapter, AdapterPlan])[]; unrecorded: TargetId[]; } {
  const jobs: (readonly [Adapter, AdapterPlan])[] = [];
  const unrecorded: TargetId[] = [];

  for (const adapter of adapters) {
    const receipt = readReceipt(receiptPath(options.receiptDir, adapter.id));
    if (receipt === undefined) {
      continue;
    }
    const plan = planFromReceipt(adapter.id, receipt);
    if (plan === undefined) {
      // An older receipt records the bytes but not the names, so there is
      // nothing to replay — say so instead of reporting "nothing to do".
      unrecorded.push(adapter.id);
      continue;
    }
    jobs.push([adapter, plan]);
  }
  return { jobs, unrecorded };
}

/** Has the statusline been installed by this CLI? Drives the upgrade refresh. */
export function statuslineInstalled(options: ExecuteOptions): boolean {
  return readReceipt(statuslineReceiptPath(options.receiptDir)) !== undefined;
}

/**
 * The statusline's own receipt, beside the per-target ones.
 *
 * Separate rather than folded into Claude's, so uninstalling the plugins does
 * not take the status bar with them and vice versa — the two are selected by
 * different flags and a user may well want only one of them gone.
 */
export function statuslineReceiptPath(receiptDir: string): string {
  return join(receiptDir, "statusline.json");
}

/** Install the statusline, or describe the install under `--dry-run`. */
export function executeStatusline(options: ExecuteOptions): TargetOutcome {
  try {
    if (options.dryRun) {
      return {
        target: "statusline",
        actions: planStatusline(options.context),
      };
    }
    const result = installStatusline(options.context);
    writeReceipt(statuslineReceiptPath(options.receiptDir), result.receipt);
    return { target: "statusline", actions: result.actions };
  }
  catch (error) {
    return {
      target: "statusline",
      actions: [],
      error: (error as Error).message,
    };
  }
}

/** Undo a statusline install from its receipt. */
export function revertStatuslineInstall(
  options: ExecuteOptions,
): TargetOutcome {
  const path = statuslineReceiptPath(options.receiptDir);
  const receipt = readReceipt(path);
  if (receipt === undefined) {
    return { target: "statusline", actions: [], skipped: "empty" };
  }
  try {
    revertStatusline(receipt);
    return {
      target: "statusline",
      actions: [{ summary: "reverted the statusline", path }],
    };
  }
  catch (error) {
    return {
      target: "statusline",
      actions: [],
      error: (error as Error).message,
    };
  }
}

/** Did anything fail? Drives the process exit code. */
export function failed(outcomes: readonly TargetOutcome[]): boolean {
  return outcomes.some(o => o.error !== undefined);
}

/**
 * What a receipt claims is on disk but is not.
 *
 * Reported rather than repaired: a file the user deleted may have been deleted
 * on purpose.
 */
export function verify(
  adapters: readonly Adapter[],
  options: ExecuteOptions,
): Map<TargetId, readonly string[]> {
  const out = new Map<TargetId, readonly string[]>();
  for (const adapter of adapters) {
    const receipt: Receipt | undefined = readReceipt(
      receiptPath(options.receiptDir, adapter.id),
    );
    if (receipt !== undefined) {
      out.set(adapter.id, adapter.verify(options.context, receipt));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

/**
 * Human-readable progress. **Goes to stderr**, so stdout stays parseable — a
 * caller piping this into `jq` should not have to filter out banners.
 */
export function renderProgress(outcomes: readonly TargetOutcome[]): string {
  return outcomes
    .map(outcome => {
      if (outcome.error !== undefined) {
        return `✘ ${outcome.target}: ${outcome.error}`;
      }
      if (outcome.skipped === "not-installed") {
        return `- ${outcome.target}: not installed, skipping`;
      }
      if (outcome.skipped === "empty") {
        return `- ${outcome.target}: nothing to do`;
      }
      return `✔ ${outcome.target}: ${outcome.actions.length} change(s)`;
    })
    .join("\n");
}

/**
 * The full `--dry-run` diff.
 *
 * Every action carrying `diff` is rendered as a unified-ish before/after, so a
 * dry run shows the actual bytes rather than a summary the real run might not
 * match. Actions without a diff (a command to run, a binary copied) print their
 * summary alone.
 */
export function renderDiff(outcomes: readonly TargetOutcome[]): string {
  const blocks: string[] = [];

  for (const outcome of outcomes) {
    if (outcome.actions.length === 0) {
      continue;
    }
    blocks.push(`# ${outcome.target}`);
    for (const action of outcome.actions) {
      if (action.diff === undefined) {
        blocks.push(`  ${action.summary}`);
        continue;
      }
      blocks.push(`  ${action.summary}`);
      blocks.push(indent(diffLines(action.diff.before, action.diff.after)));
    }
  }

  return blocks.join("\n");
}

/**
 * A minimal line diff — enough to review a config edit, with no dependency.
 *
 * Not an LCS: it prints removed lines then added ones for the changed region,
 * which for the edits this makes (a key set, an array appended) is the same
 * thing and far less code.
 */
function diffLines(before: string, after: string): string {
  const a = before.length === 0 ? [] : before.split("\n");
  const b = after.split("\n");

  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) {
    head++;
  }
  let tail = 0;
  while (
    tail < a.length - head
    && tail < b.length - head
    && a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail++;
  }

  const removed = a.slice(head, a.length - tail).map(l => `- ${l}`);
  const added = b.slice(head, b.length - tail).map(l => `+ ${l}`);
  return [...removed, ...added].join("\n");
}

function indent(text: string): string {
  return text
    .split("\n")
    .map(line => `    ${line}`)
    .join("\n");
}
