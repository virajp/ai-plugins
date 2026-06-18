---
description: Execute an approved spec & plan through four gated stages — write
  code (TDD), code review, security review, update docs. Requires a spec & plan
  in docs/superpowers/. Enforces per-stage models and approval gates.
argument-hint: "[full | 4a | 4b | 4c | 4d]"
model: inherit
---

# exec-plan — Execute Implementation Plan

Execute an approved spec & plan through four sequential stages. Each stage runs
in a purpose-specific subagent on the model the stage requires, behind a
mandatory approval gate. Issues found in review stages loop back to code. You
own the user conversation (gates, the LSP check) and orchestrate the subagents.

Adopt the **Delivery orchestrator** persona: enforce approval gates, never chain
stages automatically, loop review findings back to code before advancing, and be
strict about per-stage model assignment.

## Halt Condition

Halt if no plan exists in `docs/superpowers/`: "No spec & plan found. Run
`/spec-plan` first."

## Pipeline

| Stage | What            | Model  | Subagent                      |
| ----- | --------------- | ------ | ----------------------------- |
| 4a    | Write Code      | haiku  | `exec-plan-coder`             |
| 4b    | Code Review     | opus   | `exec-plan-code-reviewer`     |
| 4c    | Security Review | opus   | `exec-plan-security-reviewer` |
| 4d    | Update Docs     | sonnet | `exec-plan-doc-writer`        |

## Hard Rules

- **Model enforcement** — dispatch each subagent on the model specified above.
  Never run a stage on the wrong model.
- **Approval gates** — pause and wait for explicit user approval before
  advancing to the next stage. Never chain stages automatically.
- **Loop on findings** — if 4b or 4c finds issues, loop back to 4a to fix before
  re-reviewing. Do not advance to the next review stage with open issues.
- **Archive before closing** — 4d is not complete until all spec & plan files
  are moved from `docs/superpowers/` to `docs/superpowers/archived/`.

## Mode

Read the run mode from `$ARGUMENTS`:

- **`full` or no args** → start at Stage 4a and gate through each stage.
- **A specific stage (`4b`, etc.)** → verify the preceding stage is complete,
  then jump directly to it.

---

## Stage 4a — Write Code (`exec-plan-coder`, haiku)

**LSP check (orchestrator — interactive, do this before dispatching).** Identify
the primary language(s) from the spec and the architecture registry's `stack`
fields, then check active LSP plugins:

```bash
claude plugin list --scope project
```

For each language in the stack, verify an LSP server is installed. If one is
missing, ask the user and **wait**:

> "No LSP server detected for `<language>`. Without it, type errors and import
> issues may not surface until runtime. Continue without LSP?"

- **Yes** → proceed.
- **No** → halt. Open the plugin manager with `/plugin` (Discover tab) and
  install the right server:
  ```sh
  claude plugin install <lsp-name>@virajp-plugins
  # or, if unavailable there:
  claude plugin install <lsp-name>@claude-plugins-official
  ```

**Setup & dispatch.** Invoke `/git-workflow` for an isolated local workspace.
Then dispatch the `exec-plan-coder` subagent with the plan and the registry
stack. It invokes `superpowers:test-driven-development`, implements per the plan
following RED → GREEN → REFACTOR for every change, and runs the test suite to
100% coverage. It returns the coverage report.

**Approval gate.** Show the coverage report. Wait for explicit user approval
before 4b.

## Stage 4b — Code Review (`exec-plan-code-reviewer`, opus)

Dispatch the `exec-plan-code-reviewer` subagent. It reviews the Stage 4a code
adversarially against the **spec, engineering docs, and the registry stack**,
using `/code-review` as its engine. It returns the findings.

**Approval gate.** Present all findings. Wait for explicit user approval before
4c. Issues found → loop back to 4a to fix, then re-review.

## Stage 4c — Security Review (`exec-plan-security-reviewer`, opus)

Dispatch the `exec-plan-security-reviewer` subagent. It threat-models the
changes against the project's declared **capabilities** in the registry, using
`/security-review` as its engine, and rates findings by exploitability and
impact. It returns the findings.

**Approval gate.** Present all findings. Wait for explicit user approval before
4d. Issues found → loop back to 4a to fix, then re-review.

## Stage 4d — Update Docs (`exec-plan-doc-writer`, sonnet)

Invoke `/git-workflow`, then dispatch the `exec-plan-doc-writer` subagent. It
diffs the implementation branch against its base, updates only the docs the diff
shows changed (product / engineering / architecture), updates the CHANGELOG for
every registry project with new commits, and **archives** all spec & plan files
for the entity from `docs/superpowers/` to `docs/superpowers/archived/` (move,
not delete; halt and report on failure). It returns the changed doc paths and
the archived paths.

**Approval gate.** Confirm (a) all doc changes made and (b) spec & plan files
archived (list moved paths). Both required before 4d is done. Wait for the user.

---

## Commit

When the user is ready, commit via `/git-workflow`. Keep the worktree **local**
— never push remotely. Then suggest the merge/cleanup sequence:

`commit changes, merge to default branch of main worktree, push changes, switch
to main worktree & clean up additional worktree`
