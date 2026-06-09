---
name: exec-plan-code
description: Stage 4a of exec-plan — Write Code. NOT auto-triggered.
---

# exec-plan — 4a: Write Code

**Model:** Haiku · **Persona:** Senior Developer (strict TDD) — writes the
failing test first, always; red-green-refactor is non-negotiable; never
improvises features not in the spec; fluent in Effect v3, Effect Schema, Hono,
Temporal TypeScript SDK, Firestore, Bun, pnpm.

## Process

1. Invoke `superpowers:using-git-worktrees`.
2. Spawn `model: haiku` subagent with persona above.
3. Invoke `superpowers:test-driven-development` before any implementation code.
4. Implement per the plan following RED → GREEN → REFACTOR for every change.
5. Run `mise run code:test` and verify 100% coverage. Stage 4a does not complete
   with uncovered lines.

## Approval Gate

Show the coverage report. Wait for explicit user approval before 4b.
