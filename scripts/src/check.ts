#!/usr/bin/env node
/**
 * Static validation of the authored `plugins/` tree.
 *
 * The successor to the renderer's 1000-line checker, and much smaller — not
 * because less is checked, but because a whole half of what it checked stopped
 * existing. There is one tree now, authored in Claude Code's native format, so
 * the per-target passes (no surviving template tags, per-target frontmatter,
 * per-target reference resolution, the coverage report) have nothing to run
 * against, and the neutral-schema assertions they existed to protect —
 * `it.cmd()` targets, `prefixSkillNames` bare-name delegation, cross-plugin
 * skill-name uniqueness, invocation projection — describe mechanisms that are
 * gone. Deleting them was the point of the cutover, not a regression.
 *
 * What survives is what no format and no type can state: cross-file agreement,
 * things that must exist on disk, and the two contracts vwf enforces by
 * *constructing* a skill name — where the failure mode is silence rather than an
 * error, which is what makes a static check the only place they are catchable.
 *
 * Usage: node scripts/src/check.ts
 */
import { existsSync } from "node:fs";
import {
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { parse as parseYaml } from "yaml";
import {
  agentName,
  bodyOf,
  frontmatterBlock,
  readPlugins,
  readText,
  skillName,
} from "./plugins.ts";
import type {
  Dependency,
  Manifest,
  Plugin,
  PluginFile,
} from "./plugins.ts";

export interface Finding {
  /** What was being checked — a plugin name, or `<plugin>:<path>`. */
  readonly scope: string;
  readonly message: string;
}

/** The one marketplace every dependency in this repo resolves within. */
const MARKETPLACE = "virajp-plugins";

/** A bare kebab-case code span — how prose names the agents it dispatches. */
const TOKEN_RE = /`([a-z0-9]+(?:-[a-z0-9]+)+)`/g;
/** A relative markdown link to a doc, minus any anchor. */
const LINK_RE = /\]\((\.{1,2}\/[^)\s#]+\.(?:md|ya?ml))(?:#[^)\s]*)?\)/g;
/** A plugin-root-relative reference, and the path behind it. */
const ROOT_REF_RE = /\$\{CLAUDE_PLUGIN_ROOT\}\/([A-Za-z0-9_./-]+)/g;
/** Loose semver — the shape Claude parses a plugin `version` as. */
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+].+)?$/;

export function check(repoRoot: string): Finding[] {
  const pluginsRoot = join(repoRoot, "plugins");
  const plugins = readPlugins(pluginsRoot);
  const dirs = new Set(plugins.map(p => p.dir));

  const findings: Finding[] = [];
  for (const plugin of plugins) {
    findings.push(...checkManifest(plugin));
    findings.push(...checkDependencies(plugin, dirs));
    findings.push(...checkHookScripts(plugin));
    findings.push(...checkFrontmatterYaml(plugin));
    findings.push(...checkAgentReferences(plugin));
    findings.push(...checkExampleLinks(plugin));
    findings.push(...checkRootRefs(plugin, pluginsRoot));
  }

  findings.push(...checkDesignAdapters(plugins));
  findings.push(...checkStackAdapters(plugins));
  findings.push(...checkVwfIsTechnologyFree(plugins));
  return findings;
}

// ---------------------------------------------------------------------------
// The manifest
// ---------------------------------------------------------------------------

/**
 * The manifest fields the marketplace projection depends on.
 *
 * Deliberately not a schema. `plugin.json` is Claude Code's own format with a
 * published `$schema`, so the editor and the client validate its shape already;
 * reintroducing a zod package to restate that would put the drift back that the
 * cutover removed. What is asserted here is narrower and repo-specific: the four
 * values `scripts/src/marketplace.ts` reads, plus the name↔directory agreement
 * no schema can see.
 */
function checkManifest(plugin: Plugin): Finding[] {
  const findings: Finding[] = [];
  const m = plugin.manifest;
  const at = (message: string) => findings.push({ scope: plugin.dir, message });

  if (typeof m.name !== "string" || m.name === "") {
    at("plugin.json declares no `name`");
  }
  // The directory is what the marketplace `source` points at and what Claude
  // keys the installed bundle by; the name is what dependency lists and prose
  // use. A disagreement installs a plugin nothing can refer to.
  else if (m.name !== plugin.dir) {
    at(`plugin.json name "${m.name}" != directory "${plugin.dir}"`);
  }

  if (typeof m.version !== "string" || !SEMVER_RE.test(m.version)) {
    at(
      `plugin.json version ${JSON.stringify(m.version)} is not semver — it is `
        + `what an end-user install pins to`,
    );
  }

  if (typeof m.description !== "string" || m.description.trim() === "") {
    at(
      "plugin.json declares no `description` — the marketplace entry needs one",
    );
  }

  return findings;
}

/**
 * Every dependency resolves inside this marketplace.
 *
 * Both halves matter and both fail silently. A name that resolves to nothing
 * makes `claude plugin install` fail for the dependent, not for whoever typo'd
 * it; a wrong `marketplace` sends Claude looking in a marketplace the user has
 * very likely never registered, and the install of the *parent* is what breaks.
 */
function checkDependencies(
  plugin: Plugin,
  dirs: ReadonlySet<string>,
): Finding[] {
  const declared = plugin.manifest.dependencies;
  if (!Array.isArray(declared)) {
    return [];
  }

  const findings: Finding[] = [];
  for (const dep of declared as readonly Partial<Dependency>[]) {
    const name = JSON.stringify(dep.name);
    const marketplace = JSON.stringify(dep.marketplace);

    if (dep.marketplace !== MARKETPLACE) {
      findings.push({
        scope: plugin.dir,
        message: `dependency ${name} names marketplace ${marketplace} — every `
          + `dependency in this repo is authored here and resolves from `
          + `"${MARKETPLACE}"`,
      });
      continue;
    }
    if (typeof dep.name !== "string" || !dirs.has(dep.name)) {
      findings.push({
        scope: plugin.dir,
        message: `dependency ${name} is not a plugin in this marketplace`,
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// On disk
// ---------------------------------------------------------------------------

/** Hook scripts must exist and be executable, or the hook dies at run time. */
function checkHookScripts(plugin: Plugin): Finding[] {
  const hooks = plugin.files.find(f => f.path === "hooks/hooks.json");
  if (hooks === undefined) {
    return [];
  }

  const findings: Finding[] = [];
  const byPath = new Map(plugin.files.map(f => [f.path, f]));

  let doc: { hooks?: Record<string, unknown>; };
  try {
    doc = JSON.parse(readText(hooks.absolute));
  }
  catch (error) {
    return [{
      scope: plugin.dir,
      message: `hooks/hooks.json is not valid JSON — ${firstLine(error)}`,
    }];
  }

  for (const [event, command] of hookCommands(doc.hooks ?? {})) {
    // Matched rather than assumed: a hook may be an inline shell command with no
    // script at all (vwf's guarded `rtk` hook is one), and only the ones naming
    // a bundled file have anything to exist.
    for (const path of captures(command, ROOT_REF_RE)) {
      const file = byPath.get(path);
      if (file === undefined) {
        findings.push({
          scope: plugin.dir,
          message: `${event} hook names a missing script: ${path}`,
        });
      }
      else if (!file.executable) {
        findings.push({
          scope: plugin.dir,
          message: `${event} hook script is not executable: ${path}`,
        });
      }
    }
  }
  return findings;
}

/** Every `command` in a `hooks.json`, paired with the event declaring it. */
function* hookCommands(
  byEvent: Record<string, unknown>,
): Generator<[string, string]> {
  for (const [event, groups] of Object.entries(byEvent)) {
    for (const group of asArray(groups)) {
      const entries = (group as { hooks?: unknown; }).hooks;
      for (const hook of asArray(entries)) {
        const command = (hook as { command?: unknown; }).command;
        if (typeof command === "string") {
          yield [event, command];
        }
      }
    }
  }
}

/**
 * Frontmatter must parse under a *strict* YAML parser.
 *
 * A lenient host accepting it proves nothing: a colon-space inside a folded
 * plain scalar shipped for months because Claude tolerated it, while a strict
 * host dropped the whole skill with no error at all. Nothing normalises the
 * block on its way to disk any more — it *is* the authored bytes — so this is
 * the only reader that ever holds it to the spec.
 */
function checkFrontmatterYaml(plugin: Plugin): Finding[] {
  const findings: Finding[] = [];

  for (const path of [...plugin.skills, ...plugin.agents]) {
    const raw = frontmatterBlock(readText(join(plugin.root, path)));
    if (raw === null) {
      findings.push({
        scope: plugin.dir,
        message: `${path}: no YAML frontmatter — the host drops the whole `
          + `document, silently`,
      });
      continue;
    }
    try {
      parseYaml(raw);
    }
    catch (error) {
      findings.push({
        scope: plugin.dir,
        message: `${path}: frontmatter is not valid YAML — ${firstLine(error)}`,
      });
    }
  }
  return findings;
}

/** Relative links inside the worked example bundle must resolve. */
function checkExampleLinks(plugin: Plugin): Finding[] {
  const findings: Finding[] = [];

  for (const file of plugin.files) {
    if (!file.path.includes("assets/examples/") || !file.path.endsWith(".md")) {
      continue;
    }
    for (const rel of captures(readText(file.absolute), LINK_RE)) {
      if (!existsSync(join(file.absolute, "..", rel))) {
        findings.push({
          scope: plugin.dir,
          message: `${file.path}: unresolved link ${rel}`,
        });
      }
    }
  }
  return findings;
}

/**
 * Every `${CLAUDE_PLUGIN_ROOT}` reference names something that exists.
 *
 * Resolved for real, against the plugin that wrote it — which is what the
 * predecessor could not do. With four render trees to satisfy, the old check
 * matched a reference against the *tail* of every emitted path across every
 * plugin, so `${CLAUDE_PLUGIN_ROOT}/assets/x.md` in plugin A passed on the
 * strength of `plugins/B/assets/x.md`. One tree means one unambiguous
 * resolution, and a real path is the only thing Claude expands this to.
 *
 * Directories resolve: half the corpus points at a tree and tells the reader to
 * pick the entry matching their case. `../<plugin>/` also resolves — Claude
 * installs every plugin as a sibling, so a relative hop between them is stable —
 * but it may not climb past `plugins/`, since nothing above it is installed.
 */
function checkRootRefs(plugin: Plugin, pluginsRoot: string): Finding[] {
  const findings: Finding[] = [];

  for (const file of plugin.files) {
    for (const ref of captures(readText(file.absolute), ROOT_REF_RE)) {
      const target = resolveRootRef(plugin.root, ref);
      if (outside(pluginsRoot, target)) {
        findings.push({
          scope: `${plugin.dir}:${file.path}`,
          message: `reference to ${ref} climbs out of plugins/ — only sibling `
            + `plugins are installed alongside this one`,
        });
      }
      else if (!existsSync(target)) {
        findings.push({
          scope: `${plugin.dir}:${file.path}`,
          message: `reference to ${ref} resolves to nothing (${
            relative(pluginsRoot, target)
          })`,
        });
      }
    }
  }
  return findings;
}

/** `${CLAUDE_PLUGIN_ROOT}/<ref>` as an absolute path. Exported for the tests. */
export function resolveRootRef(pluginRoot: string, ref: string): string {
  return resolve(pluginRoot, ref.replace(/\/+$/, ""));
}

function outside(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel === "" || rel.startsWith("..") || isAbsolute(rel);
}

// ---------------------------------------------------------------------------
// Cross-references
// ---------------------------------------------------------------------------

/**
 * Agent cross-references, both directions.
 *
 * Agent names are role-suffixed (`-coder`, `-reviewer`, `-writer`), and the
 * suffix set is derived from the plugin's own `agents/` dir — so any role-shaped
 * token in its prose must name a real agent. The orphan direction covers what
 * the forward one cannot: a rename that takes the last holder of a suffix with
 * it leaves the new name referenced by nothing.
 */
function checkAgentReferences(plugin: Plugin): Finding[] {
  if (plugin.agents.length === 0) {
    return [];
  }

  const declared = new Set(plugin.agents.map(agentName));
  const roles = new Set([...declared].map(roleOf));
  const tokens = new Set(
    proseOf(plugin).flatMap(t => [...captures(t, TOKEN_RE)]),
  );

  const findings: Finding[] = [];
  for (const token of [...tokens].sort()) {
    if (roles.has(roleOf(token)) && !declared.has(token)) {
      findings.push({
        scope: plugin.dir,
        message: `reference \`${token}\` names no agent under agents/`,
      });
    }
  }
  for (const orphan of [...declared].sort()) {
    if (!tokens.has(orphan)) {
      findings.push({
        scope: plugin.dir,
        message: `agent "${orphan}" is referenced by no skill or asset`,
      });
    }
  }
  return findings;
}

/**
 * The design-adapter contract, on the materialized side.
 *
 * vwf calls three fixed skill names, which in turn delegate to three more fixed
 * names in the repo's own `.claude/` — the ones a `design-tool` pack lands. Every
 * way of getting that second hop wrong fails silently. A missing skill imports
 * nothing and reports no error; a skill carrying `disable-model-invocation: true`
 * is removed from the model's context altogether, so it cannot be invoked
 * programmatically and the import returns an empty payload that reads exactly
 * like a design nobody authored. Static checking is the only place either is
 * catchable.
 *
 * This used to key on a plugin keyworded `vwf-design-adapter`. Wave D deleted the
 * last such plugin, which would have left this rule permanently inert — a check
 * that can never fire is indistinguishable from one that always passes, and that
 * is the class of defect this file exists to prevent. So it now walks the packs
 * instead, where the three skills actually live.
 *
 * Asserting the literal absence of `true` would also pass for
 * `user-invocable: false`, which is model-invocable but hides the skill from the
 * user. So the check is for the explicit `false`, the one spelling meaning both.
 */
function checkDesignAdapters(plugins: readonly Plugin[]): Finding[] {
  const findings: Finding[] = [];

  const KINDS = [
    "design-import-screens",
    "design-import-design-system",
    "design-import-conversations",
  ] as const;

  for (const plugin of plugins) {
    // Every design-tool pack, discovered from the file list rather than the
    // filesystem — one entry per `stacks/design-tool/<tool>/pack.yaml`.
    const tools = plugin
      .files
      .map(file => /^stacks\/design-tool\/([^/]+)\/pack\.yaml$/.exec(file.path))
      .filter(match => match !== null)
      .map(match => match[1]!);

    for (const tool of tools) {
      for (const kind of KINDS) {
        const wanted = `stacks/design-tool/${tool}/skills/${kind}/SKILL.md`;
        const file = plugin.files.find(entry => entry.path === wanted);
        if (file === undefined) {
          findings.push({
            scope: `${plugin.dir}:stacks/design-tool/${tool}`,
            message:
              `design-tool pack is missing its "${kind}" skill — vwf delegates `
              + `to that exact name, and a missing one is silently unavailable `
              + `rather than a smaller feature`,
          });
          continue;
        }
        const front = frontmatterBlock(readText(file.absolute)) ?? "";
        if (!/^disable-model-invocation:\s*false\s*$/m.test(front)) {
          findings.push({
            scope: `${plugin.dir}:stacks/design-tool/${tool}`,
            message: `${kind} is not \`disable-model-invocation: false\` — vwf `
              + `delegates to it by name, and a skill the model cannot invoke `
              + `returns an empty payload rather than an error, which is `
              + `indistinguishable from a design nobody authored`,
          });
        }
      }
    }
  }
  return findings;
}

/**
 * The vwf stack-adapter contract.
 *
 * The same failure as the design adapter, on the other constructed name. vwf
 * reaches a stack plugin at `<plugin>-stack-menu` and `<plugin>-stack-template`
 * and never at anything it read from config, so a skill the model cannot invoke
 * does not error — `architecture` gets an empty menu, which is
 * indistinguishable from a plugin that genuinely offers nothing. The stack
 * menu is closed, so an empty one silently removes every option that plugin
 * was the only source of.
 *
 * Unlike the design adapter, both skills are also documented as user-runnable,
 * so the assertion is again the explicit `disable-model-invocation: false`
 * rather than the mere absence of `true` — `user-invocable: false` would be
 * model-invocable but hidden from the user, and would wrongly pass.
 */
function checkStackAdapters(plugins: readonly Plugin[]): Finding[] {
  const findings: Finding[] = [];

  for (const plugin of plugins) {
    const keywords = plugin.manifest.keywords;
    if (!Array.isArray(keywords) || !keywords.includes("vwf-stack-adapter")) {
      continue;
    }
    const skills = new Map(
      plugin.skills.map(path => [skillName(path), path] as const),
    );

    for (const kind of ["stack-menu", "stack-template"]) {
      const expected = `${plugin.dir}-${kind}`;
      const path = skills.get(expected);
      if (path === undefined) {
        findings.push({
          scope: plugin.dir,
          message: `stack adapter is missing its "${expected}" skill`,
        });
        continue;
      }
      const front = frontmatterBlock(readText(join(plugin.root, path))) ?? "";
      if (!/^disable-model-invocation:\s*false\s*$/m.test(front)) {
        findings.push({
          scope: plugin.dir,
          message:
            `${expected} is not \`disable-model-invocation: false\` — vwf `
            + `reaches it by constructed name, and a skill the model cannot `
            + `invoke returns an empty menu rather than an error, which is `
            + `indistinguishable from a plugin that offers nothing`,
        });
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// The technology-free vwf guard
// ---------------------------------------------------------------------------

/**
 * Tokens that name a concrete technology. vwf may not use any of them.
 *
 * Anchored on both sides on purpose. The unanchored form this list started as
 * matched `hono` inside "honor" and "honored" across a dozen files, which is the
 * kind of false positive that gets a guard deleted rather than fixed.
 */
const TOOL_TOKENS = [
  "firebase",
  "firestore",
  "cloud run",
  "cloud-run",
  "playwright",
  "axe-core",
  "pnpm",
  "npm",
  "bun",
  "turbo",
  "turborepo",
  "docker",
  "wait-on",
  "temporal",
  "terraform",
  "pulumi",
  "refine",
  "astro",
  "hono",
  "vitest",
  "doppler",
  "postgres",
  "grafana",
  "opentelemetry",
  // The design tools. Only ONE of the three tokens is listable, and the reason
  // is the same false-positive trap the anchoring above exists for:
  //
  //   `stitch` is an ordinary English word, and vwf's screens doctrine leans on
  //   it — "stitch its happy path", "the stitch contract", "an out-of-order
  //   stitch". Three vwf documents use it that way and name no design tool at
  //   all. Anchoring does not help, because this is the same word, not a
  //   substring of a different one.
  //
  //   `lovable` is likewise an ordinary adjective. It happens to be unused in
  //   vwf today, so listing it would pass right now and break on the first
  //   sentence that calls an interface lovable — a guard that fails later, for a
  //   reason unrelated to what it guards.
  //
  // `claude-design` is distinctive, and it is also the token that actually
  // caused the bug this entry exists for: vwf reached that one tool's MCP server
  // by hardcoded prefix, leaving the other two advertised and silently
  // non-functional. The prefix itself is guarded separately below, which is the
  // part that generalises to all three.
  "claude-design",
];

/**
 * The two places vwf is allowed to name a tool, both reviewed and both
 * recognition rather than prescription — vwf naming a tool to read a repo it did
 * not choose, never to tell anyone what to use.
 *
 * Deliberately a path allowlist, not a weakened pattern. Adding a third entry
 * should require arguing for it, which is the point.
 */
const TOOL_NAME_EXCEPTIONS = new Set([
  // States the rule, which cannot be stated without an example of what it bans.
  "assets/stack-adapter.md",
  // Documents a repo it did not choose, so it has to recognise what is there.
  "skills/readme/SKILL.md",
  // Maps product names to the prose nouns that replace them. The names are the
  // LOOKUP KEY: an author who wrote "npm" finds the row by searching for it, so
  // removing them would break the one job the table has. Pure recognition —
  // every occurrence sits in an "instead of" column whose row prescribes the
  // opposite.
  "assets/capability-vocabulary.md",
  // The three design-adapter references USED TO BE allowlisted here. They are
  // gone: Wave D moved them to stackgen's `design-tool` packs, which materialize
  // the resolved tool's adapter into the repo's own `.claude/` under three fixed
  // skill names vwf invokes. vwf now names no design tool anywhere, so the
  // exceptions that entry needed are retired rather than maintained.
  //
  // That is the intended direction whenever an allowlist entry stops feeling
  // arguable: move the naming out of vwf, never widen the pattern.
]);

/** How far either side of a match still counts as the same enumeration. */
const ENUMERATION_WINDOW = 100;

/**
 * Tokens that prove an enumeration without being banned themselves.
 *
 * `lovable` and `stitch` are the other two values of the `design` config key, so
 * their presence beside `claude-design` is exactly what makes a passage a
 * vocabulary rather than a recommendation — but neither can go in TOOL_TOKENS,
 * because both are ordinary English words (see the note there). Keeping the
 * evidence set wider than the prohibition set is what lets a token be recognised
 * as enumerated by a peer that is not itself policed.
 */
const ENUMERATION_PEERS = ["lovable", "stitch"];

/**
 * Drop fenced code blocks. A fence is a worked example of a config file, and a
 * config example has to show real accepted values — `design: lovable`
 * prescribes nothing, it demonstrates the key's shape.
 */
function stripFences(body: string): string {
  return body.replace(/^```[\s\S]*?^```/gm, "");
}

/**
 * The two sides are deliberately asymmetric.
 *
 * Leading keeps `-`, so a token is not matched as the *tail* of a longer
 * compound: `axe-core` must not be found inside some other hyphenated name, and
 * `npm` must not be found inside `pnpm-workspace`.
 *
 * Trailing drops it, because a banned token used as the *head* of a compound is
 * still the banned token doing the prescribing. `Grafana-side by default` and
 * `deploy/npm-package` both escaped the symmetric form — as would
 * `docker-compose`, `postgres-backed` and `terraform-managed`.
 */
const anchored = (token: string) =>
  new RegExp(`(^|[^a-z0-9-])${token}([^a-z0-9]|$)`, "g");

/**
 * Does this document *prescribe* the token, rather than enumerate it?
 *
 * The distinction that matters: naming ONE tool tells the reader what to use;
 * listing the alternatives describes the domain of a config key vwf owns. The
 * design-adapter contract has to say the value is one of `claude-design`,
 * `lovable` or `stitch` — that is the vocabulary, not a recommendation.
 *
 * So an occurrence is exempt when at least one OTHER token sits within
 * `ENUMERATION_WINDOW` characters of it. The window is character-based rather
 * than line-based on purpose: the real enumerations wrap mid-list, and a
 * line-based rule would flag the first line of every one of them.
 */
export function prescribes(body: string, token: string): boolean {
  const others = [...TOOL_TOKENS, ...ENUMERATION_PEERS].filter(t =>
    t !== token
  );
  for (const match of body.matchAll(anchored(token))) {
    const at = match.index ?? 0;
    const window = body.slice(
      Math.max(0, at - ENUMERATION_WINDOW),
      at + token.length + ENUMERATION_WINDOW,
    );
    const enumerated = others.some(other => anchored(other).test(window));
    if (!enumerated) {
      return true;
    }
  }
  return false;
}

/**
 * A `${VAR}` or `${VAR:-default}` expansion, which Claude Code performs in an
 * MCP server's `command`, `args`, `env`, `url` and `headers`.
 */
const EXPANSION_RE = /\$\{[^}]*\}/g;

/**
 * Every stdio invocation vwf's manifest declares, as one string per server.
 *
 * `type: http` servers have no `command` and contribute nothing — vwf's
 * mempalace entry is a URL to a daemon the user runs, so there is no runner in
 * it to hardcode.
 */
function invocations(manifest: Manifest): string[] {
  const servers = manifest.mcpServers;
  if (typeof servers !== "object" || servers === null) {
    return [];
  }
  return Object.values(servers as Record<string, unknown>).flatMap(server => {
    if (typeof server !== "object" || server === null) {
      return [];
    }
    const { command, args } = server as { command?: unknown; args?: unknown; };
    if (typeof command !== "string") {
      return [];
    }
    const argv = asArray(args).filter(a => typeof a === "string");
    return [[command, ...argv].join(" ")];
  });
}

/**
 * The manifest half of the technology-free guard: a runner vwf picked *for* the
 * user.
 *
 * The prose rule cannot be reused verbatim here, and the difference is the whole
 * point. A manifest has to name something executable — `sh` is a tool name too —
 * so the bar is not "names no tool" but **"the name is overridable"**. vwf's
 * context7 entry declared `"command": "pnpm"`, which a bun user cannot satisfy
 * and which fails as a dead MCP server rather than as a missing prerequisite;
 * the same entry written as `${CONTEXT7_RUNNER:-pnpm dlx}` keeps pnpm as the
 * recommendation while letting `bunx`, `npx -y` or an absolute path answer.
 *
 * So expansions are elided before the token scan. A token surviving that is one
 * no environment variable can displace, which is the actual defect.
 */
function checkManifestRunners(vwf: Plugin): Finding[] {
  const findings: Finding[] = [];
  for (const invocation of invocations(vwf.manifest)) {
    const fixed = invocation.toLowerCase().replaceAll(EXPANSION_RE, " ");
    const hits = TOOL_TOKENS.filter(token => anchored(token).test(fixed));
    if (hits.length > 0) {
      findings.push({
        scope: "vwf:.claude-plugin/plugin.json",
        message: `hardcodes ${hits.map(h => `"${h}"`).join(", ")} in the `
          + `"${invocation}" MCP server invocation — the dependency is vwf's, `
          + `the runner is the user's. Put it behind a \${VAR:-default} `
          + `expansion so the recommendation stays and another runner still `
          + `works; a fixed one fails as a dead server, not as a missing `
          + `prerequisite.`,
      });
    }
  }
  return findings;
}

/**
 * The regression guard: vwf ships no stack template and names no tool.
 *
 * `assets/stack-adapter.md` has stated this since it was written and nothing
 * enforced it, which is how 17 templates accumulated inside vwf. Without this
 * check the whole re-architecture is one refactor away from unwinding.
 *
 * The `languages` half of the old guard is gone with the key it read: the
 * neutral manifest's `languages:` had no consumer but this check and the two
 * plugins declaring it folded their rows into `keywords`, where they are
 * metadata rather than a vocabulary anything resolves against.
 */
function checkVwfIsTechnologyFree(plugins: readonly Plugin[]): Finding[] {
  const findings: Finding[] = [];
  const vwf = plugins.find(p => p.dir === "vwf");
  if (vwf === undefined) {
    return findings;
  }

  findings.push(...checkManifestRunners(vwf));

  for (const file of vwf.files) {
    if (file.path.startsWith("stacks/")) {
      findings.push({
        scope: "vwf",
        message: `ships a stack template at ${file.path} — vwf states the `
          + `requirement and a plugin states the mechanism, so every template `
          + `belongs to a stack plugin (assets/stack-adapter.md)`,
      });
    }
  }

  for (const file of vwf.files) {
    if (!file.path.endsWith(".md") || TOOL_NAME_EXCEPTIONS.has(file.path)) {
      continue;
    }
    // The conformance bundle is a worked EXAMPLE of a product's blueprint, not
    // vwf's own prose. A blueprint names its product's technology by design.
    if (file.path.startsWith("assets/examples/")) {
      continue;
    }
    const body = stripFences(readText(file.absolute).toLowerCase());

    // vwf talks to NO design tool: it calls three fixed adapter skill names and
    // the adapter resolves which tool answers. Reaching a design tool's own MCP
    // server skips that entirely, and does it for exactly one tool — which is
    // how `feedback canvas` came to work for `claude-design` and silently do
    // nothing for the other two tokens the menu advertises.
    //
    // Generalized at Wave D. It used to match `mcp__plugin_design-tools_`, the
    // prefix a plugin-declared server got. That plugin is gone and servers now
    // land in the project's own `.mcp.json`, which scopes them `mcp__<server>__`
    // — so matching the old prefix alone would have quietly stopped catching
    // anything. Both spellings are matched: a repo upgrading from an earlier
    // version can still carry the old one in its prose.
    const designMcp = TOOL_TOKENS
      .filter(token =>
        body.includes(`mcp__plugin_design-tools_${token}`)
        || new RegExp(`mcp__${token}__`).test(body)
      );
    if (designMcp.length > 0) {
      findings.push({
        scope: `vwf:${file.path}`,
        message: `reaches the ${designMcp.map(t => `"${t}"`).join(", ")} MCP `
          + `server directly — vwf talks to no design tool, it calls the three `
          + `fixed adapter skill names and lets the adapter resolve which tool `
          + `answers (assets/design-adapter.md). Reaching one tool's server `
          + `makes every other configured tool silently return nothing.`,
      });
    }

    // A token already reported above is not reported again by the generic rule.
    // Both would fire on the same line — an MCP tool name reads as prescription
    // — and the generic message's advice ("add the path to TOOL_NAME_EXCEPTIONS")
    // is exactly wrong here: an allowlist entry would bless the seam violation
    // rather than fix it. The specific finding is the one that helps.
    const hits = TOOL_TOKENS.filter(token =>
      !designMcp.includes(token) && prescribes(body, token)
    );
    if (hits.length > 0) {
      findings.push({
        scope: `vwf:${file.path}`,
        message: `names ${hits.map(h => `"${h}"`).join(", ")} — vwf states the `
          + `requirement, the plugin states the mechanism, so a tool name here `
          + `is a bug in that contract (assets/stack-adapter.md). If this is `
          + `genuinely recognition rather than prescription, add the path to `
          + `TOOL_NAME_EXCEPTIONS with a reason.`,
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Every piece of authored prose in a plugin.
 *
 * Frontmatter is stripped from skills and agents and kept for everything else:
 * a `description:` is a folded scalar full of the same backticked vocabulary the
 * body uses, and letting it into the token set makes an agent look referenced by
 * its own file.
 */
function proseOf(plugin: Plugin): string[] {
  const isDoc = (f: PluginFile) =>
    f.path.endsWith("/SKILL.md") || f.path.startsWith("agents/");

  const docs = plugin.files.filter(f => f.path.endsWith(".md"));
  return docs.map(f =>
    isDoc(f) ? bodyOf(readText(f.absolute)) : readText(f.absolute)
  );
}

/** First capture group of every match, skipping any that did not participate. */
function* captures(text: string, pattern: RegExp): Generator<string> {
  for (const match of text.matchAll(pattern)) {
    const value = match[1];
    if (value !== undefined) {
      yield value;
    }
  }
}

/** The role suffix an agent name ends with — `execute-coder` -> `coder`. */
function roleOf(name: string): string {
  return name.slice(name.lastIndexOf("-") + 1);
}

/** First line of an error message, for a one-line finding. */
function firstLine(error: unknown): string {
  return String((error as Error).message).split("\n")[0] ?? "";
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const repoRoot = join(import.meta.dirname, "..", "..");
  const plugins = readPlugins(join(repoRoot, "plugins"));
  const findings = check(repoRoot);

  for (const { scope, message } of findings) {
    console.error(`  FAIL ${scope}: ${message}`);
  }

  const skills = plugins.reduce((n, p) => n + p.skills.length, 0);
  const agents = plugins.reduce((n, p) => n + p.agents.length, 0);
  console.log(
    `\nchecked ${plugins.length} plugins, ${skills} skills, ${agents} agents`,
  );

  if (findings.length > 0) {
    console.error(`\n${findings.length} finding(s)`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}
