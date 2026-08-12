/**
 * Static validation of the authored `templates/` tree and every rendered
 * target, plus the per-target coverage report.
 *
 * This replaces the 344-line `plugins:check` shell/Python task. It is
 * deliberately *smaller* than what it replaces: the neutral manifest merged
 * `plugin.json` with the marketplace entry, and the zod schemas now type what
 * used to be checked by regex. Whole families of the old assertions became
 * unrepresentable rather than merely unchecked —
 *
 * - `plugin.json` name vs marketplace entry, and the two dependency lists that
 *   had to be kept identical by hand: one manifest, so they cannot disagree.
 * - marketplace registration in both directions: the marketplace is *derived*
 *   from the manifests, so a plugin cannot be unregistered or orphaned.
 * - skill `name:`/`description:`/`model:` shape: `Skill` in `schema/` types all
 *   three, and `readSkill` rejects a name that disagrees with its directory.
 *
 * What survives here is what no type can state: cross-file agreement, things
 * that must exist on disk, and the properties of the *rendered* output. The
 * per-target half matters most — three of the four targets have no byte-parity
 * gate, so this is their only automated defence.
 */
import { frontmatter as fm } from "@ai-plugins/schema";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { TARGETS } from "./render.ts";
import { readWorkspace } from "./source.ts";
import type {
  PluginSource,
  Workspace,
} from "./source.ts";
import type {
  Emission,
  Target,
} from "./target.ts";

export interface Finding {
  /** What was being checked — a plugin name, or `<target>:<plugin>`. */
  readonly scope: string;
  readonly message: string;
}

export interface CheckResult {
  readonly findings: readonly Finding[];
  readonly coverage: readonly TargetCoverage[];
  readonly counts: {
    readonly plugins: number;
    readonly skills: number;
    readonly agents: number;
  };
}

export interface TargetCoverage {
  readonly target: string;
  readonly outputs: number;
  readonly degraded: number;
  readonly dropped: number;
  /** Capability → the plugins that lost it, for the report. */
  readonly byCapability: ReadonlyMap<string, readonly string[]>;
}

/** A bare kebab-case code span — how prose names the agents it dispatches. */
const TOKEN_RE = /`([a-z0-9]+(?:-[a-z0-9]+)+)`/g;
/** A relative markdown link to a doc, minus any anchor. */
const LINK_RE = /\]\((\.{1,2}\/[^)\s#]+\.(?:md|ya?ml))(?:#[^)\s]*)?\)/g;
/** Either root spelling a rendered file may carry, plus the path behind it. */
const ROOT_REF_RE =
  /(?:\$\{CLAUDE_PLUGIN_ROOT\}|%%AI_PLUGINS_ROOT(?::[a-z0-9-]+)?%%)\/([A-Za-z0-9_./-]+)/g;

export async function check(repoRoot: string): Promise<CheckResult> {
  const workspace = readWorkspace(join(repoRoot, "templates"));
  // `checkInstallerSync` lived here until the cutover. It compared
  // `bin/claude.mjs`'s hardcoded plugin sets against the manifests; the CLI now
  // reads `plugins.json`, so there is no second copy left to disagree.
  const findings: Finding[] = [...checkTemplates(workspace)];

  const coverage: TargetCoverage[] = [];
  for (const target of TARGETS) {
    const emission = target.render(workspace);
    findings.push(...checkTarget(target, emission));
    coverage.push(summarise(target, emission));
  }

  return {
    findings,
    coverage,
    counts: {
      plugins: workspace.plugins.length,
      skills: workspace.plugins.reduce((n, p) => n + p.skills.length, 0),
      agents: workspace.plugins.reduce((n, p) => n + p.agents.length, 0),
    },
  };
}

// ---------------------------------------------------------------------------
// The authored tree
// ---------------------------------------------------------------------------

function checkTemplates(workspace: Workspace): Finding[] {
  const findings: Finding[] = [];
  const declared = new Set(workspace.plugins.map(p => p.manifest.name));

  // What `--all` installs. The CLI validates these names too, but only at
  // install time and only for whoever ran `--all` — a typo here would ship,
  // and then fail as an unknown plugin on someone else's machine.
  for (const name of workspace.marketplace.defaultInstall) {
    if (!declared.has(name)) {
      findings.push({
        scope: "marketplace",
        message: `defaultInstall "${name}" is not a plugin in this marketplace`,
      });
    }
  }

  // Skills land in one flat namespace on OpenCode and Oh-My-Pi alike — they
  // are keyed by bare name with no plugin qualifier — so a collision between
  // two plugins silently drops one of them.
  const skillOwners = new Map<string, string[]>();

  for (const plugin of workspace.plugins) {
    const name = plugin.manifest.name;
    const at = (message: string) => findings.push({ scope: name, message });

    // The directory is what every target keys the bundle by; the manifest name
    // is what the prose and the dependency lists use.
    const dir = plugin.root.split("/").pop();
    if (dir !== name) {
      at(`plugin.yaml name "${name}" != directory "${dir}"`);
    }

    for (const dep of plugin.manifest.dependencies) {
      if (!declared.has(dep)) {
        at(`dependency "${dep}" is not a plugin in this marketplace`);
      }
    }

    for (const skill of plugin.skills) {
      const owners = skillOwners.get(skill.meta.name) ?? [];
      owners.push(name);
      skillOwners.set(skill.meta.name, owners);
    }

    findings.push(...checkHookScripts(plugin));
    findings.push(...checkAgentReferences(plugin));
    findings.push(...checkSkillSelfReferences(plugin));
    findings.push(...checkFrontmatterYaml(plugin));
    findings.push(...checkExampleLinks(plugin));
  }

  for (const [skill, owners] of [...skillOwners].sort()) {
    if (owners.length > 1) {
      findings.push({
        scope: "skills",
        message: `skill name "${skill}" is declared by ${
          owners.join(", ")
        } — skills `
          + `share one flat namespace, so one of them is silently dropped`,
      });
    }
  }

  findings.push(...checkDesignAdapters(workspace));
  findings.push(...checkStackAdapters(workspace));
  findings.push(...checkVwfIsTechnologyFree(workspace));
  return findings;
}

/** Hook scripts must exist and be executable, or the hook dies at run time. */
function checkHookScripts(plugin: PluginSource): Finding[] {
  const findings: Finding[] = [];
  const byPath = new Map(plugin.files.map(f => [f.path, f]));

  for (const hook of plugin.hooks) {
    if (hook.script === undefined) {
      continue;
    }
    // `script` is relative to the hooks directory that declares it.
    const file = byPath.get(`hooks/${hook.script}`);
    if (file === undefined) {
      findings.push({
        scope: plugin.manifest.name,
        message: `hook "${hook.id}" names a missing script: ${hook.script}`,
      });
    }
    else if (!file.executable) {
      findings.push({
        scope: plugin.manifest.name,
        message: `hook "${hook.id}" script is not executable: ${hook.script}`,
      });
    }
  }
  return findings;
}

/**
 * A prefixed plugin must not name its own skills in bare prose.
 *
 * With `prefixSkillNames`, a skill is `plan` on Claude and `vwf-plan` on the
 * flat targets, so the only spelling that is right everywhere is the one
 * `it.cmd()` renders. A literal `` `plan` `` is right on Claude and resolves to
 * nothing on OpenCode and Oh-My-Pi — and a skill reference that resolves to
 * nothing is **silent**: the model reads a name, finds no such skill, and
 * carries on. That is indistinguishable from a model that chose not to
 * delegate, which is why this needs a checker rather than review.
 *
 * Only *delegation-shaped* mentions are flagged. These names double as the
 * workflow's own vocabulary — "the `plan` stage", "once `execute` finishes" —
 * and rewriting those to an invocation would be wrong, so the rule matches the
 * verbs that mean "go and run it" rather than every backticked occurrence.
 */
function checkSkillSelfReferences(plugin: PluginSource): Finding[] {
  if (!plugin.manifest.prefixSkillNames) {
    return [];
  }

  const own = new Set(plugin.skills.map(s => s.meta.name));
  const delegation =
    /\b(?:via|through|delegates? to|routes? through|hands? off to)\s+`([a-z0-9-]+)`/g;
  const findings: Finding[] = [];

  for (const text of proseOf(plugin)) {
    for (const name of captures(text, delegation)) {
      if (own.has(name)) {
        findings.push({
          scope: plugin.manifest.name,
          message: `delegates to \`${name}\` by bare name — this plugin sets `
            + `\`prefixSkillNames\`, so that skill is \`${plugin.manifest.name}-`
            + `${name}\` on OpenCode and Oh-My-Pi and the bare form resolves to `
            + `nothing there. Use \`<%= it.cmd("${plugin.manifest.name}:`
            + `${name}") %>\`, which spells it per target.`,
        });
      }
    }
  }
  return findings;
}

/**
 * Agent cross-references, both directions.
 *
 * Agent names are role-suffixed (`-coder`, `-reviewer`, `-writer`), and the
 * suffix set is derived from the plugin's own `agents/` dir — so any
 * role-shaped token in its prose must name a real agent. The orphan direction
 * covers what the forward one cannot: a rename that takes the last holder of a
 * suffix with it leaves the new name referenced by nothing.
 */
function checkAgentReferences(plugin: PluginSource): Finding[] {
  if (plugin.agents.length === 0) {
    return [];
  }

  const declared = new Set(plugin.agents.map(a => a.meta.name));
  const roles = new Set([...declared].map(roleOf));
  const tokens = new Set<string>();

  for (const text of proseOf(plugin)) {
    for (const token of captures(text, TOKEN_RE)) {
      tokens.add(token);
    }
  }

  const findings: Finding[] = [];
  for (const token of [...tokens].sort()) {
    if (roles.has(roleOf(token)) && !declared.has(token)) {
      findings.push({
        scope: plugin.manifest.name,
        message: `reference \`${token}\` names no agent under agents/`,
      });
    }
  }
  for (const orphan of [...declared].sort()) {
    if (!tokens.has(orphan)) {
      findings.push({
        scope: plugin.manifest.name,
        message: `agent "${orphan}" is referenced by no skill or asset`,
      });
    }
  }
  return findings;
}

/**
 * Frontmatter must parse under a *strict* YAML parser.
 *
 * A lenient host accepting it proves nothing: a colon-space inside a folded
 * plain scalar shipped for months because Claude tolerated it, while a strict
 * host dropped the whole skill with no error. Renderers re-emit frontmatter
 * verbatim as ordered (key, raw) pairs, so nothing normalises a bad scalar
 * away.
 */
function checkFrontmatterYaml(plugin: PluginSource): Finding[] {
  const findings: Finding[] = [];
  const paths = [
    ...plugin.skills.map(s => s.path),
    ...plugin.agents.map(a => a.path),
  ];

  for (const path of paths) {
    const raw = frontmatterBlock(readText(join(plugin.root, path)));
    if (raw === null) {
      continue;
    }
    try {
      parseYaml(raw);
    }
    catch (error) {
      findings.push({
        scope: plugin.manifest.name,
        message: `${path}: frontmatter is not valid YAML — ${firstLine(error)}`,
      });
    }
  }
  return findings;
}

/** Relative links inside the worked example bundle must resolve. */
function checkExampleLinks(plugin: PluginSource): Finding[] {
  const findings: Finding[] = [];

  for (const file of plugin.files) {
    if (!file.path.includes("assets/examples/") || !file.path.endsWith(".md")) {
      continue;
    }
    const text = readText(file.absolute);
    for (const rel of captures(text, LINK_RE)) {
      const resolved = join(file.absolute, "..", rel);
      if (!existsSync(resolved)) {
        findings.push({
          scope: plugin.manifest.name,
          message: `${file.path}: unresolved link ${rel}`,
        });
      }
    }
  }
  return findings;
}

/**
 * The vwf design-adapter contract.
 *
 * vwf delegates to an adapter by *constructed* name, and the failure is silent:
 * a skill whose invocation is `user` is removed from the model's context and
 * cannot be invoked programmatically, so a wrong name or mode imports nothing
 * and reports no error. Static checking is the only place this is catchable.
 */
function checkDesignAdapters(workspace: Workspace): Finding[] {
  const findings: Finding[] = [];

  for (const plugin of workspace.plugins) {
    if (!plugin.manifest.tags.includes("vwf-design-adapter")) {
      continue;
    }
    const name = plugin.manifest.name;
    const byName = new Map(plugin.skills.map(s => [s.meta.name, s]));

    for (
      const kind of [
        "import-screens",
        "import-design-system",
        "import-conversations",
      ]
    ) {
      const expected = `${name}-${kind}`;
      const skill = byName.get(expected);
      if (skill === undefined) {
        findings.push({
          scope: name,
          message: `design adapter is missing its "${expected}" skill`,
        });
        continue;
      }
      if (skill.meta.invocation === "user") {
        findings.push({
          scope: name,
          message:
            `${expected} has invocation "user" — vwf delegates to it by name, `
            + `and a user-only skill cannot be invoked programmatically, so the `
            + `import would silently do nothing`,
        });
      }
    }
  }
  return findings;
}

/** The four axes a stack template may declare. */
const AXES = new Set(["project", "backing", "deploy", "repo"]);

/** Roles a `project`-axis template may declare, from the registry vocabulary. */
const ROLES = new Set([
  "service",
  "worker",
  "packages",
  "site",
  "fullstack",
  "frontend",
  "iac",
]);

/** Roles that put a UI in front of a user, and so need a `-ux-gate`. */
const UI_ROLES = new Set(["site", "fullstack", "frontend"]);

/**
 * The vwf stack-adapter contract.
 *
 * The mirror of `checkDesignAdapters`, and it exists for the same reason: vwf
 * delegates to these skills by *constructed* name, so a missing skill or one
 * flipped to `user` invocation fails **silently** — vwf sees no menu and
 * reports an empty result, which is indistinguishable from a plugin that
 * genuinely offers nothing.
 *
 * Triggered by shipping `stacks/`, not by a tag: a plugin with templates and no
 * way to serve them is exactly the broken state worth catching, and a tag would
 * let it opt out of being checked.
 */
function checkStackAdapters(workspace: Workspace): Finding[] {
  const findings: Finding[] = [];

  for (const plugin of workspace.plugins) {
    const templates = plugin.files.filter(f =>
      f.path.startsWith("stacks/") && f.path.endsWith(".md")
    );
    if (templates.length === 0) {
      continue;
    }

    const name = plugin.manifest.name;
    const byName = new Map(plugin.skills.map(s => [s.meta.name, s]));

    for (const kind of ["stack-menu", "stack-template"]) {
      const expected = `${name}-${kind}`;
      const skill = byName.get(expected);
      if (skill === undefined) {
        findings.push({
          scope: name,
          message: `ships stacks/ but has no "${expected}" skill — vwf `
            + `constructs that name, so the templates are unreachable`,
        });
        continue;
      }
      if (skill.meta.invocation === "user") {
        findings.push({
          scope: name,
          message:
            `${expected} has invocation "user" — vwf delegates to it by name, `
            + `and a user-only skill cannot be invoked programmatically, so the `
            + `menu would silently come back empty`,
        });
      }
    }

    const uiRoles = new Set<string>();
    for (const template of templates) {
      const front = frontmatterOf(template.absolute);
      const axis = front["axis"];
      if (axis === undefined) {
        findings.push({
          scope: `${name}:${template.path}`,
          message: "stack template declares no `axis:` — the template payload "
            + "contract requires one of project/backing/deploy/repo",
        });
      }
      else if (!AXES.has(axis)) {
        findings.push({
          scope: `${name}:${template.path}`,
          message: `stack template declares axis "${axis}", which is not one `
            + `of project/backing/deploy/repo`,
        });
      }

      if (axis === "project") {
        const role = front["role"];
        if (role === undefined) {
          findings.push({
            scope: `${name}:${template.path}`,
            message: "project-axis template declares no `role:` — the axis "
              + "says which menu it joins, the role says which projects it "
              + "serves, and both are required",
          });
        }
        else if (!ROLES.has(role)) {
          findings.push({
            scope: `${name}:${template.path}`,
            message: `project-axis template declares role "${role}", which is `
              + `not in the registry role vocabulary`,
          });
        }
        else if (UI_ROLES.has(role)) {
          uiRoles.add(role);
        }
      }
    }

    // A plugin owning a UI stack must ship the gate vwf's `execute-ux-reviewer`
    // delegates to. Without it the reviewer reports `rendered: n/a` on every
    // slice — the UX gate degrades to a code-only read and says nothing about
    // why. The inverse also holds: a plugin with no UI stack must not ship one,
    // or the roster stops saying which plugins own a UI.
    const gate = `${name}-ux-gate`;
    const hasGate = plugin.skills.some(s => s.meta.name === gate);
    if (uiRoles.size > 0 && !hasGate) {
      findings.push({
        scope: name,
        message: `owns a UI stack (role ${[...uiRoles].sort().join(", ")}) but `
          + `ships no "${gate}" skill — vwf would report rendered: n/a on `
          + `every UI slice`,
      });
    }
    if (uiRoles.size === 0 && hasGate) {
      findings.push({
        scope: name,
        message: `ships "${gate}" but owns no UI stack — vwf never calls it`,
      });
    }
  }

  return findings;
}

/**
 * Tokens that name a concrete technology. vwf may not use any of them.
 *
 * Anchored on both sides on purpose. The unanchored form this list started as
 * matched `hono` inside "honor" and "honored" across a dozen files, which is
 * the kind of false positive that gets a guard deleted rather than fixed.
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
  //   sentence that calls an interface lovable — a guard that fails later, for
  //   a reason unrelated to what it guards.
  //
  // `claude-design` is distinctive, and it is also the token that actually
  // caused the bug this entry exists for: vwf reached that one tool's MCP
  // server by hardcoded prefix, leaving the other two advertised and silently
  // non-functional. The prefix itself is guarded separately below, which is the
  // part that generalises to all three.
  "claude-design",
];

/**
 * The two places vwf is allowed to name a tool, both reviewed and both
 * recognition rather than prescription — vwf naming a tool to read a repo it
 * did not choose, never to tell anyone what to use.
 *
 * Deliberately a path allowlist, not a weakened pattern. Adding a third entry
 * should require arguing for it, which is the point.
 */
const TOOL_NAME_EXCEPTIONS = new Set([
  // States the rule, which cannot be stated without an example of what it bans.
  "assets/stack-adapter.md",
  // Documents a repo it did not choose, so it has to recognise what is there.
  "skills/readme/SKILL.md",
]);

/** How far either side of a match still counts as the same enumeration. */
const ENUMERATION_WINDOW = 100;

/**
 * Tokens that prove an enumeration without being banned themselves.
 *
 * `lovable` and `stitch` are the other two values of the `design` config key,
 * so their presence beside `claude-design` is exactly what makes a passage a
 * vocabulary rather than a recommendation — but neither can go in TOOL_TOKENS,
 * because both are ordinary English words (see the note there). Keeping the
 * evidence set wider than the prohibition set is what lets a token be
 * recognised as enumerated by a peer that is not itself policed.
 */
const ENUMERATION_PEERS = ["lovable", "stitch"];

/**
 * Drop fenced code blocks. A fence is a worked example of a config file, and a
 * config example has to show real accepted values — `design: lovable` prescribes
 * nothing, it demonstrates the key's shape.
 */
function stripFences(body: string): string {
  return body.replace(/^```[\s\S]*?^```/gm, "");
}

const anchored = (token: string) =>
  new RegExp(`(^|[^a-z0-9-])${token}([^a-z0-9-]|$)`, "g");

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
 * The regression guard: vwf ships no stack template and names no tool.
 *
 * `stack-adapter.md` has stated this since it was written and nothing enforced
 * it, which is how 17 templates accumulated inside vwf. Without this check the
 * whole re-architecture is one refactor away from unwinding.
 */
function checkVwfIsTechnologyFree(workspace: Workspace): Finding[] {
  const findings: Finding[] = [];
  const vwf = workspace.plugins.find(p => p.manifest.name === "vwf");
  if (vwf === undefined) {
    return findings;
  }

  // Decision 6: the language vocabulary is open, and the rows come from the
  // plugins. vwf declaring one would put a language back inside the workflow.
  if (vwf.manifest.languages.length > 0) {
    findings.push({
      scope: "vwf",
      message: `declares languages ${vwf.manifest.languages.join(", ")} — vwf `
        + `keeps the shape of a language fact; a language plugin supplies the `
        + `rows`,
    });
  }

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

  const documents = [
    ...vwf.files.filter(f => f.path.endsWith(".md")),
    ...vwf.skills.map(s => ({
      path: s.path,
      absolute: join(vwf.root, s.path),
    })),
    ...vwf.agents.map(a => ({
      path: a.path,
      absolute: join(vwf.root, a.path),
    })),
    ...vwf.skills.flatMap(s => s.extras.filter(e => e.path.endsWith(".md"))),
  ];

  for (const document of documents) {
    if (TOOL_NAME_EXCEPTIONS.has(document.path)) {
      continue;
    }
    // The conformance bundle is a worked EXAMPLE of a product's blueprint, not
    // vwf's own prose. A blueprint names its product's technology by design.
    if (document.path.startsWith("assets/examples/")) {
      continue;
    }
    const body = stripFences(
      readFileSync(document.absolute, "utf8").toLowerCase(),
    );

    // vwf talks to NO design tool: it calls three fixed adapter skill names and
    // the adapter resolves which tool answers. Reaching into the adapter
    // plugin's own MCP server skips that entirely, and does it for exactly one
    // tool — which is how `feedback canvas` came to work for `claude-design`
    // and silently do nothing for the other two tokens the menu advertises.
    //
    // This catches the whole class where the token list cannot: it names no
    // tool, so a fourth design tool is covered the day it is added.
    if (body.includes("mcp__plugin_design-tools_")) {
      findings.push({
        scope: `vwf:${document.path}`,
        message: `references a design-tools MCP server directly — vwf talks to `
          + `no design tool, it calls the three fixed adapter skill names and `
          + `lets the adapter resolve which tool answers `
          + `(assets/design-adapter.md). Reaching one tool's server makes every `
          + `other configured tool silently return nothing.`,
      });
    }

    const hits = TOOL_TOKENS.filter(token => prescribes(body, token));
    if (hits.length > 0) {
      findings.push({
        scope: `vwf:${document.path}`,
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

/** The `axis` and `role` a stack template declares, if it declares them. */
function frontmatterOf(absolute: string): Record<string, string | undefined> {
  const doc = fm.parse(readFileSync(absolute, "utf8"));
  if (doc === null) {
    return {};
  }
  return { axis: fm.scalar(doc, "axis"), role: fm.scalar(doc, "role") };
}

// ---------------------------------------------------------------------------
// The rendered targets
// ---------------------------------------------------------------------------

function checkTarget(target: Target, emission: Emission): Finding[] {
  const findings: Finding[] = [];
  const scope = target.id;
  const paths = emission.outputs.map(o => o.path);

  for (const out of emission.outputs) {
    // Every emitted file must be attributable to a plugin, or the installer
    // cannot install or remove a subset. The repo-root marketplace manifest is
    // the one file that legitimately belongs to no single plugin.
    if (out.owner === undefined && out.unowned !== true) {
      findings.push({
        scope,
        message: `${out.path}: no owning plugin — it would be unremovable`,
      });
    }

    if (typeof out.contents !== "string") {
      continue;
    }

    // An unrendered tag means a template reached a user verbatim.
    if (out.contents.includes("<%")) {
      findings.push({
        scope,
        message: `${out.path}: unrendered template tag survived`,
      });
    }

    if (out.path.endsWith(".md")) {
      findings.push(...checkRenderedFrontmatter(scope, out.path, out.contents));
    }

    // Every root-relative reference must name something this target actually
    // emitted. Layout differs per target, so match on the tail rather than
    // reconstructing each target's bundle root.
    for (const rel of captures(out.contents, ROOT_REF_RE)) {
      if (!resolves(rel, paths)) {
        findings.push({
          scope,
          message: `${out.path}: reference to ${rel} resolves to nothing`,
        });
      }
    }
  }
  return findings;
}

function checkRenderedFrontmatter(
  scope: string,
  path: string,
  contents: string,
): Finding[] {
  const raw = frontmatterBlock(contents);
  if (raw === null) {
    return [];
  }
  try {
    parseYaml(raw);
    return [];
  }
  catch (error) {
    return [{
      scope,
      message: `${path}: rendered frontmatter is not valid YAML — ${
        firstLine(error)
      }`,
    }];
  }
}

function summarise(target: Target, emission: Emission): TargetCoverage {
  const byCapability = new Map<string, string[]>();
  for (const gap of emission.gaps) {
    const plugins = byCapability.get(gap.capability) ?? [];
    if (!plugins.includes(gap.plugin)) {
      plugins.push(gap.plugin);
    }
    byCapability.set(gap.capability, plugins);
  }

  return {
    target: target.id,
    outputs: emission.outputs.length,
    degraded: emission.gaps.filter(g => g.severity === "degraded").length,
    dropped: emission.gaps.filter(g => g.severity === "dropped").length,
    byCapability,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Every piece of authored prose in a plugin: skills, agents, bundled docs. */
function proseOf(plugin: PluginSource): string[] {
  const texts = [
    ...plugin.skills.map(s => s.doc.body),
    ...plugin.agents.map(a => a.doc.body),
  ];
  for (const file of plugin.files) {
    if (file.path.endsWith(".md")) {
      texts.push(readText(file.absolute));
    }
  }
  for (const skill of plugin.skills) {
    for (const extra of skill.extras) {
      if (extra.path.endsWith(".md")) {
        texts.push(readText(extra.absolute));
      }
    }
  }
  return texts;
}

const cache = new Map<string, string>();
function readText(absolute: string): string {
  const hit = cache.get(absolute);
  if (hit !== undefined) {
    return hit;
  }
  const text = readFileSync(absolute, "utf8");
  cache.set(absolute, text);
  return text;
}

/**
 * Does a root-relative reference name something the target emitted?
 *
 * Two shapes beyond a plain file path, both load-bearing:
 *
 * - **Directories.** Half the corpus points at a tree rather than a file
 *   (`assets/topologies/`, `stacks/project/`), because the reader is told to
 *   pick the entry matching its case. A file-only check rejects every one.
 * - **Sibling plugins.** `../vwf/assets/design-adapter.md` escapes the plugin
 *   root, so the tail is what has to resolve.
 *
 * Matching on the tail rather than the full path keeps this target-agnostic:
 * the same reference lives under `plugins/vwf/`, `vwf/` or
 * `virajp-plugins/vwf/` depending on who rendered it.
 */
export function resolves(ref: string, paths: readonly string[]): boolean {
  const tail = ref.replace(/\/+$/, "").replace(/^(?:\.\.\/)+/, "");
  if (tail === "") {
    return true;
  }
  return paths.some(path =>
    path === tail
    || path.endsWith(`/${tail}`)
    || path.startsWith(`${tail}/`)
    || path.includes(`/${tail}/`)
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

/** The frontmatter block of a document, or null when it has none. */
function frontmatterBlock(text: string): string | null {
  if (!text.startsWith("---")) {
    return null;
  }
  const end = text.indexOf("\n---", 3);
  return end === -1 ? null : text.slice(3, end);
}
