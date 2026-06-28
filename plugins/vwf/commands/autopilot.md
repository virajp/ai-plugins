---
description: Autonomously execute an approved cycle plan end-to-end in a
  dedicated
  worktree — dependency-ordered, code→review→security per step with finding
  loops, gaps written to a gap-report, never merging or archiving. Pauses only on
  hard halts, resource caps, an all-blocking gap, or an uncovered irreversible
  decision.
argument-hint: "[plan-file]"
model: opus
effort: high
---

# autopilot — Autonomously Execute an Approved Plan

Run an approved cycle plan to completion **without per-stage human gates**.
Where `/vwf:execute` pauses for approval at every stage, autopilot takes those
decisions from the **Autonomous Rules** below and stops only at the **Pause
Conditions**. It reuses execute's three subagents (`execute-coder`,
`execute-code-reviewer`, `execute-security-reviewer`) and the memory protocol —
only the orchestration policy differs.

Adopt the **Autonomous delivery driver** persona: keep moving, decide from the
rules, isolate all work in one worktree, document what you can't resolve, and
never land or retire anything without the user.

## Halt Condition

Halt if no approved plan exists in `docs/plans/`: "No approved plan found. Run
`/vwf:plan` first." If `$ARGUMENTS` names no plan and more than one is active,
list them and ask which single plan to run (one plan per autopilot run).

## Doc Paths

| Doc         | Path                              |
| ----------- | --------------------------------- |
| Plan        | `docs/plans/<plan>.md`            |
| Gap-report  | `docs/plans/<plan>.gap-report.md` |
| Registry    | `docs/specs/architecture.md`      |
| Spec        | `docs/specs/<entity>.md`          |
| Conventions | `docs/specs/conventions.md`       |

## Pipeline (per step)

| Stage    | What             | Model  | Subagent                    |
| -------- | ---------------- | ------ | --------------------------- |
| code     | Write Code (TDD) | sonnet | `execute-coder`             |
| review   | Code Review      | opus   | `execute-code-reviewer`     |
| security | Security Review  | opus   | `execute-security-reviewer` |

## Autonomous Rules

- **Implement the whole plan.** Every step in the plan's "Delta — ordered steps"
  is implemented — no cherry-picking, no partial delivery.
- **Dependencies first.** Before executing, derive a dependency order over the
  steps (what a step needs to already exist) and run prerequisites before
  dependents. The plan's TDD order is the starting point; reorder only to honor
  a real dependency.
- **One plan, one worktree.** Via `/vwf:git-workflow`, create a dedicated
  isolated worktree for this plan — declared preference: **yes, isolate; do not
  prompt**. Implement everything there and **commit each step autonomously** (no
  consent). **Never merge or push** to the main worktree — autopilot leaves the
  worktree intact for the user to review and land.
- **Full pipeline every step.** `code → review → security`, in that order, for
  each step. Findings loop back to `code` before the step is done.
- **Always fix every security finding.** Security findings gate the step: loop
  back to `code` until security review is clean. A security finding is **never**
  downgraded to a gap or deferred.
- **Review findings: cap at 4 rounds.** For `review` (non-security) findings,
  loop `code → review` up to **4 rounds**. Any review finding still unresolved
  after the 4th round is **documented as a gap** ("spec/plan was not thorough
  enough") and execution continues — it does not block.
- **Gaps: document and continue.** Every gap (a spec/plan hole, not a code
  finding) is written to the **gap-report** file and filed to mempalace room
  `gaps`, then execution continues. A *non-blocking* gap never stops the run. An
  *isolated blocking* gap (the step can't proceed without a human decision, but
  other steps can) → skip that step **and its dependents**, document, continue.
- **Never archive.** Autopilot never runs `/vwf:archive` and never suggests it.
- **All git via `/vwf:git-workflow`** (worktree + per-step commits only — no
  merge/push). Never run raw git. On **every** invocation, pass git-workflow
  these declared preferences so it never prompts: **isolate without asking**
  (its Step 1) and **commit only — do not prompt, never merge/push** (its Step
  4). Without these, git-workflow's post-commit gate fires on every step commit
  and stalls the run.
- **Model enforcement** — dispatch each subagent on its model above.
- **Terse subagent output** — subagents return their fixed contract blocks; any
  other agent you spawn returns only conclusions and `file:line` pointers.
- **Memory via mempalace (lean on it)** — follow
  `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`. mempalace is autopilot's working
  memory, not just an end-of-run sink: resolve the project **wing** once;
  **recall per step** (decisions/problems/gaps/runs for that slice) before
  dispatching the coder, not only before step 1; pass the wing **and** the
  recall hits to every subagent; **persist incrementally** — store each step's
  durable decisions and update the **run journal** (room `runs`, drawer
  `<plan>`) as each step completes, not only at reconcile. The run journal is
  what a resumed run reads after a resource-cap pause. Skip silently if
  mempalace is down — the worktree commits and gap-report are the fallback.

## Pause Conditions

These are the **only** stops. On any pause: ensure the worktree is committed,
update the gap-report, state precisely what is needed, and stop — do not guess
past it.

**Always on**

- **Hard halts** — no approved plan or missing spec for a needed slice; the
  test/coverage/build harness cannot run at all (TDD can't be verified); a git
  or merge **conflict** that cannot be safely resolved.
- **Resource caps** — context > 65%, 5-hour > 90%, or 7-day > 80%. A command
  cannot measure its own context window, so this signal is **delivered by the
  statusline caps hook** (install via `@askviraj/ai-plugins --statusline`); for
  autonomous runs, install it or this pause will not fire. On the injected cap
  directive, run `/vwf:handoff` to snapshot state, then stop; resume later with
  `/vwf:recall`.

**Judgment**

- **All-blocking gap** — a blocking gap that halts **every** remaining step (no
  independent work is left). Document it and pause. (An isolated blocking gap
  does *not* pause — skip + document + continue per the rules above.)
- **Uncovered irreversible decision** — any decision the rules above do not
  cover that is irreversible or outward-facing. Pause and ask.

Everything else is decided from the rules — do not pause for routine approvals.
Destructive operations (`--force`, `reset --hard`, deleting files the run did
not create) are **refused**, never paused on.

---

## Recall (mempalace)

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, resolve the project **wing** and
recall prior decisions, findings, and unreconciled gaps for this slice (rooms
`decisions`, `problems`, `gaps`) before the first step. Pass the wing to every
subagent.

**Resume check.** Also recall the **run journal** (room `runs`, drawer
`<plan>`). If a prior run for this plan is recorded, read which steps are
already done and their commits, reconcile against the worktree, and **resume at
the current step** — do not re-implement finished steps. This is how a run
paused at a resource cap (`/vwf:handoff` → `/vwf:recall`) picks up where it left
off.

Per-step recall continues inside the Execute loop below. Skip every memory step
silently if mempalace is unavailable.

## Setup

1. **LSP check.** Identify the plan's primary language(s) from the registry
   `stack` fields and check active LSP plugins
   (`claude plugin list --scope
   project`). If one is missing, note it as a
   gap (degraded type-safety) and continue — do not pause; autopilot favors
   progress, and missing LSP is a documented risk, not a blocker.
2. **Worktree.** Invoke `/vwf:git-workflow` to create the dedicated worktree,
   passing the declared preferences (isolate without prompting; commit-only, no
   post-commit prompt; never merge/push). All subsequent work and commits happen
   here.
3. **Dependency order.** Read the plan's "Delta — ordered steps", build the
   dependency order, and record the sequence you will execute. **Write the run
   journal** to mempalace (room `runs`, drawer `<plan>`): the ordered sequence
   with every step marked pending. This is the resumable record the loop updates
   as it goes.

## Execute (loop over steps, no human gates)

For each step in dependency order (skip any already marked done in the run
journal):

1. **recall** — before dispatching, `mempalace_search` the wing scoped to this
   step's slice across rooms `decisions`, `problems`, `gaps`, and `runs` (limit
   3-5). Pass the relevant hits (with the wing) to the coder so it builds on
   prior decisions instead of re-deriving them. Skip silently if mempalace is
   down.
2. **code** — dispatch `execute-coder` (sonnet) with the plan step, registry
   stack, wing, and recall hits. Strict TDD (RED → GREEN → REFACTOR) to the
   coverage gate.
3. **review** — dispatch `execute-code-reviewer` (opus). Issues → loop back to
   `code` with the findings **tag** (the coder recalls detail from mempalace),
   re-commit, re-review. Cap at **4 rounds**; document residual review findings
   as gaps and move on.
4. **security** — dispatch `execute-security-reviewer` (opus). **Every** finding
   → loop back to `code`, re-commit, re-review until security is clean. Never
   defer a security finding.
5. **gaps** — any stage's gap pointer → append to the gap-report and file to
   mempalace room `gaps`. Decide blocking vs non-blocking and act per the rules.
6. **commit** — commit the step's work via `/vwf:git-workflow` (declared:
   commit-only, no prompt).
7. **persist & journal** — store the step's durable decisions to room
   `decisions`, then update the run journal (room `runs`, drawer `<plan>`): mark
   this step **done** with its commit ref, the review/security round counts, and
   any gap tags. This incremental write is what a resumed run reads to skip
   completed steps.

## Gap-report

Maintain `docs/plans/<plan>.gap-report.md` — the consolidated, human-facing,
mempalace-independent record. One row per gap:

```markdown
# Gap report: <plan>

| Step / stage | What's under/mis-specified | Assumption proceeded on | Blocking?  | Status |
| ------------ | -------------------------- | ----------------------- | ---------- | ------ |
| ...          | ...                        | ...                     | no/iso/all | open   |
```

Mirror each row's full detail into mempalace room `gaps` (the subagents file
their own; you consolidate the report). Residual review findings after 4 rounds
are recorded here as gaps too, tagged as plan/spec under-specification.

## Reconcile

1. **Architecture.** If the implementation changed topology (new project,
   dependency, or capability), update the registry block in
   `docs/specs/architecture.md` — via `/vwf:architecture` for non-trivial
   changes. Edit precisely; do not rewrite prose unless topology changed.
2. **Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store the run's
   durable decisions, resolved findings, and each gap to mempalace (rooms
   `decisions`, `problems`, `gaps`). Skip anything a doc already captures. Most
   per-step decisions were already persisted in the loop — here, fill only what
   is missing. Then mark the run journal (room `runs`, drawer `<plan>`)
   **complete**.

## Finish

Report: steps completed, per-step commits, final coverage, and the **worktree
path** — it is committed and ready for the user to review and merge (autopilot
does not merge or push).

- **If any gaps remain:** present the gap-report and ask the user to take care
  of the gaps — the spec/plan needs them resolved (via `/vwf:spec` /
  `/vwf:plan`). **Do not** suggest archiving.
- **If no gaps:** report completion. Still do **not** archive — `/vwf:archive`
  runs only on the user's explicit request.
