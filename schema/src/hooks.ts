import { z } from "zod";

/**
 * Neutral hook declarations — `templates/<plugin>/hooks/hooks.yaml`.
 *
 * Hooks are the least portable surface in the toolkit, so this schema declares
 * *intent* and lets each renderer pick its own mechanism:
 *
 * | target   | mechanism                          | can rewrite? |
 * |----------|------------------------------------|--------------|
 * | claude   | `hooks.json`, `updatedInput`       | yes          |
 * | opencode | JS plugin, mutable `output.args`   | yes          |
 * | cursor   | `hooks.json`, allow/deny/ask       | **no**       |
 * | ohmypi   | TS extension, `{block, reason}`    | **no**       |
 *
 * A `rewrite` action on a target that cannot rewrite degrades to deny-plus-
 * correction: the hook still fires and still prevents the wrong command, but
 * the model has to reissue it. That costs a turn; it does not lose the
 * guarantee. Renderers must never silently drop a hook.
 */

export const Event = z.enum([
  "preToolUse",
  "postToolUse",
  "sessionStart",
  "sessionEnd",
  "userPromptSubmit",
  /** The agent finished responding — the surface a "save a checkpoint" hook wants. */
  "stop",
  /** About to compact the conversation, i.e. the last chance to persist context. */
  "preCompact",
]);
export type Event = z.infer<typeof Event>;

export const Action = z.enum(["rewrite", "gate", "observe"]);
export type Action = z.infer<typeof Action>;

export const Hook = z.object({
  /** Stable id, used to name generated plugin/extension files per target. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  event: Event,
  /** Tool name the hook applies to, e.g. `Bash`. */
  matcher: z.string().optional(),
  action: Action,

  /**
   * Script relative to the plugin's `hooks/` directory. Receives the hook
   * payload on stdin and emits the target's response shape on stdout. The
   * renderer wraps it per target rather than the script knowing about targets.
   */
  script: z.string().optional(),

  /** Literal command, for hooks that shell out to a tool on PATH. */
  command: z.string().optional(),

  /**
   * Message shown to the model when a `rewrite` degrades to a denial. Required
   * for `rewrite` hooks so the degraded path is never wordless — without it a
   * Cursor or Oh-My-Pi user just sees a blocked command and no reason.
   */
  correction: z.string().optional(),

  timeout: z.number().int().positive().optional(),
  async: z.boolean().optional(),

  /**
   * Targets to skip entirely. Use sparingly and say why in a comment — the
   * default is that every hook reaches every target, degraded if necessary.
   */
  skipTargets: z.array(z.string()).default([]),
});
export type Hook = z.infer<typeof Hook>;

export const Hooks = z
  .object({ hooks: z.array(Hook).default([]) })
  .refine(
    h => h.hooks.every(x => x.script !== undefined || x.command !== undefined),
    { message: "each hook needs either `script` or `command`" },
  )
  .refine(h => h.hooks.every(x => x.action !== "rewrite" || x.correction), {
    message:
      "a `rewrite` hook must carry a `correction` for targets that cannot rewrite",
  });
export type Hooks = z.infer<typeof Hooks>;
