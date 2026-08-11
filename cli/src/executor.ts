/**
 * Running a resolved plan across adapters, and rendering what happened.
 *
 * One executor drives every target, so `--dry-run` and a real run walk the same
 * code: an adapter's `plan()` and `apply()` already share one implementation,
 * and this keeps the layer above from growing a second path of its own.
 *
 * **A failing adapter does not abort the others.** Targets are independent —
 * Cursor failing says nothing about OpenCode — and stopping halfway would leave
 * some installed, some not, with no receipt for the ones that succeeded. Each
 * target's outcome is collected and reported, and the caller exits non-zero if
 * any failed.
 */
import type { TargetId } from "@ai-plugins/schema";
import {
  readdirSync,
  rmdirSync,
  rmSync,
} from "node:fs";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  join,
} from "node:path";
import { hasBin } from "./adapters/support.ts";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
} from "./adapters/types.ts";
import { isEmptyPlan } from "./adapters/types.ts";
import type { Progress } from "./progress.ts";
import type { Receipt } from "./receipt.ts";
import {
  readReceipt,
  writeReceipt,
} from "./receipt.ts";
import {
  installStatuslineOhmypi,
  planStatuslineOhmypi,
  revertStatuslineOhmypi,
} from "./statusline-ohmypi.ts";
import {
  installStatuslineOpencode,
  planStatuslineOpencode,
  revertStatuslineOpencode,
} from "./statusline-opencode.ts";
import {
  installStatusline,
  planStatusline,
  revertStatusline,
} from "./statusline.ts";

/**
 * What an outcome can be about. Neither statusline is a target — neither is a
 * plugin — but both are reported beside them, so the reporter needs one row
 * type rather than three.
 */
export type OutcomeId =
  | TargetId
  | "statusline"
  | "statusline:ohmypi"
  | "statusline:opencode";

export interface TargetOutcome {
  readonly target: OutcomeId;
  readonly actions: readonly Action[];
  /** Absent on success; the failure message otherwise. */
  readonly error?: string;
  readonly skipped?: "empty" | "not-installed";
  /**
   * How many plugins this target's plan named. Absent for the statusline
   * outcomes, which install no plugin — the report says what they touched
   * instead of pretending to a count of zero.
   */
  readonly plugins?: number;
}

export interface ExecuteOptions {
  readonly context: AdapterContext;
  readonly dryRun: boolean;
  /** Where per-target receipts live. */
  readonly receiptDir: string;
  /** Install into a target whose tool is not on PATH. Off by default. */
  readonly force?: boolean;
  /**
   * The live step indicator. Every adapter blocks on `spawnSync`, so this is
   * the only feedback a run gives between starting and its final report.
   */
  readonly progress?: Progress;
}

/**
 * Our own directory under the user's config base — `<config>/ai-plugins/`.
 *
 * Named here so the uninstall cleanup can prove the directory it is about to
 * remove is ours, rather than trusting that the receipt dir's parent must be.
 */
const PACKAGE_DIR = "ai-plugins";

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
    const plugins = plan.user.length + plan.project.length;
    options.progress?.step(
      `${options.dryRun ? "planning" : "installing"} ${adapter.id}`,
    );
    if (isEmptyPlan(plan)) {
      outcomes.push({
        target: adapter.id,
        actions: [],
        skipped: "empty",
        plugins,
      });
      continue;
    }
    if (options.force !== true && !adapter.detect(options.context)) {
      // Not an error: `--platform` defaults to every tool present, so a machine
      // without Cursor should say so and move on, not fail the run.
      outcomes.push({
        target: adapter.id,
        actions: [],
        skipped: "not-installed",
        plugins,
      });
      continue;
    }

    try {
      if (options.dryRun) {
        outcomes.push({
          target: adapter.id,
          actions: adapter.plan(options.context, plan),
          plugins,
        });
        continue;
      }
      const result = adapter.apply(options.context, plan);
      writeReceipt(
        receiptPath(options.receiptDir, adapter.id),
        result.receipt,
      );
      outcomes.push({ target: adapter.id, actions: result.actions, plugins });
    }
    catch (error) {
      outcomes.push({
        target: adapter.id,
        actions: [],
        error: (error as Error).message,
        plugins,
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
    options.progress?.step(`reverting ${adapter.id}`);
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

  // The receipts live in directories this tool created, and no receipt can
  // record the directory holding itself — so after the last one is consumed
  // they were left behind, empty. Removed here rather than as receipt entries,
  // and only while empty, so a partial uninstall that leaves another target's
  // receipt in place keeps the directory it needs.
  //
  // The parent is removed **only when it is our own `ai-plugins/`**. Walking up
  // blindly would point this at whatever holds the receipt dir — `/tmp` under a
  // test, or a directory the user chose — and an empty one there is not ours to
  // delete.
  removeIfEmpty(options.receiptDir);
  const parent = dirname(options.receiptDir);
  if (basename(parent) === PACKAGE_DIR) {
    removeIfEmpty(parent);
  }

  return outcomes;
}

/** Remove a directory only when nothing is left in it. Never throws. */
function removeIfEmpty(path: string): void {
  try {
    if (readdirSync(path).length === 0) {
      rmdirSync(path);
    }
  }
  catch {
    // Absent, not a directory, or not ours to remove: nothing to clean up.
  }
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
  options.progress?.step("installing statusline (claude)");
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

/**
 * The Oh-My-Pi statusline's receipt.
 *
 * A file of its own rather than a section of Claude's: the two configure
 * different surfaces on different machines, and sharing one record would have
 * an uninstall on a Claude-only run try to undo `omp config` keys it never set.
 */
export function ohmypiStatuslineReceiptPath(receiptDir: string): string {
  return join(receiptDir, "statusline-ohmypi.json");
}

/** Has the Oh-My-Pi statusline been configured by this CLI? */
export function ohmypiStatuslineInstalled(options: ExecuteOptions): boolean {
  return readReceipt(ohmypiStatuslineReceiptPath(options.receiptDir))
    !== undefined;
}

/**
 * Configure the Oh-My-Pi statusline, or describe it under `--dry-run`.
 *
 * `omp` absent is a **skip, not a failure** — the same rule the target loop
 * follows, and for the same reason: this runs whenever Oh-My-Pi is among the
 * selected targets, and a machine without it should say so and move on.
 * Everything here is driven through the CLI, so there is no half-install to
 * fall back to.
 */
export function executeStatuslineOhmypi(
  options: ExecuteOptions,
): TargetOutcome {
  options.progress?.step("installing statusline (ohmypi)");
  if (!hasBin("omp")) {
    return {
      target: "statusline:ohmypi",
      actions: [],
      skipped: "not-installed",
    };
  }
  try {
    if (options.dryRun) {
      return {
        target: "statusline:ohmypi",
        actions: planStatuslineOhmypi(options.context),
      };
    }
    const result = installStatuslineOhmypi(options.context);
    writeReceipt(
      ohmypiStatuslineReceiptPath(options.receiptDir),
      result.receipt,
    );
    return { target: "statusline:ohmypi", actions: result.actions };
  }
  catch (error) {
    return {
      target: "statusline:ohmypi",
      actions: [],
      error: (error as Error).message,
    };
  }
}

/** Undo an Oh-My-Pi statusline install from its receipt. */
export function revertStatuslineOhmypiInstall(
  options: ExecuteOptions,
): TargetOutcome {
  const path = ohmypiStatuslineReceiptPath(options.receiptDir);
  const receipt = readReceipt(path);
  if (receipt === undefined) {
    return { target: "statusline:ohmypi", actions: [], skipped: "empty" };
  }
  if (!hasBin("omp")) {
    return {
      target: "statusline:ohmypi",
      actions: [],
      skipped: "not-installed",
    };
  }
  try {
    revertStatuslineOhmypi(options.context, receipt);
    rmSync(path, { force: true });
    return {
      target: "statusline:ohmypi",
      actions: [{ summary: "reverted the Oh-My-Pi statusline", path }],
    };
  }
  catch (error) {
    return {
      target: "statusline:ohmypi",
      actions: [],
      error: (error as Error).message,
    };
  }
}

/**
 * The OpenCode statusline's receipt.
 *
 * A third file, for the third surface, for the same reason the second one
 * exists: the three are selected together but installed independently, and one
 * shared record would have an uninstall on a Claude-only machine try to undo a
 * `tui.json` it never wrote.
 */
export function opencodeStatuslineReceiptPath(receiptDir: string): string {
  return join(receiptDir, "statusline-opencode.json");
}

/** Has the OpenCode statusline been installed by this CLI? */
export function opencodeStatuslineInstalled(options: ExecuteOptions): boolean {
  return readReceipt(opencodeStatuslineReceiptPath(options.receiptDir))
    !== undefined;
}

/**
 * Install the OpenCode TUI statusline, or describe it under `--dry-run`.
 *
 * `opencode` absent is a **skip, not a failure** — the same rule the target loop
 * and the Oh-My-Pi half follow. Writing a `tui.json` for a tool that is not on
 * the machine leaves config behind for something that will never read it.
 */
export function executeStatuslineOpencode(
  options: ExecuteOptions,
): TargetOutcome {
  options.progress?.step("installing statusline (opencode)");
  if (!hasBin("opencode")) {
    return {
      target: "statusline:opencode",
      actions: [],
      skipped: "not-installed",
    };
  }
  try {
    if (options.dryRun) {
      return {
        target: "statusline:opencode",
        actions: planStatuslineOpencode(options.context),
      };
    }
    const result = installStatuslineOpencode(options.context);
    writeReceipt(
      opencodeStatuslineReceiptPath(options.receiptDir),
      result.receipt,
    );
    return { target: "statusline:opencode", actions: result.actions };
  }
  catch (error) {
    return {
      target: "statusline:opencode",
      actions: [],
      error: (error as Error).message,
    };
  }
}

/**
 * Undo an OpenCode statusline install from its receipt.
 *
 * Unlike Oh-My-Pi's, this does **not** need `opencode` on `PATH`: everything it
 * wrote is files this CLI owns, so it can put them back whether or not the tool
 * is still installed.
 */
export function revertStatuslineOpencodeInstall(
  options: ExecuteOptions,
): TargetOutcome {
  const path = opencodeStatuslineReceiptPath(options.receiptDir);
  const receipt = readReceipt(path);
  if (receipt === undefined) {
    return { target: "statusline:opencode", actions: [], skipped: "empty" };
  }
  try {
    revertStatuslineOpencode(receipt);
    rmSync(path, { force: true });
    return {
      target: "statusline:opencode",
      actions: [{ summary: "reverted the OpenCode statusline", path }],
    };
  }
  catch (error) {
    return {
      target: "statusline:opencode",
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

export interface ProgressReport {
  readonly outcomes: readonly TargetOutcome[];
  /**
   * Everything the run wanted to say that is not a per-target result — a
   * skipped plugin, a scope redirect, graphify wiring. **Collected, not
   * printed as it happens**: interleaved with the results they read as noise
   * before you know whether anything worked.
   */
  readonly notes?: readonly string[];
  /** Shown in the header, so a pasted report says which build produced it. */
  readonly version?: string;
  readonly elapsedMs?: number;
}

const OK = "✔";
const BAD = "✘";
const SKIP = "–";

interface Row {
  readonly target: string;
  readonly result: string;
  readonly detail: string;
}

/** `3 plugins` / `1 plugin`, or nothing when the count is not meaningful. */
function plural(n: number, one: string): string {
  return `${n} ${n === 1 ? one : `${one}s`}`;
}

function rowFor(outcome: TargetOutcome): Row {
  const target = outcome.target;
  const count = outcome.plugins;
  const scope = count === undefined ? undefined : plural(count, "plugin");

  if (outcome.error !== undefined) {
    // The table keeps a phrase; the whole error expands in Failures below, so
    // one broken target cannot push the other rows out of alignment.
    return {
      target,
      result: `${BAD} failed`,
      detail: firstLine(outcome.error),
    };
  }
  if (outcome.skipped === "not-installed") {
    return { target, result: `${SKIP} skipped`, detail: "tool not on PATH" };
  }
  if (outcome.skipped === "empty") {
    return { target, result: `${SKIP} skipped`, detail: "nothing requested" };
  }
  if (outcome.actions.length === 0) {
    return {
      target,
      result: `${OK} current`,
      detail: scope === undefined
        ? "already up to date"
        : `${scope}, already up to date`,
    };
  }
  const files = plural(outcome.actions.length, "change");
  return {
    target,
    result: `${OK} updated`,
    detail: scope === undefined ? files : `${scope}, ${files}`,
  };
}

function firstLine(text: string): string {
  const line = text.split("\n")[0] ?? text;
  return line.length > 64 ? `${line.slice(0, 61)}…` : line;
}

/** Which agent each statusline outcome installs into. */
const STATUSLINE_SURFACE: Record<string, string> = {
  statusline: "claude",
  "statusline:ohmypi": "ohmypi",
  "statusline:opencode": "opencode",
};

/**
 * The three statusline outcomes become one row.
 *
 * They are three installs of a single feature — a copied script, four `omp
 * config` keys, a TUI plugin — so listing them as three targets both triples
 * the apparent surface area and, because `statusline:opencode` is the longest
 * label in the run, widens every other column to accommodate a name nobody
 * needed to read.
 */
function collapseStatusline(outcomes: readonly TargetOutcome[]): Row[] {
  const bars = outcomes.filter(o => o.target in STATUSLINE_SURFACE);
  const rows = outcomes
    .filter(o => !(o.target in STATUSLINE_SURFACE))
    .map(rowFor);
  if (bars.length === 0) {
    return rows;
  }

  const failedBars = bars.filter(o => o.error !== undefined);
  if (failedBars.length > 0) {
    rows.push({
      target: "statusline",
      result: `${BAD} failed`,
      detail: firstLine(failedBars[0]?.error ?? ""),
    });
    return rows;
  }
  const changed = bars
    .filter(o => o.skipped === undefined && o.actions.length > 0)
    .map(o => STATUSLINE_SURFACE[o.target] ?? o.target);
  rows.push({
    target: "statusline",
    result: changed.length > 0 ? `${OK} updated` : `${OK} current`,
    detail: changed.length > 0
      ? changed.join(", ")
      : "already up to date",
  });
  return rows;
}

/**
 * Collapse `$HOME` to `~` in a note.
 *
 * A pnpm store path is ~150 characters of content-addressed hash, and three of
 * them turn the notes block into a wall. The prefix is the part carrying no
 * information — every reader knows where their own home directory is.
 */
export function shorten(text: string, home: string = homedir()): string {
  return home.length > 1 ? text.split(home).join("~") : text;
}

/** Wrap to `width`, continuation lines aligned under the first. */
function wrap(text: string, width: number, indent: string): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length > 0 && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
      continue;
    }
    line = line.length === 0 ? word : `${line} ${word}`;
  }
  if (line.length > 0) {
    lines.push(line);
  }
  return lines.map((l, i) => (i === 0 ? `${indent}${l}` : `${indent}  ${l}`));
}

/**
 * The run report. **Goes to stderr**, so stdout stays parseable — a caller
 * piping this into `jq` should not have to filter out banners.
 *
 * Three blocks, in the order you need them: a per-target table you can scan
 * down a column of, the notes that would otherwise interrupt it, and the full
 * text of anything that failed. A one-line verdict closes it, so a green run
 * is legible without reading any of the rest.
 */
export function renderProgress(
  input: readonly TargetOutcome[] | ProgressReport,
): string {
  const report: ProgressReport = Array.isArray(input)
    ? { outcomes: input as readonly TargetOutcome[] }
    : input as ProgressReport;
  const { outcomes } = report;
  const notes = report.notes ?? [];
  const blocks: string[] = [];

  if (report.version !== undefined) {
    blocks.push(`  @askviraj/ai-plugins ${report.version}`);
  }

  const rows = collapseStatusline(outcomes);
  const wTarget = Math.max(6, ...rows.map(r => r.target.length));
  const wResult = Math.max(6, ...rows.map(r => r.result.length));
  const table = [
    `  ${pad("TARGET", wTarget)}  ${pad("RESULT", wResult)}  DETAIL`,
    ...rows.map(r =>
      `  ${pad(r.target, wTarget)}  ${pad(r.result, wResult)}  ${r.detail}`
        .trimEnd()
    ),
  ];
  blocks.push(table.join("\n"));

  if (notes.length > 0) {
    blocks.push(
      ["  Notes", ...notes.flatMap(n => wrap(shorten(n), 68, "    "))]
        .join("\n"),
    );
  }

  const failures = outcomes.filter(o => o.error !== undefined);
  if (failures.length > 0) {
    blocks.push(
      [
        "  Failures",
        ...failures.flatMap(o => [
          `    ${o.target}`,
          ...(o.error ?? "").split("\n").map(l => `      ${l}`),
        ]),
      ]
        .join("\n"),
    );
  }

  blocks.push(`  ${verdict(rows, report.elapsedMs)}`);
  return blocks.join("\n\n");
}

/**
 * Counted over the **rows**, not the raw outcomes.
 *
 * The three statusline outcomes collapse into one row, so counting outcomes
 * made the verdict disagree with the table right above it — "1 of 7 targets
 * failed" printed under five rows, which reads as two targets having gone
 * unreported.
 */
function verdict(rows: readonly Row[], elapsedMs?: number): string {
  const failed = rows.filter(r => r.result.startsWith(BAD)).length;
  const took = elapsedMs === undefined
    ? ""
    : ` in ${(elapsedMs / 1000).toFixed(1)}s`;
  if (failed > 0) {
    return `${BAD} ${failed} of ${plural(rows.length, "target")} failed${took}`;
  }
  const changed = rows.filter(r => r.result.includes("updated")).length;
  if (changed === 0) {
    return `${OK} everything already up to date${took}`;
  }
  return `${OK} ${plural(changed, "target")} updated${took}`;
}

function pad(text: string, width: number): string {
  // Padding by code points, not UTF-16 units: the status glyphs are outside
  // the BMP-safe assumption `String.length` makes, and a column that drifts by
  // one on the rows that matter is worse than no column at all.
  const length = [...text].length;
  return text + " ".repeat(Math.max(0, width - length));
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
