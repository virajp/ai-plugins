import {
  type Agent,
  type Manifest,
  type Skill,
  agentFromFrontmatter,
  CAPABILITIES,
  frontmatter as fm,
  isReadOnly,
  skillFromFrontmatter,
} from "@ai-plugins/schema";
import { readFileSync } from "node:fs";
import type {
  PluginSource,
  Workspace,
} from "../source.ts";
import {
  type Context,
  type Emission,
  type Gap,
  type Output,
  type Target,
  bundledFiles,
  renderDocument,
  ROOT_TOKEN,
  siblingRootToken,
} from "../target.ts";

/**
 * OpenAI Codex — verified against `openai/codex` at `rust-v0.146.1`.
 *
 * Codex is the closest thing to Claude on the two surfaces that usually break
 * first: its `SKILL.md` is the same Anthropic-standard file, and its hooks take
 * the same JSON and honour `updatedInput`, so `action: "rewrite"` works
 * natively here rather than degrading to a denial.
 *
 * It loses on the two surfaces Claude keeps in the bundle. The plugin manifest
 * has no `agents` key, so subagents install as loose `.codex/agents/*.toml`
 * beside the bundle, not inside it; and there is no language-server config at
 * all (openai/codex#8745 is open), so every declared `lspServers` entry is a
 * hard drop.
 */
export const codex: Target = {
  id: "codex",
  capabilities: CAPABILITIES.codex,

  render(workspace: Workspace): Emission {
    const outputs: Output[] = [];
    const gaps: Gap[] = [];

    for (const plugin of workspace.plugins) {
      if (plugin.manifest.source.kind !== "local") {
        continue;
      }
      const emission = renderPlugin(plugin);
      outputs.push(...emission.outputs);
      gaps.push(...emission.gaps);
    }

    // No marketplace manifest: Codex has a registry, but this version ships no
    // verified schema for it, and inventing one would be worse than the install
    // step pointing at the bundles directly.
    return { outputs, gaps };
  },
};

/**
 * Subagents live outside the bundle because the manifest cannot carry them:
 * they are dropped into `.codex/agents/` at install time. Kept flat rather than
 * grouped by plugin, because flat is the shape the install produces and a
 * grouped tree would hide a name collision that the install would resolve by
 * silent overwrite.
 */
const AGENTS_DIR = "codex-agents";

function contextFor(plugin: PluginSource): Context {
  return {
    root: ROOT_TOKEN,
    pluginRoot: siblingRootToken,
    // Codex resolves a skill by the `name` in its `SKILL.md`; the bundle it came
    // from is not part of the reference and the manifest has no namespacing key.
    // Skill names are already unique across every plugin here (`plugins:check`
    // enforces it for OpenCode's flat namespace), so dropping the `<plugin>:`
    // prefix cannot collide.
    // Codex invokes a skill by name with a `$` sigil, not a slash — slash
    // commands there are the deprecated, user-scope-only `~/.codex/prompts`,
    // which a plugin cannot ship. The plugin prefix drops because Codex
    // resolves by the SKILL.md `name` in a flat namespace, and cross-plugin
    // skill names are already unique (the checker enforces it).
    cmd: ref => `$${ref.slice(ref.indexOf(":") + 1)}`,
    target: { id: "codex", caps: CAPABILITIES.codex },
    ...{ plugin: plugin.manifest.name },
  };
}

function renderPlugin(plugin: PluginSource): Emission {
  const base = `plugins/${plugin.manifest.name}`;
  const context = contextFor(plugin);
  const outputs: Output[] = [
    {
      path: `${base}/.codex-plugin/plugin.json`,
      contents: pluginJson(plugin.manifest),
    },
  ];
  const gaps: Gap[] = [];

  for (const skill of plugin.skills) {
    const doc = renderDocument(
      readFileSync(join(plugin.root, skill.path), "utf8"),
      context,
    );
    const meta = skillFromFrontmatter(doc);

    outputs.push({
      path: `${base}/${skill.path}`,
      contents: fm.emit(toCodexSkill(doc, meta)),
    });

    // Invocation is not a frontmatter key here — it is a sibling policy file,
    // and only the restrictive direction needs stating.
    if (meta.invocation === "user") {
      outputs.push({
        path: `${base}/${skillDir(skill.path)}/openai.yaml`,
        contents: "policy:\n  allow_implicit_invocation: false\n",
      });
    }

    outputs.push(...bundledFiles(skill.extras, base, context));
    gaps.push(...skillGaps(plugin.manifest.name, meta));
  }

  const agents = renderAgents(plugin, context);
  outputs.push(...agents.outputs);
  gaps.push(...agents.gaps);

  outputs.push(...bundledFiles(plugin.files, base, context));

  if (plugin.hooks.length > 0) {
    const hooks = hooksJson(plugin);
    if (hooks.contents !== null) {
      outputs.push({
        path: `${base}/hooks/hooks.json`,
        contents: hooks.contents,
      });
    }
    gaps.push(...hooks.gaps);
  }

  const mcp = Object.entries(plugin.manifest.mcpServers);
  if (mcp.length > 0) {
    outputs.push({
      path: `${base}/.mcp.json`,
      contents: mcpJson(plugin.manifest),
    });
  }

  gaps.push(...manifestGaps(plugin.manifest));

  return { outputs, gaps };
}

/**
 * Neutral skill frontmatter → Codex's spelling.
 *
 * The block is rebuilt from `name` + `description` rather than filtered down to
 * them, because Codex reads the Anthropic-standard three keys (`name`,
 * `description`, `metadata`) and every other authored key is either unsupported
 * or re-expressed elsewhere. Leaving an unsupported key in place would let a
 * later Codex release assign a meaning to text that was written for Claude —
 * `paths` in particular is a *narrowing* on Claude and would be a silent
 * behaviour change if it ever became a widening somewhere else.
 *
 * `version`/`category`/`license` are pure provenance with no behaviour attached,
 * so they move into `metadata` instead of being gapped.
 */
function toCodexSkill(doc: fm.Document, meta: Skill): fm.Document {
  const keep = new Set(["name", "description"]);
  let out: fm.Document = {
    entries: doc.entries.filter(e => keep.has(e.key)),
    body: doc.body,
  };
  out = fm.reorder(out, ["name", "description"]);

  const metadata: [string, string][] = Object
    .entries({
      version: meta.version,
      category: meta.category,
      license: meta.license,
    })
    .flatMap(([k, v]) => (v === undefined ? [] : [[k, v] as [string, string]]));

  if (metadata.length > 0) {
    out = fm.set(
      out,
      "metadata",
      metadata.map(([k, v]) => `\n  ${k}: ${yamlScalar(v)}`).join(""),
    );
  }

  return out;
}

function skillGaps(plugin: string, meta: Skill): Gap[] {
  const gaps: Gap[] = [];

  if (meta.paths !== undefined && meta.paths.length > 0) {
    const globs = meta.paths.join(", ");
    gaps.push({
      plugin,
      capability: "pathScopedSkills",
      severity: "dropped",
      detail:
        `skill \`${meta.name}\` auto-applies to ${globs}; Codex has no glob `
        + `scoping, so it loads only when the model reaches for it on the `
        + `strength of its description`,
    });
  }

  if (meta.tools !== undefined && meta.tools.length > 0) {
    const tools = meta.tools.join(", ");
    gaps.push({
      plugin,
      capability: "skillToolAllowlist",
      severity: "dropped",
      detail:
        `skill \`${meta.name}\` restricts itself to ${tools}; a Codex skill `
        + `carries no tool allowlist, so the restriction does not ship`,
    });
  }

  if (meta.model !== undefined || meta.effort !== undefined) {
    const pin = [meta.model, meta.effort].filter(Boolean).join("/");
    gaps.push({
      plugin,
      capability: "skillModelPin",
      severity: "degraded",
      detail:
        `skill \`${meta.name}\` pins ${pin}; a Codex skill cannot select a `
        + `model, so it runs on whatever the session is already using`,
    });
  }

  if (meta.argumentHint !== undefined) {
    gaps.push({
      plugin,
      capability: "commandArguments",
      severity: "degraded",
      detail:
        `skill \`${meta.name}\` documents arguments (${meta.argumentHint}); Codex `
        + `skills take no argument frontmatter, so the hint is not surfaced and `
        + `the user has to state the argument in prose`,
    });
  }

  return gaps;
}

function renderAgents(plugin: PluginSource, context: Context): Emission {
  if (plugin.agents.length === 0) {
    return { outputs: [], gaps: [] };
  }

  const outputs: Output[] = [];
  const gaps: Gap[] = [{
    plugin: plugin.manifest.name,
    capability: "subagentsInBundle",
    severity: "degraded",
    detail:
      `Codex's plugin manifest has no \`agents\` key, so ${plugin.agents.length} `
      + `subagents ship as loose TOML under \`${AGENTS_DIR}/\` for the installer `
      + `to drop into \`.codex/agents/\` — they are not carried by the bundle and `
      + `uninstalling the plugin will not remove them`,
  }];

  for (const agent of plugin.agents) {
    const doc = renderDocument(
      readFileSync(join(plugin.root, agent.path), "utf8"),
      context,
    );
    const meta = agentFromFrontmatter(doc);

    outputs.push({
      path: `${AGENTS_DIR}/${meta.name}.toml`,
      contents: agentToml(meta, doc.body),
    });

    if (meta.tools !== undefined && meta.tools.length > 0) {
      const tools = meta.tools.join(", ");
      const sandbox = sandboxMode(meta);
      gaps.push({
        plugin: plugin.manifest.name,
        capability: "agentToolAllowlist",
        severity: "degraded",
        detail:
          `agent \`${meta.name}\` is scoped to ${tools}; Codex has no per-agent `
          + `tool allowlist, so this is approximated by \`sandbox_mode = `
          + `"${sandbox}"\` — the filesystem is constrained, the tool set is not`,
      });
    }

    if (meta.model !== undefined) {
      gaps.push({
        plugin: plugin.manifest.name,
        capability: "agentModelPin",
        severity: "degraded",
        detail:
          `agent \`${meta.name}\` pins model \`${meta.model}\`, an Anthropic id `
          + `with no Codex equivalent; only its reasoning effort is carried`,
      });
    }
  }

  return { outputs, gaps };
}

/**
 * One subagent as a `.codex/agents/<name>.toml` file.
 *
 * `developer_instructions` is where the markdown body goes — Codex has no
 * body-after-frontmatter form, so the whole prose contract becomes a string
 * value. It is written as a multi-line basic string: TOML trims the newline
 * that immediately follows the opening delimiter, so the body survives
 * byte-for-byte once escaped.
 */
function agentToml(agent: Agent, body: string): string {
  const lines = [
    `name = ${tomlString(agent.name)}`,
    `description = ${tomlString(agent.description)}`,
  ];

  // The model pin cannot cross over (gapped above), but `effort` can: Codex's
  // `model_reasoning_effort` uses the same low/medium/high vocabulary.
  if (agent.effort !== undefined) {
    lines.push(`model_reasoning_effort = ${tomlString(agent.effort)}`);
  }

  // Only stated when the agent actually declared a tool scope. Emitting the
  // default sandbox for an unscoped agent would look like a decision we made.
  if (agent.tools !== undefined && agent.tools.length > 0) {
    lines.push(`sandbox_mode = ${tomlString(sandboxMode(agent))}`);
  }

  lines.push(`developer_instructions = ${tomlMultiline(body)}`);
  return `${lines.join("\n")}\n`;
}

function sandboxMode(agent: Agent): string {
  return isReadOnly(agent) ? "read-only" : "workspace-write";
}

function pluginJson(manifest: Manifest): string {
  // `version` and `description` are required by Codex but optional in the
  // neutral manifest, which mirrors Claude (where the marketplace entry carries
  // the description). Falling back keeps a manifest-less plugin installable;
  // `0.0.0` is loud enough that an unversioned plugin is obvious in `--version`.
  const out: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version ?? "0.0.0",
    description: manifest.description ?? manifest.name,
  };

  if (manifest.author) {
    out["author"] = manifest.author;
  }
  if (manifest.homepage) {
    out["homepage"] = manifest.homepage;
  }
  if (manifest.repository) {
    out["repository"] = manifest.repository;
  }
  if (manifest.license) {
    out["license"] = manifest.license;
  }
  if (manifest.tags.length > 0) {
    out["keywords"] = manifest.tags;
  }

  return json(out);
}

function manifestGaps(manifest: Manifest): Gap[] {
  const lsp = Object.entries(manifest.lspServers);
  const gaps: Gap[] = lsp.map(([id, server]) => {
    const extensions = Object.keys(server.extensions).sort().join(", ");
    return {
      plugin: manifest.name,
      capability: "lsp",
      severity: "dropped" as const,
      detail:
        `language server \`${id}\` (\`${server.command}\`) covers ${extensions}; `
        + `Codex has no language-server configuration at all `
        + `(openai/codex#8745), so these files get no symbol or diagnostic `
        + `support`,
    };
  });

  if (manifest.dependencies.length > 0) {
    const deps = manifest.dependencies.join(", ");
    gaps.push({
      plugin: manifest.name,
      capability: "dependencies",
      severity: "degraded",
      detail:
        `Codex's plugin manifest has no dependency key, so ${deps} are not `
        + `pulled in automatically — the installer has to expand them, exactly `
        + `as \`bin/opencode.mjs\` already does`,
    });
  }

  return gaps;
}

/**
 * Codex's `hooks/hooks.json` is Claude's shape, so the grouping is the same:
 * event → list of `{matcher, hooks[]}` groups.
 *
 * Two Codex semantics shape what may be emitted. If *any* hook on a call
 * blocks, `updated_input` from every hook is discarded — so a rewrite is only
 * reliable next to non-blocking hooks. And when two hooks both rewrite, the one
 * that finishes last wins, which is a race rather than a rule; so at most one
 * rewriting hook is emitted per event+matcher and the rest are dropped loudly.
 */
function hooksJson(plugin: PluginSource): {
  contents: string | null;
  gaps: Gap[];
} {
  const byEvent: Record<string, unknown[]> = {};
  const gaps: Gap[] = [];
  const rewriters = new Set<string>();

  for (const hook of plugin.hooks) {
    if (hook.skipTargets.includes("codex")) {
      continue;
    }
    const event = hook.event.charAt(0).toUpperCase() + hook.event.slice(1);
    // The neutral matcher names Claude's tool; Codex's shell tool is `shell`.
    const matcher = hook.matcher === undefined
      ? undefined
      : MATCHERS[hook.matcher] ?? hook.matcher;

    if (hook.action === "rewrite") {
      const slot = `${event}/${matcher ?? "*"}`;
      if (rewriters.has(slot)) {
        gaps.push({
          plugin: plugin.manifest.name,
          capability: "hookRewrite",
          severity: "dropped",
          detail:
            `hook \`${hook.id}\` is the second rewriting hook on ${slot}; Codex `
            + `resolves competing rewrites by last-writer-wins, so shipping both `
            + `would make the outcome a race — this one is not emitted`,
        });
        continue;
      }
      rewriters.add(slot);
    }

    (byEvent[event] ??= []).push({
      hooks: [
        {
          ...(hook.async !== undefined ? { async: hook.async } : {}),
          // No plugin-root variable on Codex: the install-time adapter
          // substitutes the token for the absolute bundle path.
          command: hook.script
            ? `${ROOT_TOKEN}/hooks/${hook.script}`
            : hook.command,
          ...(hook.timeout ? { timeout: hook.timeout } : {}),
          type: "command",
        },
      ],
      ...(matcher ? { matcher } : {}),
    });
  }

  const contents = Object.keys(byEvent).length > 0
    ? json({ hooks: byEvent })
    : null;
  return { contents, gaps };
}

const MATCHERS: Record<string, string> = { Bash: "shell" };

function mcpJson(manifest: Manifest): string {
  return json({
    mcpServers: Object.fromEntries(
      Object.entries(manifest.mcpServers).map(([id, s]) => [
        id,
        // No `type` discriminator: Codex selects streamable HTTP on the presence
        // of `url`, and reads everything else as stdio.
        s.transport === "http"
          ? { url: s.url, ...(s.headers ? { headers: s.headers } : {}) }
          : {
            command: s.command,
            ...(s.args.length > 0 ? { args: s.args } : {}),
            ...(s.env ? { env: s.env } : {}),
          },
      ]),
    ),
  });
}

/** `skills/<name>/SKILL.md` → `skills/<name>`, for the sibling policy file. */
function skillDir(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

/** Always quoted: a bare `1.0.0` is a string in YAML, but `1.0` is not. */
function yamlScalar(value: string): string {
  return JSON.stringify(value);
}

function tomlString(value: string): string {
  return `"${escapeToml(value).replace(/\n/g, "\\n")}"`;
}

/**
 * Every `"` is escaped, not just runs of three. A body ending in a quote would
 * otherwise fuse with the closing delimiter, and spotting that case is more
 * code than escaping unconditionally.
 */
function tomlMultiline(value: string): string {
  return `"""\n${escapeToml(value)}"""`;
}

function escapeToml(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    // Tab and newline are legal literals in a multi-line basic string; the rest
    // of the C0 range is not, and markdown occasionally smuggles one in.
    .replace(
      // eslint-disable-next-line no-control-regex
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
      c => `\\u${c.codePointAt(0)!.toString(16).padStart(4, "0")}`,
    );
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function join(a: string, b: string): string {
  return `${a}/${b}`;
}
