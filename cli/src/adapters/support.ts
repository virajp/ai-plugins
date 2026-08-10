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
 * Where this tool keeps data it owns, as opposed to config it edits.
 *
 * `XDG_DATA_HOME` wins, then the platform default. Windows gets `LOCALAPPDATA`
 * rather than a literal `~/.local/share`, which is a POSIX convention that
 * means nothing there — and this is a payload, not a dotfile, so it belongs
 * where the OS puts application data.
 *
 * Taken from the injected `home` rather than `homedir()`: the tests point a
 * whole install at a throwaway directory, and an adapter reaching past the
 * context writes into the developer's real one.
 */
export function dataDir(home: string): string {
  const xdg = process.env["XDG_DATA_HOME"];
  if (xdg !== undefined && xdg.length > 0) {
    return join(xdg, "virajp", "ai-plugins");
  }
  if (process.platform === "win32") {
    const local = process.env["LOCALAPPDATA"];
    const base = local !== undefined && local.length > 0
      ? local
      : join(home, "AppData", "Local");
    return join(base, "virajp", "ai-plugins");
  }
  return join(home, ".local", "share", "virajp", "ai-plugins");
}

/**
 * The Claude marketplace root this tool maintains.
 *
 * **Fixed across versions on purpose.** A versioned path would change the pin
 * on every release, forcing a `marketplace remove` + `add` each upgrade and
 * accumulating dead trees. A fixed one keeps the property the adapter already
 * relies on — Claude re-reads it in place, so refreshed content is picked up
 * without re-registering — while moving the bytes somewhere that outlives a
 * `pnpm store prune`.
 *
 * The doubled `claude` below is not a mistake. The manifest's plugin sources
 * are `./claude/plugins/<name>` and resolve against the **marketplace root**,
 * so the copy has to preserve the repo-root-relative layout for the manifest to
 * stay byte-identical to the committed one. Flattening would mean rewriting
 * every `source` at install time — an install-time mutation of generated
 * output, which is the divergence `plugins:render-clean` exists to prevent.
 */
export function claudeMarketplaceRoot(home: string): string {
  return join(dataDir(home), "claude");
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

/**
 * Is `path` an installed copy of this package, rather than somewhere a user
 * pointed us on purpose?
 *
 * `pnpx` resolves to a **version-specific** store path, so every upgrade moves
 * `sourceRoot`. Both CLI-driven targets record that path in their marketplace
 * registry and, being written to never clobber a registration they did not
 * make, then declined to update it — so a marketplace added by 3.0.0 kept
 * serving 3.0.0's rendered trees after 3.0.1 was installed. Claude reported
 * "already up to date" while reading the old package, which is the worst
 * possible shape for that bug: the upgrade silently did nothing.
 *
 * The test is deliberately narrow. Only a path *inside a node_modules install
 * of this package* counts, so a marketplace the user added from a git clone,
 * a GitHub source, or anywhere else is still left exactly alone — repointing
 * one of those is the clobbering the guard exists to prevent.
 */
export function isPackageInstall(path: string, packageName: string): boolean {
  return path.includes(`node_modules/${packageName}`);
}

/**
 * Should a marketplace pin be moved from `declared` to `current`?
 *
 * True only when they differ **and both** are paths this tool produced — one
 * install of it handing over to another. Anything else is the user's, and
 * re-pointing it would install from the wrong copy.
 *
 * A path is ours if it is inside a `node_modules` install of this package, or
 * inside `managedBase` when one is given. Both halves are needed and neither
 * alone suffices: the migration off the pnpm store is precisely the case where
 * `declared` is a package install and `current` is the managed directory, so
 * testing only one would leave every existing user pinned to a path their next
 * `pnpm store prune` deletes.
 */
export function isStalePin(
  declared: string,
  current: string,
  packageName: string,
  managedBase?: string,
): boolean {
  const ours = (path: string) =>
    isPackageInstall(path, packageName)
    || (managedBase !== undefined && isInside(path, managedBase));
  return declared !== current && ours(declared) && ours(current);
}

/** Is `path` `base` itself, or beneath it? */
function isInside(path: string, base: string): boolean {
  return path === base || path.startsWith(`${base}/`);
}

/**
 * The published package name.
 *
 * Lives here rather than in `index.ts` because two adapters need it to tell
 * their own stale marketplace pin from one the user made.
 */
export const PACKAGE_NAME = "@askviraj/ai-plugins";
