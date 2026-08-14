import type {
  Capabilities,
  TargetId,
} from "@ai-plugins/schema";
import { frontmatter as fm } from "@ai-plugins/schema";
import { Eta } from "eta";
import { readFileSync } from "node:fs";
import type {
  FileSource,
  Workspace,
} from "./source.ts";

/**
 * A rendered file, ready to be written under `<repo>/<target>/`.
 * Renderers return data rather than writing, so they stay pure and testable and
 * a single writer owns the filesystem.
 */
export interface Output {
  /** Path relative to the target's render root, or to the repo root — see below. */
  readonly path: string;
  readonly contents: string | { readonly copyFrom: string; };
  readonly executable?: boolean;
  /**
   * Write relative to the **repo root** rather than `<repo>/<target>/`.
   *
   * Exactly one file needs this: Claude Code reads the marketplace manifest
   * from `.claude-plugin/marketplace.json` at the root of the repo it was
   * added from, and the sources inside it are root-relative
   * (`./claude/plugins/<name>`). Emitted under `claude/` those paths would
   * resolve nowhere, so the file belongs at the root and is generated there —
   * the alternative being a hand-maintained copy that can drift from the
   * manifests it is derived from.
   */
  readonly atRepoRoot?: boolean;
  /**
   * The plugin this file came from, stamped by `stampOwner`.
   *
   * Some targets flatten per-plugin files into one global directory —
   * OpenCode's `agent/`, `command/` and `plugin/` — where the path no longer
   * says who owns what. The installer needs that to install or remove a
   * *subset* of plugins, so the build records it in `.ownership.json` rather
   * than making the adapter infer it.
   *
   * Filenames are deliberately left alone. `command/` and `plugin/` happen to
   * carry a plugin prefix already, but agents cannot: OpenCode strips the
   * `name` field and keys an agent by its filename, so prefixing would rename
   * every agent and silently break the delegation that names them.
   */
  readonly owner?: string;
  /**
   * Deliberately belongs to no plugin — a target-level registry such as a
   * marketplace manifest, which describes the whole set.
   *
   * Distinct from `atRepoRoot`, which is about *where* a file lands: Claude's
   * manifest is both, Oh-My-Pi's is unowned but still inside `ohmypi/`. Marked
   * explicitly so `plugins:check` can insist every *other* file is
   * attributable, rather than pattern-matching filenames and silently
   * excusing a real gap.
   */
  readonly unowned?: boolean;
}

/**
 * A skill's name on a target that flattens every plugin into one namespace.
 *
 * OpenCode and Oh-My-Pi discover skills from every provider into a single
 * namespace keyed by bare name, so `plan` is addressable as `plan` with no hint
 * of which plugin owns it. Claude and Cursor scope by plugin (`/vwf:plan`) and
 * need none of this — which is why the prefix is applied by the renderer rather
 * than baked into the authored name.
 *
 * Opt-in per plugin (`prefixSkillNames`), so a plugin whose names are already
 * distinctive keeps them.
 *
 * **Every place that names a skill on a flat target must go through here.**
 * The identifier appears in the directory, in the frontmatter `name:`, and in
 * every cross-reference `it.cmd()` renders — and the failure when they disagree
 * is silent, because a skill that resolves nowhere reads exactly like one the
 * model chose not to use.
 */
export function flatSkillName(
  plugin: { readonly name: string; readonly prefixSkillNames: boolean; },
  skill: string,
): string {
  return plugin.prefixSkillNames ? `${plugin.name}-${skill}` : skill;
}

/**
 * Move a skill's bundled files to follow the skill's own directory.
 *
 * Both flat targets relocate a skill directory — OpenCode when a user-only
 * skill becomes a command, and both of them when `prefixSkillNames` renames it
 * — and a `references/` link in the body is relative to that directory, so the
 * extras have to travel with it.
 */
export function relocate(
  from: string,
  to: string,
): (f: FileSource) => FileSource {
  return f => ({ ...f, path: `${to}${f.path.slice(from.length)}` });
}

/**
 * Stamp every output added since `from` as belonging to `owner`.
 *
 * Targets differ in how they accumulate (returned arrays, mutated arrays,
 * nested emissions), so this works off a length marker rather than trying to
 * impose one shape on all five.
 */
export function stampOwner(
  outputs: Output[],
  from: number,
  owner: string,
): void {
  for (let i = from; i < outputs.length; i++) {
    const output = outputs[i];
    if (output !== undefined) {
      outputs[i] = { ...output, owner };
    }
  }
}

/** A capability a target could not carry, surfaced in the coverage report. */
export interface Gap {
  readonly plugin: string;
  readonly capability: string;
  readonly detail: string;
  /** `degraded` still works, in a weaker form. `dropped` does not ship. */
  readonly severity: "degraded" | "dropped";
}

export interface Emission {
  readonly outputs: readonly Output[];
  readonly gaps: readonly Gap[];
}

export interface Target {
  readonly id: TargetId;
  readonly capabilities: Capabilities;
  /** Root at the repo root — e.g. `claude` → `<repo>/claude/`. */
  render(workspace: Workspace): Emission;
}

/**
 * Placeholder for a plugin's installed root, for targets with no runtime
 * equivalent of `${CLAUDE_PLUGIN_ROOT}` — which is all of them except Claude.
 *
 * The absolute path is only known at install time, so the build emits this
 * token and the install-time adapter substitutes it, exactly as
 * `bin/opencode.mjs` does today. Every non-Claude target must use these two
 * helpers rather than inventing its own spelling, or the adapter has to learn
 * one substitution rule per target.
 */
export const ROOT_TOKEN = "%%AI_PLUGINS_ROOT%%";

/** Placeholder for a *sibling* plugin's installed root. */
export function siblingRootToken(plugin: string): string {
  return `%%AI_PLUGINS_ROOT:${plugin}%%`;
}

/**
 * The Eta context (`it`) every template body is rendered against.
 *
 * These helpers exist because the same prose has to name a different thing on
 * each target: the plugin's own directory, a sibling plugin's directory, and
 * the way a command is invoked. Everything else in a template is plain
 * markdown.
 */
export interface Context {
  /** The plugin's own installed root. */
  readonly root: string;
  /** A sibling plugin's installed root. */
  readonly pluginRoot: (name: string) => string;
  /** How `<plugin>:<skill>` is invoked on this target. */
  readonly cmd: (ref: string) => string;
  /**
   * The directory name a skill occupies, for a path built around `it.root`.
   *
   * `cmd` spells an *invocation*; this spells a *location*. They diverge on the
   * flat targets, where `prefixSkillNames` renames the directory as well as the
   * frontmatter — so a link like
   * `<%= it.root %>/skills/<%= it.skillName("vwf:blueprint-authoring") %>/references/x.md`
   * resolves on every target, where the hardcoded directory resolved only on
   * the ones that do not rename.
   *
   * Only needed when the link crosses *out* of the skill that owns the file —
   * an agent or an asset naming a skill's reference. Inside a skill, a plain
   * relative link (`references/x.md`) is correct everywhere and needs nothing.
   */
  readonly skillName: (ref: string) => string;
  readonly target: { readonly id: TargetId; readonly caps: Capabilities; };
}

// `autoEscape` off: these render Markdown and YAML, not HTML. Left on, every
// `&`, `<` and `>` in the prose would be entity-escaped — and this corpus is
// full of them (`<project>`, `A → B`, `a && b`).
//
// `autoTrim` off is just as load-bearing: Eta strips the newline adjacent to a
// tag by default, which silently reflows folded YAML scalars. A `description`
// whose continuation line began right after a `<%= it.cmd(…) %>` came back
// joined onto one line — same text, different bytes, parity gone.
const eta = new Eta({ autoEscape: false, autoTrim: false, useWith: false });

export function renderTemplate(source: string, context: Context): string {
  return eta.renderString(source, context);
}

/**
 * Render a template, then re-parse its frontmatter.
 *
 * Order matters: Eta runs over the whole document first, because 54 skill and
 * agent `description` fields name a sibling command and must be rewritten for
 * the target before anything reads them.
 */
export function renderDocument(source: string, context: Context): fm.Document {
  const rendered = renderTemplate(source, context);
  const doc = fm.parse(rendered);
  if (doc === null) {
    throw new Error("rendered document lost its frontmatter");
  }
  return doc;
}

/**
 * Bundled files (assets, stack templates, skill references, hook scripts).
 *
 * Markdown is *rendered*, not copied: the migration templatised every `.md` in
 * the tree, and `assets/` holds the bulk of vwf's doctrine — copying it
 * verbatim would ship `<%= it.root %>` to users. Everything else is copied
 * byte-for-byte, preserving the executable bit that hook scripts need.
 */
export function bundledFiles(
  files: readonly FileLike[],
  prefix: string,
  context: Context,
): Output[] {
  return files.map(f => ({
    path: `${prefix}/${f.path}`,
    contents: f.path.endsWith(".md")
      ? renderTemplate(readFileSync(f.absolute, "utf8"), context)
      : { copyFrom: f.absolute },
    executable: f.executable,
  }));
}

interface FileLike {
  readonly path: string;
  readonly absolute: string;
  readonly executable: boolean;
}
