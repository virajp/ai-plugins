import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import { parse as parseYaml } from "yaml";
import { readWorkspace } from "./source.ts";
import type { Target } from "./target.ts";
import { claude } from "./targets/claude.ts";
import { codex } from "./targets/codex.ts";
import { cursor } from "./targets/cursor.ts";
import { ohmypi } from "./targets/ohmypi.ts";
import { opencode } from "./targets/opencode.ts";

const repoRoot = join(import.meta.dirname, "..", "..");
const workspace = readWorkspace(join(repoRoot, "templates"));

/**
 * Frontmatter has to parse as YAML under a *strict* parser, not merely under
 * the lenient one a given host happens to ship.
 *
 * This exists because a single authored description read
 * `... + README. Re-runnable: detects format drift and` folded across lines.
 * A colon-space inside a multi-line plain scalar makes the document invalid
 * YAML, and the failure is silent in exactly the way that matters: Claude's
 * parser accepts it, so byte-parity stayed clean and every structural
 * assertion passed, while Codex's strict parser dropped the whole skill and
 * `/vwf:setup` simply did not exist there.
 *
 * The renderers re-emit frontmatter verbatim as ordered (key, raw) pairs — by
 * design, to preserve key order and fold widths — so a malformed scalar is
 * carried into every target rather than normalised away by a serialiser.
 * That makes the authored source the only place worth gating.
 */
const TARGETS: readonly (readonly [string, Target])[] = [
  ["claude", claude],
  ["opencode", opencode],
  ["cursor", cursor],
  ["ohmypi", ohmypi],
  ["codex", codex],
];

function frontmatterOf(contents: string): string | null {
  if (!contents.startsWith("---")) {
    return null;
  }
  const end = contents.indexOf("\n---", 3);
  return end === -1 ? null : contents.slice(3, end);
}

describe("frontmatter is strict-YAML valid", () => {
  it("holds for every authored skill and agent", () => {
    const offenders: string[] = [];

    for (const plugin of workspace.plugins) {
      const authored = [
        ...plugin.skills.map(s => s.path),
        ...plugin.agents.map(a => a.path),
      ];
      for (const path of authored) {
        const fm = frontmatterOf(
          readFileSync(join(plugin.root, path), "utf8"),
        );
        if (fm === null) {
          continue;
        }
        try {
          parseYaml(fm);
        }
        catch (error) {
          offenders.push(
            `${plugin.manifest.name}/${path}: ${
              (error as Error).message.split("\n")[0]
            }`,
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("survives rendering into every target", () => {
    // The authored check above is the real gate, but a renderer that rewrites
    // frontmatter (renaming keys, injecting values) could reintroduce this on
    // its own — so assert the property where it is actually consumed.
    const offenders: string[] = [];

    for (const [id, target] of TARGETS) {
      for (const out of target.render(workspace).outputs) {
        if (typeof out.contents !== "string") {
          continue;
        }
        if (!out.path.endsWith(".md")) {
          continue;
        }
        const fm = frontmatterOf(out.contents);
        if (fm === null) {
          continue;
        }
        try {
          parseYaml(fm);
        }
        catch (error) {
          offenders.push(
            `${id}:${out.path}: ${(error as Error).message.split("\n")[0]}`,
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
