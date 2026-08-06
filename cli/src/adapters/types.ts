/**
 * The install-time half of the two abstractions.
 *
 * A **Target** (`build/src/targets/`) is build-time and pure: templates → the
 * committed `dist/` tree. An **Adapter** is install-time and effectful:
 * `dist/` → the user's machine. Keeping them apart is what stops
 * format-preserving config mutation leaking into the renderer, where it has no
 * business, and what let the OpenCode installer shrink from a 1189-line
 * renderer to a copier.
 */
import type { TargetId } from "@ai-plugins/schema";
import type { Receipt } from "../receipt.ts";

/** Where an install lands. Not every adapter supports both. */
export type Scope = "user" | "project";

/** One adapter's slice of the run — what to install, where. */
export interface AdapterPlan {
  readonly target: TargetId;
  /** Plugin names at user scope, already dependency-expanded. */
  readonly user: readonly string[];
  /** Plugin names at project scope. */
  readonly project: readonly string[];
}

export function isEmptyPlan(plan: AdapterPlan): boolean {
  return plan.user.length === 0 && plan.project.length === 0;
}

/** A single intended change, rendered for `--dry-run` and for the reporter. */
export interface Action {
  /** Imperative, user-facing: "write ~/.config/opencode/…". */
  readonly summary: string;
  /** Absolute path this touches, when it is a file operation. */
  readonly path?: string;
  /** A diff to show under `--dry-run`, when the change is to a text file. */
  readonly diff?: { readonly before: string; readonly after: string; };
}

export interface ApplyResult {
  readonly receipt: Receipt;
  readonly actions: readonly Action[];
}

/**
 * Everything an adapter needs from the outside world.
 *
 * Passed in rather than read directly so tests can point a whole install at a
 * temp directory, and so `Date.now()` never appears inside an adapter — a
 * receipt has to be reproducible.
 */
export interface AdapterContext {
  /** Root of the checkout or unpacked package holding `dist/`. */
  readonly sourceRoot: string;
  /** `$HOME`, injectable so tests never touch the real one. */
  readonly home: string;
  /** Where a project-scoped install writes. */
  readonly cwd: string;
  /** Timestamp for the receipt, supplied by the caller. */
  readonly now: string;
  readonly log: (message: string) => void;
  /**
   * Runs an external command.
   *
   * Required rather than optional, and injected rather than imported, because
   * the marketplace-backed targets (Claude, Codex, Oh-My-Pi) install by driving
   * their own CLI — so for those adapters this *is* the install. A default
   * would give tests a second code path to the one that ships.
   */
  readonly exec: Exec;
}

export interface ExecResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

export type Exec = (
  command: string,
  args: readonly string[],
  options?: { readonly cwd?: string; readonly env?: NodeJS.ProcessEnv; },
) => ExecResult;

export interface Adapter {
  readonly id: TargetId;
  /** Human name for banners and notes. */
  readonly displayName: string;
  /** Scopes this adapter can install into. */
  readonly scopes: readonly Scope[];

  /** Is the tool installed on this machine? */
  detect(context: AdapterContext): boolean;

  /** The files this adapter owns, for `verify` and for reporting. */
  configPaths(context: AdapterContext, scope: Scope): readonly string[];

  /** What `apply` would do, without doing it. Drives `--dry-run`. */
  plan(context: AdapterContext, plan: AdapterPlan): readonly Action[];

  /** Perform the install, returning a receipt that can undo it exactly. */
  apply(context: AdapterContext, plan: AdapterPlan): ApplyResult;

  /** Is what the receipt claims still actually on disk? */
  verify(context: AdapterContext, receipt: Receipt): readonly string[];

  /** Undo a receipt. */
  revert(context: AdapterContext, receipt: Receipt): void;
}
