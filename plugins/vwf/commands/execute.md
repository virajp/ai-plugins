---
description: Execute an approved cycle plan end-to-end in a dedicated worktree
  —
  dependency-ordered, code→review→security per step under TDD with finding
  loops, one E2E acceptance + UX-conformance pass after all steps, gaps captured
  in the plan doc. Autonomous between the start and one final human gate, which
  reviews the run and approves the merge. Requires an approved plan in
  docs/plans/.
argument-hint: "[plan-file]"
model: sonnet
effort: xhigh
---

# execute — Run an Approved Plan to Completion

Implement an approved cycle plan **to completion, autonomously**. Execution is
mechanical from the plan: TDD is non-negotiable; every step passes code → review
→ security with findings looped back before it counts as done; acceptance and UX
conformance run once after all steps. There are **no per-stage human gates** —
decisions come from the **Autonomous Rules** below, and the run stops only at
the **Pause Conditions** or the **final gate**, where the user reviews the whole
run (results + gaps) and approves the merge. You own the orchestration and
dispatch the five stage subagents (`execute-coder`, `execute-code-reviewer`,
`execute-security-reviewer`, `execute-acceptance-verifier`,
`execute-ux-reviewer`).

Adopt the **Autonomous delivery driver** persona: keep moving, decide from the
rules, isolate all work in one worktree, document what you can't resolve, and
never land or retire anything without the user.

## Halt Condition

Halt if no approved plan exists in `docs/plans/`: "No approved plan found. Run
`/vwf:plan` first." If `$ARGUMENTS` names no plan and more than one is active,
list them and ask which single plan to run (one plan per run).

## Format Check

Before the first step, run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`. Since the run is autonomous: if
the format drift is **non-blocking**, log it and continue; if it is **blocking**
(the run needs an artifact the old format lacks), **pause** for `/vwf:setup` per
the pause rules — never migrate autonomously.

## Doc Paths

| Doc         | Path                                                       |
| ----------- | ---------------------------------------------------------- |
| Plan        | `docs/plans/<plan>.md`                                     |
| Registry    | `docs/blueprint/architecture.md`                           |
| Blueprint   | `docs/blueprint/<entity>.md` or `docs/blueprint/<entity>/` |
| Conventions | `docs/blueprint/conventions.md`                            |
| Environment | `docs/blueprint/environment.md`                            |

## Pipeline (per step)

`code` → `review` → `security` per step, then **`acceptance` + `ux` once after
all steps** (see the Acceptance & UX section below). The stage table, per-stage
subagent contracts, and shared stage rules (model enforcement, terse subagent
output, loop-on-findings, gap capture, never silently editing the blueprint) are
defined in `${CLAUDE_PLUGIN_ROOT}/assets/execute-stages.md` — follow them
throughout. The durable gap record is the **plan doc's "Gaps surfaced during
execution" section**.

## Autonomous Rules

- **Implement the whole plan.** Every step in the plan's "Delta — ordered steps"
  is implemented — no cherry-picking, no partial delivery.
- **Dependencies first.** Before executing, derive a dependency order over the
  steps (what a step needs to already exist) and run prerequisites before
  dependents. The plan's TDD order is the starting point; reorder only to honor
  a real dependency. If the derivation finds a **cycle or genuine ambiguity**,
  fall back to the plan's **written TDD order** as-is; if even that is not
  executable, treat it as an **uncovered decision** and pause (per the Pause
  Conditions) — never invent an order.
- **One plan, one worktree.** Via `/vwf:git-workflow`, create a dedicated
  isolated worktree for this plan — declared preference: **yes, isolate; do not
  prompt**. Implement everything there and **commit each step autonomously** (no
  consent). Merge/push happens **only behind the final gate**.
- **Full pipeline every step.** `code → review → security`, in that order, for
  each step. Findings loop back to `code` before the step is done.
- **Always fix every security finding.** Security findings gate the step: loop
  back to `code` until security review is clean. A security finding is **never**
  downgraded to a gap or deferred.
- **Review findings: capped rounds.** For `review` (non-security) findings, loop
  `code → review` up to the configured cap (`.config/vwf.yaml`
  `pipeline.review_round_cap`, default **4**). Any review finding still
  unresolved after the capped round is **documented as a gap** ("blueprint/plan
  was not thorough enough") and execution continues — it does not block.
- **Gaps: document and continue.** Every gap (a blueprint/plan hole, not a code
  finding) is mirrored into the plan doc's "Gaps surfaced during execution"
  section and filed to mempalace room `gaps`, then execution continues. A
  *non-blocking* gap never stops the run. An *isolated blocking* gap (the step
  can't proceed without a human decision, but other steps can) → skip that step
  **and its dependents**, document, continue.
- **All git via `/vwf:git-workflow`.** Never run raw git. On **every** mid-run
  invocation, pass git-workflow these declared preferences so it never prompts:
  **isolate without asking** (its Step 1) and **commit only — do not prompt,
  never merge/push** (its Step 4). Without these, git-workflow's post-commit
  gate fires on every step commit and stalls the run. The final merge/push (via
  git-workflow, behind its own gate) happens only after the final gate approves.
- **Memory via mempalace (lean on it)** — follow
  `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`. mempalace is the run's working
  memory, not just an end-of-run sink: resolve the project **wing** once;
  **recall per step** (decisions/problems/gaps/runs for that slice) before
  dispatching the coder, not only before step 1; pass the wing **and** the
  recall hits to every subagent; **persist incrementally** — store each step's
  durable decisions and update the **run journal** (room `runs`, drawer
  `<plan>`) as each step completes, not only at reconcile. The run journal is
  what a resumed run reads after a pause. The execute subagents file their own
  findings and gaps directly (rich detail bypasses your context) and recall them
  on fix loop-backs. Skip silently if mempalace is down — the worktree commits
  and the plan doc's gap section are the fallback.

## Pause Conditions

These are the **only** stops before the final gate. On any pause: ensure the
worktree is committed, update the plan doc's gap section, state precisely what
is needed, **emit the exact resume command**, and stop — do not guess past it.
The resume command is `/vwf:recall <handoff-name>` after a **resource-cap**
pause (which ran `/vwf:handoff` first), and `/vwf:execute <plan>` for every
other pause (it resumes from the run journal per the Resume check).

**Always on**

- **Hard halts** — no approved plan or missing blueprint for a needed slice; the
  test/coverage/build harness cannot run at all (TDD can't be verified); a git
  or merge **conflict** that cannot be safely resolved.
- **Subagent death** — a stage subagent erroring twice in a row (after one
  re-dispatch) on the **same step**. Commit what is safe, journal the step as
  **blocked** (run journal + plan-doc gap section), and pause — never proceed on
  a dead stage.
- **Resource caps** — context > 65%, 5-hour > 90%, or 7-day > 80% (a repo may
  **tighten** these — never loosen — via `.config/vwf.yaml`
  `pipeline.execute_caps`; the caps hook honors the lower value). A command
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
recall prior decisions, plan rationale, findings, and unreconciled gaps for this
slice (rooms `decisions`, `planning`, `problems`, `gaps`) before the first step.
Pass the wing to every subagent.

**Resume check.** Also recall the **run journal** (room `runs`, drawer
`<plan>`). If a prior run for this plan is recorded, read which steps are
already done and their commits, reconcile against the worktree, and **resume at
the current step** — do not re-implement finished steps. This is how a run
paused at a resource cap (`/vwf:handoff` → `/vwf:recall`) picks up where it left
off.

**Tie-break — the worktree is authoritative.** If the journal marks a step
**done** but its commit is **absent** from the worktree, trust the worktree and
**re-run that step**. The journal is skip-if-mempalace-down, so it can be stale
or ahead of what actually landed; the committed code is ground truth.

Per-step recall continues inside the Execute loop below. Skip every memory step
silently if mempalace is unavailable.

## Setup

1. **LSP check (interactive — the user is still present at invocation).**
   Identify the plan's primary language(s) from the registry `stack` fields and
   check active LSP plugins (`claude plugin list --scope project`). If a
   language's LSP server is missing, ask and **wait**:

   > "No LSP server detected for `<language>`. Without it, type errors may not
   > surface until runtime. Continue without LSP?"

   - **Yes** → proceed. **No** → halt; install via `/plugin` (Discover) then
     retry. On a **resumed** run, don't re-ask — note it as a gap (degraded
     type-safety) and continue.

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
2. **code** — dispatch `execute-coder` per the stage contract in
   `execute-stages.md` (plan step, registry stack, wing, recall hits). A
   sub-100% coverage result against the configured target (`.config/vwf.yaml`
   `pipeline.coverage_target`, default 100) is documented as a gap — never a
   silent pass.
3. **review** — dispatch `execute-code-reviewer` per the stage contract. Issues
   → loop back to `code` with the findings **tag**, re-commit, re-review, **per
   the round-cap rule** (residuals after the cap → documented as gaps).
4. **security** — dispatch `execute-security-reviewer` per the stage contract.
   Loop every finding back to `code`, re-commit, re-review **per the
   security-always-fix rule**.
5. **gaps** — any stage's gap pointer → mirror into the plan doc's "Gaps
   surfaced during execution" section and file to mempalace room `gaps`. Decide
   blocking vs non-blocking and act per the rules.
6. **commit** — commit the step's work via `/vwf:git-workflow`, **per the
   commit-only preference**.
7. **persist & journal** — store the step's durable decisions to room
   `decisions`, then update the run journal (room `runs`, drawer `<plan>`): mark
   this step **done** with its commit ref, the review/security round counts, and
   any gap tags. This incremental write is what a resumed run reads to skip
   completed steps.

## Acceptance & UX (once, after all steps)

When every step is done (or skipped per the gap rules), run the `acceptance` and
`ux` stages back to back per the contracts in `execute-stages.md` — skip each
(journaled, never silent) per its condition: acceptance when the plan's
"Acceptance criteria (from blueprint)" section reads `none — no flow touched`,
ux when the plan changes no screens in a UI project. Autonomous policy:

- **Acceptance `FAIL` / `NOT-COVERED`, and ux findings → loop to `code`** for
  the step that owns the flow/screen (dispatch `execute-coder` with the **tag**;
  the fix is the code, the missing E2E test, or the style/state correction),
  re-commit, re-verify the affected stage — **up to 4 rounds** (the review-cap
  rule). Residuals after the 4th round are documented as gaps and the run
  proceeds to the final gate; a residual is never silently dropped.
- **Acceptance `n/a — no harness`**, or **ux `RENDERED: n/a` on a web slice** →
  record it as a gap (what harness/capture is missing, in the harness-contract
  vocabulary) and proceed — never scaffold infrastructure beyond the plan's own
  steps.
- **Untestable criteria / unpinned states** (`SPEC/PLAN GAPS` / `SPEC GAPS`) →
  plan-doc gap section + room `gaps`, per the gap rules.
- Journal both stages in the run journal (room `runs`) like steps — a resumed
  run must know whether they already passed.

## Reconcile (in the worktree, before the final gate)

1. **Architecture, environment, harness & docs.** Reconcile per the Reconcile
   section of `${CLAUDE_PLUGIN_ROOT}/assets/execute-stages.md` — the registry
   block for any topology change, `environment.md` for any new secret/env var,
   the `.config/vwf.yaml` `harness:` block for any capability the run added, and
   the repo's human docs (README/CLAUDE.md) per docs-sync (report what was
   synced, or `docs: nothing contradicted`) — committed in the worktree like
   every other step.
2. **Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store the run's
   durable decisions, resolved findings, and each gap to mempalace (rooms
   `decisions`, `problems`, `gaps`). Skip anything a doc already captures. Most
   per-step decisions were already persisted in the loop — here, fill only what
   is missing. Then mark the run journal (room `runs`, drawer `<plan>`)
   **complete**.

## Final gate & merge

Present the whole run at **one** human gate: steps completed, per-step commits,
final coverage vs the configured target, the **acceptance result**
(per-criterion pass/fail, or why it was skipped/n-a), the **ux result**
(findings/a11y summary, or why it was skipped), any configured model downgrades
that applied, the consolidated **gap list** from the plan doc's "Gaps surfaced
during execution" section, and the **worktree path**. Then wait.

- **Approve** → hand off to `/vwf:git-workflow` for the merge/push sequence
  behind its own approval gate.
- **Fix first** → the user names what to address → loop the affected steps back
  through the pipeline (code → review → security, re-verify acceptance/ux if
  touched), then re-present the gate.
- **Reject** → leave the worktree intact and committed for inspection; nothing
  merges.

**Gap reconciliation (after the gate).** Whatever the merge decision, walk the
consolidated gap list and offer to close each — **never silently rewrite either
doc**: blueprint holes → `/vwf:blueprint` (the sweep re-stamps coverage); plan
holes → `/vwf:plan` to re-derive the slice against the now-updated blueprint.
When a gap is reconciled, note its resolution back into the `gaps` room so a
later cycle's recall sees it as closed.

## Archive

After a merge with no open gaps, offer to archive the completed plan via
`/vwf:archive`. While gaps remain open, don't offer it — the plan doc is still
the working record of what needs reconciling.
