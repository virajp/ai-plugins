import { join } from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";
import { readWorkspace } from "../source.ts";
import type { Output } from "../target.ts";
import { ROOT_TOKEN } from "../target.ts";
import { opencode } from "./opencode.ts";

const root = join(import.meta.dirname, "..", "..", "..");
const workspace = readWorkspace(join(root, "templates"));
const { outputs, gaps } = opencode.render(workspace);

const paths = outputs.map(o => o.path);
const byPath = new Map(outputs.map(o => [o.path, o] as const));

function text(path: string): string {
  const output = byPath.get(path);
  expect(output, path).toBeDefined();
  const contents = output!.contents;
  if (typeof contents !== "string") {
    throw new Error(`${path} is a copy, not rendered text`);
  }
  return contents;
}

/** The install-time config fragment stamped beside each plugin. */
interface Fragment {
  readonly version?: string;
  readonly dependencies?: readonly string[];
  readonly lsp?: Record<
    string,
    { readonly command: readonly string[]; readonly extensions: string[]; }
  >;
  readonly mcp?: Record<string, unknown>;
}

function fragment(plugin: string): Fragment {
  return JSON.parse(
    text(`virajp-plugins/${plugin}/opencode.config.json`),
  ) as Fragment;
}

describe("skills", () => {
  it("segregates user-only skills out of SKILL.md discovery", () => {
    // The path glob is the only thing deciding whether OpenCode's model sees a
    // skill, so relocation *is* the user-only emulation — if a `SKILL.md`
    // survived under `commands/`, the model would load it anyway.
    expect(paths).toContain("virajp-plugins/vwf/commands/setup/index.md");
    expect(paths).not.toContain("virajp-plugins/vwf/skills/setup/SKILL.md");
    expect(
      paths.filter(p => p.includes("/commands/") && p.endsWith("SKILL.md")),
    )
      .toEqual([]);

    // Model-invoked skills stay discoverable.
    expect(paths).toContain("virajp-plugins/vwf/skills/blueprint/SKILL.md");
    expect(paths).toContain(
      "virajp-plugins/vwf/skills/documentation-standards/SKILL.md",
    );
  });

  it("emits a wrapper for exactly the user-invocation skills", () => {
    const expected = workspace
      .plugins
      .filter(p => p.manifest.source.kind === "local")
      .flatMap(p =>
        p
          .skills
          .filter(s => s.meta.invocation === "user")
          .map(s => `command/${p.manifest.name}-${s.meta.name}.md`)
      )
      .sort();

    expect(paths.filter(p => p.startsWith("command/")).sort()).toEqual(
      expected,
    );
    expect(expected.length).toBeGreaterThan(0);
  });

  it("points each wrapper at the installed skill and passes arguments", () => {
    const wrapper = text("command/vwf-setup.md");
    expect(wrapper).toContain(
      `%%AI_PLUGINS_ROOT:vwf%%/commands/setup/index.md`,
    );
    expect(wrapper).toContain("$ARGUMENTS");
    // A folded description full of `: ` and dashes has to survive as one YAML
    // scalar; JSON quoting is what guarantees that.
    expect(wrapper.split("\n")[1]).toMatch(/^description: "/);
  });

  it("drops frontmatter OpenCode does not read", () => {
    const skill = text(
      "virajp-plugins/vwf/skills/documentation-standards/SKILL.md",
    );
    const block = skill.slice(0, skill.indexOf("\n---\n", 4));
    for (const key of ["invocation", "paths", "tools", "model", "effort"]) {
      expect(block, key).not.toMatch(new RegExp(`^${key}:`, "m"));
    }
    // Provenance has a home — `metadata` is one of the five recognised keys.
    expect(block).toMatch(/^metadata:\n {2}version: /m);
    expect(block).toMatch(/^license:/m);
  });

  it("relocates a skill's references with it", () => {
    const relocated = paths.filter(p =>
      p.startsWith("virajp-plugins/vwf/commands/")
    );
    expect(relocated.every(p => !p.includes("/skills/"))).toBe(true);
  });
});

describe("agents", () => {
  it("emits subagents outside the bundle, in OpenCode's spelling", () => {
    const agent = text("agent/blueprint-surveyor.md");
    expect(agent).toMatch(/^mode: subagent$/m);
    expect(agent).not.toMatch(/^name:/m);
    // Model pins are provider-qualified on OpenCode, so they cannot be carried.
    expect(agent).not.toMatch(/^model:/m);
  });

  it("writes the tool allowlist as a filter that names the denials", () => {
    // `tools` is a filter and anything unnamed stays enabled, so an allowlist
    // is only enforced by spelling out the `false` side.
    const agent = text("agent/blueprint-surveyor.md");
    expect(agent).toMatch(/^ {2}read: true$/m);
    expect(agent).toMatch(/^ {2}grep: true$/m);
    expect(agent).toMatch(/^ {2}glob: true$/m);
    expect(agent).toMatch(/^ {2}list: true$/m);
    expect(agent).toMatch(/^ {2}bash: false$/m);
    expect(agent).toMatch(/^ {2}write: false$/m);
    expect(agent).toMatch(/^ {2}edit: false$/m);
  });
});

describe("config fragments", () => {
  it("aliases lsp ids onto OpenCode's built-in server ids", () => {
    // Writing under the built-in id replaces its launcher rather than starting
    // a second server for the same language.
    expect(Object.keys(fragment("typescript").lsp ?? {})).toEqual([
      "typescript",
    ]);
    expect(Object.keys(fragment("flutter").lsp ?? {}).sort()).toEqual([
      "dart",
      "kotlin-ls",
      "sourcekit-lsp",
    ]);

    const ts = fragment("typescript").lsp?.["typescript"];
    expect(ts?.command[0]).toBe("mise");
    expect(ts?.extensions).toContain(".ts");
  });

  it("spells mcp transports local and remote", () => {
    expect(fragment("vwf").mcp?.["context7"]).toEqual({
      type: "local",
      command: ["pnpm", "dlx", "@upstash/context7-mcp"],
      environment: { CONTEXT7_API_KEY: "${CONTEXT7_API_KEY:-}" },
    });
    expect(fragment("vwf").mcp?.["mempalace"]).toEqual({
      type: "remote",
      url: "http://127.0.0.1:8765/mcp",
    });
    // Never Claude's spelling.
    const json = text("virajp-plugins/vwf/opencode.config.json");
    expect(json).not.toContain("\"stdio\"");
    expect(json).not.toContain("\"http\"");
  });

  it("stamps what an uninstall has to remove", () => {
    expect(fragment("vwf").version).toBe(
      workspace.plugins.find(p => p.manifest.name === "vwf")!.manifest.version,
    );
    expect(fragment("vwf").dependencies).toContain("mempalace");
  });
});

describe("hooks", () => {
  it("wraps each hook as a JS plugin module", () => {
    // npm-normalize belongs to `typescript` — a JS/TS rewrite has no place in a
    // language-agnostic workflow plugin. The flat `plugin/` dir is global, so
    // the filename carries the owner and that owner changed with it.
    const hook = text("plugin/typescript-npm-normalize.js");
    expect(hook).toContain("\"tool.execute.before\"");
    expect(hook).toContain("export const typescriptNpmNormalize");
    // The rewrite lands natively — `output.args` is mutable on this target.
    expect(hook).toContain("Object.assign(args, decision.updatedInput)");
    expect(hook).toContain(
      "%%AI_PLUGINS_ROOT:typescript%%/hooks/npm-normalize.sh",
    );
    // The script itself still ships, and keeps its executable bit.
    const script = byPath.get(
      "virajp-plugins/typescript/hooks/npm-normalize.sh",
    );
    expect(script?.executable).toBe(true);
  });

  it("shells out for hooks declared as a literal command", () => {
    expect(text("plugin/vwf-rtk.js")).toContain("[\"sh\",\"-c\"");
  });
});

describe("plugin roots", () => {
  it("leaves no Claude-only variable anywhere in the output", () => {
    // OpenCode expands nothing at runtime, so a surviving `${CLAUDE_PLUGIN_ROOT}`
    // would ship to users as literal text.
    const offenders = outputs
      .filter((o): o is Output & { contents: string; } =>
        typeof o.contents === "string"
      )
      .filter(o => o.contents.includes("CLAUDE_PLUGIN_ROOT"))
      .map(o => o.path);
    expect(offenders).toEqual([]);
  });

  it("emits the install-time token instead", () => {
    expect(
      outputs.some(o =>
        typeof o.contents === "string" && o.contents.includes(ROOT_TOKEN)
      ),
    )
      .toBe(true);
  });

  it("rewrites command references to what OpenCode can actually reach", () => {
    // A user-only skill is reachable only through its wrapper; everything else
    // is addressed by bare name in OpenCode's flat skill namespace.
    const plan = text("virajp-plugins/vwf/skills/plan/SKILL.md");
    expect(plan).toContain("/vwf-setup");
    expect(plan).not.toContain("/vwf:setup");
    expect(plan).not.toContain("/vwf:blueprint");
  });
});

describe("gaps", () => {
  const capabilities = new Set(gaps.map(g => g.capability));

  it("names every capability it could not carry", () => {
    for (
      const capability of [
        "pathScopedSkills",
        "userOnlySkills",
        "skillToolAllowlist",
        "modelPin",
        "agentToolAllowlist",
        "subagentsInBundle",
        "marketplace",
        "pluginRootVariable",
      ]
    ) {
      expect(capabilities, capability).toContain(capability);
    }
  });

  it("keeps every gap concrete and classified", () => {
    for (const gap of gaps) {
      expect(["degraded", "dropped"]).toContain(gap.severity);
      expect(gap.detail.length, gap.capability).toBeGreaterThan(40);
      expect(gap.plugin.length).toBeGreaterThan(0);
    }
  });

  it("reports path-scoped skills as degraded, not dropped", () => {
    // They still install; they just never auto-apply.
    const scoped = gaps.filter(g => g.capability === "pathScopedSkills");
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.every(g => g.severity === "degraded")).toBe(true);
    expect(scoped.map(g => g.plugin)).toContain("vwf");
  });
});
