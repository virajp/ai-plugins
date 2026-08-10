import { z } from "zod";

/**
 * The neutral plugin manifest — `templates/<plugin>/plugin.yaml`.
 *
 * This merges what is today split across two files that must be kept in sync by
 * hand: `plugins/<name>/.claude-plugin/plugin.json` (servers, dependencies) and
 * the plugin's entry in `.claude-plugin/marketplace.json` (version, category,
 * tags, source). Holding both here removes a whole class of drift the
 * `plugins:check` task currently exists to catch.
 */

export const McpServer = z.discriminatedUnion("transport", [
  z.object({
    transport: z.literal("stdio"),
    command: z.string(),
    args: z.array(z.string()).default([]),
    env: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    transport: z.literal("http"),
    url: z.url(),
    headers: z.record(z.string(), z.string()).optional(),
  }),
]);
export type McpServer = z.infer<typeof McpServer>;

export const LspServer = z.object({
  command: z.string(),
  args: z.array(z.string()).default([]),
  /** Maps file extension (with the dot) to language id. */
  extensions: z.record(z.string(), z.string()),
  startupTimeout: z.number().int().positive().optional(),
  /**
   * Per-target id overrides. OpenCode keys LSP config by its own built-in
   * server ids, so `typescript-lsp` must be written as `typescript` there.
   */
  idAliases: z.record(z.string(), z.string()).optional(),
});
export type LspServer = z.infer<typeof LspServer>;

/** Where a plugin's source lives. `url` entries are re-listed, not authored here. */
export const Source = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("local") }),
  z.object({ kind: z.literal("url"), url: z.url() }),
]);

export const Manifest = z.object({
  name: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  version: z.string().optional(),
  description: z.string().optional(),
  category: z.string().default("development"),
  tags: z.array(z.string()).default([]),
  homepage: z.url().optional(),
  repository: z.url().optional(),
  author: z
    .object({ name: z.string(), email: z.email().optional() })
    .optional(),
  license: z.string().optional(),
  strict: z.boolean().optional(),

  source: Source.default({ kind: "local" }),

  /** Other plugins this one requires; all resolve within this marketplace. */
  dependencies: z.array(z.string()).default([]),

  /**
   * Install scope and eligibility, mirroring the installer's constants.
   * `optIn` plugins are excluded from `--all`; `userOnly` ones are pinned to
   * user scope even when a project install is requested.
   */
  scope: z.enum(["user", "project"]).default("user"),
  optIn: z.boolean().default(false),
  userOnly: z.boolean().default(false),

  /** External binaries this plugin needs at runtime, checked before install. */
  requires: z.array(z.string()).default([]),

  /**
   * Prefix this plugin's skill names with the plugin name on the **flat**
   * targets.
   *
   * Claude and Cursor scope a skill to its plugin — `/vwf:plan` — so a name
   * only has to be unique within its own bundle. OpenCode and Oh-My-Pi
   * discover every provider's skills into **one flat namespace** keyed by bare
   * name, so the same skill is just `plan` there: no hint of where it came
   * from, and one generic name away from colliding with another tool's.
   *
   * With this set, the flat targets emit `<plugin>-<skill>` instead —
   * `vwf-plan` — which reads the same as OpenCode's own wrapper convention for
   * user-only skills (`/vwf-setup`), already `<plugin>-<skill>`.
   *
   * Off by default, and deliberately per-plugin rather than global: turning it
   * on renames every skill a plugin ships, so it is a decision each plugin
   * makes once, when its names are generic enough to be worth qualifying.
   */
  prefixSkillNames: z.boolean().default(false),

  /**
   * Languages this plugin owns the facts for — the LSP, the manifest, the
   * toolchain that `/vwf:doctor` checks a repo against.
   *
   * vwf holds no list of languages; it keeps only the *shape* of a language
   * fact and the rule that an unrecognised token degrades to `unknown`. The
   * rows come from here, which is what makes the vocabulary open: supporting a
   * new language means shipping a plugin, not editing vwf.
   *
   * Empty for every plugin that is not a language plugin, which is most of
   * them — a cloud or capability plugin owns providers, not languages.
   */
  languages: z.array(z.string()).default([]),

  mcpServers: z.record(z.string(), McpServer).default({}),
  lspServers: z.record(z.string(), LspServer).default({}),
});
export type Manifest = z.infer<typeof Manifest>;

/** Marketplace-level metadata — `templates/marketplace.yaml`. */
export const Marketplace = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  owner: z.object({ name: z.string(), email: z.email().optional() }),
  forceRemoveDeletedPlugins: z.boolean().default(false),
  /**
   * Clone URL of the repo publishing this marketplace.
   *
   * Needed only by targets whose marketplace cannot reference a local path.
   * Cursor is the one that does: its plugin `source` is a union of git forms
   * (`github` / `url` / `git-subdir`) with no local variant, so a Cursor
   * install resolves over the network even when the rendered tree sits right
   * beside the config.
   */
  repository: z.url().optional(),
});
export type Marketplace = z.infer<typeof Marketplace>;
