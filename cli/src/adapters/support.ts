/**
 * Helpers shared by more than one adapter.
 *
 * Kept deliberately small: an adapter's value is that it says exactly what its
 * target needs, so anything moved here has to be genuinely target-independent.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getPath } from "../config/json.ts";
import type { Exec } from "./types.ts";

/**
 * The real command runner, for the CLI entrypoint to put on the context.
 *
 * No shell: arguments are passed as an array, so a marketplace name or path
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

/** Is `bin` on the PATH? Used by every adapter's `detect`. */
export function hasBin(bin: string): boolean {
  const path = process.env["PATH"] ?? "";
  return path
    .split(process.platform === "win32" ? ";" : ":")
    .some(dir => dir.length > 0 && existsSync(join(dir, bin)));
}

/**
 * Where Claude Code keeps its user-level config.
 *
 * `CLAUDE_CONFIG_DIR` wins, which is also how the tests point a whole install
 * at a throwaway directory. Shared because the statusline writes into the same
 * `settings.json` the plugin adapter reads, and the two disagreeing would put
 * the status bar in a file Claude never loads.
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
 * would undo the leaf and strand its parent — setting `plugins["x"]` on a config
 * with no `plugins` leaves an orphaned `"plugins": {}` behind, which is close to
 * byte-identical and therefore not byte-identical.
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
