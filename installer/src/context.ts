/**
 * What the CLI needs from the outside world, and the few helpers that read it.
 *
 * **This is what is left of `adapters/`.** That directory held the install-time
 * half of a build-time/install-time split: a Target rendered templates into one
 * of four committed trees, an Adapter copied or registered that tree onto the
 * machine. Both halves are gone — plugins are authored once in Claude's native
 * format and installed by `claude plugin install` from GitHub — so there is no
 * adapter to give a context to, and the type is named for what it is.
 *
 * Everything here is passed in rather than read directly, so a test can point a
 * whole run at a temp directory and `Date.now()` never appears inside a writer:
 * a receipt has to be reproducible.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getPath } from "./config/json.ts";
import type { Progress } from "./progress.ts";

/** Where a Claude plugin install lands. */
export type Scope = "user" | "project";

export interface Context {
  /** Root of the checkout or unpacked package — what holds `package.json`. */
  readonly sourceRoot: string;
  /** `$HOME`, injectable so tests never touch the real one. */
  readonly home: string;
  /** The directory the run was invoked from, which decides its repo. */
  readonly cwd: string;
  /** Timestamp for the receipt, supplied by the caller. */
  readonly now: string;
  readonly log: (message: string) => void;
  /**
   * Runs an external command.
   *
   * Required rather than optional, and injected rather than imported: an
   * uninstall removes a plugin by driving `claude plugin uninstall`, so for
   * that path this *is* the work. A default would give tests a second code
   * path to the one that ships.
   */
  readonly exec: Exec;
}

/**
 * The run's settings, as opposed to its environment.
 *
 * Shared by the two things a run can do — install plugins, or uninstall —
 * because both honour `--dry-run` and both report through the same progress
 * indicator.
 */
export interface RunOptions {
  readonly context: Context;
  readonly dryRun: boolean;
  /** Where receipts live. Stable across runs, or uninstall has nothing to read. */
  readonly receiptDir: string;
  /**
   * The live step indicator. Everything here blocks on `spawnSync` or a
   * synchronous file write, so this is the only feedback a run gives between
   * starting and its final report.
   */
  readonly progress?: Progress;
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

/**
 * The real command runner, for the CLI entrypoint to put on the context.
 *
 * No shell: arguments are passed as an array, so a plugin name or path
 * containing a space or a metacharacter is an argument rather than syntax.
 * A command that cannot be spawned at all reports status 127 like a shell
 * would, instead of throwing, so callers have one failure shape to handle.
 */
export const execCommand: Exec = (command, args, options) => {
  const result = spawnSync(command, [...args], {
    encoding: "utf8",
    ...(options?.cwd === undefined ? {} : { cwd: options.cwd }),
    ...(options?.env === undefined ? {} : { env: options.env }),
  });
  if (result.error !== undefined) {
    return { status: 127, stdout: "", stderr: String(result.error.message) };
  }
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

/** A single intended change, rendered for `--dry-run` and for the reporter. */
export interface Action {
  /** Imperative, user-facing: "claude plugin install vwf@virajp-plugins". */
  readonly summary: string;
  /** Absolute path this touches, when it is a file operation. */
  readonly path?: string;
  /** A diff to show under `--dry-run`, when the change is to a text file. */
  readonly diff?: { readonly before: string; readonly after: string; };
}

/** Is `bin` on the PATH? */
export function hasBin(bin: string): boolean {
  const path = process.env["PATH"] ?? "";
  return path
    .split(process.platform === "win32" ? ";" : ":")
    .some(dir => dir.length > 0 && existsSync(join(dir, bin)));
}

/**
 * Where Claude Code keeps its user-level config.
 *
 * `CLAUDE_CONFIG_DIR` wins, which is also how the tests point a whole run at a
 * throwaway directory. The install planner and the uninstall enumeration both
 * read `settings.json` from here, and the two disagreeing would have an
 * uninstall unable to see what an install had just written.
 */
export function claudeConfigDir(home: string): string {
  const override = process.env["CLAUDE_CONFIG_DIR"];
  return override !== undefined && override.length > 0
    ? override
    : join(home, ".claude");
}

/**
 * The shortest prefix of `path` that is absent from the document.
 *
 * That prefix is what this install creates, and therefore what an uninstall has
 * to remove to leave the file as it found it. Recording the full path instead
 * would undo the leaf and strand its parent — setting `hooks.PostToolUse[0]` on
 * a config with no `hooks` leaves an orphaned `"hooks": {}` behind, which is
 * close to byte-identical and therefore not byte-identical.
 */
export function shallowestNew(
  parsed: Record<string, unknown> | undefined,
  path: readonly (string | number)[],
): readonly (string | number)[] {
  for (let i = 1; i <= path.length; i++) {
    const prefix = path.slice(0, i);
    if (parsed === undefined || getPath(parsed, prefix) === undefined) {
      return prefix;
    }
  }
  return path;
}

/**
 * The published package name.
 *
 * Read by `packageRoot()`, which finds the root by walking up for a
 * `package.json` whose name matches rather than by counting `..` segments.
 */
export const PACKAGE_NAME = "@askviraj/ai-plugins";

/** The marketplace this toolkit registers with Claude. */
export const MARKETPLACE_NAME = "virajp-plugins";
