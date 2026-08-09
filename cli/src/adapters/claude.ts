/**
 * Claude Code.
 *
 * Driven through `claude plugin`, like Oh-My-Pi. The marketplace is
 * the repo root — `.claude-plugin/marketplace.json` lives there and its sources
 * are root-relative — and Claude registers it as a `directory` source, reading
 * `claude/plugins/<name>` **in place** rather than copying. So an install
 * tracks the working tree, and a rebuild is picked up without reinstalling.
 *
 * Verified against a throwaway `CLAUDE_CONFIG_DIR`:
 *
 * - `claude plugin marketplace add <path>` → user `settings.json`
 *   `extraKnownMarketplaces.<name>.source = {source: "directory", path}`, plus a
 *   `plugins/known_marketplaces.json` cache the CLI owns.
 * - `claude plugin install <p>@<m> --scope user|project` → `enabledPlugins` in
 *   the settings file for that scope (project writes `<cwd>/.claude/`).
 * - **Dependencies install themselves.** Installing `vwf` reported
 *   "+ 4 dependencies", so this adapter must not expand them — doing so would
 *   record undo entries for plugins Claude manages, and uninstalling one would
 *   then remove a dependency another plugin still needs.
 * - Uninstall leaves auto-installed dependencies behind, suggesting
 *   `claude plugin prune`. That matches the existing installer's rule that an
 *   uninstall never removes an unnamed dependency, so `--prune` is not passed.
 * - A bare `.` source is rejected ("Invalid marketplace source format"); an
 *   absolute path is accepted, which is what this passes.
 */
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  getPath,
  readJsonc,
} from "../config/json.ts";
import {
  ReceiptBuilder,
  revert as revertReceipt,
} from "../receipt.ts";
import {
  claudeConfigDir,
  hasBin,
} from "./support.ts";
import type {
  Action,
  Adapter,
  AdapterContext,
  AdapterPlan,
  ApplyResult,
  Scope,
} from "./types.ts";
import { planPlugins } from "./types.ts";

const BIN = "claude";

/** Generated into the repo root, not `claude/` — see `build/src/targets/claude.ts`. */
const MANIFEST = join(".claude-plugin", "marketplace.json");

export const claude: Adapter = {
  id: "claude",
  displayName: "Claude Code",
  scopes: ["user", "project"],

  detect(): boolean {
    return hasBin(BIN);
  },

  configPaths(context, scope): string[] {
    return [settingsFile(context, scope)];
  },

  plan(context, plan): readonly Action[] {
    return run(context, plan, true).actions;
  },

  apply(context, plan): ApplyResult {
    return run(context, plan, false);
  },

  verify(context, receipt): string[] {
    const missing: string[] = [];
    for (const entry of receipt.entries) {
      if (entry.kind !== "command" || !entry.ran.includes("install")) {
        continue;
      }
      const selector = entry.ran[2];
      const scope = entry.ran.at(-1) as Scope;
      if (selector !== undefined && !isInstalled(context, scope, selector)) {
        missing.push(selector);
      }
    }
    return missing;
  },

  revert(context, receipt): void {
    revertReceipt(receipt, {
      restoreKey() {
        // Claude's settings are written by its own CLI, never key-by-key here.
      },
      runUndo(undo) {
        claudeExec(context, undo);
      },
    });
  },
};

/**
 * One code path for planning and applying, so `--dry-run` cannot describe
 * something other than what happens.
 */
function run(
  context: AdapterContext,
  plan: AdapterPlan,
  dryRun: boolean,
): ApplyResult {
  const receipt = new ReceiptBuilder();
  const actions: Action[] = [];

  if (plan.user.length === 0 && plan.project.length === 0) {
    return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
  }

  const marketplace = readMarketplaceName(context);
  actions.push(
    ...registerMarketplace(context, marketplace, receipt, dryRun),
  );

  for (const scope of ["user", "project"] as const) {
    for (const name of scope === "user" ? plan.user : plan.project) {
      const selector = `${name}@${marketplace}`;
      if (isInstalled(context, scope, selector)) {
        continue;
      }
      // No dependency expansion: `claude plugin install` pulls them in itself,
      // and naming them here would record undos for plugins it manages.
      const install = ["plugin", "install", selector, "--scope", scope];
      actions.push({ summary: `${BIN} ${install.join(" ")}` });
      if (!dryRun) {
        runOrThrow(context, install);
        receipt.command(install, [
          "plugin",
          "uninstall",
          name,
          "--scope",
          scope,
        ]);
      }
    }
  }

  return { receipt: receipt.build(context.now, planPlugins(plan)), actions };
}

/**
 * Declare the marketplace, always at user scope — the source is one machine-wide
 * path, and the existing installer registers it there regardless of where the
 * plugins land.
 */
function registerMarketplace(
  context: AdapterContext,
  marketplace: string,
  receipt: ReceiptBuilder,
  dryRun: boolean,
): Action[] {
  const declared = getPath(
    readSettings(context, "user"),
    ["extraKnownMarketplaces", marketplace, "source", "path"],
  );

  if (declared === context.sourceRoot) {
    return [];
  }
  if (declared !== undefined) {
    // Re-adding would repoint a marketplace the user configured — and the
    // common case is a name collision with the *published* GitHub source, where
    // silently continuing installs from the wrong copy.
    context.log(
      `claude: marketplace \`${marketplace}\` already points at ${
        String(declared)
      }; installing from there rather than ${context.sourceRoot}`,
    );
    return [];
  }
  // `claude plugin marketplace add` rejects a bare `.`, so this is absolute.
  const add = ["plugin", "marketplace", "add", context.sourceRoot];
  const actions: Action[] = [{ summary: `${BIN} ${add.join(" ")}` }];
  if (!dryRun) {
    runOrThrow(context, add);
    receipt.command(add, [
      "plugin",
      "marketplace",
      "remove",
      marketplace,
      // Without a scope this removes the declaration from *every* scope.
      "--scope",
      "user",
    ]);
  }
  return actions;
}

/** The marketplace's own name, so the CLI selector matches what it registered. */
function readMarketplaceName(context: AdapterContext): string {
  const path = join(context.sourceRoot, MANIFEST);
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return (JSON.parse(readFileSync(path, "utf8")) as { name: string; }).name;
}

function isInstalled(
  context: AdapterContext,
  scope: Scope,
  selector: string,
): boolean {
  return getPath(
    readSettings(context, scope),
    ["enabledPlugins", selector],
  ) !== undefined;
}

/** Read only, to decide what is already there. The CLI owns every write. */
function readSettings(
  context: AdapterContext,
  scope: Scope,
): Record<string, unknown> | undefined {
  const path = settingsFile(context, scope);
  return existsSync(path)
    ? readJsonc<Record<string, unknown>>(readFileSync(path, "utf8"))
    : undefined;
}

function settingsFile(context: AdapterContext, scope: Scope): string {
  return scope === "project"
    ? join(context.cwd, ".claude", "settings.json")
    : join(configDir(context), "settings.json");
}

function configDir(context: AdapterContext): string {
  return claudeConfigDir(context.home);
}

function claudeExec(context: AdapterContext, args: readonly string[]) {
  return context.exec(BIN, args, {
    cwd: context.cwd,
    env: { ...process.env, CLAUDE_CONFIG_DIR: configDir(context) },
  });
}

function runOrThrow(context: AdapterContext, args: readonly string[]): void {
  const result = claudeExec(context, args);
  if (result.status !== 0) {
    throw new Error(
      `\`${BIN} ${args.join(" ")}\` failed (${result.status}): `
        + `${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}
