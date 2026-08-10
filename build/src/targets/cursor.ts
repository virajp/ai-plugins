import {
  agentFromFrontmatter,
  CAPABILITIES,
  frontmatter as fm,
  isReadOnly,
  skillFromFrontmatter,
} from "@ai-plugins/schema";
import type {
  Hook,
  Manifest,
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
  stampOwner,
} from "../target.ts";

/**
 * Cursor — the closest non-Claude target.
 *
 * Cursor has a real plugin format (`.cursor-plugin/plugin.json` bundling
 * `skills/`, `agents/`, `hooks/`, `mcp.json`, `assets/`), and its skills are a
 * near-1:1 map of ours: `name`, `description`, optional `paths` globs, and
 * `disable-model-invocation`. So *every* skill lands as a skill — none become
 * `.cursor/rules/*.mdc` or `.cursor/commands/*.md`, both of which are strictly
 * weaker (rules lose model invocation, commands lose frontmatter entirely).
 * Cursor steers the other way too, shipping a `/migrate-to-skills` skill.
 *
 * Three surfaces genuinely do not survive, and each records a gap: no LSP
 * exists at all, hooks answer with a verdict and cannot rewrite a command, and
 * a subagent's tool allowlist collapses to one `readonly` boolean.
 */
export const cursor: Target = {
  id: "cursor",
  capabilities: CAPABILITIES.cursor,

  render(workspace: Workspace): Emission {
    const outputs: Output[] = [];
    const gaps: Gap[] = [];

    for (const plugin of workspace.plugins) {
      if (plugin.manifest.source.kind !== "local") {
        continue;
      }
      const before = outputs.length;
      renderPlugin(plugin, outputs, gaps);
      stampOwner(outputs, before, plugin.manifest.name);
    }

    outputs.push({
      // At the repo root for the same reason Claude's is, plus one of its own:
      // Cursor looks for `.cursor-plugin/marketplace.json` *before*
      // `.claude-plugin/marketplace.json`, so emitting ours here shadows the
      // Claude manifest. Without it Cursor would read that one and resolve
      // every plugin to a Claude-rendered bundle.
      path: ".cursor-plugin/marketplace.json",
      contents: marketplaceJson(workspace, gaps),
      atRepoRoot: true,
      unowned: true,
    });

    return { outputs, gaps };
  },
};

function contextFor(): Context {
  return {
    // Cursor has no `${CLAUDE_PLUGIN_ROOT}` equivalent, so the install-time
    // adapter substitutes these — see `ROOT_TOKEN` in target.ts.
    root: ROOT_TOKEN,
    pluginRoot: siblingRootToken,
    // Cursor invokes a skill by its bare name, not `<plugin>:<skill>`. Safe
    // because `plugins:check` already forces skill names to be unique across
    // the whole marketplace, for exactly this class of flat namespace.
    cmd: ref => `/${ref.split(":").pop()}`,
    // Neither target renames a skill directory, so the location is the
    // authored name.
    skillName: ref => ref.slice(ref.indexOf(":") + 1),
    target: { id: "cursor", caps: CAPABILITIES.cursor },
  };
}

function renderPlugin(
  plugin: PluginSource,
  outputs: Output[],
  gaps: Gap[],
): void {
  const name = plugin.manifest.name;
  const base = name;
  const context = contextFor();

  outputs.push({
    path: `${base}/.cursor-plugin/plugin.json`,
    contents: pluginJson(plugin.manifest, gaps),
  });

  for (const skill of plugin.skills) {
    outputs.push({
      path: `${base}/${skill.path}`,
      contents: fm.emit(
        toCursorSkill(renderDocument(
          readFileSync(`${plugin.root}/${skill.path}`, "utf8"),
          context,
        )),
      ),
    });
    outputs.push(...bundledFiles(skill.extras, base, context));
  }
  reportSkillGaps(plugin, gaps);

  for (const agent of plugin.agents) {
    outputs.push({
      path: `${base}/${agent.path}`,
      contents: fm.emit(
        toCursorAgent(renderDocument(
          readFileSync(`${plugin.root}/${agent.path}`, "utf8"),
          context,
        )),
      ),
    });
  }
  reportAgentGaps(plugin, gaps);

  outputs.push(...bundledFiles(plugin.files, base, context));

  renderHooks(plugin, base, outputs, gaps);

  if (Object.keys(plugin.manifest.mcpServers).length > 0) {
    outputs.push({ path: `${base}/mcp.json`, contents: mcpJson(plugin) });
  }

  for (const [id, server] of Object.entries(plugin.manifest.lspServers)) {
    gaps.push({
      plugin: name,
      capability: "lsp",
      detail: `language server \`${id}\` (${
        Object
          .keys(server.extensions)
          .sort()
          .join(", ")
      }) is not emitted: Cursor exposes no agent-facing LSP configuration at `
        + `all — the editor's own language services are not reachable from a `
        + `plugin (open request: forum.cursor.com thread 156751).`,
      severity: "dropped",
    });
  }
}

/**
 * Neutral skill frontmatter → Cursor's spelling.
 *
 * Cursor reads four keys and ignores the rest, so everything else is dropped
 * rather than shipped as decoration a reader would mistake for behaviour.
 * `paths` passes through verbatim — same key, same glob semantics, and its raw
 * block sequence is already valid YAML.
 *
 * `invocation: model` has no exact analogue: Cursor can hide a skill from the
 * model but not from the user, so doctrine skills additionally gain a slash
 * form. That is additive, not a loss, so it records no gap.
 */
function toCursorSkill(doc: fm.Document): fm.Document {
  const meta = skillFromFrontmatter(doc);
  let out = fm.omit(
    doc,
    "invocation",
    "tools",
    "argumentHint",
    "model",
    "effort",
    "version",
    "category",
    "license",
  );

  if (meta.invocation === "user") {
    out = fm.set(out, "disable-model-invocation", " true");
  }

  return fm.reorder(out, [
    "name",
    "description",
    "paths",
    "disable-model-invocation",
  ]);
}

/**
 * Neutral agent frontmatter → Cursor's spelling.
 *
 * The tool allowlist collapses into `readonly`, derived by `isReadOnly` rather
 * than dropped: for the pure-read gates that boolean is as strong as the list,
 * and for the rest it is the honest answer (see `reportAgentGaps`).
 */
function toCursorAgent(doc: fm.Document): fm.Document {
  const meta = agentFromFrontmatter(doc);
  let out = fm.omit(doc, "tools", "model", "effort", "spawns");

  // Cursor's `model` is `inherit`, `fast`, or a concrete id — it has no tier
  // vocabulary, so only the cheap tier maps; the rest defer to the user's
  // chosen model.
  out = fm.set(out, "model", meta.model === "haiku" ? " fast" : " inherit");
  out = fm.set(out, "readonly", isReadOnly(meta) ? " true" : " false");

  return fm.reorder(out, ["name", "description", "model", "readonly"]);
}

function reportSkillGaps(plugin: PluginSource, gaps: Gap[]): void {
  const metas = plugin.skills.map(s => s.meta);
  const named = (subset: readonly { name: string; }[]) =>
    subset.map(s => `\`${s.name}\``).join(", ");

  const hinted = metas.filter(s => s.argumentHint !== undefined);
  if (hinted.length > 0) {
    gaps.push({
      plugin: plugin.manifest.name,
      capability: "commandArguments",
      detail:
        `\`argumentHint\` dropped from ${hinted.length} skill(s): ${
          named(hinted)
        }. Cursor's skill frontmatter has no argument hint and `
        + `\`.cursor/commands/*.md\` interpolate no arguments; each skill's body `
        + `still describes its argument in prose.`,
      severity: "degraded",
    });
  }

  const pinned = metas.filter(s =>
    s.model !== undefined || s.effort !== undefined
  );
  if (pinned.length > 0) {
    gaps.push({
      plugin: plugin.manifest.name,
      capability: "skillModel",
      detail:
        `model/effort pin dropped from ${pinned.length} skill(s): ${
          named(pinned)
        }. A Cursor skill runs on whatever model the user selected, so a skill `
        + `authored for opus at high effort may run on a weaker one.`,
      severity: "degraded",
    });
  }

  const scoped = metas.filter(s => s.tools !== undefined);
  if (scoped.length > 0) {
    gaps.push({
      plugin: plugin.manifest.name,
      capability: "skillTools",
      detail:
        `tool allowlist dropped from ${scoped.length} skill(s): ${
          named(scoped)
        }. Cursor scopes tools per agent, never per skill, and a skill is not an `
        + `agent — there is nothing to attach the list to.`,
      severity: "degraded",
    });
  }
}

function reportAgentGaps(plugin: PluginSource, gaps: Gap[]): void {
  const mutating = plugin.agents.map(a => a.meta).filter(a => !isReadOnly(a));
  if (mutating.length === 0) {
    return;
  }

  gaps.push({
    plugin: plugin.manifest.name,
    capability: "agentToolAllowlist",
    detail: `${mutating.length} agent(s) run unrestricted: ${
      mutating
        .map(a => `\`${a.name}\``)
        .join(", ")
    }. Cursor has no per-agent tool allowlist, only \`readonly\`, and each of `
      + `these holds a mutating tool (Bash/Write/Edit) — so \`readonly: false\` `
      + `grants them every tool, not just the ones they were scoped to.`,
    severity: "degraded",
  });
}

/**
 * Cursor's hook events are named for the surface they guard, not for a generic
 * tool lifecycle, so the mapping is partial by construction. `null` means the
 * event has no Cursor surface at all and the caller records a dropped gap
 * rather than inventing one.
 */
function cursorEvent(hook: Hook): string | null {
  switch (hook.event) {
    case "preToolUse":
      return hook.matcher === "Bash" ? "beforeShellExecution" : null;
    case "postToolUse":
      return hook.matcher === "Edit" || hook.matcher === "Write"
        ? "afterFileEdit"
        : null;
    case "userPromptSubmit":
      return "beforeSubmitPrompt";
    case "sessionEnd":
      return "stop";
    case "sessionStart":
      return null;
    case "stop":
      // Cursor's `stop` fires when the agent finishes responding, which is
      // this event rather than `sessionEnd` — the two share a surface here.
      return "stop";
    case "preCompact":
      // Spelled the same as ours. Verified against cursor.com/docs/hooks,
      // whose event list carries both `preCompact` and `stop` — an earlier
      // reading of this file's own mapping suggested it had neither.
      return "preCompact";
  }
}

function renderHooks(
  plugin: PluginSource,
  base: string,
  outputs: Output[],
  gaps: Gap[],
): void {
  const byEvent: Record<string, unknown[]> = {};

  for (const hook of plugin.hooks) {
    if (hook.skipTargets.includes("cursor")) {
      continue;
    }

    const event = cursorEvent(hook);
    if (event === null) {
      gaps.push({
        plugin: plugin.manifest.name,
        capability: "hookGate",
        detail: `hook \`${hook.id}\` (${hook.event}${
          hook.matcher ? ` on ${hook.matcher}` : ""
        }) is not emitted: Cursor has no hook event covering that surface.`,
        severity: "dropped",
      });
      continue;
    }

    if (hook.script) {
      outputs.push({
        path: `${base}/hooks/${hook.id}.cursor.sh`,
        contents: wrapperScript(hook),
        executable: true,
      });
    }

    if (hook.action === "rewrite") {
      gaps.push({
        plugin: plugin.manifest.name,
        capability: "hookRewrite",
        detail: `hook \`${hook.id}\` degrades from rewrite to `
          + `deny-plus-correction: Cursor's ${event} answer is `
          + `\`{permission, agent_message}\` with no \`updatedInput\`, so the `
          + `wrapper refuses the command and returns the correction for the `
          + `model to reissue. The guarantee holds; it costs a turn.`,
        severity: "degraded",
      });
    }

    (byEvent[event] ??= []).push({
      command: hookCommand(hook),
      ...(hook.timeout ? { timeout: hook.timeout } : {}),
    });
  }

  if (Object.keys(byEvent).length > 0) {
    outputs.push({
      path: `${base}/hooks/hooks.json`,
      // `version: 1` is required; Cursor rejects the file without it.
      contents: json({ hooks: byEvent, version: 1 }),
    });
  }
}

function hookCommand(hook: Hook): string {
  if (hook.script) {
    return `${ROOT_TOKEN}/hooks/${hook.id}.cursor.sh`;
  }
  // A literal command is a tool on PATH speaking some other target's response
  // shape. Cursor treats a malformed answer as a failure, so the output is
  // swallowed and an explicit allow appended — the observation still happens.
  // The braces matter: without them the redirection would bind to the last
  // command of the `&&`/`||` chain instead of the whole thing.
  return `{ ${hook.command}; } >/dev/null 2>&1; `
    + `printf '{"permission":"allow"}\\n'`;
}

/**
 * The per-hook adapter Cursor needs and the neutral script must not know about.
 *
 * Two translations, both unavoidable: Cursor puts the shell command at
 * `.command` while the script reads `.tool_input.command`, and Cursor's answer
 * is a verdict where the script emits Claude's `hookSpecificOutput`.
 */
function wrapperScript(hook: Hook): string {
  return `#!/usr/bin/env bash
# Generated by build/src/targets/cursor.ts — do not edit.
#
# Cursor answers a hook with {permission, user_message, agent_message} and has
# no \`updatedInput\`, so a rewrite is impossible here. This runs the neutral
# script unchanged and translates its answer: a would-be rewrite becomes a
# denial carrying the correction, so the model reissues the command itself.
set -euo pipefail

payload=$(cat)
answer=$(printf '%s' "$payload" \\
  | jq '. + {tool_input: {command: (.command // "")}}' \\
  | "$(dirname "$0")/${hook.script}")

if printf '%s' "$answer" | jq -e '.hookSpecificOutput.updatedInput' >/dev/null; then
  jq -n --arg m ${shellQuote(hook.correction ?? "")} \\
    '{permission: "deny", agent_message: $m}'
elif [ "$(printf '%s' "$answer" \\
  | jq -r '.hookSpecificOutput.permissionDecision // "allow"')" = "deny" ]; then
  jq -n --arg m "$(printf '%s' "$answer" \\
    | jq -r '.hookSpecificOutput.permissionDecisionReason // ""')" \\
    '{permission: "deny", agent_message: $m}'
else
  printf '{"permission":"allow"}\\n'
fi
`;
}

function pluginJson(manifest: Manifest, gaps: Gap[]): string {
  // Cursor requires all four. Every local plugin declares them today; the
  // fallbacks keep a half-filled manifest from producing a bundle Cursor
  // refuses to load, and say so in the report rather than silently.
  if (!manifest.version) {
    gaps.push({
      plugin: manifest.name,
      capability: "manifest",
      detail: "no `version` declared; Cursor requires one, so the bundle "
        + "ships `0.0.0` and will never look upgradeable.",
      severity: "degraded",
    });
  }

  return json({
    author: manifest.author?.name ?? "unknown",
    description: manifest.description ?? manifest.name,
    name: manifest.name,
    version: manifest.version ?? "0.0.0",
  });
}

/**
 * The registry Cursor reads when this repo is added as a marketplace.
 *
 * Cursor's plugin `source` is a union of git forms only — a bare string, or an
 * object tagged `github` / `url` / `git-subdir`. **There is no local-path
 * variant**, verified against its manifest parser. So unlike every other target
 * here, a Cursor install cannot be pointed at the rendered tree sitting on
 * disk: it clones the repo and reads `cursor/<plugin>` from whatever ref it
 * resolves. A working copy and an installed copy can therefore differ, which is
 * the one place the committed-render guarantee does not reach.
 *
 * `git-subdir` is the only form that can name a directory inside the repo,
 * which is what every plugin here is.
 */
function marketplaceJson(workspace: Workspace, gaps: Gap[]): string {
  const local = workspace
    .plugins
    .filter(plugin => plugin.manifest.source.kind === "local");
  const repository = workspace.marketplace.repository;

  if (repository === undefined) {
    for (const plugin of local) {
      gaps.push({
        plugin: plugin.manifest.name,
        capability: "marketplace",
        detail: "not listed: `marketplace.yaml` declares no `repository`, and "
          + "Cursor's plugin sources are git-only, so there is no URL to point "
          + "the entry at.",
        severity: "dropped",
      });
    }
    // A manifest listing nothing still registers cleanly and reports "no
    // plugins", which is a far clearer failure than entries Cursor skips one by
    // one for having no usable source.
    return json({ name: workspace.marketplace.name, plugins: [] });
  }

  return json({
    description: workspace.marketplace.description,
    name: workspace.marketplace.name,
    owner: workspace.marketplace.owner,
    plugins: local.map(plugin => ({
      category: plugin.manifest.category,
      description: plugin.manifest.description ?? plugin.manifest.name,
      name: plugin.manifest.name,
      source: {
        source: "git-subdir",
        url: repository,
        path: `cursor/${plugin.manifest.name}`,
      },
      ...(plugin.manifest.version ? { version: plugin.manifest.version } : {}),
    })),
  });
}

function mcpJson(plugin: PluginSource): string {
  return json({
    mcpServers: Object.fromEntries(
      Object.entries(plugin.manifest.mcpServers).map(([id, s]) => [
        id,
        s.transport === "http"
          ? {
            // Cursor's remote entries are typed `http` or `sse`; ours are all
            // streamable HTTP.
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
    ),
  });
}

/** Single-quote a string for safe interpolation into generated bash. */
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
