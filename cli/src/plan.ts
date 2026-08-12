/**
 * Turning a request into a per-adapter plan.
 *
 * Everything here derives from `plugins.json`, which the build projects
 * from each `templates/<plugin>/plugin.yaml`. The old installer carried the same facts as
 * five hand-maintained constants — `PLUGINS`, `PROJECT_SCOPED`, `OPT_IN`,
 * `USER_ONLY`, `PLUGIN_DEPS` — and `plugins:check` existed to assert they still
 * matched the manifests. Deriving them makes that whole class of drift
 * unrepresentable rather than merely checked.
 */
import type { TargetId } from "@ai-plugins/schema";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import type {
  AdapterPlan,
  Scope,
} from "./adapters/types.ts";

/** One plugin's install-relevant manifest fields, as the build projects them. */
export interface PluginIndexEntry {
  readonly name: string;
  readonly local: boolean;
  readonly dependencies: readonly string[];
  /**
   * External binaries the plugin needs at runtime, from its `requires:`.
   * Optional so an index written before this field still parses.
   */
  readonly requires?: readonly string[];
}

export interface PluginIndex {
  readonly marketplace: string;
  /**
   * What `--all` installs, from the marketplace manifest.
   *
   * A plugin carries no install-time eligibility of its own. It used to carry
   * three — `scope`, `optIn` and `userOnly` — of which `scope` and `optIn` did
   * the same single thing (exclude from `--all`, in two spellings) and
   * `userOnly` was set by no manifest at all. Every plugin is now installable
   * at either scope on request; membership here is the only remaining fact.
   */
  readonly defaultInstall: readonly string[];
  readonly plugins: readonly PluginIndexEntry[];
}

export interface PlanRequest {
  /** The marketplace's `defaultInstall` set, at user scope. */
  readonly all?: boolean;
  /** Plugin names requested at user scope. */
  readonly user?: readonly string[];
  /** Plugin names requested at project scope. */
  readonly project?: readonly string[];
}

export interface ResolveOptions {
  /**
   * Adapters whose own tooling installs dependencies, so the plan must not.
   * Claude Code expands them natively; naming them here would record undo
   * entries for plugins it manages.
   */
  readonly expandDependencies: boolean;
  /** Adapters that can only install a rendered bundle, so url-sourced plugins are skipped. */
  readonly localOnly: boolean;
  readonly log?: (message: string) => void;
  /**
   * Called instead of `log` when a plugin is skipped for this target.
   *
   * Reported rather than logged because the same plugin is skipped on every
   * target that cannot host it — three identical sentences differing only in a
   * name, which reads as three problems instead of one fact. The caller
   * aggregates and states it once.
   */
  readonly onSkip?: (plugin: string, target: string) => void;
}

export function readPluginIndex(sourceRoot: string): PluginIndex {
  const path = join(sourceRoot, "plugins.json");
  if (!existsSync(path)) {
    throw new Error(`missing ${path} — run \`mise run plugins:build\``);
  }
  return JSON.parse(readFileSync(path, "utf8")) as PluginIndex;
}

/**
 * Resolve a request into one adapter's plan.
 *
 * Names are validated against the index, so the CLI can only ever install from
 * this marketplace — an `@marketplace` or path qualifier is not a different
 * source, it is simply not a known name.
 */
export function resolvePlan(
  index: PluginIndex,
  target: TargetId,
  request: PlanRequest,
  options: ResolveOptions,
): AdapterPlan {
  const byName = new Map(index.plugins.map(p => [p.name, p]));
  const log = options.log ?? (() => {});

  const wanted = new Map<string, Scope>();
  const want = (name: string, scope: Scope) => {
    if (!byName.has(name)) {
      throw new Error(
        `unknown plugin \`${name}\` — expected one of: ${
          index.plugins.map(p => p.name).sort().join(", ")
        }`,
      );
    }
    // A name requested at both scopes resolves once. Project wins, being the
    // narrower of the two.
    if (wanted.get(name) !== "project") {
      wanted.set(name, scope);
    }
  };

  if (request.all === true) {
    // The curated set, at user scope. Every other plugin is installed by name,
    // at whichever scope was asked for.
    for (const name of index.defaultInstall) {
      want(name, "user");
    }
  }
  for (const name of request.user ?? []) {
    want(name, "user");
  }
  for (const name of request.project ?? []) {
    want(name, "project");
  }

  if (options.expandDependencies) {
    expand(wanted, byName, log);
  }

  const user: string[] = [];
  const project: string[] = [];
  for (
    const [name, scope] of [...wanted].sort(([a], [b]) => a.localeCompare(b))
  ) {
    if (options.localOnly && byName.get(name)?.local !== true) {
      if (options.onSkip !== undefined) {
        options.onSkip(name, target);
      }
      else {
        log(`${name} installs from its own repo; skipped on ${target}`);
      }
      continue;
    }
    (scope === "project" ? project : user).push(name);
  }

  return { target, user, project };
}

/**
 * Pull in each plugin's dependencies, transitively.
 *
 * A dependency inherits the scope of whatever pulled it in, and never *narrows*
 * an existing selection: a plugin already wanted at user scope stays there
 * rather than being duplicated into a project install.
 */
function expand(
  wanted: Map<string, Scope>,
  byName: Map<string, PluginIndexEntry>,
  log: (message: string) => void,
): void {
  const queue = [...wanted.keys()];
  while (queue.length > 0) {
    const name = queue.shift() as string;
    const scope = wanted.get(name) as Scope;
    for (const dep of byName.get(name)?.dependencies ?? []) {
      if (!byName.has(dep)) {
        // `plugins:check` enforces that dependencies resolve, so this means the
        // index is stale rather than the manifest wrong.
        log(`${name} depends on unknown plugin ${dep}; skipping`);
        continue;
      }
      if (wanted.has(dep)) {
        continue;
      }
      wanted.set(dep, scope);
      queue.push(dep);
    }
  }
}
