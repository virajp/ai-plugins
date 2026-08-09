import { z } from "zod";

/**
 * What each target can actually express.
 *
 * Every entry here was verified against vendor docs or source, not inferred.
 * The build reads this to decide what to emit, and the coverage report reads it
 * to name what a target could not carry — so a gap is always reported, never
 * silently dropped.
 */
export const Capabilities = z.object({
  /** Model-decided skill loading (`SKILL.md` with a description). */
  modelInvokedSkills: z.boolean(),
  /** Glob-scoped auto-application of a skill. */
  pathScopedSkills: z.enum(["yes", "advisory", "no"]),
  /** A skill can be hidden from the model and left slash-only. */
  userOnlySkills: z.boolean(),
  /** Slash commands accept frontmatter and argument interpolation. */
  commandArguments: z.boolean(),
  /** Subagents defined as files the plugin ships. */
  subagents: z.boolean(),
  /** Subagents can be shipped *inside* the plugin bundle. */
  subagentsInBundle: z.boolean(),
  /** Per-agent tool allowlist, by tool name. */
  agentToolAllowlist: z.enum(["names", "readonly-only", "sandbox-only", "no"]),
  /** A hook can block a tool call. */
  hookGate: z.boolean(),
  /** A hook can rewrite the tool input before it executes. */
  hookRewrite: z.boolean(),
  mcpStdio: z.boolean(),
  mcpHttp: z.boolean(),
  /** User-configurable language servers for the agent. */
  lsp: z.boolean(),
  /** A marketplace or registry the plugin can be published to. */
  marketplace: z.boolean(),
  /** A variable resolving to the installed plugin's own root directory. */
  pluginRootVariable: z.boolean(),
});
export type Capabilities = z.infer<typeof Capabilities>;

export const TargetId = z.enum([
  "claude",
  "opencode",
  "cursor",
  "ohmypi",
]);
export type TargetId = z.infer<typeof TargetId>;

/**
 * One row per target. Sources, for anyone re-verifying:
 * - claude:   code.claude.com/docs plugins reference
 * - opencode: anomalyco/opencode `packages/core/src/v1/config/*`, `plugin/src/index.ts`
 * - cursor:   cursor.com/docs {skills,subagents,hooks,mcp,plugins}; LSP absent (forum #156751)
 * - ohmypi:   can1357/oh-my-pi `docs/{skills,hooks,mcp-config,lsp-config,marketplace}.md`
 */
export const CAPABILITIES: Record<TargetId, Capabilities> = {
  claude: {
    modelInvokedSkills: true,
    pathScopedSkills: "yes",
    userOnlySkills: true,
    commandArguments: true,
    subagents: true,
    subagentsInBundle: true,
    agentToolAllowlist: "names",
    hookGate: true,
    hookRewrite: true,
    mcpStdio: true,
    mcpHttp: true,
    lsp: true,
    marketplace: true,
    pluginRootVariable: true,
  },
  opencode: {
    modelInvokedSkills: true,
    // No `paths`/glob mechanism exists; skills load on the model's initiative.
    pathScopedSkills: "no",
    // Issue #11972 closed unimplemented; emulated by moving the skill out of
    // `**/SKILL.md` discovery into `command/<n>/index.md`.
    userOnlySkills: false,
    commandArguments: true,
    subagents: true,
    subagentsInBundle: false,
    agentToolAllowlist: "names",
    hookGate: true,
    hookRewrite: true,
    mcpStdio: true,
    mcpHttp: true,
    lsp: true,
    marketplace: false,
    pluginRootVariable: false,
  },
  cursor: {
    modelInvokedSkills: true,
    pathScopedSkills: "yes",
    userOnlySkills: true,
    // `.cursor/commands/*.md` take no frontmatter and interpolate no arguments.
    commandArguments: false,
    subagents: true,
    subagentsInBundle: true,
    agentToolAllowlist: "readonly-only",
    hookGate: true,
    // `beforeShellExecution` returns allow/deny/ask only — no `updatedInput`.
    hookRewrite: false,
    mcpStdio: true,
    mcpHttp: true,
    lsp: false,
    marketplace: true,
    pluginRootVariable: false,
  },
  ohmypi: {
    modelInvokedSkills: true,
    // `globs` gate retrieval but do not force selection — advisory, per
    // docs/rulebook-matching-pipeline.md.
    pathScopedSkills: "advisory",
    userOnlySkills: true,
    commandArguments: true,
    subagents: true,
    // `.claude/agents` is explicitly skipped; agents need OMP's own contract.
    subagentsInBundle: true,
    agentToolAllowlist: "names",
    hookGate: true,
    // `ToolCallEventResult` is `{block, reason}` — no input mutation.
    hookRewrite: false,
    mcpStdio: true,
    mcpHttp: true,
    lsp: true,
    marketplace: true,
    pluginRootVariable: false,
  },
};
