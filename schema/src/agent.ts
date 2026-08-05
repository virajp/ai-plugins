import { z } from "zod";
import * as fm from "./frontmatter.ts";
import {
  Effort,
  Model,
} from "./skill.ts";

/**
 * A subagent the workflow skills delegate to.
 *
 * Every target has subagents, but no two agree on the encoding: Claude and
 * Cursor use Markdown + YAML frontmatter, Oh-My-Pi uses its own frontmatter
 * contract (and explicitly refuses to read Claude's), and Codex uses TOML with
 * the body moved into a `developer_instructions` field. The neutral shape
 * carries what all of them can express; renderers project down.
 */
export const Agent = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "agent names are lowercase kebab-case"),
  description: z.string().min(1),

  /**
   * Tool allowlist. Claude and Oh-My-Pi enforce this by name; Cursor collapses
   * it to a single `readonly` boolean; Codex approximates it with sandbox mode
   * and MCP-server narrowing.
   */
  tools: z.array(z.string()).optional(),

  model: Model.optional(),
  effort: Effort.optional(),

  /**
   * Which agents this one may itself delegate to. Not authored today — derived
   * by the Oh-My-Pi renderer, which requires `spawns` to permit delegation.
   */
  spawns: z.array(z.string()).optional(),
});
export type Agent = z.infer<typeof Agent>;

export function fromFrontmatter(doc: fm.Document): Agent {
  const rawTools = fm.scalar(doc, "tools");
  return Agent.parse({
    name: fm.scalar(doc, "name"),
    description: fm.scalar(doc, "description"),
    tools: rawTools
      ?.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0),
    model: fm.scalar(doc, "model"),
    effort: fm.scalar(doc, "effort"),
    spawns: fm.sequence(doc, "spawns"),
  });
}

/**
 * Whether an agent is read-only — no tool that mutates the workspace.
 * Cursor has no per-agent tool allowlist, only this boolean, so the renderer
 * derives it rather than dropping the restriction entirely.
 */
const MUTATING = new Set(["Write", "Edit", "NotebookEdit", "Bash"]);

export function isReadOnly(agent: Agent): boolean {
  if (agent.tools === undefined) {
    return false;
  }
  return !agent.tools.some(t => MUTATING.has(t));
}
