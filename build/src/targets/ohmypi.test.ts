import { frontmatter as fm } from "@ai-plugins/schema";
import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import { readWorkspace } from "../source.ts";
import type { Emission } from "../target.ts";
import { ohmypi } from "./ohmypi.ts";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const workspace = readWorkspace(join(repoRoot, "templates"));
const emission: Emission = ohmypi.render(workspace);

/** Rendered text for one output path. Copied binaries have no text to read. */
function text(path: string): string {
  const out = emission.outputs.find(o => o.path === path);
  if (out === undefined) {
    throw new Error(`no output at ${path}`);
  }
  if (typeof out.contents !== "string") {
    throw new Error(`${path} is a copy, not rendered text`);
  }
  return out.contents;
}

function front(path: string): fm.Document {
  const doc = fm.parse(text(path));
  if (doc === null) {
    throw new Error(`${path} lost its frontmatter`);
  }
  return doc;
}

describe("skills", () => {
  it("renames `paths` to `globs` and pins them off always-apply", () => {
    // `blueprint-authoring` is the two-glob doctrine archetype: it exists to
    // auto-apply, so losing the scoping would make it load everywhere.
    const doc = front("vwf/skills/blueprint-authoring/SKILL.md");

    expect(fm.get(doc, "paths")).toBeUndefined();
    expect(fm.sequence(doc, "globs")).toEqual([
      "docs/blueprint/**/*.md",
      "docs/plans/**/*.md",
    ]);
    expect(fm.bool(doc, "alwaysApply")).toBe(false);
  });

  it("collapses `invocation` onto Oh-My-Pi's single visibility axis", () => {
    // Verified against omp 17.2.9: `hide` and `disableModelInvocation` are
    // aliases the loader ORs into one flag, and the only reader is the
    // system-prompt builder. So the axis is "hidden from the model", and
    // slash-reachability is unaffected by either key.

    // user-only: withheld from the model, still reachable via `/skill:setup`.
    const user = front("vwf/skills/setup/SKILL.md");
    expect(fm.bool(user, "disableModelInvocation")).toBe(true);

    // Doctrine must stay model-visible, so it carries NEITHER key. `hide` here
    // would silently drop it from the prompt and stop it auto-applying — the
    // regression this assertion exists to catch.
    const model = front("vwf/skills/blueprint-authoring/SKILL.md");
    expect(fm.get(model, "hide")).toBeUndefined();
    expect(fm.get(model, "disableModelInvocation")).toBeUndefined();

    // The default carries no flag either.
    const both = front("vwf/skills/plan/SKILL.md");
    expect(fm.get(both, "hide")).toBeUndefined();
    expect(fm.get(both, "disableModelInvocation")).toBeUndefined();
  });

  it("spells cross-skill references `/skill:<name>`", () => {
    // omp 17.2.9 triggers on /(^|\s)\/skill:([^\s/]+)(\s|$)/ and its parser
    // returns early on any other `/`-prefixed input. A bare `/plan` is not a
    // failed lookup — it is plain prose the model receives as a message.
    const body = text("vwf/skills/execute/SKILL.md");

    expect(body).toContain("/skill:plan");
    expect(body).toContain("/skill:git-workflow");

    // Neither Claude's namespaced spelling nor the bare one may survive.
    expect(body).not.toContain("/vwf:");
    expect(body).not.toMatch(/(^|\s)\/plan\b/m);
    expect(body).not.toMatch(/(^|\s)\/git-workflow\b/m);
  });

  it("never emits `hide` on any rendered skill", () => {
    // Belt-and-braces across all 12 plugins: no renderer path may reintroduce
    // the key, whatever the authored frontmatter looks like.
    for (const out of emission.outputs) {
      if (!out.path.endsWith("/SKILL.md")) {
        continue;
      }
      expect(fm.get(front(out.path), "hide")).toBeUndefined();
    }
  });

  it("drops every key Oh-My-Pi has no field for", () => {
    for (const out of emission.outputs) {
      if (!out.path.endsWith("/SKILL.md")) {
        continue;
      }
      const doc = front(out.path);
      for (
        const key of [
          "invocation",
          "paths",
          "argumentHint",
          "argument-hint",
          "version",
          "category",
          "license",
          "model",
          "effort",
          "tools",
        ]
      ) {
        expect(fm.get(doc, key), `${out.path}: ${key}`).toBeUndefined();
      }
      expect(fm.scalar(doc, "name")).toBeTruthy();
      expect(fm.scalar(doc, "description")).toBeTruthy();
    }
  });
});

describe("agents", () => {
  it("carries the tool allowlist as a sequence and forbids delegation", () => {
    const doc = front("vwf/agents/blueprint-surveyor.md");

    // Authored as a comma-separated scalar; Oh-My-Pi wants a list.
    expect(fm.sequence(doc, "tools")).toEqual(["Read", "Grep", "Glob"]);
    // Empty `spawns` is the declaration, not the absence of one: these are leaf
    // agents the skills invoke directly.
    expect(fm.sequence(doc, "spawns")).toEqual([]);
  });

  it("gives every agent a spawns declaration", () => {
    const agents = emission.outputs.filter(o => o.path.includes("/agents/"));
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(fm.sequence(front(agent.path), "spawns"), agent.path).toEqual([]);
    }
  });

  it("re-encodes the model pin as a preference list", () => {
    const doc = front("vwf/agents/execute-coder.md");
    expect(fm.sequence(doc, "model")).toEqual(["opus"]);
    expect(fm.get(doc, "effort")).toBeUndefined();
    expect(fm.scalar(doc, "thinkingLevel")).toBe("high");
  });
});

describe("marketplace", () => {
  const catalog = JSON.parse(text(".omp-plugin/marketplace.json")) as {
    name: string;
    owner: { name: string; };
    plugins: { name: string; description: string; source: string; }[];
  };

  it("lists every local plugin against its rendered bundle", () => {
    const local = workspace
      .plugins
      .filter(p => p.manifest.source.kind === "local")
      .map(p => p.manifest.name);

    const listed = new Map(catalog.plugins.map(p => [p.name, p.source]));
    for (const name of local) {
      expect(listed.get(name), name).toBe(`./${name}`);
    }
    expect(catalog.name).toBe(workspace.marketplace.name);
    expect(catalog.owner.name).toBe(workspace.marketplace.owner.name);
  });

  // Regression: sources were once spelled from the repo root, which `omp`
  // resolves against the marketplace root instead — producing
  // `ohmypi/ohmypi/<name>` and failing every install with "Plugin source
  // directory does not exist". Nothing else catches it: the path exists, just
  // not where Oh-My-Pi looks.
  it("spells local sources relative to the marketplace root", () => {
    for (const plugin of catalog.plugins) {
      if (plugin.source.startsWith("./")) {
        expect(plugin.source, plugin.name).not.toContain("ohmypi/");
      }
    }
  });

  it("keeps the plugin-name rules Oh-My-Pi enforces", () => {
    for (const plugin of catalog.plugins) {
      expect(plugin.name).toMatch(/^[a-z0-9.-]{1,64}$/);
      expect(plugin.description.length).toBeGreaterThan(0);
    }
  });
});

describe("servers", () => {
  it("derives LSP fileTypes from the extension keys", () => {
    const lsp = JSON.parse(text("flutter/.lsp.json")) as {
      servers: Record<string, { fileTypes: string[]; rootMarkers: string[]; }>;
    };

    expect(lsp.servers["dart-lsp"]?.fileTypes).toEqual([".dart"]);
    expect(lsp.servers["kotlin-lsp"]?.fileTypes).toEqual([".kt", ".kts"]);
    expect(lsp.servers["sourcekit-lsp"]?.rootMarkers).toEqual([".git"]);
  });

  it("writes stdio servers without a type and http servers with one", () => {
    const servers = (JSON.parse(text("vwf/.mcp.json")) as {
      mcpServers: Record<string, Record<string, unknown>>;
    })
      .mcpServers;
    expect(servers["context7"]).toMatchObject({ command: "pnpm" });
    expect(servers["context7"]).not.toHaveProperty("type");
    expect(servers["mempalace"]).toMatchObject({ type: "http" });
  });
});

describe("hooks", () => {
  it("wires each shipped hook as an extension module", () => {
    const pkg = JSON.parse(text("vwf/package.json")) as {
      omp: { extensions: string[]; };
    };
    expect(pkg.omp.extensions).toEqual([
      "./hooks/npm-normalize.ts",
      "./hooks/rtk.ts",
    ]);

    const rewrite = text("vwf/hooks/npm-normalize.ts");
    // The rewrite degrades to a block, and the correction is what the model is
    // given to act on — a wordless block would be unusable.
    expect(rewrite).toContain("block: true");
    expect(rewrite).toContain("never npm");
    expect(rewrite).toContain("tool_call");

    // An `observe` hook never blocks.
    expect(text("vwf/hooks/rtk.ts")).not.toContain("block: true");
  });
});

describe("gaps", () => {
  it("reports the advisory globs and the un-rewritable hook", () => {
    const find = (capability: string) =>
      emission.gaps.filter(g => g.capability === capability);

    expect(find("pathScopedSkills").length).toBeGreaterThan(0);
    for (const gap of find("pathScopedSkills")) {
      expect(gap.severity).toBe("degraded");
      expect(gap.detail).toContain("advisory");
    }

    const rewrite = find("hookRewrite");
    expect(rewrite).toHaveLength(1);
    expect(rewrite[0]?.plugin).toBe("vwf");
    expect(rewrite[0]?.severity).toBe("degraded");
  });

  it("names a concrete loss in every gap", () => {
    expect(emission.gaps.length).toBeGreaterThan(0);
    for (const gap of emission.gaps) {
      expect(gap.detail.length, gap.capability).toBeGreaterThan(20);
      expect(gap.plugin.length).toBeGreaterThan(0);
    }
  });
});

describe("output", () => {
  it("skips plugins that are not sourced locally", () => {
    const external = workspace
      .plugins
      .filter(p => p.manifest.source.kind !== "local")
      .map(p => p.manifest.name);
    expect(external.length).toBeGreaterThan(0);

    for (const name of external) {
      expect(emission.outputs.some(o => o.path.startsWith(`${name}/`))).toBe(
        false,
      );
      // Still catalogued, and still reported as a gap.
      expect(emission.gaps.some(g => g.plugin === name)).toBe(true);
    }
  });

  it("leaves no Claude plugin-root variable anywhere in the output", () => {
    // Oh-My-Pi has no such variable; the install-time adapter substitutes the
    // shared token instead. A survivor here would ship a literal `${...}` to
    // users.
    for (const out of emission.outputs) {
      if (typeof out.contents !== "string") {
        continue;
      }
      expect(out.contents, out.path).not.toContain("CLAUDE_PLUGIN_ROOT");
      expect(out.contents, out.path).not.toContain("<%=");
    }
  });
});
