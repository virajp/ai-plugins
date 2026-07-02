---
description: Execute an approved cycle plan under TDD, then code review and
  security review via fresh subagents. Reconciles the architecture registry and
  flags blueprint drift. Requires an approved plan in docs/plans/.
argument-hint: "[full | code | review | security]"
model: sonnet
effort: xhigh
---

# execute — Implement an Approved Plan

Implement an approved cycle plan. Execution is mechanical from the plan: TDD is
non-negotiable, then code review and security review follow, each in a fresh
purpose-specific subagent behind a mandatory approval gate. Findings loop back
to code before advancing. You own the user conversation and orchestrate the
subagents.

Adopt the **Delivery orchestrator** persona: enforce approval gates, never chain
stages automatically, loop review findings back to code before advancing, and be
strict about per-stage model assignment.

## Halt Condition

Halt if no approved plan exists in `docs/plans/`: "No approved plan found. Run
`/vwf:plan` first."

## Format Check

Before the first stage, run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/vwf:init` (proceed unless a needed artifact is
missing).

## Doc Paths

| Doc         | Path                                                       |
| ----------- | ---------------------------------------------------------- |
| Plan        | `docs/plans/<plan>.md`                                     |
| Registry    | `docs/blueprint/architecture.md`                           |
| Blueprint   | `docs/blueprint/<entity>.md` or `docs/blueprint/<entity>/` |
| Conventions | `docs/blueprint/conventions.md`                            |
| Environment | `docs/blueprint/environment.md`                            |

## Pipeline

`code` → `review` → `security`. The stage table, per-stage subagent contracts,
and shared stage rules (model enforcement, terse subagent output,
loop-on-findings, gap capture, never silently editing the blueprint) are defined
in `${CLAUDE_PLUGIN_ROOT}/assets/execute-stages.md` (shared with
`/vwf:autopilot`) — follow them throughout. For `execute`, the durable gap
record is the **plan doc's "Gaps surfaced during execution" section**.

## Hard Rules

- **All git via `git-workflow`.** Every git action — worktree, commit, merge,
  push — goes through `/vwf:git-workflow`. `execute` invokes it **multiple
  times**: worktree at the start, a commit after each stage's work lands, and a
  final merge/push behind the approval gate. Never run raw git.
- **Approval gates** — pause for explicit user approval before advancing. Never
  chain stages automatically.
- **Subagent failure** — if a dispatched subagent errors or returns a malformed
  contract block (missing the fixed fields the stage expects), **re-dispatch it
  once**. On a second failure, **halt the stage and report** — never advance on
  a missing or unparseable contract.
- **Memory via mempalace** — see the **Recall (mempalace)** section below and
  `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`. Unique to execute's subagents: they
  file their own findings and blueprint/plan gaps (rich detail bypasses your
  context) and recall them on fix loop-backs; **pass the wing to every subagent
  you dispatch**.

## Mode

Read the run mode from `$ARGUMENTS`:

- **`full` or no args** → start at `code` and gate through each stage.
- **A specific stage (`review`, etc.)** → verify the preceding stage is
  complete, then jump to it. **Complete** means its commit exists in the
  worktree (`git log` shows the stage's commit) and, when the preceding stage is
  `code`, its coverage report was produced. If completeness can't be determined,
  **ask the user** rather than guessing.

---

## Recall (mempalace)

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, resolve the project **wing** and
recall prior decisions, plan rationale, findings, and unreconciled gaps for this
slice (rooms `decisions`, `planning`, `problems`, `gaps`) before the first
stage. Pass the wing to every subagent you dispatch, plus any relevant recall
hits. Skip silently if mempalace is unavailable.

## Stage: code (`execute-coder`, sonnet)

**LSP check (orchestrator — interactive, before dispatching).** Identify the
primary language(s) from the plan and the registry's `stack` fields, then check
active LSP plugins:

```bash
claude plugin list --scope project
```

If a language's LSP server is missing, ask and **wait**:

> "No LSP server detected for `<language>`. Without it, type errors may not
> surface until runtime. Continue without LSP?"

- **Yes** → proceed. **No** → halt; install via `/plugin` (Discover) then retry.

**Setup & dispatch.** Invoke `/vwf:git-workflow` for an isolated local worktree,
then dispatch `execute-coder` per the stage contract in `execute-stages.md`
(plan, registry stack, wing; the findings **tag** on a fix loop-back).

**Capture any gap.** If the coder's `GAPS:` line points to a tag (not "none"),
mirror its terse gist into the plan doc's "Gaps surfaced during execution"
section before committing — per the gap-capture rule.

**Commit & gate.** Commit the implementation via `/vwf:git-workflow`. Show the
coverage report and wait for explicit approval before `review`.

## Stage: review (`execute-code-reviewer`, opus)

Dispatch `execute-code-reviewer` per the stage contract in `execute-stages.md`.

**Gate.** Present the findings block. If `SPEC/PLAN GAPS` is not "none", mirror
each into the plan doc's "Gaps surfaced during execution" section (per the
gap-capture rule). Issues → loop back to `code` with the **tag** (the coder
recalls the detail and fixes), then re-commit via `/vwf:git-workflow` and
re-review. Wait for approval before `security`.

**Loop policy.** The review→code loop is intentionally **unbounded** — a human
gates every round, so it can run as long as the findings keep shrinking (heed
the convergence guard). But when the **4th round** still leaves findings open,
stop looping blind and suggest the autopilot-style resolution: document the
residuals as gaps in the plan doc's "Gaps surfaced during execution" section and
reconcile them (blueprint/plan holes → `/vwf:blueprint` / `/vwf:plan`) rather
than churning further rounds.

## Stage: security (`execute-security-reviewer`, opus)

Dispatch `execute-security-reviewer` per the stage contract in
`execute-stages.md`.

**Gate.** Present the findings block. If `SPEC/PLAN GAPS` is not "none", mirror
each into the plan doc's "Gaps surfaced during execution" section (per the
gap-capture rule). Issues → loop back to `code` with the **tag**, re-commit,
re-review. Wait for approval before reconciliation.

---

## Reconcile & drift

1. **Reconcile architecture & environment** per the Reconcile section of
   `${CLAUDE_PLUGIN_ROOT}/assets/execute-stages.md` — the registry block for any
   topology change, `environment.md` for any new secret/env var.
2. **Reconcile blueprint/plan gaps.** Collect the cycle's gaps: read the plan
   doc's "Gaps surfaced during execution" section (the durable copy) and recall
   room `gaps` for the full detail. Present the consolidated list to the user
   and offer to close them — **do not silently rewrite either doc**:
   - **Blueprint holes** (a behaviour/requirement the blueprint never pinned
     down) → offer to update the blueprint via `/vwf:blueprint`.
   - **Plan holes** (a step the plan under-/mis-specified) → offer to re-derive
     the slice via `/vwf:plan` against the now-updated blueprint. Drive both
     behind the user's approval. When a gap is reconciled, note its resolution
     back into the `gaps` room (step 3) so a later cycle's recall sees it as
     closed.
3. **Persist to memory.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store
   the cycle's durable outcomes to mempalace — decisions and their rationale,
   findings and how they were resolved, and each gap's resolution (rooms
   `decisions`, `problems`, `gaps`). Skip anything a doc already captures
   verbatim.

## Merge (git-workflow)

When the user is ready, commit any reconciliation and hand off to
`/vwf:git-workflow` for the merge/push sequence behind its own approval gate.

## Archive

Offer to archive the now-completed plan via `/vwf:archive`.
