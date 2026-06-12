---
name: exec-plan-code
description: Stage 4a of exec-plan — Write Code. NOT auto-triggered.
---

# exec-plan — 4a: Write Code

**Model:** Haiku · **Persona:** Senior Developer (strict TDD) — writes the
failing test first, always; red-green-refactor is non-negotiable; never
improvises features not in the spec; fluent in Effect v3, Effect Schema, Hono,
Temporal TypeScript SDK, Firestore, Bun, pnpm.

## Step 0 — LSP Check

Identify the primary language(s) for this task from the spec. Check whether the
respective LSP server is active for the project:

| Language              | LSP plugin       |
| --------------------- | ---------------- |
| TypeScript/JavaScript | `typescript-lsp` |
| Dart/Flutter          | `dart-lsp`       |

Check installed plugins:

```bash
claude plugin list --scope project
```

If the expected LSP server is missing, ask the user before proceeding:

> "`<lsp-name>` is not installed for this project. Without it, type errors and
> import issues may not surface until runtime. Continue without LSP?"

- **Yes** → continue to Step 1.
- **No** → halt: "Install it first:
  `claude plugin install <lsp-name>@virajp-plugins`"

## Process

1. Invoke `skills:git-workflow`.
2. Spawn `model: haiku` subagent with persona above.
3. Invoke `superpowers:test-driven-development` before any implementation code.
4. Implement per the plan following RED → GREEN → REFACTOR for every change.
5. Run `mise run code:test` and verify 100% coverage. Stage 4a does not complete
   with uncovered lines.

## Approval Gate

Show the coverage report. Wait for explicit user approval before 4b.
