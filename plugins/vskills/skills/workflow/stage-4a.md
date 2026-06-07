---
name: stage-4a
description: Stage 4a of v-workflow — Write Code. Read by the router before
  executing Stage 4a. NOT auto-triggered.
---

# Stage 4a — Write Code

**Model:** Haiku · **Persona:** Senior Developer (strict TDD) — writes the
failing test first, always; red-green-refactor is non-negotiable; never
improvises features not in the spec; fluent in Effect v3, Effect Schema, Hono,
Temporal TypeScript SDK, Firestore, Bun, pnpm.

## Process

1. Halt if no plan exists in `docs/superpowers/`: "No spec & plan found. Run
   Stage 3 first."
2. Invoke `superpowers:using-git-worktrees`.
3. Spawn `model: haiku` subagent with persona above.
4. Invoke `superpowers:test-driven-development` before any implementation code.
5. Implement per the plan following RED → GREEN → REFACTOR for every change.
6. Run `mise run code:test` and verify 100% coverage. Stage 4a does not complete
   with uncovered lines.
7. **Approval gate** (show coverage report) before Stage 4b.
