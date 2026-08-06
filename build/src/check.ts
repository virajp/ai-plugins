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
 * per-target half matters most — four of the five targets have no byte-parity
 * gate, so this is their only automated defence.
 */
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
  // reads `dist/plugins.json`, so there is no second copy left to disagree.
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

  // Skills land in one flat namespace on OpenCode, Oh-My-Pi and Codex alike —
  // they are keyed by bare name with no plugin qualifier — so a collision
  // between two plugins silently drops one of them.
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
 * plain scalar shipped for months because Claude tolerated it, while Codex
 * dropped the whole skill with no error. Renderers re-emit frontmatter verbatim
 * as ordered (key, raw) pairs, so nothing normalises a bad scalar away.
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

    for (const kind of ["import-screens", "import-design-system"]) {
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
