import { join } from "node:path";
import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import {
  check,
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
