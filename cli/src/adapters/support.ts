/**
 * Helpers shared by more than one adapter.
 *
 * Kept deliberately small: an adapter's value is that it says exactly what its
 * target needs, so anything moved here has to be genuinely target-independent.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getPath } from "../config/json.ts";

/** Is `bin` on the PATH? Used by every adapter's `detect`. */
export function hasBin(bin: string): boolean {
  const path = process.env["PATH"] ?? "";
  return path
    .split(process.platform === "win32" ? ";" : ":")
    .some(dir => dir.length > 0 && existsSync(join(dir, bin)));
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
