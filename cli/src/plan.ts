/**
 * Turning a request into a per-adapter plan.
 *
 * Everything here derives from `dist/plugins.json`, which the build projects
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
  readonly scope: Scope;
  readonly optIn: boolean;
  readonly userOnly: boolean;
  readonly local: boolean;
  readonly dependencies: readonly string[];
}

export interface PluginIndex {
  readonly marketplace: string;
  readonly plugins: readonly PluginIndexEntry[];
}

export interface PlanRequest {
  /** Every user-scoped plugin that is not opt-in. */
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
}

export function readPluginIndex(sourceRoot: string): PluginIndex {
  const path = join(sourceRoot, "dist", "plugins.json");
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
    const entry = byName.get(name);
    if (entry === undefined) {
      throw new Error(
        `unknown plugin \`${name}\` — expected one of: ${
          index.plugins.map(p => p.name).sort().join(", ")
        }`,
      );
    }
    // A plugin pinned to user scope stays there even when asked for at project
    // scope: installing it per-project would shadow the single shared copy.
    const resolved = entry.userOnly ? "user" : scope;
    if (resolved !== scope) {
      log(`${name} is user-scoped; installing at user scope`);
    }
    // A name requested at both scopes resolves once. Project wins, being the
    // narrower of the two.
    if (wanted.get(name) !== "project") {
      wanted.set(name, resolved);
    }
  };

  if (request.all === true) {
    // `--all` is the curated set: user-scoped, and opt-in plugins excluded so
    // they are only ever installed by name.
    for (const entry of index.plugins) {
      if (entry.scope === "user" && !entry.optIn) {
        want(entry.name, "user");
      }
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
      log(`${name} has no rendered bundle for ${target}; skipping`);
      continue;
    }
    (scope === "project" ? project : user).push(name);
  }

  return { target, user, project, statusline: false };
}

/**
 * Pull in each plugin's dependencies, transitively.
 *
 * A dependency inherits the scope of whatever pulled it in, except where it is
 * pinned to user scope. It never *narrows* an existing selection: a plugin
 * already wanted at user scope stays there rather than being duplicated into a
 * project install.
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
      const entry = byName.get(dep);
      if (entry === undefined) {
        // `plugins:check` enforces that dependencies resolve, so this means the
        // index is stale rather than the manifest wrong.
        log(`${name} depends on unknown plugin ${dep}; skipping`);
        continue;
      }
      if (wanted.has(dep)) {
        continue;
      }
      wanted.set(dep, entry.userOnly ? "user" : scope);
      queue.push(dep);
    }
  }
}
