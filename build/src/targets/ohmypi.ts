import {
  agentFromFrontmatter,
  CAPABILITIES,
  frontmatter as fm,
} from "@ai-plugins/schema";
import type {
  Hook,
  LspServer,
  Manifest,
} from "@ai-plugins/schema";
import { readFileSync } from "node:fs";
import type {
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
  flatSkillName,
  relocate,
  renderDocument,
  ROOT_TOKEN,
  siblingRootToken,
  stampOwner,
} from "../target.ts";

/**
 * Oh-My-Pi — a Claude-shaped bundle with its own frontmatter contract.
 *
 * The directory layout is almost Claude's (`skills/<name>/SKILL.md`,
 * `agents/*.md`, `hooks/`, `.mcp.json`), which makes this the cheapest target
 * to reach. What it does *not* share is the vocabulary: Oh-My-Pi explicitly
 * refuses to read `.claude/agents`, so every agent has to be re-emitted under
 * its own keys, and skills spell path scoping `globs` rather than `paths`.
 *
 * Three things genuinely do not carry, and each is reported rather than
 * dropped: `globs` only rank retrieval instead of forcing selection, a hook
 * cannot rewrite the tool input, and skill frontmatter has no model/effort or
 * tool-allowlist field.
 */
export const ohmypi: Target = {
  id: "ohmypi",
  capabilities: CAPABILITIES.ohmypi,

  render(workspace: Workspace): Emission {
    const outputs: Output[] = [];
    const gaps: Gap[] = [];

    // Built over every plugin: prose in one routinely names a skill in
    // another, and the flat name depends on the *owning* plugin's opt-in.
    const flatNames = new Map<string, string>();
    for (const plugin of workspace.plugins) {
      for (const skill of plugin.skills) {
        flatNames.set(
          `${plugin.manifest.name}:${skill.meta.name}`,
          flatSkillName(plugin.manifest, skill.meta.name),
        );
      }
    }

    for (const plugin of workspace.plugins) {
      if (plugin.manifest.source.kind !== "local") {
        // Nothing to render, and `marketplaceJson` no longer catalogues it
        // either — it reports that gap itself, with the reason. One gap per
        // plugin, so the coverage report says what is actually true.
        continue;
      }
      const before = outputs.length;
      const emission = renderPlugin(plugin, flatNames);
      outputs.push(...emission.outputs);
      stampOwner(outputs, before, plugin.manifest.name);
      gaps.push(...emission.gaps);
    }

    outputs.push({
      path: ".omp-plugin/marketplace.json",
      contents: marketplaceJson(workspace, gaps),
      unowned: true,
    });

    return { outputs, gaps };
  },
};

/**
 * Oh-My-Pi has no `${CLAUDE_PLUGIN_ROOT}` equivalent, so both roots resolve to
 * the shared install-time tokens. `cmd` has to spell a skill the way Oh-My-Pi
 * actually parses one, since 54 descriptions name a sibling command and a
 * spelling users cannot type is worse than no reference at all.
 */
function contextFor(flatNames: ReadonlyMap<string, string>): Context {
  return {
    root: ROOT_TOKEN,
    pluginRoot: siblingRootToken,
    // `/skill:<name>` — verified against omp 17.2.9, which is strict about
    // both halves of this:
    //
    // - The prefix is mandatory. Skills register under `skill:${name}` and the
    //   trigger is `/(^|\s)\/skill:([^\s/]+)(\s|$)/`; the parser returns early
    //   on any other `/`-prefixed input, so a bare `/plan` is not a failed
    //   skill lookup, it is not a skill reference at all.
    // - The suffix is bare. `vwf:plan` would leave `skill:vwf:plan`, and the
    //   trigger's `[^\s/]+` aside, Oh-My-Pi discovers skills from every
    //   provider into ONE flat namespace keyed by bare name. Cross-plugin
    //   names are already unique (the checker enforces it).
    //   Prefixed when the owning plugin asks for it, so the suffix is the
    //   flat name rather than the authored one — `/skill:vwf-plan`.
    cmd: ref =>
      `/skill:${flatNames.get(ref) ?? ref.slice(ref.indexOf(":") + 1)}`,
    skillName: ref => flatNames.get(ref) ?? ref.slice(ref.indexOf(":") + 1),
    target: { id: "ohmypi", caps: CAPABILITIES.ohmypi },
  };
}

function renderPlugin(
  plugin: PluginSource,
  flatNames: ReadonlyMap<string, string>,
): Emission {
  const base = plugin.manifest.name;
  const context = contextFor(flatNames);
  const outputs: Output[] = [];

  for (const skill of plugin.skills) {
    const flat = flatSkillName(plugin.manifest, skill.meta.name);
    // The directory carries the flat name as well: a `references/` link in the
    // body resolves against it, so leaving it authored-named would split one
    // skill across two identifiers.
    const from = `skills/${skill.meta.name}`;
    const to = `skills/${flat}`;
    outputs.push({
      path: `${base}/${skill.path.replace(from, to)}`,
      contents: fm.emit(
        toOhMyPiSkill(
          renderDocument(
            readFileSync(`${plugin.root}/${skill.path}`, "utf8"),
            context,
          ),
          flat,
        ),
      ),
    });
    outputs.push(
      ...bundledFiles(skill.extras.map(relocate(from, to)), base, context),
    );
  }

  for (const agent of plugin.agents) {
    outputs.push({
      path: `${base}/${agent.path}`,
      contents: fm.emit(
        toOhMyPiAgent(renderDocument(
          readFileSync(`${plugin.root}/${agent.path}`, "utf8"),
          context,
        )),
      ),
    });
  }

  outputs.push(...bundledFiles(plugin.files, base, context));

  if (Object.keys(plugin.manifest.mcpServers).length > 0) {
    outputs.push({
      path: `${base}/.mcp.json`,
      contents: mcpJson(plugin.manifest),
    });
  }

  if (Object.keys(plugin.manifest.lspServers).length > 0) {
    outputs.push({
      path: `${base}/.lsp.json`,
      contents: lspJson(plugin.manifest),
    });
  }

  const hooks = plugin.hooks.filter(h => !h.skipTargets.includes("ohmypi"));
  const wired = hooks.filter(h => EVENTS[h.event] !== undefined);
  for (const hook of wired) {
    outputs.push({
      path: `${base}/hooks/${hook.id}.ts`,
      contents: hookExtension(plugin, hook),
    });
  }
  if (wired.length > 0) {
    // The bundle's package.json exists only to point at the extensions; there
    // is nothing else in the neutral manifest Oh-My-Pi reads from it.
    outputs.push({
      path: `${base}/package.json`,
      contents: packageJson(plugin.manifest, wired),
    });
  }

  return { outputs, gaps: gapsFor(plugin, hooks) };
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

/**
 * Neutral skill frontmatter → Oh-My-Pi's spelling.
 *
 * Key *position* is preserved the way `claude.ts` preserves it — a rename in
 * place keeps the emitted order close to the authored file, so a reviewer
 * diffing two targets sees the vocabulary change and nothing else.
 *
 * The three-valued `invocation` collapses onto Oh-My-Pi's **single** axis.
 * `hide` and `disableModelInvocation` are not two booleans here — they are
 * aliases the loader ORs into one internal flag (verified against omp 17.2.9:
 * `hide: fm?.hide === true || fm?.disableModelInvocation === true`, the same
 * expression at all four skill-load sites). That flag is read in exactly one
 * place, the system-prompt builder — `skills: enabled.filter(s => s.hide !==
 * true)` — so it means "hidden from the model" and nothing else.
 *
 * Two consequences, both load-bearing:
 *
 * - `model` must emit **neither** key. Emitting `hide` would drop every
 *   auto-applying doctrine skill out of the prompt, which is silent: the skill
 *   still loads, still lists, and simply never fires.
 * - There is no "off the slash menu" to express. The loader returns its list
 *   unfiltered and `/skill:<name>` resolves by name alone, so a hidden skill
 *   stays user-invocable — which is what makes `user` work, and why `model`
 *   loses nothing by going bare.
 */
function toOhMyPiSkill(doc: fm.Document, flatName: string): fm.Document {
  let out = doc;

  // Oh-My-Pi keys a skill by `name:` and resolves `/skill:<name>` by it, so
  // this is the line that makes the prefix real. A no-op unless the plugin
  // opted in.
  if (fm.scalar(doc, "name") !== flatName) {
    out = fm.set(out, "name", ` ${flatName}`);
  }

  if (fm.get(doc, "paths") !== undefined) {
    out = fm.rename(out, "paths", "globs");
    // Explicit rather than implied: `globs` without `alwaysApply` would leave
    // "load everywhere" one default-change away from being the behaviour.
    out = fm.set(out, "alwaysApply", " false");
  }

  switch (readInvocation(doc)) {
    case "model":
      // Bare, deliberately: see above. Model visibility is the default, and
      // Oh-My-Pi has no key that withholds a skill from the menu alone.
      out = fm.omit(out, "invocation");
      break;
    case "user":
      out = fm.rename(out, "invocation", "disableModelInvocation");
      out = fm.set(out, "disableModelInvocation", " true");
      break;
    case "both":
      out = fm.omit(out, "invocation");
      break;
  }

  // Everything Oh-My-Pi's skill frontmatter has no field for. Left in place
  // these are inert at best, and a strict parser rejects the whole document —
  // the loss each one represents is reported as a gap instead.
  return fm.omit(
    out,
    "version",
    "category",
    "license",
    "argumentHint",
    "model",
    "effort",
    "tools",
  );
}

/**
 * `invocation` off the *rendered* document.
 *
 * `skillFromFrontmatter` would do this, but it also re-validates `name` and
 * `description`, and the rendered body is not what those were authored as. The
 * one key that matters here is unambiguous on its own.
 */
function readInvocation(doc: fm.Document): "model" | "user" | "both" {
  const raw = fm.scalar(doc, "invocation");
  return raw === "model" || raw === "user" ? raw : "both";
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

/**
 * Neutral agent frontmatter → Oh-My-Pi's contract.
 *
 * `tools` is the one value that cannot pass through verbatim: the authored form
 * is a comma-separated scalar and Oh-My-Pi wants a sequence, so it is
 * re-encoded from the semantic view. JSON quoting is used deliberately — it is
 * valid YAML flow syntax and it survives the `mcp__plugin_*` tool names
 * unescaped.
 */
function toOhMyPiAgent(doc: fm.Document): fm.Document {
  const meta = agentFromFrontmatter(doc);
  let out = doc;

  if (meta.tools !== undefined) {
    out = fm.set(out, "tools", ` ${JSON.stringify(meta.tools)}`);
  }
  if (meta.model !== undefined) {
    // Oh-My-Pi takes a preference list, not a single id.
    out = fm.set(out, "model", ` ${JSON.stringify([meta.model])}`);
  }
  out = fm.rename(out, "effort", "thinkingLevel");

  // Oh-My-Pi grants delegation through `spawns`, and its default is not
  // "nothing" — every agent here is a leaf the skills invoke directly and none
  // delegates onward, so the empty list is the accurate declaration.
  return fm.set(out, "spawns", " []");
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Neutral event → Oh-My-Pi's extension event. Unmapped events cannot ship. */
const EVENTS: Partial<Record<Hook["event"], string>> = {
  preToolUse: "tool_call",
  stop: "session_stop",
  preCompact: "session_before_compact",
};

/**
 * Events about the session rather than a tool call.
 *
 * They need a different payload (there is no tool to name) and a different
 * verdict: `session_stop` answers with `{continue, additionalContext}`, which
 * hands the model an instruction and lets it carry on — where a tool hook
 * answers `{block, reason}` and stops the call. Same script, same stdout
 * contract; only the translation differs.
 */
const SESSION_EVENTS = new Set<string>(["stop", "preCompact"]);

/**
 * One hook → one Oh-My-Pi extension module.
 *
 * The authored scripts speak Claude's payload shape (they read
 * `.tool_input.command` and answer with `hookSpecificOutput`), so the wrapper
 * — not the script — is what learns Oh-My-Pi. That is the split `hooks.yaml`
 * asks for: the script stays one implementation, the renderer pays per target.
 *
 * A `rewrite` degrades here, because `{block, reason}` carries no input. The
 * script still decides, and its decision becomes a block plus the authored
 * correction: the wrong command never runs, the model reissues it, and the
 * guarantee costs a turn instead of being lost.
 */
function hookExtension(plugin: PluginSource, hook: Hook): string {
  const event = EVENTS[hook.event];
  const observe = hook.action === "observe";
  const timeout = hook.timeout === undefined
    ? ""
    : `, timeout: ${hook.timeout * 1000}`;

  const runner = hook.script === undefined
    ? {
      importee: "execSync",
      target: `const COMMAND = ${q(hook.command ?? "")};`,
      call: `execSync(COMMAND, { input: payload, encoding: "utf8"${timeout} })`,
    }
    : {
      importee: "execFileSync",
      target: `const SCRIPT = ${q(`${ROOT_TOKEN}/hooks/${hook.script}`)};`,
      call:
        `execFileSync(SCRIPT, [], { input: payload, encoding: "utf8"${timeout} })`,
    };

  const session = SESSION_EVENTS.has(hook.event);

  const guard = hook.matcher === undefined || session
    ? ""
    : `    if (tool !== ${q(hook.matcher)}) {\n      return;\n    }\n`;

  // An `observe` hook has no verdict to read, so it neither captures stdout nor
  // returns — a stray `return {}` there would look like a decision.
  const verdict = observe ? [] : session
    ? [
      ``,
      `    // Anything on stdout means the script wants a checkpoint. The model`,
      `    // is handed the instruction and continues, rather than being stopped.`,
      `    if (out.trim() === "" || out.trim() === "{}") {`,
      `      return;`,
      `    }`,
      `    return { continue: true, additionalContext: REASON };`,
    ]
    : [
      ``,
      `    // A verdict at all means the script wants this call stopped. Oh-My-Pi`,
      `    // cannot apply the fix, so it hands the model the reason instead.`,
      `    if (out.trim() === "" || out.trim() === "{}") {`,
      `      return;`,
      `    }`,
      `    return { block: true, reason: REASON };`,
    ];

  const payload = session
    ? [
      `    // The script counts stops, so a session id is all it needs — and`,
      `    // \`stop_hook_active\` is what stops a save cycle re-triggering itself.`,
      `    const payload = JSON.stringify({`,
      `      session_id: event.session_id ?? event.sessionId ?? "",`,
      `      stop_hook_active: event.stop_hook_active === true,`,
      `    });`,
    ]
    : [
      `    // Both spellings are accepted so a payload rename upstream degrades`,
      `    // to a no-op rather than a crash on every tool call.`,
      `    const tool = event.tool ?? event.tool_name;`,
      ...(guard === "" ? [] : [guard.replace(/\n$/, "")]),
      `    const payload = JSON.stringify({`,
      `      tool_name: tool,`,
      `      tool_input: event.input ?? event.tool_input ?? {},`,
      `    });`,
    ];

  return [
    `// Generated by @ai-plugins/build from ${plugin.manifest.name}/hooks/hooks.yaml.`,
    `// Edit the hook there, not this file.`,
    ``,
    `import { ${runner.importee} } from "node:child_process";`,
    ``,
    runner.target,
    observe ? null : `const REASON = ${q(reasonFor(hook))};`,
    ``,
    `export default function (pi) {`,
    `  pi.on(${q(event ?? "tool_call")}, async event => {`,
    ...payload,
    ``,
    observe ? null : `    let out = "";`,
    `    try {`,
    `      ${observe ? "" : "out = "}${runner.call};`,
    `    }`,
    `    catch {`,
    `      // A hook that cannot run must not take the tool call down with it.`,
    `      return;`,
    `    }`,
    ...verdict,
    `  });`,
    `}`,
    ``,
  ]
    .filter(line => line !== null)
    .join("\n");
}

/** What the model is told when a blocked call needs reissuing. */
function reasonFor(hook: Hook): string {
  return hook.correction
    ?? `Blocked by the ${hook.id} hook.`;
}

function packageJson(manifest: Manifest, hooks: readonly Hook[]): string {
  return json({
    name: manifest.name,
    omp: { extensions: hooks.map(h => `./hooks/${h.id}.ts`) },
    private: true,
    ...(manifest.version ? { version: manifest.version } : {}),
  });
}

// ---------------------------------------------------------------------------
// Servers
// ---------------------------------------------------------------------------

function mcpJson(manifest: Manifest): string {
  return json({
    mcpServers: Object.fromEntries(
      Object.entries(manifest.mcpServers).map(([id, s]) => [
        id,
        s.transport === "http"
          ? {
            type: "http",
            url: s.url,
            ...(s.headers ? { headers: s.headers } : {}),
          }
          // `type` omitted: stdio is Oh-My-Pi's default and the shorter entry
          // is the one its own docs show.
          : {
            args: s.args,
            command: s.command,
            ...(s.env ? { env: s.env } : {}),
          },
      ]),
    ),
  });
}

function lspJson(manifest: Manifest): string {
  return json({
    servers: Object.fromEntries(
      Object.entries(manifest.lspServers).map(([id, s]) => [
        // `idAliases` exists because clients key LSP config by their own
        // built-in server ids; honour an Oh-My-Pi entry if one is ever authored.
        s.idAliases?.["ohmypi"] ?? id,
        lspServer(s),
      ]),
    ),
  });
}

function lspServer(server: LspServer): Record<string, unknown> {
  return {
    args: server.args,
    command: server.command,
    // The neutral `extensions` map is extension → language id; Oh-My-Pi routes
    // on the extension alone, and the keys already carry the leading dot.
    fileTypes: Object.keys(server.extensions).sort(),
    // `.git` is the only marker the neutral manifest can justify. A per-language
    // one (`pubspec.yaml`, `package.json`) is not recorded anywhere, and
    // guessing it would silently narrow where the server starts.
    rootMarkers: [".git"],
  };
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

/**
 * Only LOCAL plugins are listed.
 *
 * A url-sourced plugin used to be listed with its URL as the `source` string.
 * The file parsed, the entry was there, and `omp` **silently dropped it**:
 * `omp plugin discover` returned 13 of 14, and `omp plugin install <name>`
 * answered "not found in marketplace" — so the manifest promised something the
 * tool would never deliver, with nothing anywhere saying why. Omitting it is
 * the honest shape, and `resolvePlan`'s `localOnly` branch keeps the CLI from
 * asking for it in the first place.
 */
function marketplaceJson(workspace: Workspace, gaps: Gap[]): string {
  const local = workspace.plugins.filter(p =>
    p.manifest.source.kind === "local"
  );
  for (const plugin of workspace.plugins) {
    if (plugin.manifest.source.kind === "local") {
      continue;
    }
    gaps.push({
      plugin: plugin.manifest.name,
      capability: "marketplace",
      detail: "not listed: it installs from its own repo, and Oh-My-Pi's "
        + "marketplace accepts a local path only — a URL entry is parsed and "
        + "then silently ignored by `omp`.",
      severity: "dropped",
    });
  }
  const plugins = local.map(plugin => {
    const m = plugin.manifest;
    const entry: Record<string, unknown> = {
      category: m.category,
      description: m.description ?? m.name,
      name: m.name,
      // Relative to the MARKETPLACE ROOT — the directory holding
      // `.omp-plugin/`, i.e. `ohmypi/` itself. Spelling this from the repo
      // root instead resolves to `ohmypi/ohmypi/<name>`, and `omp
      // plugin install` fails with "Plugin source directory does not exist".
      source: `./${m.name}`,
    };
    if (m.homepage) {
      entry["homepage"] = m.homepage;
    }
    return sortKeys(entry);
  });

  return json({
    metadata: {
      ...(workspace.marketplace.description
        ? { description: workspace.marketplace.description }
        : {}),
    },
    name: workspace.marketplace.name,
    owner: workspace.marketplace.owner,
    plugins,
  });
}

// ---------------------------------------------------------------------------
// Gaps
// ---------------------------------------------------------------------------

function gapsFor(plugin: PluginSource, hooks: readonly Hook[]): Gap[] {
  const gaps: Gap[] = [];
  const name = plugin.manifest.name;
  const named = (pick: (s: SkillSource) => boolean) =>
    plugin.skills.filter(pick).map(s => s.meta.name);

  // One gap per capability per plugin, not per skill: a coverage report listing
  // the same sentence 20 times is one nobody reads to the end.
  const doctrine = named(s => s.meta.invocation === "model");
  if (doctrine.length > 0) {
    gaps.push({
      plugin: name,
      capability: "modelOnlyInvocation",
      detail:
        `Oh-My-Pi has one visibility axis (hide/disableModelInvocation are `
        + `aliases for "hidden from the model"), so a skill cannot be kept out `
        + `of the slash menu while staying model-visible. ${list(doctrine)} `
        + `render bare and are therefore also user-invocable.`,
      severity: "degraded",
    });
  }

  const scoped = named(s => s.meta.paths !== undefined);
  if (scoped.length > 0) {
    gaps.push({
      plugin: name,
      capability: "pathScopedSkills",
      detail:
        `globs are advisory in Oh-My-Pi — they rank retrieval, they do not `
        + `force selection. ${list(scoped)} may not load when the files they `
        + `govern are edited.`,
      severity: "degraded",
    });
  }

  const hinted = named(s => s.meta.argumentHint !== undefined);
  if (hinted.length > 0) {
    gaps.push({
      plugin: name,
      capability: "commandArguments",
      detail: `arguments still interpolate, but skill frontmatter has no `
        + `argumentHint field, so the usage hint on ${list(hinted)} is not `
        + `shown at the prompt.`,
      severity: "degraded",
    });
  }

  const pinned = named(s =>
    s.meta.model !== undefined || s.meta.effort !== undefined
  );
  if (pinned.length > 0) {
    gaps.push({
      plugin: name,
      capability: "skillModelPin",
      detail: `Oh-My-Pi pins a model per agent, not per skill: the pin on `
        + `${list(pinned)} is not honoured, and those skills run on whatever `
        + `model the session already holds.`,
      severity: "dropped",
    });
  }

  const restricted = named(s => s.meta.tools !== undefined);
  if (restricted.length > 0) {
    gaps.push({
      plugin: name,
      capability: "skillToolAllowlist",
      detail:
        `skill frontmatter carries no tool allowlist, so the restriction on `
        + `${list(restricted)} is not enforced and those skills see the `
        + `session's full tool set. Agents keep theirs.`,
      severity: "dropped",
    });
  }

  for (const hook of hooks) {
    if (EVENTS[hook.event] === undefined) {
      gaps.push({
        plugin: name,
        capability: "hooks",
        detail:
          `the ${hook.id} hook fires on ${hook.event}, which has no Oh-My-Pi `
          + `extension event; it does not ship.`,
        severity: "dropped",
      });
      continue;
    }
    if (hook.action === "rewrite") {
      gaps.push({
        plugin: name,
        capability: "hookRewrite",
        detail: `the ${hook.id} hook rewrites the tool input, which a `
          + `{block, reason} result cannot do. It blocks instead and returns `
          + `the correction, so the model reissues the command itself.`,
        severity: "degraded",
      });
    }
  }

  return gaps;
}

function list(names: readonly string[]): string {
  return names.map(n => `\`${n}\``).join(", ");
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

/** Key-sorted, matching `claude.ts`, so diffs across targets stay reviewable. */
function sortKeys(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function q(value: string): string {
  return JSON.stringify(value);
}
