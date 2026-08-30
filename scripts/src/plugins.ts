/**
 * The in-memory model of the one authored plugin tree.
 *
 * `plugins/<name>/` is Claude Code's native plugin format, and since the
 * Claude-first cutover there is nothing else — the target-agnostic `templates/`
 * tree, the four render trees and the renderer between them are gone. So this
 * reader is deliberately thin: it globs, it stats, and it parses the two JSON
 * files anything actually reads as data (`.claude-plugin/plugin.json` and
 * `hooks/hooks.json`). The rest of a plugin is prose, which the checker greps.
 *
 * Both consumers go through here rather than the filesystem, so the marketplace
 * generator and the checker can never disagree about what a plugin is.
 */
import {
  globSync,
  readFileSync,
  statSync,
} from "node:fs";
import {
  basename,
  join,
} from "node:path";

/** A `dependencies[]` entry in a plugin manifest. */
export interface Dependency {
  readonly marketplace: string;
  readonly name: string;
}

/**
 * The subset of `.claude-plugin/plugin.json` this repo's tooling reads.
 *
 * Typed rather than schema-validated on purpose. The zod `Manifest` in the
 * retired `schema/` package existed because the neutral `plugin.yaml` was a
 * shape only this repo defined; `plugin.json` is Claude Code's own format with a
 * published `$schema`, so the editor and the client already validate it. What is
 * left for `check.ts` to assert is the handful of fields the *marketplace
 * projection* depends on — see `checkManifest`.
 */
export interface Manifest {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly description?: unknown;
  readonly author?: unknown;
  readonly repository?: unknown;
  /**
   * The marketplace entry spells this `tags`. Two names for one list, and the
   * plugin manifest's is the one authored — `flutter` and `typescript` also
   * folded their retired `languages:` rows in here, which had no other consumer.
   */
  readonly keywords?: unknown;
  readonly dependencies?: unknown;
  /**
   * Read only by the technology-free guard, which needs a manifest's
   * `command`/`args` as well as its prose: `"command": "pnpm"` sat in vwf's
   * context7 entry for months because the guard globbed `.md` files and a
   * manifest is not one.
   */
  readonly mcpServers?: unknown;
}

export interface PluginFile {
  /** Path relative to the plugin root, POSIX-separated. */
  readonly path: string;
  readonly absolute: string;
  readonly executable: boolean;
}

export interface Plugin {
  /**
   * The directory name under `plugins/`.
   *
   * Distinct from `manifest.name` on purpose: the directory is what the
   * marketplace `source` points at and what Claude keys the installed bundle
   * by, the manifest name is what dependency lists and prose use. They must
   * agree, which is a check rather than an assumption.
   */
  readonly dir: string;
  /** Absolute path to the plugin root. */
  readonly root: string;
  readonly manifest: Manifest;
  /** Every regular file under the plugin root, sorted by path. */
  readonly files: readonly PluginFile[];
  /** `skills/<name>/SKILL.md`, sorted. */
  readonly skills: readonly string[];
  /** `agents/<name>.md`, sorted. */
  readonly agents: readonly string[];
}

/** Read every plugin under a `plugins/` root, in directory order. */
export function readPlugins(pluginsRoot: string): Plugin[] {
  return globSync("*/.claude-plugin/plugin.json", { cwd: pluginsRoot })
    .map(path => path.split("/")[0] ?? "")
    .sort()
    .map(dir => readPlugin(pluginsRoot, dir));
}

export function readPlugin(pluginsRoot: string, dir: string): Plugin {
  const root = join(pluginsRoot, dir);
  const manifest = JSON.parse(
    readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"),
  ) as Manifest;

  // One glob for the whole plugin. Deliberately generic: `assets/` is the common
  // case, but stack templates live in a top-level `stacks/`, the vendored skills
  // bring a `vendor/`, and hook scripts need their mode bits — enumerating
  // directories here would silently drop whichever one is added next.
  const files = globSync("**/*", { cwd: root })
    .map(path => fileSource(root, path))
    .filter((f): f is PluginFile => f !== null)
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    dir,
    root,
    manifest,
    files,
    skills: globSync("skills/*/SKILL.md", { cwd: root }).sort(),
    agents: globSync("agents/*.md", { cwd: root }).sort(),
  };
}

function fileSource(root: string, path: string): PluginFile | null {
  const absolute = join(root, path);
  const stat = statSync(absolute);
  if (!stat.isFile()) {
    return null;
  }
  return {
    path,
    absolute,
    // Preserved because a hook script without it is dead at run time, and
    // `plugins:check` is the only thing that notices.
    executable: (stat.mode & 0o111) !== 0,
  };
}

/** The skill name a `skills/<name>/SKILL.md` path declares by its directory. */
export function skillName(path: string): string {
  return basename(join(path, ".."));
}

/** The agent name an `agents/<name>.md` path declares by its filename. */
export function agentName(path: string): string {
  return basename(path, ".md");
}

const cache = new Map<string, string>();

/** Read a text file once. The checker makes several passes over the corpus. */
export function readText(absolute: string): string {
  const hit = cache.get(absolute);
  if (hit !== undefined) {
    return hit;
  }
  const text = readFileSync(absolute, "utf8");
  cache.set(absolute, text);
  return text;
}

/**
 * The raw YAML frontmatter block of a document, or null when it has none.
 *
 * Returns the text between the fences untouched — the point of the strict-YAML
 * check is that nothing normalises a bad scalar away before the parser sees it.
 */
export function frontmatterBlock(text: string): string | null {
  if (!text.startsWith("---")) {
    return null;
  }
  const end = text.indexOf("\n---", 3);
  return end === -1 ? null : text.slice(3, end);
}

/** A document with its frontmatter removed — prose only. */
export function bodyOf(text: string): string {
  if (!text.startsWith("---")) {
    return text;
  }
  const end = text.indexOf("\n---", 3);
  return end === -1 ? text : text.slice(end + 4);
}
