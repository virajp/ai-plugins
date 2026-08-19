/**
 * Installing plugins, by driving Claude Code's own CLI.
 *
 * **This is a thin wrapper, not the old installer.** The claude-first cut
 * removed the payload copy, the four adapters and the `requires:` gate, and
 * none of them return here: the marketplace is served from this repo's `main`
 * on GitHub, so the whole install is `claude plugin marketplace add` followed
 * by `claude plugin install` per plugin — commands the user could type
 * themselves, sequenced and made idempotent. Claude's settings are read for
 * idempotence and **never written**: Claude keeps bookkeeping beside
 * `enabledPlugins`, and hand-editing it strands the two apart.
 *
 * The same split `uninstall.ts` uses, for the same reason: `planInstall` is a
 * pure read returning data with no closures in it, so a test can assert *what*
 * would run against a fixture directory; `executeInstall` is the separate
 * switch that runs it.
 *
 * **No receipt is written for a plugin install.** The uninstall enumerates
 * plugin state from Claude's live settings, not from receipts, so a receipt
 * here would be a second record nothing reads — the bug class `receipt.ts`
 * exists to contain, reopened for no reader.
 */
import {
  claudeEnv,
  installedPlugins,
  marketplaceRegistered,
  projectSettingsFile,
  readSettings,
  userSettingsFile,
} from "./claude-settings.ts";
import type {
  RunOptions,
  Scope,
} from "./context.ts";
import { MARKETPLACE_NAME } from "./context.ts";
import type { Outcome } from "./report.ts";

/**
 * The GitHub shorthand, not a local path. A path-registered marketplace pins
 * every reader to a copied payload that goes stale; the shorthand keeps
 * installs and updates reading this repo's `main`, which `plugins.yml`
 * validates on every push.
 */
export const MARKETPLACE_SOURCE = "virajp/ai-plugins";

/**
 * What `--all` installs. Only `vwf`: its dependencies (`devtools`) arrive
 * through Claude's own dependency resolution (≥ 2.1.143), which is where that
 * belongs — the old `defaultInstall` list lived in a file this repo deleted.
 */
export const DEFAULT_INSTALL: readonly string[] = ["vwf"];

/** The plugin half of a run's arguments, as parsed. */
export interface InstallRequest {
  readonly all: boolean;
  readonly user: readonly string[];
  readonly project: readonly string[];
}

/** Did the run ask for any plugin at all? Drives the nothing-to-do gate. */
export function pluginsRequested(request: InstallRequest): boolean {
  return request.all || request.user.length > 0 || request.project.length > 0;
}

/**
 * A plugin name as Claude's marketplace spells them. Checked before anything
 * runs so a mistyped flag value fails as our sentence, not three commands in;
 * `claude plugin install` stays the authoritative validator of which names
 * exist — a local list would be a second source of truth to drift.
 */
const NAME_SHAPE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Resolve the request to one scope per plugin.
 *
 * The same name at both scopes resolves once and **project wins** — the
 * narrower of the two, and the rule the old resolver used. Throws naming the
 * first malformed token.
 */
export function resolveRequest(
  request: InstallRequest,
): ReadonlyMap<string, Scope> {
  const resolved = new Map<string, Scope>();
  const claim = (name: string, scope: Scope): void => {
    if (!NAME_SHAPE.test(name)) {
      throw new Error(
        `not a plugin name: \`${name}\` — expected lowercase letters, digits `
          + `and dashes, as \`claude plugin list\` spells them`,
      );
    }
    if (scope === "project" || !resolved.has(name)) {
      resolved.set(name, scope);
    }
  };
  for (const name of request.all ? DEFAULT_INSTALL : []) {
    claim(name, "user");
  }
  for (const name of request.user) {
    claim(name, "user");
  }
  for (const name of request.project) {
    claim(name, "project");
  }
  return resolved;
}

/**
 * One planned step: data, no closures — `enumerate`'s rule, for the same
 * testability. Ids mirror the uninstall's rows (`marketplace`,
 * `plugin:<scope>:<name>`), so an install and the uninstall after it report
 * the same names.
 */
export interface InstallStep {
  readonly id: string;
  /** Shown as the live progress step. */
  readonly label: string;
  /** `run` drives claude; `already` is a satisfied request, reported as such. */
  readonly kind: "run" | "already";
  /** claude's argv, when `kind` is `run`. */
  readonly args?: readonly string[];
  /** Project scope is resolved from the working directory Claude is given. */
  readonly cwd?: string;
  /** Logged as a note, when there is something worth saying. */
  readonly note?: string;
}

/**
 * A pure read of Claude's settings → the steps this run would take.
 *
 * The marketplace registration is checked in **user** settings, where
 * `claude plugin marketplace add` records it; a plugin is checked at the scope
 * it was requested for, so a project-scope entry never satisfies a user-scope
 * request. An already-installed plugin is a satisfied request, not an error —
 * and never an auto-update: upgrading is Claude's own
 * `claude plugin update`, deliberately left to it.
 */
export function planInstall(
  request: InstallRequest,
  options: RunOptions,
): InstallStep[] {
  const { context } = options;
  const steps: InstallStep[] = [];
  const userSettings = readSettings(userSettingsFile(context));

  if (!marketplaceRegistered(userSettings)) {
    steps.push({
      id: "marketplace",
      label: `registering the \`${MARKETPLACE_NAME}\` marketplace`,
      kind: "run",
      args: ["plugin", "marketplace", "add", MARKETPLACE_SOURCE],
    });
  }

  const installed: Record<Scope, readonly string[]> = {
    user: installedPlugins(userSettings),
    project: installedPlugins(readSettings(projectSettingsFile(context))),
  };

  for (
    const [name, scope] of [...resolveRequest(request)]
      .sort(([a], [b]) => a.localeCompare(b))
  ) {
    if (installed[scope].includes(name)) {
      steps.push({
        id: `plugin:${scope}:${name}`,
        label: `plugin \`${name}\` (${scope} scope)`,
        kind: "already",
        note: `plugin \`${name}\` is already installed — `
          + `\`claude plugin update ${name}@${MARKETPLACE_NAME}\` upgrades it`,
      });
      continue;
    }
    steps.push({
      id: `plugin:${scope}:${name}`,
      label: `installing plugin \`${name}\` (${scope} scope)`,
      kind: "run",
      args: [
        "plugin",
        "install",
        `${name}@${MARKETPLACE_NAME}`,
        "--scope",
        scope,
      ],
      ...(scope === "project" ? { cwd: context.cwd } : {}),
    });
  }
  return steps;
}

/**
 * Run the plan, one outcome per step.
 *
 * Steps run in order, and the ordering carries one dependency: every plugin
 * install needs the marketplace registered, so a **failed registration marks
 * the rest as errors without running them** — Claude's own "unknown
 * marketplace" message per plugin would say less than the one failure that
 * caused it. Plugin failures stay independent of each other, the uninstall's
 * rule: one that will not install says nothing about the next.
 */
export function executeInstall(
  steps: readonly InstallStep[],
  options: RunOptions,
): Outcome[] {
  const { context, dryRun, progress } = options;
  const outcomes: Outcome[] = [];
  let marketplaceFailed = false;

  for (const step of steps) {
    if (step.kind === "already") {
      if (step.note !== undefined) {
        context.log(step.note);
      }
      outcomes.push({ name: step.id, actions: [] });
      continue;
    }

    const args = step.args ?? [];
    const action = { summary: `claude ${args.join(" ")}` };
    if (marketplaceFailed) {
      outcomes.push({
        name: step.id,
        actions: [],
        error: "not attempted — the marketplace registration failed",
      });
      continue;
    }
    if (dryRun) {
      outcomes.push({ name: step.id, actions: [action] });
      continue;
    }

    progress?.step(step.label);
    const result = context.exec("claude", args, {
      cwd: step.cwd ?? context.cwd,
      env: claudeEnv(context),
    });
    if (result.status !== 0) {
      if (step.id === "marketplace") {
        marketplaceFailed = true;
      }
      outcomes.push({
        name: step.id,
        actions: [],
        error: `\`claude ${args.join(" ")}\` failed (${result.status}): `
          + `${result.stderr.trim() || result.stdout.trim()}`,
      });
      continue;
    }
    outcomes.push({ name: step.id, actions: [action] });
  }
  return outcomes;
}
