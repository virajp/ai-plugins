import {
  type Skill,
  Agent,
  agentFromFrontmatter,
  frontmatter,
  Hooks,
  Manifest,
  Marketplace,
  skillFromFrontmatter,
} from "@ai-plugins/schema";
import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import { globSync } from "node:fs";
import {
  basename,
  dirname,
  join,
  relative,
} from "node:path";
import { parse as parseYaml } from "yaml";

/**
 * The in-memory model of one authored plugin under `templates/`.
 *
 * Every renderer consumes this and nothing else — no renderer reads the
 * filesystem directly, so all of them see exactly the same source and a single
 * reader owns the parsing rules.
 */
export interface PluginSource {
  readonly manifest: Manifest;
  readonly skills: readonly SkillSource[];
  readonly agents: readonly AgentSource[];
  readonly hooks: Hooks["hooks"];
  /** Files copied through untouched: assets/, references/, hook scripts. */
  readonly files: readonly FileSource[];
  readonly root: string;
}

export interface SkillSource {
  readonly meta: Skill;
  readonly doc: frontmatter.Document;
  /** Path of the SKILL.md relative to the plugin root. */
  readonly path: string;
  /** Sibling files under the skill directory (references/, etc.). */
  readonly extras: readonly FileSource[];
}

export interface AgentSource {
  readonly meta: Agent;
  readonly doc: frontmatter.Document;
  readonly path: string;
}

export interface FileSource {
  /** Path relative to the plugin root. */
  readonly path: string;
  readonly absolute: string;
  readonly executable: boolean;
}

export interface Workspace {
  readonly marketplace: Marketplace;
  readonly plugins: readonly PluginSource[];
}

/** Read every plugin under a `templates/` root. */
export function readWorkspace(templatesRoot: string): Workspace {
  const marketplacePath = join(templatesRoot, "marketplace.yaml");
  const marketplace = Marketplace.parse(
    parseYaml(readFileSync(marketplacePath, "utf8")),
  );

  const names = globSync("*/plugin.yaml", { cwd: templatesRoot })
    .map(p => dirname(p))
    .sort();

  return {
    marketplace,
    plugins: names.map(name => readPlugin(join(templatesRoot, name))),
  };
}

/** Files the reader interprets rather than copies. */
const OWNED = new Set(["plugin.yaml", "hooks/hooks.yaml"]);

export function readPlugin(root: string): PluginSource {
  const manifest = Manifest.parse(
    parseYaml(readFileSync(join(root, "plugin.yaml"), "utf8")),
  );

  const skills = globSync("skills/*/SKILL.md", { cwd: root })
    .sort()
    .map(path => readSkill(root, path));

  const agents = globSync("agents/*.md", { cwd: root })
    .sort()
    .map(path => readAgent(root, path));

  const hooksPath = join(root, "hooks", "hooks.yaml");
  const hooks = existsSync(hooksPath)
    ? Hooks.parse(parseYaml(readFileSync(hooksPath, "utf8"))).hooks
    : [];

  // Every bundled file a skill or agent does not already own. Deliberately
  // generic: `assets/` is the common case, but `typescript` and `gcp` keep their
  // stack templates in a top-level `stacks/`, and hardcoding a directory list
  // would silently drop them. Hook scripts come through here too, so they keep
  // their mode bits.
  const files = globSync("**/*", { cwd: root })
    .filter(p =>
      !OWNED.has(p) && !p.startsWith("skills/") && !p.startsWith("agents/")
    )
    .map(path => fileSource(root, path))
    .filter((f): f is FileSource => f !== null)
    .sort((a, b) => a.path.localeCompare(b.path));

  return { manifest, skills, agents, hooks, files, root };
}

function readSkill(root: string, path: string): SkillSource {
  const doc = parseDocument(join(root, path));
  const meta = skillFromFrontmatter(doc);
  const dir = dirname(path);

  if (meta.name !== basename(dir)) {
    throw new Error(
      `${path}: frontmatter name "${meta.name}" != directory "${
        basename(dir)
      }"`,
    );
  }

  const extras = globSync(`${dir}/**/*`, { cwd: root })
    .filter(p => p !== path)
    .map(p => fileSource(root, p))
    .filter((f): f is FileSource => f !== null)
    .sort((a, b) => a.path.localeCompare(b.path));

  return { meta, doc, path, extras };
}

function readAgent(root: string, path: string): AgentSource {
  const doc = parseDocument(join(root, path));
  const meta = agentFromFrontmatter(doc);

  if (meta.name !== basename(path, ".md")) {
    throw new Error(`${path}: frontmatter name "${meta.name}" != filename`);
  }

  return { meta, doc, path };
}

function parseDocument(absolute: string): frontmatter.Document {
  const doc = frontmatter.parse(readFileSync(absolute, "utf8"));
  if (doc === null) {
    throw new Error(`${absolute}: no YAML frontmatter`);
  }
  return doc;
}

function fileSource(root: string, path: string): FileSource | null {
  const absolute = join(root, path);
  const stat = statSync(absolute);
  if (!stat.isFile()) {
    return null;
  }
  return {
    path: relative(root, absolute),
    absolute,
    // Preserve the executable bit — hook scripts are unusable without it, and
    // `plugins:check` asserts it.
    executable: (stat.mode & 0o111) !== 0,
  };
}
