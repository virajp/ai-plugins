import { z } from "zod";
import * as fm from "./frontmatter.ts";

/**
 * How a skill may be invoked. This replaces Claude Code's two-boolean encoding
 * (`disable-model-invocation` / `user-invocable`), which every other agent
 * spells differently:
 *
 * - `model` — the agent loads it on its own; no slash command. Claude's
 *   `user-invocable: false`. This is the auto-applying doctrine archetype.
 * - `user`  — slash command only, hidden from the model's context. Claude's
 *   `disable-model-invocation: true`.
 * - `both`  — reachable either way. The default.
 *
 * The distinction is load-bearing, not cosmetic: a skill flipped to `user`
 * cannot be delegated to by another skill, and the failure is silent.
 */
export const Invocation = z.enum(["model", "user", "both"]);
export type Invocation = z.infer<typeof Invocation>;

export const Model = z.enum(["opus", "sonnet", "haiku"]);
export const Effort = z.enum(["low", "medium", "high"]);

export const Skill = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "skill names are lowercase kebab-case"),
  description: z.string().min(1),
  invocation: Invocation.default("both"),

  /** Optional provenance, carried by the doctrine archetype only. */
  version: z.string().optional(),
  category: z.string().optional(),
  license: z.string().optional(),

  /**
   * Globs that scope where the skill auto-applies. Only Claude and Cursor
   * honour these; OpenCode has no equivalent, and Oh-My-Pi treats them as an
   * advisory ranking signal.
   */
  paths: z.array(z.string()).optional(),

  /** Tool allowlist. Spelled `allowed-tools` by Claude. */
  tools: z.array(z.string()).optional(),

  argumentHint: z.string().optional(),
  model: Model.optional(),
  effort: Effort.optional(),
});
export type Skill = z.infer<typeof Skill>;

/**
 * Derive the semantic view from parsed frontmatter.
 *
 * Accepts both the neutral spelling (`invocation`, `tools`, `argumentHint`) and
 * the Claude spelling, so the same reader serves `templates/` and the codemod
 * reading the legacy `plugins/` tree.
 */
export function fromFrontmatter(doc: fm.Document): Skill {
  return Skill.parse({
    name: fm.scalar(doc, "name"),
    description: fm.scalar(doc, "description"),
    invocation: readInvocation(doc),
    version: fm.scalar(doc, "version"),
    category: fm.scalar(doc, "category"),
    license: fm.scalar(doc, "license"),
    paths: fm.sequence(doc, "paths"),
    tools: readTools(doc),
    argumentHint: fm.scalar(doc, "argumentHint")
      ?? fm.scalar(doc, "argument-hint"),
    model: fm.scalar(doc, "model"),
    effort: fm.scalar(doc, "effort"),
  });
}

function readInvocation(doc: fm.Document): Invocation {
  const neutral = fm.scalar(doc, "invocation");
  if (neutral !== undefined) {
    return Invocation.parse(neutral);
  }

  // Legacy Claude encoding. `user-invocable: false` wins when both are present:
  // it is the stronger statement (the skill has no slash form at all), and the
  // one file carrying both — git-workflow — pairs it with `user-invocable: true`,
  // which is merely the default restated.
  if (fm.bool(doc, "user-invocable") === false) {
    return "model";
  }
  if (fm.bool(doc, "disable-model-invocation") === true) {
    return "user";
  }
  return "both";
}

function readTools(doc: fm.Document): string[] | undefined {
  // Neutral form is a sequence; Claude's `allowed-tools` is a space-separated
  // scalar; agents use a comma-separated scalar. Accept all three.
  const neutral = fm.sequence(doc, "tools");
  if (neutral !== undefined && neutral.length > 0) {
    return neutral;
  }

  const raw = fm.scalar(doc, "tools") ?? fm.scalar(doc, "allowed-tools");
  if (raw === undefined) {
    return undefined;
  }
  const parts = raw
    .split(raw.includes(",") ? "," : " ")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return parts.length > 0 ? parts : undefined;
}
