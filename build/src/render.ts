import type { TargetId } from "@ai-plugins/schema";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import type { Workspace } from "./source.ts";
import { readWorkspace } from "./source.ts";
import type {
  Emission,
  Target,
} from "./target.ts";
import { claude } from "./targets/claude.ts";
import { cursor } from "./targets/cursor.ts";
import { ohmypi } from "./targets/ohmypi.ts";
import { opencode } from "./targets/opencode.ts";

export const TARGETS: readonly Target[] = [
  claude,
  opencode,
  cursor,
  ohmypi,
];

export interface RenderResult {
  readonly target: TargetId;
  readonly files: number;
  readonly emission: Emission;
}

/**
 * Render every target into `<repo>/<target>/`.
 *
 * Each target's directory is removed first, so a deleted skill disappears from
 * the output instead of lingering — the committed render must be a pure
 * function of `templates/`, or `git status` stops being a meaningful check.
 */
export function renderAll(
  repoRoot: string,
  only?: readonly TargetId[],
): RenderResult[] {
  const workspace = readWorkspace(join(repoRoot, "templates"));
  const selected = only ? TARGETS.filter(t => only.includes(t.id)) : TARGETS;

  writePluginIndex(repoRoot, workspace);

  return selected.map(target => {
    const out = join(repoRoot, target.id);
    rmSync(out, { recursive: true, force: true });

    const emission = target.render(workspace);

    // Which plugin owns each emitted file. Some targets flatten per-plugin
    // files into one global directory (OpenCode's `agent/`, `command/`,
    // `plugin/`), where the path stops saying who owns what — and the
    // installer needs that to install or remove a subset of plugins. Recording
    // it here beats the alternatives: prefixing agent filenames would rename
    // every agent, since OpenCode strips the `name` field and keys agents by
    // filename.
    const ownership: Record<string, string> = {};
    for (const file of emission.outputs) {
      if (file.owner !== undefined && file.atRepoRoot !== true) {
        ownership[file.path] = file.owner;
      }
    }

    for (const file of emission.outputs) {
      const path = join(file.atRepoRoot === true ? repoRoot : out, file.path);
      mkdirSync(dirname(path), { recursive: true });

      if (typeof file.contents === "string") {
        writeFileSync(path, file.contents);
      }
      else {
        cpSync(file.contents.copyFrom, path);
      }

      if (file.executable) {
        chmodSync(path, 0o755);
      }
    }

    writeFileSync(
      join(out, ".ownership.json"),
      `${JSON.stringify(sortKeys(ownership), null, 2)}\n`,
    );

    return { target: target.id, files: emission.outputs.length, emission };
  });
}

/**
 * The install-time view of the manifests: `plugins.json` at the repo root.
 *
 * The CLI resolves a plan — dependency expansion, scope defaults, which plugins
 * `--all` covers, the bare-name allowlist — entirely from `plugin.yaml`. But it
 * cannot read `templates/`: the published package ships the rendered trees, not
 * the authored source. So the build projects the plan-relevant fields here, the
 * same build→install contract `.ownership.json` already is.
 *
 * Deliberately narrow. Anything the renderers consume (skills, hooks, servers)
 * is already baked into the rendered trees; duplicating it would create a
 * second source of truth for something that has one.
 */
function writePluginIndex(repoRoot: string, workspace: Workspace): void {
  const index = {
    marketplace: workspace.marketplace.name,
    plugins: workspace.plugins.map(plugin => {
      const m = plugin.manifest;
      return {
        name: m.name,
        scope: m.scope,
        optIn: m.optIn,
        userOnly: m.userOnly,
        // A url-sourced plugin has no rendered bundle, so the copy-based
        // installer has nothing to install and must skip it.
        local: m.source.kind === "local",
        dependencies: [...m.dependencies].sort(),
        // External binaries the plugin needs at runtime. Projected so the CLI
        // can refuse an install that would land in a broken state — vwf without
        // graphify installs fine and then halts at its own entry gate. The old
        // installer carried this as a hand-maintained `PLUGIN_EXTRA_DEPS` map,
        // which is exactly the drift this layer exists to make unrepresentable.
        requires: [...m.requires].sort(),
      };
    }),
  };

  const path = join(repoRoot, "plugins.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(index, null, 2)}\n`);
}

/** Stable key order, so the manifest is a pure function of the templates. */
function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
  );
}
