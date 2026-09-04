/**
 * Reading Claude Code's own settings, and pinning which config a run drives.
 *
 * Extracted from `uninstall.ts` when the plugin install path returned: install
 * and uninstall are mirror images that must agree on where Claude's state lives
 * and how to read it, or an install would write what the uninstall cannot see.
 * Everything here is a pure read — the one writer of these files is Claude
 * itself, driven through its CLI.
 */
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  getPath,
  readJsonc,
} from "./config/json.ts";
import type { Context } from "./context.ts";
import {
  claudeConfigDir,
  MARKETPLACE_NAME,
} from "./context.ts";

export function userSettingsFile(context: Context): string {
  return join(claudeConfigDir(context.home), "settings.json");
}

/**
 * Project scope follows the **working directory**, not the repo root: that is
 * where `claude plugin install --scope project` writes, so it is where both the
 * install's idempotence check and the uninstall's enumeration have to look.
 */
export function projectSettingsFile(context: Context): string {
  return join(context.cwd, ".claude", "settings.json");
}

export function readSettings(
  path: string,
): Record<string, unknown> | undefined {
  if (!existsSync(path)) {
    return undefined;
  }
  return readJsonc<Record<string, unknown>>(readFileSync(path, "utf8"));
}

/** Is the `virajp-plugins` marketplace declared in these settings? */
export function marketplaceRegistered(
  settings: Record<string, unknown> | undefined,
): boolean {
  return getPath(settings, ["extraKnownMarketplaces", MARKETPLACE_NAME])
    !== undefined;
}

/**
 * The plugins enabled from our marketplace, by bare name.
 *
 * Claude keys these `<name>@<marketplace>`, and only entries carrying our
 * marketplace are ours to offer — a plugin the user installed from somewhere
 * else has nothing to do with this toolkit.
 */
export function installedPlugins(
  settings: Record<string, unknown> | undefined,
): string[] {
  const enabled = getPath(settings, ["enabledPlugins"]);
  if (typeof enabled !== "object" || enabled === null) {
    return [];
  }
  const suffix = `@${MARKETPLACE_NAME}`;
  return Object
    .keys(enabled as Record<string, unknown>)
    .filter(key => key.endsWith(suffix))
    .map(key => key.slice(0, -suffix.length))
    .sort();
}

/**
 * The environment every `claude` invocation gets: the process's own, with
 * `CLAUDE_CONFIG_DIR` pinned. Install and uninstall must drive the same config
 * the enumeration read, rather than whatever Claude would default to.
 */
export function claudeEnv(context: Context): NodeJS.ProcessEnv {
  return {
    ...process.env,
    CLAUDE_CONFIG_DIR: claudeConfigDir(context.home),
  };
}
