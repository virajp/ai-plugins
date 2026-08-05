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

export const TARGETS: readonly Target[] = [claude];

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

    for (const file of emission.outputs) {
      const path = join(out, file.path);
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

    return { target: target.id, files: emission.outputs.length, emission };
  });
}
