import {
  agentFromFrontmatter,
  CAPABILITIES,
  frontmatter as fm,
  skillFromFrontmatter,
} from "@ai-plugins/schema";
import type {
  Hook,
  Invocation,
  Manifest,
} from "@ai-plugins/schema";
import { readFileSync } from "node:fs";
import type {
  FileSource,
  PluginSource,
  SkillSource,
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
  renderTemplate,
  ROOT_TOKEN,
  siblingRootToken,
  stampOwner,
} from "../target.ts";

/**
 * OpenCode.
 *
 * OpenCode has no plugin bundle at all: skills, commands, agents and JS plugins
 * each live in their own well-known directory under the config dir, and
 * everything else is config the installer merges. So this target emits an
 * *install image* — `virajp-plugins/<plugin>/` holding the plugin's own files,
 * mirroring where `bin/opencode.mjs` copies them today, plus the loose
 * `command/`, `agent/` and `plugin/` trees OpenCode discovers globally. Phase 2
 * is then a copy plus a config merge, with no knowledge of the schema.
 *
 * Two capabilities are emulated rather than carried. User-only skills have no
 * OpenCode equivalent (issue #11972 closed unimplemented), so they are moved
 * out of `**\/SKILL.md` discovery and reached through a generated wrapper
 * command; and hooks have no declarative form, so each becomes a JS plugin
 * module wrapping the authored script.
 */
export const opencode: Target = {
  id: "opencode",
  capabilities: CAPABILITIES.opencode,

  render(workspace: Workspace): Emission {
    const outputs: Output[] = [];
    const gaps: Gap[] = [];

    // `cmd` has to know how a *referenced* skill is invoked, not just the one
    // being rendered: a user-only skill is reachable through its wrapper, and
    // everything else only by name. Built once, over every plugin — prose in
    // one plugin routinely names a skill in another.
    const invocations = new Map<string, Invocation>();
    for (const plugin of workspace.plugins) {
      for (const skill of plugin.skills) {
        invocations.set(
          `${plugin.manifest.name}:${skill.meta.name}`,
          skill.meta.invocation,
        );
      }
    }

    for (const plugin of workspace.plugins) {
      if (plugin.manifest.source.kind !== "local") {
        continue;
      }
      const before = outputs.length;
      const emission = renderPlugin(plugin, invocations);
      outputs.push(...emission.outputs);
      stampOwner(outputs, before, plugin.manifest.name);
      gaps.push(...emission.gaps);
    }

    gaps.push({
      plugin: workspace.marketplace.name,
      capability: "marketplace",
      detail:
        "OpenCode has no plugin registry or marketplace. Distribution is the "
        + "installer copying this tree into the config dir and merging each "
        + "plugin's `opencode.config.json` fragment.",
      severity: "dropped",
    });

    return { outputs, gaps };
  },
};

function contextFor(
  plugin: PluginSource,
  invocations: ReadonlyMap<string, Invocation>,
): Context {
  return {
    // OpenCode resolves nothing at runtime, so the install-time token stands in
    // for both roots and the adapter substitutes the absolute path it chose.
    root: ROOT_TOKEN,
    pluginRoot: siblingRootToken,
    cmd: ref => {
      // A user-only skill exists here *only* as its wrapper command, which is
      // typed `/<plugin>-<skill>`. Everything else is model-invoked, and
      // OpenCode addresses skills by bare name in one flat namespace — which is
      // why skill names are unique across plugins.
      const bare = ref.slice(ref.indexOf(":") + 1);
      return invocations.get(ref) === "user"
        ? `/${ref.replace(":", "-")}`
        : bare;
    },
    target: { id: "opencode", caps: CAPABILITIES.opencode },
    ...{ plugin: plugin.manifest.name },
  };
}

/** Where a plugin's own files land, relative to the OpenCode config dir. */
const BUNDLE_DIR = "virajp-plugins";

function renderPlugin(
  plugin: PluginSource,
  invocations: ReadonlyMap<string, Invocation>,
): Emission {
  const name = plugin.manifest.name;
  const base = `${BUNDLE_DIR}/${name}`;
  const context = contextFor(plugin, invocations);
  const outputs: Output[] = [];
  const gaps: Gap[] = [];

  const pathScoped: string[] = [];
  const userOnly: string[] = [];
  const modelPinned: string[] = [];
  const skillTools: string[] = [];
  const shadowed: string[] = [];

  for (const skill of plugin.skills) {
    const meta = skill.meta;
    if (meta.paths !== undefined) {
      pathScoped.push(meta.name);
    }
    if (meta.model !== undefined || meta.effort !== undefined) {
      modelPinned.push(`skill ${meta.name}`);
    }
    if (meta.tools !== undefined) {
      skillTools.push(meta.name);
    }

    if (meta.invocation === "user") {
      userOnly.push(meta.name);
      // Out of `**/SKILL.md` discovery entirely — that path glob is the only
      // thing that decides whether the model sees a skill, so relocating the
      // file *is* the emulation.
      outputs.push(...renderSkill(plugin, skill, base, "commands", context));
      outputs.push(wrapper(name, skill, context));
    }
    else {
      if (meta.invocation === "both") {
        shadowed.push(meta.name);
      }
      outputs.push(...renderSkill(plugin, skill, base, "skills", context));
    }
  }

  const unmappedTools = new Set<string>();
  for (const agent of plugin.agents) {
    const meta = agent.meta;
    if (meta.model !== undefined || meta.effort !== undefined) {
      modelPinned.push(`agent ${meta.name}`);
    }
    for (const tool of meta.tools ?? []) {
      if (TOOL_ALIASES[tool] === undefined) {
        unmappedTools.add(tool);
      }
    }
    outputs.push({
      // Agents are global: OpenCode reads `agent/<name>.md` from the config dir
      // and knows nothing about the bundle they came from.
      path: `agent/${meta.name}.md`,
      contents: fm.emit(
        toOpenCodeAgent(renderDocument(source(plugin, agent.path), context)),
      ),
    });
  }

  outputs.push(...bundledFiles(plugin.files, base, context));

  for (const hook of plugin.hooks) {
    if (hook.skipTargets.includes("opencode")) {
      continue;
    }
    const key = HOOK_EVENTS[hook.event];
    if (key === undefined) {
      gaps.push({
        plugin: name,
        capability: "hookEvent",
        detail:
          `hook \`${hook.id}\` fires on \`${hook.event}\`, which OpenCode's `
          + "plugin API does not expose as a tool-lifecycle callback.",
        severity: "dropped",
      });
      continue;
    }
    outputs.push({
      path: `plugin/${name}-${hook.id}.js`,
      contents: hookPlugin(name, hook, key),
    });
    if (hook.timeout !== undefined || hook.async !== undefined) {
      gaps.push({
        plugin: name,
        capability: "hookScheduling",
        detail:
          `hook \`${hook.id}\` declares timeout/async, which OpenCode's plugin `
          + "API has no knob for — the wrapper awaits the script to completion.",
        severity: "degraded",
      });
    }
  }

  outputs.push({
    path: `${base}/opencode.config.json`,
    contents: configFragment(plugin.manifest),
  });

  if (pathScoped.length > 0) {
    gaps.push({
      plugin: name,
      capability: "pathScopedSkills",
      detail:
        `\`paths:\`-scoped skills (${names(pathScoped)}) still install, but `
        + "OpenCode has no glob auto-apply — they load only when the model "
        + "picks them out of the description.",
      severity: "degraded",
    });
  }

  if (userOnly.length > 0) {
    gaps.push({
      plugin: name,
      capability: "userOnlySkills",
      detail:
        `user-only skills (${names(userOnly)}) are emulated: each moves to `
        + "`commands/<name>/index.md`, outside `**/SKILL.md` discovery, plus a "
        + "`command/<plugin>-<name>.md` wrapper. The model can no longer invoke "
        + "them, though nothing stops it reading the file.",
      severity: "degraded",
    });
  }

  if (shadowed.length > 0) {
    gaps.push({
      plugin: name,
      capability: "slashInvocation",
      detail: `model+user skills (${names(shadowed)}) keep only their `
        + "model-invoked half: OpenCode has no user-typed skills, and giving "
        + "them a wrapper would re-expose them to the model.",
      severity: "degraded",
    });
  }

  if (skillTools.length > 0) {
    gaps.push({
      plugin: name,
      capability: "skillToolAllowlist",
      detail: `skill tool allowlists (${names(skillTools)}) drop: OpenCode's `
        + "skill frontmatter carries no tool restriction — only agents do.",
      severity: "dropped",
    });
  }

  if (modelPinned.length > 0) {
    gaps.push({
      plugin: name,
      capability: "modelPin",
      detail:
        `model/effort pins drop (${names(modelPinned)}): OpenCode model ids `
        + "are provider-qualified (`<provider>/<model>`) and the provider is "
        + "the user's own config, so the build cannot name one.",
      severity: "dropped",
    });
  }

  if (unmappedTools.size > 0) {
    gaps.push({
      plugin: name,
      capability: "agentToolAllowlist",
      detail: `no OpenCode equivalent for ${names([...unmappedTools].sort())}; `
        + "those entries drop from the agent allowlists and the built-in tools "
        + "carry the restriction alone.",
      severity: "degraded",
    });
  }

  if (plugin.agents.length > 0) {
    gaps.push({
      plugin: name,
      capability: "subagentsInBundle",
      detail:
        `${plugin.agents.length} agents install into the shared \`agent/\` dir `
        + "rather than the bundle, so uninstall must remove them by name.",
      severity: "degraded",
    });
  }

  if (
    outputs.some(o =>
      typeof o.contents === "string" && o.contents.includes(ROOT_TOKEN)
    )
  ) {
    gaps.push({
      plugin: name,
      capability: "pluginRootVariable",
      detail:
        `references to the plugin's own root are emitted as \`${ROOT_TOKEN}\`; `
        + "OpenCode expands nothing at runtime, so the installer must "
        + "substitute the absolute install path.",
      severity: "degraded",
    });
  }

  return { outputs, gaps };
}

function renderSkill(
  plugin: PluginSource,
  skill: SkillSource,
  base: string,
  dir: "skills" | "commands",
  context: Context,
): Output[] {
  const from = `skills/${skill.meta.name}`;
  const to = `${dir}/${skill.meta.name}`;
  const file = dir === "commands" ? "index.md" : "SKILL.md";

  return [
    {
      path: `${base}/${to}/${file}`,
      contents: fm.emit(
        toOpenCodeSkill(renderDocument(source(plugin, skill.path), context)),
      ),
    },
    // References travel with their skill, so a relocated skill takes its whole
    // directory — a `references/` link inside the body is relative to it.
    ...bundledFiles(
      skill.extras.map(relocate(from, to)),
      base,
      context,
    ),
  ];
}

function relocate(from: string, to: string): (f: FileSource) => FileSource {
  return f => ({ ...f, path: `${to}${f.path.slice(from.length)}` });
}

/**
 * The wrapper that restores a user-only skill's slash form.
 *
 * OpenCode commands are user-typed and never model-invoked, which is exactly
 * the half of Claude's `disable-model-invocation` that matters. The wrapper
 * carries no doctrine of its own — it points at the relocated skill so the two
 * can never drift.
 */
function wrapper(
  plugin: string,
  skill: SkillSource,
  context: Context,
): Output {
  const meta = skill.meta;
  const installed = `${
    siblingRootToken(plugin)
  }/commands/${meta.name}/index.md`;
  // The description is a folded scalar in the source and routinely contains
  // `: ` and quotes; JSON is a valid YAML double-quoted scalar, so it survives.
  const description = JSON.stringify(
    renderTemplate(meta.description, context),
  );
  const hint = meta.argumentHint;

  return {
    path: `command/${plugin}-${meta.name}.md`,
    contents: [
      "---",
      `description: ${description}`,
      "---",
      "",
      `Read the \`${meta.name}\` workflow skill at \`${installed}\` and follow`,
      "it for this request.",
      "",
      ...(hint ? [`Arguments (${hint}):`, ""] : []),
      "$ARGUMENTS",
      "",
    ]
      .join("\n"),
  };
}

/**
 * Neutral skill frontmatter → OpenCode's spelling.
 *
 * OpenCode reads `name`, `description`, `license`, `compatibility` and
 * `metadata`, and ignores everything else. Ignored is not the same as harmless:
 * a stale `disable-model-invocation` in a shipped file reads as a promise the
 * runtime does not keep, so anything without a home is dropped — except the
 * provenance pair, which `metadata` can carry losslessly.
 */
function toOpenCodeSkill(doc: fm.Document): fm.Document {
  const meta = skillFromFrontmatter(doc);

  let out = fm.omit(
    doc,
    "invocation",
    "user-invocable",
    "disable-model-invocation",
    "paths",
    "tools",
    "allowed-tools",
    "argumentHint",
    "argument-hint",
    "model",
    "effort",
    "version",
    "category",
  );

  const provenance = [
    ...(meta.version ? [`  version: ${meta.version}`] : []),
    ...(meta.category ? [`  category: ${meta.category}`] : []),
  ];
  if (provenance.length > 0) {
    out = fm.set(out, "metadata", `\n${provenance.join("\n")}`);
  }

  return fm.reorder(out, ["name", "description", "license", "metadata"]);
}

/**
 * Neutral agent frontmatter → OpenCode's spelling.
 *
 * The name comes from the filename, and `mode: subagent` is what keeps the
 * agent out of the primary-agent picker.
 */
function toOpenCodeAgent(doc: fm.Document): fm.Document {
  const meta = agentFromFrontmatter(doc);

  let out = fm.omit(doc, "name", "model", "effort", "spawns", "tools");
  out = fm.set(out, "mode", " subagent");

  const tools = toolMap(meta.tools);
  if (tools !== null) {
    out = fm.set(out, "tools", tools);
  }

  return fm.reorder(out, ["description", "mode", "tools"]);
}

/**
 * Claude tool names → OpenCode's. Two of them split: OpenCode separates
 * directory listing from globbing, and a targeted patch from a full edit, so an
 * allowlist that granted the Claude tool has to grant both halves.
 */
const TOOL_ALIASES: Record<string, readonly string[]> = {
  Bash: ["bash"],
  Edit: ["edit", "patch"],
  Glob: ["glob", "list"],
  Grep: ["grep"],
  Read: ["read"],
  WebFetch: ["webfetch"],
  Write: ["write"],
};

/**
 * Every built-in an allowlist has to decide about.
 *
 * OpenCode's `tools` map is a filter, and anything unnamed stays enabled — so
 * an allowlist is only enforced by naming the rest `false`. The todo tools are
 * deliberately absent: they are session bookkeeping, not a capability any
 * authored allowlist meant to withhold.
 */
const OPENCODE_TOOLS = [
  "bash",
  "edit",
  "glob",
  "grep",
  "list",
  "patch",
  "read",
  "task",
  "webfetch",
  "write",
];

function toolMap(tools: readonly string[] | undefined): string | null {
  if (tools === undefined) {
    return null;
  }
  const allowed = new Set(tools.flatMap(t => TOOL_ALIASES[t] ?? []));
  const lines = OPENCODE_TOOLS.map(t => `  ${t}: ${allowed.has(t)}`);
  return `\n${lines.join("\n")}`;
}

/** Neutral hook events → the OpenCode plugin API's callback keys. */
const HOOK_EVENTS: Partial<Record<string, string>> = {
  preToolUse: "tool.execute.before",
  postToolUse: "tool.execute.after",
};

/**
 * One hook → one JS plugin module.
 *
 * OpenCode ships no declarative hook file, so a module is the only route. The
 * authored script keeps speaking the Claude payload/response shape and this
 * wrapper translates it, which is what lets one script serve every target.
 * `output.args` is mutable in `tool.execute.before`, so a `rewrite` hook lands
 * natively here rather than degrading to deny-plus-correction.
 */
function hookPlugin(plugin: string, hook: Hook, key: string): string {
  const command = hook.script
    ? [`${siblingRootToken(plugin)}/hooks/${hook.script}`]
    : ["sh", "-c", hook.command ?? ""];
  const matcher = hook.matcher
    ? (TOOL_ALIASES[hook.matcher]?.[0] ?? hook.matcher.toLowerCase())
    : null;
  const symbol = identifier(`${plugin}-${hook.id}`);

  return `// Generated from templates/${plugin}/hooks/hooks.yaml — do not edit.
import { spawn } from "node:child_process";

const COMMAND = ${JSON.stringify(command)};
const MATCHER = ${JSON.stringify(matcher)};
const ACTION = ${JSON.stringify(hook.action)};
const CORRECTION = ${JSON.stringify(hook.correction ?? null)};

export const ${symbol} = async ({ directory }) => ({
  "${key}": async (input, output) => {
    if (MATCHER !== null && input.tool !== MATCHER) {
      return;
    }

    const args = output?.args ?? {};
    const response = await run(
      JSON.stringify({
        hook_event_name: "${hook.event}",
        tool_name: input.tool,
        tool_input: args,
        cwd: directory,
      }),
      directory,
    );
    if (response === null) {
      return;
    }

    const decision = response.hookSpecificOutput ?? {};
    if (decision.permissionDecision === "deny") {
      throw new Error(decision.permissionDecisionReason ?? CORRECTION);
    }
    // Mutating \`output.args\` in place is the whole reason a rewrite needs no
    // correction message on this target.
    if (ACTION === "rewrite" && decision.updatedInput) {
      Object.assign(args, decision.updatedInput);
    }
  },
});

/** Run the hook command with the payload on stdin; null when it says nothing. */
function run(payload, cwd) {
  return new Promise(resolve => {
    const child = spawn(COMMAND[0], COMMAND.slice(1), {
      cwd,
      stdio: ["pipe", "pipe", "ignore"],
    });
    let out = "";
    child.stdout.on("data", chunk => {
      out += chunk;
    });
    // A hook must never take the session down with it: an unreadable answer is
    // the same as no answer.
    child.on("error", () => resolve(null));
    child.on("close", () => {
      try {
        resolve(JSON.parse(out));
      }
      catch {
        resolve(null);
      }
    });
    child.stdin.end(payload);
  });
}
`;
}

/**
 * The config entries the installer merges, stamped beside the plugin they came
 * from.
 *
 * Per plugin, not one combined file: which plugins are installed is a runtime
 * choice, and a fragment sitting inside the bundle is also what tells an
 * uninstall exactly which `lsp`/`mcp` keys were this plugin's — never a key the
 * user wrote.
 */
function configFragment(manifest: Manifest): string {
  const out: Record<string, unknown> = {
    configSchema: "https://opencode.ai/config.json",
    name: manifest.name,
  };

  if (manifest.version) {
    out["version"] = manifest.version;
  }
  if (manifest.dependencies.length > 0) {
    out["dependencies"] = manifest.dependencies;
  }

  const lsp = Object.entries(manifest.lspServers);
  if (lsp.length > 0) {
    out["lsp"] = Object.fromEntries(
      lsp.map(([id, s]) => [
        // OpenCode keys LSP config by its own built-in server ids, so writing
        // under the alias *replaces* the built-in launcher instead of running a
        // second server for the same language.
        s.idAliases?.["opencode"] ?? id,
        {
          command: [s.command, ...s.args],
          extensions: Object.keys(s.extensions),
        },
      ]),
    );
  }

  const mcp = Object.entries(manifest.mcpServers);
  if (mcp.length > 0) {
    out["mcp"] = Object.fromEntries(
      mcp.map(([id, s]) => [
        id,
        s.transport === "http"
          // OpenCode spells the two transports `remote` and `local`, not
          // `http` and `stdio`.
          ? {
            type: "remote",
            url: s.url,
            ...(s.headers ? { headers: s.headers } : {}),
          }
          : {
            type: "local",
            command: [s.command, ...s.args],
            ...(s.env ? { environment: s.env } : {}),
          },
      ]),
    );
  }

  return `${JSON.stringify(out, null, 2)}\n`;
}

/**
 * A gap has to name what it lost, but vwf pins a model on 31 skills and agents
 * — past a handful the list stops being read, so it becomes a count.
 */
function names(values: readonly string[], limit = 8): string {
  return values.length <= limit
    ? values.join(", ")
    : `${values.slice(0, limit).join(", ")}, and ${values.length - limit} more`;
}

function source(plugin: PluginSource, path: string): string {
  return readFileSync(`${plugin.root}/${path}`, "utf8");
}

/** `vwf-npm-normalize` → `vwfNpmNormalize`, a legal export name. */
function identifier(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}
