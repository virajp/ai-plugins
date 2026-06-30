---
description: Execute an approved cycle plan under TDD, then code review and
  security review via fresh subagents. Reconciles the architecture registry and
  flags blueprint drift. Requires an approved plan in docs/plans/.
argument-hint: "[full | code | review | security]"
model: opus
effort: high
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

## Doc Paths

| Doc         | Path                             |
| ----------- | -------------------------------- |
| Plan        | `docs/plans/<plan>.md`           |
| Registry    | `docs/blueprint/architecture.md` |
| Blueprint   | `docs/blueprint/<entity>.md`     |
| Conventions | `docs/blueprint/conventions.md`  |

## Pipeline

| Stage    | What             | Model  | Subagent                    |
| -------- | ---------------- | ------ | --------------------------- |
| code     | Write Code (TDD) | sonnet | `execute-coder`             |
| review   | Code Review      | opus   | `execute-code-reviewer`     |
| security | Security Review  | opus   | `execute-security-reviewer` |

## Hard Rules

- **All git via `git-workflow`.** Every git action — worktree, commit, merge,
  push — goes through `/vwf:git-workflow`. `execute` invokes it **multiple
  times**: worktree at the start, a commit after each stage's work lands, and a
  final merge/push behind the approval gate. Never run raw git.
- **Model enforcement** — dispatch each subagent on the model specified above.
- **Terse subagent output** — a subagent's full reply lands in this
  orchestrator's context. The pipeline agents already return fixed contract
  blocks; for any *other* agent you spawn (e.g. `Explore` for research),
  instruct it to return only conclusions and `file:line` pointers — never code
  excerpts, diffs, or full file/dir dumps. Read files yourself when you need
  their contents.
- **Approval gates** — pause for explicit user approval before advancing. Never
  chain stages automatically.
- **Loop on findings** — if review or security finds issues, loop back to `code`
  to fix (then re-commit via `git-workflow`) before advancing.
- **Capture blueprint/plan gaps as they surface** — a *gap* (a hole in the
  blueprint or plan, distinct from a code finding) reported by any stage is
  never silently worked around. The subagent files the full gap to mempalace
  room `gaps` and returns a terse pointer; you **mirror that terse line into the
  plan doc's "Gaps surfaced during execution" section** (the durable,
  mempalace-independent copy) the moment it surfaces. Gaps do **not** block the
  pipeline — they are reconciled at cycle end.
- **Never silently edit the blueprint** — flag drift and offer; do not rewrite
  it.
- **Memory via mempalace** — follow `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`:
  resolve the project **wing** and recall prior decisions/findings/gaps before
  the first stage; the coder and review/security subagents file their own
  findings and **blueprint/plan gaps** to mempalace and the coder recalls
  findings on loop-backs (rich detail bypasses your context); persist the
  cycle's durable decisions and gap resolutions at reconcile. Pass the wing to
  every subagent you dispatch.

## Mode

Read the run mode from `$ARGUMENTS`:

- **`full` or no args** → start at `code` and gate through each stage.
- **A specific stage (`review`, etc.)** → verify the preceding stage is
  complete, then jump to it.

---

## Recall (mempalace)

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, resolve the project **wing** and
recall prior decisions, findings, and unreconciled gaps for this slice (rooms
`decisions`, `problems`, `gaps`) before the first stage. Pass the wing to every
subagent you dispatch, plus any relevant recall hits. Skip silently if mempalace
is unavailable.

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

**Setup & dispatch.** Invoke `/vwf:git-workflow` for an isolated local worktree.
Then dispatch `execute-coder` with the plan, the registry stack, and the project
wing. It implements per the plan under strict TDD — following RED → GREEN →
REFACTOR for every change — and runs the suite to the coverage gate. It returns
the coverage report. On a fix loop-back, also pass the review findings **tag**
(not the text) — the coder recalls the findings from mempalace before fixing.

**Capture any gap.** If the coder's `GAPS:` line points to a tag (not "none"),
mirror its terse gist into the plan doc's "Gaps surfaced during execution"
section before committing — per the gap-capture rule above.

**Commit & gate.** Commit the implementation via `/vwf:git-workflow`. Show the
coverage report and wait for explicit approval before `review`.

## Stage: review (`execute-code-reviewer`, opus)

Dispatch `execute-code-reviewer` (pass the project wing). It reviews the code
adversarially against the **plan, the blueprint, conventions, and the registry
stack**, using `/code-review` as its engine. It files its full findings to
mempalace (room `problems`) and returns the terse findings block plus a recall
tag.

**Gate.** Present the findings block. If `SPEC/PLAN GAPS` is not "none", mirror
each into the plan doc's "Gaps surfaced during execution" section (per the
gap-capture rule). Issues → loop back to `code` with the **tag** (the coder
recalls the detail and fixes), then re-commit via `/vwf:git-workflow` and
re-review. Wait for approval before `security`.

## Stage: security (`execute-security-reviewer`, opus)

Dispatch `execute-security-reviewer` (pass the project wing). It threat-models
the changes against the project's declared **capabilities** in the registry,
using `/security-review` as its engine, rating findings by exploitability and
impact. It files its full findings to mempalace (room `problems`) and returns
the terse findings block plus a recall tag.

**Gate.** Present the findings block. If `SPEC/PLAN GAPS` is not "none", mirror
each into the plan doc's "Gaps surfaced during execution" section (per the
gap-capture rule). Issues → loop back to `code` with the **tag**, re-commit,
re-review. Wait for approval before reconciliation.

---

## Reconcile & drift

1. **Reconcile architecture.** If the implementation introduced a topology
   change (new project, dependency, or capability), update the **registry
   block** in `docs/blueprint/architecture.md` to match what was actually built
   — via `/vwf:architecture` for non-trivial changes. Edit the registry
   precisely; do not rewrite prose unless topology genuinely changed.
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
