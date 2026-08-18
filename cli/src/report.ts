/**
 * What happened, rendered.
 *
 * This is the reporting half of the retired `executor.ts`. The other half drove
 * one plan per target across four adapters; there are no targets and no plans
 * left, so what a run reports is a handful of independent **steps** — the
 * statusline, and one row per thing an uninstall removed.
 *
 * The table survived the narrowing, and the reason is the uninstall: it
 * enumerates a variable number of pieces and each one succeeds or fails on its
 * own, which is exactly what a table is for. `TARGET` became `STEP`, since a
 * row no longer names a tool.
 */
import { homedir } from "node:os";
import type { Action } from "./context.ts";

export interface Outcome {
  /** What the row is about — `statusline`, or one enumerated uninstall item. */
  readonly name: string;
  readonly actions: readonly Action[];
  /** Absent on success; the failure message otherwise. */
  readonly error?: string;
  readonly skipped?: "empty" | "not-installed";
}

/** Did anything fail? Drives the process exit code. */
export function failed(outcomes: readonly Outcome[]): boolean {
  return outcomes.some(o => o.error !== undefined);
}

export interface ProgressReport {
  readonly outcomes: readonly Outcome[];
  /**
   * Everything the run wanted to say that is not a per-step result — graphify
   * wiring, a replaced statusline. **Collected, not printed as it happens**:
   * interleaved with the results they read as noise before you know whether
   * anything worked.
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
  readonly name: string;
  readonly result: string;
  readonly detail: string;
}

/** `3 changes` / `1 change`. */
function plural(n: number, one: string): string {
  return `${n} ${n === 1 ? one : `${one}s`}`;
}

function rowFor(outcome: Outcome): Row {
  const name = outcome.name;

  if (outcome.error !== undefined) {
    // The table keeps a phrase; the whole error expands in Failures below, so
    // one broken step cannot push the other rows out of alignment.
    return {
      name,
      result: `${BAD} failed`,
      detail: firstLine(outcome.error),
    };
  }
  if (outcome.skipped === "not-installed") {
    return { name, result: `${SKIP} skipped`, detail: "tool not on PATH" };
  }
  if (outcome.skipped === "empty") {
    return { name, result: `${SKIP} skipped`, detail: "nothing to do" };
  }
  if (outcome.actions.length === 0) {
    return { name, result: `${OK} current`, detail: "already up to date" };
  }
  return {
    name,
    result: `${OK} updated`,
    detail: plural(outcome.actions.length, "change"),
  };
}

function firstLine(text: string): string {
  const line = text.split("\n")[0] ?? text;
  return line.length > 64 ? `${line.slice(0, 61)}…` : line;
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
 * Three blocks, in the order you need them: a per-step table you can scan down
 * a column of, the notes that would otherwise interrupt it, and the full text of
 * anything that failed. A one-line verdict closes it, so a green run is legible
 * without reading any of the rest.
 */
export function renderProgress(
  input: readonly Outcome[] | ProgressReport,
): string {
  const report: ProgressReport = Array.isArray(input)
    ? { outcomes: input as readonly Outcome[] }
    : input as ProgressReport;
  const { outcomes } = report;
  const notes = report.notes ?? [];
  const blocks: string[] = [];

  if (report.version !== undefined) {
    blocks.push(`  @askviraj/ai-plugins ${report.version}`);
  }

  const rows = outcomes.map(rowFor);
  const wName = Math.max(4, ...rows.map(r => r.name.length));
  const wResult = Math.max(6, ...rows.map(r => r.result.length));
  const table = [
    `  ${pad("STEP", wName)}  ${pad("RESULT", wResult)}  DETAIL`,
    ...rows.map(r =>
      `  ${pad(r.name, wName)}  ${pad(r.result, wResult)}  ${r.detail}`
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
          `    ${o.name}`,
          ...(o.error ?? "").split("\n").map(l => `      ${l}`),
        ]),
      ]
        .join("\n"),
    );
  }

  blocks.push(`  ${verdict(rows, report.elapsedMs)}`);
  return blocks.join("\n\n");
}

/** Counted over the **rows**, so the verdict cannot disagree with the table. */
function verdict(rows: readonly Row[], elapsedMs?: number): string {
  const failures = rows.filter(r => r.result.startsWith(BAD)).length;
  const took = elapsedMs === undefined
    ? ""
    : ` in ${(elapsedMs / 1000).toFixed(1)}s`;
  if (failures > 0) {
    return `${BAD} ${failures} of ${plural(rows.length, "step")} failed${took}`;
  }
  const changed = rows.filter(r => r.result.includes("updated")).length;
  if (changed === 0) {
    return `${OK} everything already up to date${took}`;
  }
  return `${OK} ${plural(changed, "step")} updated${took}`;
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
export function renderDiff(outcomes: readonly Outcome[]): string {
  const blocks: string[] = [];

  for (const outcome of outcomes) {
    if (outcome.actions.length === 0) {
      continue;
    }
    blocks.push(`# ${outcome.name}`);
    for (const action of outcome.actions) {
      blocks.push(`  ${action.summary}`);
      if (action.diff !== undefined) {
        blocks.push(indent(diffLines(action.diff.before, action.diff.after)));
      }
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
