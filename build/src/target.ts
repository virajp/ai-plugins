import type {
  Capabilities,
  TargetId,
} from "@ai-plugins/schema";
import { frontmatter as fm } from "@ai-plugins/schema";
import { Eta } from "eta";
import { readFileSync } from "node:fs";
import type { Workspace } from "./source.ts";

/**
 * A rendered file, ready to be written under `dist/<target>/`.
 * Renderers return data rather than writing, so they stay pure and testable and
 * a single writer owns the filesystem.
 */
export interface Output {
  /** Path relative to the target's dist root. */
  readonly path: string;
  readonly contents: string | { readonly copyFrom: string; };
  readonly executable?: boolean;
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
  /** Root under `dist/` — e.g. `claude` → `dist/claude/`. */
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
 * Markdown is *rendered*, not copied: the codemod templatised every `.md` in
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
