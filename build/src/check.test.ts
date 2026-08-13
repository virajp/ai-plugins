import { frontmatter } from "@ai-plugins/schema";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import {
  check,
  prescribes,
  resolves,
} from "./check.ts";
import type { CheckResult } from "./check.ts";
import { TARGETS } from "./render.ts";
import { readWorkspace } from "./source.ts";

const repoRoot = join(import.meta.dirname, "..", "..");
const workspace = readWorkspace(join(repoRoot, "templates"));

describe("check", () => {
  let result: CheckResult;
  beforeAll(async () => {
    result = await check(repoRoot);
  });

  it("finds nothing wrong with the committed tree", () => {
    // The whole-corpus regression gate. Printed in full on failure, because a
    // bare count tells you nothing about which invariant broke.
    expect(result.findings).toEqual([]);
  });

  it("covers every target", () => {
    expect(result.coverage.map(c => c.target)).toEqual([
      "claude",
      "opencode",
      "cursor",
      "ohmypi",
    ]);
    for (const target of result.coverage) {
      expect(target.outputs, target.target).toBeGreaterThan(400);
    }
  });

  it("reports Claude as the target that loses nothing", () => {
    // Claude is the authoring shape, so any gap against it means the neutral
    // schema has become lossy — the one coverage number with a fixed answer.
    const claude = result.coverage.find(c => c.target === "claude");
    expect(claude?.dropped).toBe(0);
    expect(claude?.degraded).toBe(0);
  });

  it("attributes every emitted file to a plugin, bar the registries", () => {
    // The installer needs this to install or remove a *subset* of plugins.
    // OpenCode is the case that forced it: `agent/`, `command/` and `plugin/`
    // are flattened into one global directory, so the path stops saying who
    // owns what. Prefixing the filenames was the obvious fix and is wrong for
    // agents — OpenCode strips the `name` field and keys an agent by its
    // filename, so a prefix renames it and silently breaks every delegation.
    for (const [, target] of TARGETS.map(t => [t.id, t] as const)) {
      for (const out of target.render(workspace).outputs) {
        const attributed = out.owner !== undefined || out.unowned === true;
        expect(attributed, `${target.id}:${out.path}`).toBe(true);
      }
    }
  });

  it("keeps OpenCode agent filenames bare, so their names are unchanged", () => {
    const outputs = TARGETS.find(t => t.id === "opencode")!
      .render(workspace)
      .outputs;
    const agents = outputs.filter(o => o.path.startsWith("agent/"));

    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      // `agent/execute-coder.md`, never `agent/vwf-execute-coder.md`.
      expect(agent.path, agent.path).not.toMatch(
        /^agent\/[a-z0-9-]+-(vwf|markdown|typescript)-/,
      );
      expect(agent.owner, agent.path).toBeDefined();
    }
  });

  it("attributes every gap to a capability and a plugin", () => {
    for (const target of result.coverage) {
      for (const [capability, plugins] of target.byCapability) {
        expect(capability, target.target).not.toBe("");
        expect(plugins.length, `${target.target}/${capability}`)
          .toBeGreaterThan(0);
      }
    }
  });
});

describe("prescription vs enumeration", () => {
  // The distinction the tool-name guard turns on: naming ONE tool tells the
  // reader what to use; listing the alternatives describes the domain of a
  // config key vwf owns. Both directions are pinned, because a guard that
  // exempts too much is indistinguishable from one that was deleted.

  it("flags a tool named on its own", () => {
    expect(prescribes("Load the claude-design MCP tool.", "claude-design"))
      .toBe(true);
    expect(prescribes("run it on cloud-run", "cloud-run")).toBe(true);
  });

  it("exempts a tool listed beside its alternatives", () => {
    expect(
      prescribes(
        "a token — `claude-design`, `lovable`, `stitch`",
        "claude-design",
      ),
    )
      .toBe(false);
  });

  it("exempts an enumeration that wraps mid-list", () => {
    // Every real enumeration in the corpus wraps, so a line-based rule would
    // flag the first line of each one. This is why the window is by character.
    expect(
      prescribes(
        "Which tool answers (`claude-design`,\n`lovable`, `stitch`, …) is the\nproduct's choice",
        "claude-design",
      ),
    )
      .toBe(false);
  });

  it("counts a peer that is not itself a banned token", () => {
    // `lovable` and `stitch` are ordinary English words and cannot be banned,
    // but their presence is still what proves a passage is a vocabulary.
    expect(prescribes("`claude-design` or `lovable`", "claude-design"))
      .toBe(false);
  });

  it("still flags a second, prescriptive mention elsewhere in the same file", () => {
    // The exemption is per occurrence, not per document — otherwise one
    // enumeration would licence every other mention in the file.
    const body = "the tokens `claude-design`, `lovable`, `stitch`.\n"
      + "x".repeat(400)
      + "\nDefault it to claude-design.";
    expect(prescribes(body, "claude-design")).toBe(true);
  });

  it("does not treat a distant token as a peer", () => {
    // The separators matter: the guard is anchored, so a token butted straight
    // against a letter is not a match at all.
    const body = `claude-design ${"x ".repeat(200)} lovable`;
    expect(prescribes(body, "claude-design")).toBe(true);
  });
});

describe("reference resolution", () => {
  // These four shapes all appear in the corpus, and getting any of them wrong
  // produces a checker that cries wolf on every run — which is the failure mode
  // that gets a check switched off.
  const paths = [
    "plugins/vwf/assets/design-adapter.md",
    "plugins/vwf/assets/topologies/repo.md",
    "plugins/gcp/stacks/deploy/cloud-run.md",
    "vwf/skills/setup/SKILL.md",
  ];

  it("resolves a plain file reference", () => {
    expect(resolves("assets/design-adapter.md", paths)).toBe(true);
  });

  it("resolves a directory reference, with or without a trailing slash", () => {
    // Half the corpus points at a tree and tells the reader to pick the entry
    // matching their case.
    expect(resolves("assets/topologies/", paths)).toBe(true);
    expect(resolves("assets/topologies", paths)).toBe(true);
    expect(resolves("stacks/", paths)).toBe(true);
  });

  it("resolves a sibling-plugin reference that escapes the plugin root", () => {
    expect(resolves("../vwf/assets/design-adapter.md", paths)).toBe(true);
  });

  it("still rejects a reference that names nothing", () => {
    expect(resolves("assets/does-not-exist.md", paths)).toBe(false);
    expect(resolves("assets/topologies/missing.md", paths)).toBe(false);
  });
});

/**
 * The regression guards from the re-architecture.
 *
 * `stack-adapter.md` stated "vwf ships no stack templates and names no tool"
 * since it was written, and nothing enforced it — which is how 17 templates
 * accumulated inside vwf. These assertions are what make the claim true rather
 * than aspirational, so they are pinned here as well as run by `plugins:check`.
 */
describe("the stack-adapter contract", () => {
  const vwf = workspace.plugins.find(p => p.manifest.name === "vwf")!;

  it("keeps vwf free of stack templates and language rows", () => {
    expect(vwf.files.filter(f => f.path.startsWith("stacks/"))).toEqual([]);
    expect(vwf.manifest.languages).toEqual([]);
  });

  it("gives every plugin shipping stacks/ both adapter skills, model-invocable", () => {
    for (const plugin of workspace.plugins) {
      if (!plugin.files.some(f => f.path.startsWith("stacks/"))) {
        continue;
      }
      const name = plugin.manifest.name;
      for (const kind of ["stack-menu", "stack-template"]) {
        const skill = plugin.skills.find(s =>
          s.meta.name === `${name}-${kind}`
        );
        expect(skill, `${name}-${kind}`).toBeDefined();
        // `user` would remove it from the model's context, so vwf could not
        // invoke it — and the failure is silent, not an error.
        expect(skill!.meta.invocation, `${name}-${kind}`).not.toBe("user");
      }
    }
  });

  it("pairs a UI stack with a ux-gate, in both directions", () => {
    // Screen platforms — read from each template's own `platforms:`, never from
    // its path. Format 22 flattened `stacks/project/<role>/` away precisely
    // because one template serves several platforms, so a path-shaped test
    // would now pass by finding nothing.
    const SCREEN = new Set([
      "site",
      "webapp",
      "desktop",
      "mobile",
      "tablet",
      "auto",
    ]);
    for (const plugin of workspace.plugins) {
      const ownsUi = plugin.files.some(f => {
        if (!f.path.startsWith("stacks/project/")) {
          return false;
        }
        const doc = frontmatter.parse(readFileSync(f.absolute, "utf8"));
        const platforms = doc === null
          ? undefined
          : frontmatter.sequence(doc, "platforms");
        return (platforms ?? []).some(p => SCREEN.has(p));
      });
      const hasGate = plugin.skills.some(s =>
        s.meta.name === `${plugin.manifest.name}-ux-gate`
      );
      expect(hasGate, plugin.manifest.name).toBe(ownsUi);
    }
  });
});
