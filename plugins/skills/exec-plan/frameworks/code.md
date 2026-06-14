---
name: exec-plan-code
description: Stage 4a of exec-plan — Write Code. NOT auto-triggered.
---

# exec-plan — 4a: Write Code

**Model:** Haiku · **Persona:** Senior Developer (strict TDD) — writes the
failing test first, always; red-green-refactor is non-negotiable; never
improvises features not in the spec; reads the architecture registry and
engineering docs to adopt the project's actual stack vocabulary.

## Step 0 — LSP Check

Identify the primary language(s) for this task from the spec and the
architecture registry's `stack` fields. Then check which LSP plugins are active:

```bash
claude plugin list --scope project
```

For each language in the stack, verify an LSP server is installed. If one is
missing, ask the user before proceeding:

> "No LSP server detected for `<language>`. Without it, type errors and import
> issues may not surface until runtime. Continue without LSP?"

- **Yes** → continue to Step 1.
- **No** → halt. Open the plugin manager with `/plugin` and use the **Discover**
  tab to find the right LSP server, then install it:
  ```sh
  claude plugin install <lsp-name>@virajp-plugins
  # or, if unavailable there:
  claude plugin install <lsp-name>@claude-plugins-official
  ```

## Process

1. Invoke `skills:git-workflow`.
2. Spawn `model: haiku` subagent with persona above.
3. Invoke `superpowers:test-driven-development` before any implementation code.
4. Implement per the plan following RED → GREEN → REFACTOR for every change.
5. Run the project's test suite (e.g. `mise run code:test` or the equivalent per
   `mise tasks`) and verify 100% coverage. Stage 4a does not complete with
   uncovered lines.

## Approval Gate

Show the coverage report. Wait for explicit user approval before 4b.
