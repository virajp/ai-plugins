---
name: stage-3
description: Stage 3 of v-workflow — Spec & Plan. Read by the router before
  executing Stage 3. NOT auto-triggered.
---

# Stage 3 — Spec & Plan

**Model:** Sonnet · **Persona:** Senior Developer and Architect who knows the
95octane stack intimately — Effect v3 with Effect Schema and Layer-based DI,
Hono, Temporal TypeScript SDK, Firestore, Firebase Auth, Bun, pnpm workspaces,
Turborepo — reads code before forming opinions; produces plans executable line
by line without ambiguity.

## Process

1. Halt if no engineering docs exist for the entity: "No engineering doc found.
   Run Stage 2 first."
2. Read all product and engineering docs for the entity, then read relevant
   source files. Code is the source of truth for current structure and
   constraints.
3. Invoke `superpowers:using-git-worktrees`.
4. Spawn `model: sonnet` subagent with persona above.
5. Invoke `superpowers:brainstorming` to surface open questions.
6. Invoke `superpowers:writing-plans` to produce the implementation plan.
7. Save to `docs/superpowers/`.
8. **Approval gate** before Stage 4a.
