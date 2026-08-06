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
import { readWorkspace } from "./source.ts";
import type {
  Emission,
  Target,
} from "./target.ts";
import { claude } from "./targets/claude.ts";
import { codex } from "./targets/codex.ts";
import { cursor } from "./targets/cursor.ts";
import { ohmypi } from "./targets/ohmypi.ts";
import { opencode } from "./targets/opencode.ts";

export const TARGETS: readonly Target[] = [
  claude,
  opencode,
  cursor,
  ohmypi,
  codex,
];

export interface RenderResult {
  readonly target: TargetId;
  readonly files: number;
  readonly emission: Emission;
}

/**
 * Render every target into `dist/<target>/`.
 *
 * Each target's directory is removed first, so a deleted skill disappears from
 * the output instead of lingering — the committed `dist/` must be a pure
 * function of `templates/`, or `git status` stops being a meaningful check.
 */
export function renderAll(
  repoRoot: string,
  only?: readonly TargetId[],
): RenderResult[] {
  const workspace = readWorkspace(join(repoRoot, "templates"));
  const selected = only ? TARGETS.filter(t => only.includes(t.id)) : TARGETS;

  return selected.map(target => {
    const out = join(repoRoot, "dist", target.id);
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

/** Stable key order, so the manifest is a pure function of the templates. */
function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
  );
}
