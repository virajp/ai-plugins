import { frontmatter as fm } from "@ai-plugins/schema";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import { readWorkspace } from "../source.ts";
import type { Emission } from "../target.ts";
import { cursor } from "./cursor.ts";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const emission: Emission = cursor.render(
  readWorkspace(join(repoRoot, "templates")),
);

/** Rendered text of one output; copied files have no text to inspect. */
function text(path: string): string {
  const out = emission.outputs.find(o => o.path === path);
  if (out === undefined) {
    throw new Error(`no output at ${path}`);
  }
  if (typeof out.contents !== "string") {
    throw new Error(`${path} is a copied file`);
  }
  return out.contents;
}

const front = (path: string) => fm.parse(text(path))!;

const gapsFor = (capability: string) =>
  emission.gaps.filter(g => g.capability === capability);

describe("plugin bundles", () => {
  it("emits one Cursor bundle per local plugin", () => {
    const manifests = emission
      .outputs
      .filter(o => o.path.endsWith("/.cursor-plugin/plugin.json"))
      .map(o => o.path.split("/")[0]);

    expect(manifests).toContain("vwf");
    // `mempalace` and `andrej-karpathy-skills` are re-listed url sources: they
    // are somebody else's repo, so there is nothing local to render.
    expect(manifests).not.toContain("mempalace");
    expect(manifests).not.toContain("andrej-karpathy-skills");
  });

  it("fills the four fields Cursor requires", () => {
    const manifest = JSON.parse(text("vwf/.cursor-plugin/plugin.json"));
    expect(manifest.name).toBe("vwf");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.author.length).toBeGreaterThan(0);
    // Every local plugin declares a version, so the `0.0.0` fallback is unused.
    expect(gapsFor("manifest")).toEqual([]);
  });
});

describe("skills", () => {
  it("keeps `paths` on doctrine skills, and leaves them model-invocable", () => {
    const doc = front("vwf/skills/blueprint-authoring/SKILL.md");
    expect(fm.sequence(doc, "paths")).toContain("docs/blueprint/**/*.md");
    expect(fm.get(doc, "disable-model-invocation")).toBeUndefined();
    // The neutral key never reaches the output — Cursor would ignore it, and a
    // reader would take it for behaviour.
    expect(fm.get(doc, "invocation")).toBeUndefined();
  });

  it("marks user-only skills `disable-model-invocation: true`", () => {
    // `setup` is one of the five workflow skills nothing delegates to.
    expect(
      fm.bool(front("vwf/skills/setup/SKILL.md"), "disable-model-invocation"),
    )
      .toBe(true);
    // `plan` is delegated to by name, so it must stay visible to the model.
    expect(
      fm.get(front("vwf/skills/plan/SKILL.md"), "disable-model-invocation"),
    )
      .toBeUndefined();
  });

  it("drops the keys Cursor cannot read", () => {
    const doc = front("vwf/skills/execute/SKILL.md");
    for (const key of ["model", "effort", "tools", "argumentHint", "version"]) {
      expect(fm.get(doc, key), key).toBeUndefined();
    }
    expect(gapsFor("commandArguments").length).toBeGreaterThan(0);
    expect(gapsFor("skillModel").length).toBeGreaterThan(0);
    expect(gapsFor("skillTools").length).toBeGreaterThan(0);
  });
});

describe("agents", () => {
  it("derives `readonly` from the tool allowlist", () => {
    // Read/Grep/Glob only — the boolean is as strong as the list here.
    expect(fm.bool(front("vwf/agents/blueprint-reviewer.md"), "readonly"))
      .toBe(true);
    // Holds Bash (and Write/Edit): nothing in Cursor can express that scope.
    expect(fm.bool(front("vwf/agents/execute-coder.md"), "readonly")).toBe(
      false,
    );
    expect(fm.get(front("vwf/agents/execute-coder.md"), "tools"))
      .toBeUndefined();
  });

  it("reports the agents that lose their allowlist", () => {
    const gap = gapsFor("agentToolAllowlist").find(g => g.plugin === "vwf");
    expect(gap?.severity).toBe("degraded");
    expect(gap?.detail).toContain("execute-coder");
    expect(gap?.detail).not.toContain("blueprint-reviewer");
  });
});

describe("hooks", () => {
  it("maps preToolUse/Bash onto beforeShellExecution", () => {
    const hooks = JSON.parse(text("vwf/hooks/hooks.json"));
    expect(hooks.version).toBe(1);
    expect(hooks.hooks.beforeShellExecution).toHaveLength(2);
    expect(hooks.hooks.beforeShellExecution[0].command)
      .toBe("%%AI_PLUGINS_ROOT%%/hooks/npm-normalize.cursor.sh");
  });

  it("degrades the rewrite hook to deny-plus-correction", () => {
    const wrapper = text("vwf/hooks/npm-normalize.cursor.sh");
    // Runs the neutral script, then answers in Cursor's vocabulary.
    expect(wrapper).toContain("npm-normalize.sh");
    expect(wrapper).toContain("permission: \"deny\"");
    expect(wrapper).toContain("This repo uses pnpm or bun, never npm.");
    expect(
      emission
        .outputs
        .find(o => o.path === "vwf/hooks/npm-normalize.cursor.sh")
        ?.executable,
    )
      .toBe(true);

    const gap = gapsFor("hookRewrite").find(g => g.plugin === "vwf");
    expect(gap?.severity).toBe("degraded");
  });
});

describe("gaps", () => {
  it("drops every declared language server", () => {
    const lsp = gapsFor("lsp");
    // flutter's dart/kotlin/sourcekit servers plus typescript's.
    expect(lsp).toHaveLength(4);
    expect(lsp.every(g => g.severity === "dropped")).toBe(true);
    expect(lsp.map(g => g.plugin).sort()).toEqual([
      "flutter",
      "flutter",
      "flutter",
      "typescript",
    ]);
    expect(lsp.every(g => g.detail.length > 0)).toBe(true);
  });

  it("emits no LSP configuration anywhere", () => {
    expect(emission.outputs.some(o => o.path.includes("lsp"))).toBe(false);
  });
});

describe("root substitution", () => {
  it("leaves no Claude-specific token in any rendered file", () => {
    for (const out of emission.outputs) {
      if (typeof out.contents === "string") {
        expect(out.contents, out.path).not.toContain("CLAUDE_PLUGIN_ROOT");
        // Unrendered Eta would mean a template escaped `renderTemplate`.
        expect(out.contents, out.path).not.toContain("<%=");
      }
    }
  });

  it("uses the shared root tokens", () => {
    const doctrine = text("vwf/skills/execute/SKILL.md");
    expect(doctrine).toContain("%%AI_PLUGINS_ROOT%%/assets/");

    const adapter = text(
      "design-tools/skills/design-tools-import-design-system/SKILL.md",
    );
    expect(adapter).toContain(
      "%%AI_PLUGINS_ROOT:vwf%%/assets/design-adapter.md",
    );
  });

  it("rewrites cross-skill references to Cursor's bare-name invocation", () => {
    expect(text("vwf/skills/execute/SKILL.md")).toContain("/git-workflow");
    expect(text("vwf/skills/execute/SKILL.md")).not.toContain(
      "/vwf:git-workflow",
    );
  });
});

describe("mcp", () => {
  it("writes each plugin's servers to mcp.json", () => {
    const vwf = JSON.parse(text("vwf/mcp.json"));
    expect(vwf.mcpServers.mempalace).toEqual({
      type: "http",
      url: "http://127.0.0.1:8765/mcp",
    });
    expect(vwf.mcpServers.context7).toHaveProperty("command");
  });
});
