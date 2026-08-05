import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  describe,
  expect,
  it,
} from "vitest";
import { readWorkspace } from "../source.ts";
import type {
  Gap,
  Output,
} from "../target.ts";
import { codex } from "./codex.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const workspace = readWorkspace(join(repoRoot, "templates"));
const emission = codex.render(workspace);

const outputs = new Map<string, Output>(
  emission.outputs.map(o => [o.path, o]),
);

function text(path: string): string {
  const out = outputs.get(path);
  if (out === undefined) {
    throw new Error(`no output at ${path}`);
  }
  return typeof out.contents === "string"
    ? out.contents
    : readFileSync(out.contents.copyFrom, "utf8");
}

function gapsFor(capability: string): Gap[] {
  return emission.gaps.filter(g => g.capability === capability);
}

/** Pull a `key = """…"""` value back out and undo the escaping. */
function multiline(toml: string, key: string): string {
  const opened = toml.indexOf(`${key} = """\n`);
  expect(opened).toBeGreaterThanOrEqual(0);
  const start = opened + `${key} = """\n`.length;
  const end = toml.lastIndexOf("\"\"\"");
  expect(end).toBeGreaterThan(start);
  return toml
    .slice(start, end)
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

describe("codex target", () => {
  it("skips url-sourced plugins", () => {
    const skipped = [...outputs.keys()].filter(p =>
      p.startsWith("plugins/mempalace/")
      || p.startsWith("plugins/andrej-karpathy-skills/")
    );
    expect(skipped).toEqual([]);
  });

  it("writes a manifest carrying the two keys Codex requires", () => {
    const manifest = JSON.parse(text("plugins/vwf/.codex-plugin/plugin.json"));
    expect(manifest.name).toBe("vwf");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(manifest.description).toBeTruthy();
    // Codex has no `agents`/`prompts`/`dependencies` manifest keys.
    expect(manifest).not.toHaveProperty("agents");
    expect(manifest).not.toHaveProperty("dependencies");
  });

  it("marks only user-only skills as non-implicitly-invocable", () => {
    // The sidecar lives at `<skill>/agents/openai.yaml`. The loader builds
    // that path as parent(SKILL.md) + "agents" + "openai.yaml"; at the skill
    // root it is never read, `allow_implicit_invocation` defaults back to
    // true, and every user-only skill quietly becomes model-invocable.
    // `archive` is user-only; `blueprint` is delegated to, so it stays reachable.
    expect(text("plugins/vwf/skills/archive/agents/openai.yaml")).toContain(
      "allow_implicit_invocation: false",
    );
    expect(outputs.has("plugins/vwf/skills/archive/openai.yaml")).toBe(false);
    expect(outputs.has("plugins/vwf/skills/blueprint/agents/openai.yaml"))
      .toBe(false);
    expect(
      outputs.has("plugins/vwf/skills/blueprint-authoring/agents/openai.yaml"),
    )
      .toBe(false);

    const policies = [...outputs.keys()].filter(p =>
      p.endsWith("/agents/openai.yaml")
    );
    const userOnly = workspace
      .plugins
      .filter(p => p.manifest.source.kind === "local")
      .flatMap(p => p.skills.filter(s => s.meta.invocation === "user"));
    expect(policies).toHaveLength(userOnly.length);
  });

  it("strips unsupported skill keys and keeps provenance in metadata", () => {
    const skill = text("plugins/typescript/skills/tsconfig/SKILL.md");
    expect(skill).toMatch(/^---\nname: tsconfig\n/);
    expect(skill).toContain("metadata:\n");
    expect(skill).toContain("version:");
    // `paths` and `invocation` have no Codex spelling and must not linger.
    expect(skill).not.toContain("\npaths:");
    expect(skill).not.toContain("\ninvocation:");
  });

  it("drops path scoping, loudly, once per scoped skill", () => {
    const gaps = gapsFor("pathScopedSkills");
    expect(gaps.every(g => g.severity === "dropped")).toBe(true);
    expect(gaps.map(g => g.detail).join("\n")).toContain("`tsconfig`");

    const scoped = workspace
      .plugins
      .filter(p => p.manifest.source.kind === "local")
      .flatMap(p => p.skills.filter(s => (s.meta.paths ?? []).length > 0));
    expect(gaps).toHaveLength(scoped.length);
  });

  it("renders subagents as TOML outside the bundle", () => {
    const toml = text("codex-agents/blueprint-surveyor.toml");

    expect(toml).toContain("name = \"blueprint-surveyor\"");
    expect(toml).toContain("sandbox_mode = \"read-only\"");
    expect(toml).toContain("model_reasoning_effort = \"medium\"");
    // Anthropic model ids do not cross over.
    expect(toml).not.toContain("\nmodel = ");

    const body = multiline(toml, "developer_instructions");
    expect(body.length).toBeGreaterThan(500);
    // The body went through Eta with the Codex context, so no tag survives and
    // command references use Codex's bare-name spelling.
    expect(body).not.toContain("<%");
    expect(body).not.toContain("/vwf:blueprint");
    // Escaping round-trips: nothing that would close the string early is left.
    expect(body).not.toContain("\"\"\"");

    // Not inside any plugin bundle — the manifest cannot carry them. Match the
    // bundle's own `agents/` dir specifically: `agents/` is overloaded here,
    // since a skill's policy sidecar is `<skill>/agents/openai.yaml` and is a
    // legitimate bundle member.
    expect([...outputs.keys()].some(p => /^plugins\/[^/]+\/agents\//.test(p)))
      .toBe(false);
    expect(gapsFor("subagentsInBundle")).toHaveLength(1);
  });

  it("approximates the agent tool allowlist with a sandbox mode", () => {
    const gaps = gapsFor("agentToolAllowlist");
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every(g => g.severity === "degraded")).toBe(true);
    expect(gaps[0]!.detail).toContain("sandbox_mode");

    // A writing agent is not sandboxed to read-only.
    expect(text("codex-agents/execute-coder.toml")).toContain(
      "sandbox_mode = \"workspace-write\"",
    );
  });

  it("rewrites natively — the hook keeps updatedInput", () => {
    const hooks = JSON.parse(text("plugins/vwf/hooks/hooks.json"));
    const groups = hooks.hooks.PreToolUse;
    expect(groups).toHaveLength(2);

    // `Bash` is Claude's tool name; Codex's shell tool is `shell`.
    expect(groups.every((g: { matcher: string; }) => g.matcher === "shell"))
      .toBe(true);
    expect(groups[0].hooks[0].command).toBe(
      "%%AI_PLUGINS_ROOT%%/hooks/npm-normalize.sh",
    );
    expect(groups[0].hooks[0].type).toBe("command");
    expect(groups[0].hooks[0].timeout).toBe(5);

    // The script's Claude response shape is Codex's response shape, so the
    // rewrite ships intact and nothing is degraded.
    expect(text("plugins/vwf/hooks/npm-normalize.sh")).toContain(
      "updatedInput",
    );
    expect(gapsFor("hookRewrite")).toEqual([]);
  });

  it("drops every language server", () => {
    const gaps = gapsFor("lsp");
    expect(gaps.every(g => g.severity === "dropped")).toBe(true);
    expect(gaps.map(g => g.plugin).sort()).toEqual([
      "flutter",
      "flutter",
      "flutter",
      "typescript",
    ]);
    expect(gaps[0]!.detail).toContain("openai/codex#8745");

    const configs = [...outputs.keys()].filter(p => p.includes("lsp"));
    expect(configs).toEqual([]);
  });

  it("writes MCP servers to .mcp.json, keyed by transport shape", () => {
    const vwf = JSON.parse(text("plugins/vwf/.mcp.json"));
    expect(vwf.mcpServers.mempalace).toEqual({
      url: "http://127.0.0.1:8765/mcp",
    });

    const context7 = JSON.parse(text("plugins/context7/.mcp.json"));
    const server = Object.values(context7.mcpServers)[0] as {
      command: string;
    };
    expect(server.command).toBeTruthy();
    expect(server).not.toHaveProperty("url");
  });

  it("leaves no Claude-only token anywhere in the output", () => {
    const offenders = emission
      .outputs
      .filter(o =>
        typeof o.contents === "string"
        && (o.contents.includes("CLAUDE_PLUGIN_ROOT")
          || o.contents.includes("<%"))
      )
      .map(o => o.path);
    expect(offenders).toEqual([]);

    // The token that replaces it is the shared one, so one install-time
    // substitution rule serves every non-Claude target.
    expect(text("plugins/vwf/hooks/hooks.json")).toContain(
      "%%AI_PLUGINS_ROOT%%",
    );
  });
});
