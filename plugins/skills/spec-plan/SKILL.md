---
name: spec-plan
description: Use when an implementation spec and plan needs to be created for an
  entity. Requires engineering docs to exist. NOT auto-triggered.
---

# spec-plan — Spec & Plan

**Model:** Sonnet · **Persona:** Senior Developer and Architect who reads the
architecture registry, engineering docs, and source code to understand the
project's actual stack — reads code before forming opinions; produces plans
executable line by line without ambiguity.

## Doc Paths

| Doc type    | Path                |
| ----------- | ------------------- |
| Product     | `docs/product/`     |
| Engineering | `docs/engineering/` |
| Spec & Plan | `docs/superpowers/` |

## Halt Condition

Halt if no engineering docs exist for the entity: "No engineering doc found. Run
`doc-engineering` first."

## Process

1. Read all product and engineering docs for the entity, then read relevant
   source files. Code is the source of truth for current structure and
   constraints.
2. Invoke `skills:git-workflow`.
3. Spawn `model: sonnet` subagent with persona above.
4. Invoke `superpowers:brainstorming` to surface open questions.
5. Invoke `superpowers:writing-plans` to produce the implementation plan.
6. Save to `docs/superpowers/`.

## Ralph Loop — Plan Completeness

After writing the spec and plan, loop until no gaps remain:

1. Load `checklists/ralph-prompt.md` as the system prompt and spawn a subagent
   with **only** the written spec and plan files — no conversation context, no
   source code, no doc files.
2. If gaps found:
   - Present the gap list to the user.
   - Re-invoke `superpowers:brainstorming` targeting those specific gaps — ask
     the user the missing questions one at a time until all open decisions are
     resolved.
   - Update the plan with the answers.
   - Return to step 1.
3. If no gaps → exit loop.

**Critical:** The reviewer subagent must receive only the plan file — no
conversation context. Context bleed causes it to fill open decisions from memory
rather than surfacing them for the user to resolve.

## Approval Gate

Pause and wait for explicit user approval before the user continues to
`exec-plan`.
