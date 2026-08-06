import {
  CAPABILITIES,
  frontmatter as fm,
  skillFromFrontmatter,
} from "@ai-plugins/schema";
import type { Manifest } from "@ai-plugins/schema";
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
} from "../target.ts";

/**
 * Claude Code — the reference target.
 *
 * It supports every capability in the toolkit, so it emits no gaps. Its output
 * is also the byte-parity gate: `dist/claude/plugins/**` must reproduce the
 * hand-authored `plugins/**` exactly, which is what proves the neutral schema
 * is lossless.
 */
export const claude: Target = {
  id: "claude",
  capabilities: CAPABILITIES.claude,

  render(workspace: Workspace): Emission {
    const outputs: Output[] = [];
    const gaps: Gap[] = [];

    for (const plugin of workspace.plugins) {
      if (plugin.manifest.source.kind !== "local") {
        continue;
      }
      outputs.push(...renderPlugin(plugin));
    }

    // At the repo root, not under dist/claude/: this is the file Claude Code
    // reads when the marketplace is added from this repo, and the sources it
    // holds are root-relative.
    outputs.push({
      path: ".claude-plugin/marketplace.json",
      contents: marketplaceJson(workspace),
      atRepoRoot: true,
    });

    return { outputs, gaps };
  },
};

function contextFor(plugin: PluginSource): Context {
  return {
    root: "${CLAUDE_PLUGIN_ROOT}",
    // Claude installs every plugin as a sibling, so a relative hop is stable
    // and survives whatever absolute path the client chose.
    pluginRoot: name => `\${CLAUDE_PLUGIN_ROOT}/../${name}`,
    cmd: ref => `/${ref}`,
    target: { id: "claude", caps: CAPABILITIES.claude },
    ...{ plugin: plugin.manifest.name },
  };
}

function renderPlugin(plugin: PluginSource): Output[] {
  const base = `plugins/${plugin.manifest.name}`;
  const context = contextFor(plugin);
  const outputs: Output[] = [
    {
      path: `${base}/.claude-plugin/plugin.json`,
      contents: pluginJson(plugin.manifest),
    },
  ];

  for (const skill of plugin.skills) {
    outputs.push({
      path: `${base}/${skill.path}`,
      contents: fm.emit(
        toClaudeSkill(renderDocument(
          readFileSync(
            join(
              plugin.root,
              skill.path,
            ),
            "utf8",
          ),
          context,
        )),
      ),
    });
    outputs.push(...bundledFiles(skill.extras, base, context));
  }

  for (const agent of plugin.agents) {
    outputs.push({
      path: `${base}/${agent.path}`,
      contents: fm.emit(
        toClaudeAgent(renderDocument(
          readFileSync(
            join(
              plugin.root,
              agent.path,
            ),
            "utf8",
          ),
          context,
        )),
      ),
    });
  }

  outputs.push(...bundledFiles(plugin.files, base, context));

  if (plugin.hooks.length > 0) {
    outputs.push({
      path: `${base}/hooks/hooks.json`,
      contents: hooksJson(plugin),
    });
  }

  return outputs;
}

/**
 * Neutral skill frontmatter → Claude's spelling.
 *
 * Key *position* is preserved throughout: `invocation` sits where the legacy
 * key it replaces sat, so the emitted order matches the hand-authored file and
 * the byte-parity diff stays empty. The corpus uses nine distinct key orders —
 * imposing a canonical one would produce noise in all 51 skills.
 */
function toClaudeSkill(doc: fm.Document): fm.Document {
  const meta = skillFromFrontmatter(doc);
  let out = doc;

  switch (meta.invocation) {
    case "model":
      out = fm.rename(out, "invocation", "user-invocable");
      out = fm.set(out, "user-invocable", " false");
      break;
    case "user":
      out = fm.rename(out, "invocation", "disable-model-invocation");
      out = fm.set(out, "disable-model-invocation", " true");
      break;
    case "both":
      out = fm.rename(out, "invocation", "disable-model-invocation");
      out = fm.set(out, "disable-model-invocation", " false");
      break;
  }

  out = fm.rename(out, "argumentHint", "argument-hint");

  // `tools` carries its authored text through unchanged — Claude's spelling is
  // the one it was authored in. Re-serialising from the parsed list would
  // discard the line folding several agents use for long allowlists.
  out = fm.rename(out, "tools", "allowed-tools");

  return out;
}

function toClaudeAgent(doc: fm.Document): fm.Document {
  // Claude's agent frontmatter is already the neutral shape.
  return doc;
}

function pluginJson(manifest: Manifest): string {
  const out: Record<string, unknown> = {
    $schema: "https://www.schemastore.org/claude-code-plugin-manifest.json",
  };

  if (manifest.dependencies.length > 0) {
    out["dependencies"] = manifest.dependencies.map(name => ({
      marketplace: "virajp-plugins",
      name,
    }));
  }
  // No `description`: the marketplace entry carries it. Only 2 of 12 authored
  // manifests duplicated it, and Claude reads the marketplace copy when
  // listing plugins. Other targets (Codex requires it) get it from the neutral
  // manifest, which still holds it.

  const lsp = Object.entries(manifest.lspServers);
  if (lsp.length > 0) {
    out["lspServers"] = Object.fromEntries(
      lsp.map(([id, s]) => [
        id,
        {
          args: s.args,
          command: s.command,
          extensionToLanguage: s.extensions,
          ...(s.startupTimeout ? { startupTimeout: s.startupTimeout } : {}),
        },
      ]),
    );
  }

  const mcp = Object.entries(manifest.mcpServers);
  if (mcp.length > 0) {
    out["mcpServers"] = Object.fromEntries(
      mcp.map(([id, s]) => [
        id,
        s.transport === "http"
          ? {
            type: "http",
            url: s.url,
            ...(s.headers ? { headers: s.headers } : {}),
          }
          : {
            args: s.args,
            command: s.command,
            ...(s.env ? { env: s.env } : {}),
          },
      ]),
    );
  }

  out["name"] = manifest.name;
  return json(sortKeys(out));
}

function hooksJson(plugin: PluginSource): string {
  // Claude groups by event, then by matcher. Each neutral hook becomes its own
  // group, matching the authored shape.
  const byEvent: Record<string, unknown[]> = {};

  for (const hook of plugin.hooks) {
    if (hook.skipTargets.includes("claude")) {
      continue;
    }
    const event = hook.event.charAt(0).toUpperCase() + hook.event.slice(1);
    (byEvent[event] ??= []).push({
      hooks: [
        {
          ...(hook.async !== undefined ? { async: hook.async } : {}),
          command: hook.script
            ? `\${CLAUDE_PLUGIN_ROOT}/hooks/${hook.script}`
            : hook.command,
          ...(hook.timeout ? { timeout: hook.timeout } : {}),
          type: "command",
        },
      ],
      ...(hook.matcher ? { matcher: hook.matcher } : {}),
    });
  }

  return json({ hooks: byEvent });
}

function marketplaceJson(workspace: Workspace): string {
  const plugins = workspace.plugins.map(plugin => {
    const m = plugin.manifest;
    const entry: Record<string, unknown> = { name: m.name };

    if (m.author) {
      entry["author"] = m.author;
    }
    entry["category"] = m.category;
    if (m.dependencies.length > 0) {
      entry["dependencies"] = m.dependencies.map(name => ({
        marketplace: workspace.marketplace.name,
        name,
      }));
    }
    if (m.description) {
      entry["description"] = m.description;
    }
    if (m.homepage) {
      entry["homepage"] = m.homepage;
    }
    if (m.repository) {
      entry["repository"] = m.repository;
    }
    entry["source"] = m.source.kind === "local"
      ? `./dist/claude/plugins/${m.name}`
      : { source: "url", url: m.source.url };
    if (m.strict !== undefined) {
      entry["strict"] = m.strict;
    }
    if (m.tags.length > 0) {
      entry["tags"] = m.tags;
    }
    if (m.version) {
      entry["version"] = m.version;
    }

    return sortKeys(entry);
  });

  return json({
    $schema: "https://json.schemastore.org/claude-code-marketplace.json",
    description: workspace.marketplace.description,
    displayName: workspace.marketplace.displayName,
    forceRemoveDeletedPlugins: workspace.marketplace.forceRemoveDeletedPlugins,
    metadata: {},
    name: workspace.marketplace.name,
    owner: workspace.marketplace.owner,
    plugins,
  });
}

/** The authored manifests are key-sorted; keep that so diffs stay reviewable. */
function sortKeys(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function join(a: string, b: string): string {
  return `${a}/${b}`;
}
