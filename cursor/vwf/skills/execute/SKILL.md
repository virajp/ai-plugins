---
name: execute
description: Execute an approved cycle plan end-to-end in a dedicated worktree
  —
  dependency-ordered, code then review+security concurrently per step under TDD
  with finding loops, one E2E acceptance + UX-conformance pass after all steps,
  gaps
  captured in the plan doc. Autonomous between the start and one final human
  gate, which reviews the run and approves the merge. Requires an approved
  plan in docs/plans/.
---

# execute — Run an Approved Plan to Completion

Implement an approved cycle plan **to completion, autonomously**. Execution is
mechanical from the plan: TDD is non-negotiable; every step passes code, then a
concurrent review + security pass, with findings looped back before it counts as
done; acceptance and UX conformance run once after all steps. There are **no
per-stage human gates** — decisions come from the **Autonomous Rules** below,
and the run stops only at the **Pause Conditions** or the **final gate**, where
the user reviews the whole run (results + gaps) and approves the merge. You own
the orchestration and dispatch the five stage subagents (`execute-coder`,
`execute-code-reviewer`, `execute-security-reviewer`,
`execute-acceptance-verifier`, `execute-ux-reviewer`).

Adopt the **Autonomous delivery driver** persona: keep moving, decide from the
rules, isolate all work in one worktree, document what you can't resolve, and
never land or retire anything without the user.

## Halt Conditions

Halt if no approved plan exists in `docs/plans/`: "No approved plan found. Run
`/plan` first." If `$ARGUMENTS` names no plan and more than one is active,
list them and ask which single plan to run (one plan per run).

**Prerequisite order (chained plans).** Read the plan's `requires:` frontmatter.
For each required plan, read its `covers:` docs **from the current checkout**
and halt unless every one reads `implementation: complete`:

> "Prerequisite plan `<file>` has not been executed and merged (`<doc>` is
> `implementation: <state>`). Run `/execute <file>` first."

No override flag — if reality differs from the stamp, heal it via `/plan`
(its stamp-heal offer) or amend the blueprint via `/blueprint`; never guess
past the halt. Because stamps land in the merged Reconcile commit, an
executed-but-unmerged prerequisite correctly halts too.

## Format Check

Before the first step, run the preflight in
`%%AI_PLUGINS_ROOT%%/assets/format-check.md`. Since the run is autonomous: if
the format drift is **non-blocking**, log it and continue; if it is **blocking**
(the run needs an artifact the old format lacks), **pause** for `/setup` per
the pause rules — never migrate autonomously.

## Doc Paths

| Doc           | Path                                                      |
| ------------- | --------------------------------------------------------- |
| Plan          | `docs/plans/<plan>.md`                                    |
| Registry      | `docs/blueprint/registry.yaml`                            |
| Flow (slice)  | `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md`    |
| Entity        | `docs/blueprint/entities/<entity>/` (`index.md` + schema) |
| API contract  | `docs/blueprint/apis/<project>.openapi.yaml`              |
| Released APIs | `docs/blueprint/apis/released/`                           |
| Conventions   | `docs/blueprint/conventions.md`                           |
| Environment   | `docs/blueprint/environment.md`                           |

## References

This skill is almost entirely rules that hold on every run — the halts, the
pause conditions, the autonomous rules — so they stay here. Only two branches
are conditional enough to load on demand, and each is named where it applies:
[preflight](references/preflight.md) (Setup step 1, when doctor reports a
missing LSP server) and
[acceptance-and-ux](references/acceptance-and-ux.md) (when the acceptance or ux
stage returns short of a clean pass). Never read either upfront.

## Pipeline (per step)

`code`, then `review` and `security` **concurrently**, per step — then
**`acceptance` + `ux` once after all steps** (see the Acceptance & UX section
below). The stage table, per-stage subagent contracts, and shared stage rules
(model enforcement, terse subagent output, loop-on-findings, gap capture, never
silently editing the blueprint) are defined in
`%%AI_PLUGINS_ROOT%%/assets/execute-stages.md` — follow them throughout. The
durable gap record is the **plan doc's "Gaps surfaced during execution"
section**.

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
- **One plan, one worktree.** Via `/git-workflow`, create a dedicated
  isolated worktree for this plan — declared preference: **yes, isolate; do not
  prompt**. Implement everything there and **commit each step autonomously** (no
  consent). Merge/push happens **only behind the final gate**.
- **Full pipeline every step.** `code`, then `review` and `security` run
  concurrently, for each step. Both findings sets merge into one loop-back to
  `code` before the step is done — never a separate round per reviewer.
- **Always fix every security finding.** Security findings gate the step: loop
  back to `code` until security review is clean. A security finding is **never**
  downgraded to a gap or deferred.
- **Always fix every breaking-API finding.** A `[breaking-api]` finding from the
  review stage (a code change that would break a **released** API contract under
  `docs/blueprint/apis/released/`) gates exactly like a security finding: loop
  back to `code` until the `API COMPAT:` line reads clean — exempt from the
  review round cap, never downgraded to a gap, never configurable off.
- **Review findings: capped rounds, guarded for convergence.** For `review`
  (non-security) findings, loop `code → review` up to the configured cap
  (`.config/vwf.yaml` `pipeline.review_round_cap`, default **4**) — and apply
  the **convergence guard** in `execute-stages.md` before each new round. A
  round that did not strictly reduce the finding count, or that resurfaced a
  finding an earlier round resolved, is not converging: end the loop there
  rather than burning the remaining rounds, and record the contested findings as
  an **oscillation** gap naming them and the rounds tried.
  - Any review finding still unresolved when the loop ends — at the cap, or
    early at the guard — is **documented as a gap** and execution continues; it
    does not block.
  - The gap's diagnosis differs by exit. At the **cap**, "blueprint/plan was not
    thorough enough" — the contract left something open. At the **guard**, the
    contract is not the suspect and must not be named as one: the loop itself
    failed to settle, and reconciliation should look there first.
  - A guard trip on a **cap-exempt** finding (security or `[breaking-api]`) is
    not a gap — those must be fixed. It is a pause; see Pause Conditions.
- **Gaps: document and continue.** Every gap (a blueprint/plan hole, not a code
  finding) is mirrored into the plan doc's "Gaps surfaced during execution"
  section and filed to mempalace room `gaps`, then execution continues. A
  *non-blocking* gap never stops the run. An *isolated blocking* gap (the step
  can't proceed without a human decision, but other steps can) → skip that step
  **and its dependents**, document, continue.
- **All git via `/git-workflow`.** Never run raw git. On **every** mid-run
  invocation, pass git-workflow these declared preferences so it never prompts:
  **isolate without asking** (its Step 1) and **commit only — do not prompt,
  never merge/push** (its Step 4). Without these, git-workflow's post-commit
  gate fires on every step commit and stalls the run. The final merge/push (via
  git-workflow, behind its own gate) happens only after the final gate approves.
- **Memory via mempalace (lean on it)** — follow
  `%%AI_PLUGINS_ROOT%%/assets/memory.md`. mempalace is the run's working
  memory, not just an end-of-run sink: resolve the project **wing** once;
  **recall per step** (decisions/problems/gaps/runs for that slice) before
  dispatching the coder, not only before step 1; pass the wing **and** the
  recall hits to every subagent; **persist incrementally** — store each step's
  durable decisions and append a **run-journal** record (room `runs`, drawer
  `<plan>`) as each *node* returns, not only at reconcile, in the fixed shape
  the Run journal section of `execute-stages.md` defines. That journal is what a
  resumed run reads after a pause **and** what the final gate renders — so a
  record skipped under context pressure is work a resumed run repeats and a
  result the gate cannot vouch for. The execute subagents file their own
  findings and gaps directly (rich detail bypasses your context) and recall them
  on fix loop-backs. Skip silently if mempalace is down — the worktree commits
  and the plan doc's gap section are the fallback.

## Pause Conditions

These are the **only** stops before the final gate. On any pause: ensure the
worktree is committed, update the plan doc's gap section, state precisely what
is needed, **emit the exact resume command**, and stop — do not guess past it.
The resume command is `/recall next` after a **resource-cap** pause (which
ran a bare `/handoff` first, writing the reserved `next` handoff), and
`/execute <plan>` for every other pause (it resumes from the run journal per
the Resume check).

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
  directive, run `/handoff` with no argument to snapshot state as the
  reserved `next` handoff, then stop; resume later with `/recall next`.

**Judgment**

- **All-blocking gap** — a blocking gap that halts **every** remaining step (no
  independent work is left). Document it and pause. (An isolated blocking gap
  does *not* pause — skip + document + continue per the rules above.)
- **Non-converging cap-exempt finding** — a security or `[breaking-api]` finding
  that trips the convergence guard (the fix isn't holding, or keeps trading
  against another finding). These can never be downgraded to gaps, so the loop
  has nowhere to exit to. Pause with the finding, the rounds tried, and what
  each round changed.
- **Uncovered irreversible decision** — any decision the rules above do not
  cover that is irreversible or outward-facing. Pause and ask.

Everything else is decided from the rules — do not pause for routine approvals.
Destructive operations (`--force`, `reset --hard`, deleting files the run did
not create) are **refused**, never paused on.

---

## Recall (mempalace)

Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`, resolve the project **wing** and
recall prior decisions, plan rationale, findings, and unreconciled gaps for this
slice (rooms `decisions`, `planning`, `problems`, `gaps`) before the first step.
Pass the wing to every subagent.

**Resume check.** Also recall the **run journal** (room `runs`, drawer
`<plan>`). If a prior run for this plan is recorded, read which steps are
already done and their commits, reconcile against the worktree, and **resume at
the current step** — do not re-implement finished steps. This is how a run
paused at a resource cap (`/handoff` → `/recall next`) picks up where it
left off.

**Tie-break — the worktree is authoritative.** If the journal marks a step
**done** but its commit is **absent** from the worktree, trust the worktree and
**re-run that step**. The journal is skip-if-mempalace-down, so it can be stale
or ahead of what actually landed; the committed code is ground truth.

Per-step recall continues inside the Execute loop below. Skip every memory step
silently if mempalace is unavailable.

## Setup

1. **Preflight (interactive — the user is still present at invocation).** Run
   `/doctor` scoped to the plan's projects. It reads each project's
   `stack.languages` from `.config/vwf.yaml` and checks LSP servers, toolchains,
   manifests, and the harness.

   **Halt on any `blocking` finding** — mise, the graphify CLI, no graph
   reachable from either this worktree or the main checkout, or a stack no
   installed plugin defines (an **unknown** language, a `custom` template pin).
   These are mandated tooling and the closed stack menu, so this is a hard halt
   with the remedy, not a question: a run started without them fails later and
   less legibly, and one started against an undefined stack does not fail at all
   — it builds with the conventions, harness and UX gate silently absent. Report
   and stop.

   **Then gate on the LSP findings** — everything else doctor reports is noted
   and carried into the run's gap list, not blocked on. A missing LSP server is
   a question to the user, not a halt: read
   [the LSP gate](references/preflight.md) when doctor reports one, and ask and
   **wait** per its script.

2. **Worktree.** Invoke `/git-workflow` to create the dedicated worktree,
   passing the declared preferences (isolate without prompting; commit-only, no
   post-commit prompt; never merge/push). All subsequent work and commits happen
   here.
3. **Stack conventions.** Fetch the `conventions:` prose for every template this
   plan's projects pin, per *Resolving the conventions* in
   `%%AI_PLUGINS_ROOT%%/assets/stack-adapter.md` — deduped by slug, **once
   for the whole run**, here rather than per step. The config block names the
   templates; the prose is what the code is actually written to, and every stage
   below that touches code is passed it. A failed fetch halts: the preflight
   already proved each pin resolves, so a failure now is the plugin being
   unreachable, and code written to conventions nobody read is the thing this
   whole gate exists to prevent.
4. **Dependency order.** Read the plan's "Delta — ordered steps", build the
   dependency order, and record the sequence you will execute. **Open the run
   journal** in mempalace (room `runs`, drawer `<plan>`) with that ordered
   sequence, every step pending. The loop appends a node record beneath it per
   the Run journal section of `execute-stages.md`; this is both the resumable
   record and what the final gate renders.

## Execute (loop over steps, no human gates)

For each step in dependency order (skip any already marked done in the run
journal):

1. **recall** — before dispatching, `mempalace_search` the wing scoped to this
   step's slice across rooms `decisions`, `problems`, `gaps`, and `runs` (limit
   3-5). Pass the relevant hits (with the wing) to the coder so it builds on
   prior decisions instead of re-deriving them. Skip silently if mempalace is
   down.
2. **code** — dispatch `execute-coder` per the stage contract in
   `execute-stages.md` (plan step, the resolved stack, wing, recall hits). A
   sub-100% coverage result against the configured target (`.config/vwf.yaml`
   `pipeline.coverage_target`, default 100) is documented as a gap — never a
   silent pass.
3. **review + security (concurrent)** — dispatch `execute-code-reviewer` and
   `execute-security-reviewer` **in a single message** so both run at once. They
   are independent read-only passes over the same diff; neither reads the
   other's output, so serializing them only costs wall-clock.
4. **resolve both findings sets in one loop-back** — merge the two returns and
   send the combined findings **tags** to `code` in **one** dispatch, then
   re-run both reviewers concurrently. Merging is not just faster, it is better:
   the coder fixes review and security findings in a single pass instead of two,
   so the two stages never fight over the same lines. Gating is unchanged and
   per-stage: every security finding and every `[breaking-api]` finding **must**
   be fixed (cap-exempt); other review findings loop **per the round-cap rule**
   (residuals after the cap → documented as gaps). A round counts once, even
   though it ran two reviewers. Before each new round, apply the **convergence
   guard** — the merged loop-back is what *keeps* the two reviewers from
   fighting over the same lines, and the guard is what catches it when that
   fails.
5. **gaps** — any stage's gap pointer → mirror into the plan doc's "Gaps
   surfaced during execution" section and file to mempalace room `gaps`. Decide
   blocking vs non-blocking and act per the rules.
6. **commit** — commit the step's work via `/git-workflow`, **per the
   commit-only preference**.
7. **persist & journal** — store the step's durable decisions to room
   `decisions`, and mark the step **done** in the run journal. The node records
   themselves are written **as each node returns** (steps 2-4), not batched
   here: one record per execution, in the fixed shape, so the round count is the
   record count and a skip carries its `why`. Batching them to the end of the
   step is what makes a resumed run repeat work and the gate report from memory.

## Acceptance & UX (once, after all steps)

When every step is done (or skipped per the gap rules), run the `acceptance` and
`ux` stages back to back per the contracts in `execute-stages.md` — skip each
(journaled, never silent) per its condition: acceptance when the plan's
"Acceptance criteria (from blueprint)" section reads `none — no flow touched`,
ux when the plan changes no screens in a UI project. On anything short of a
clean pass, follow the autonomous policy in
[acceptance & ux](references/acceptance-and-ux.md) — the loop-to-`code` rule and
its 4-round cap under the convergence guard, the `n/a` cases, and the spec-gap
routing. Two rules hold whatever it says: a residual is **never silently
dropped**, and infrastructure is **never scaffolded beyond the plan's own
steps**.

Journal both stages like any other node — a record per execution, and a
`skipped` record with its `why` when the condition didn't hold. A resumed run
must know whether they already passed, and the gate reports each skip from the
record rather than from recollection.

## Reconcile (in the worktree, before the final gate)

1. **Architecture, environment, harness, docs & implementation stamps.**
   Reconcile per the Reconcile section of
   `%%AI_PLUGINS_ROOT%%/assets/execute-stages.md` — the registry block for any
   topology change, `environment.md` for any new secret/env var, the
   `.config/vwf.yaml` `harness:` block for any capability the run added, the
   repo's human docs (README/CLAUDE.md) per docs-sync (report what was synced,
   or `docs: nothing contradicted`), and the **`implementation:` stamp** on each
   blueprint doc in the plan's `covers:` list (the single sanctioned blueprint
   edit — state only, per the stage rules) — committed in the worktree like
   every other step.
2. **Persist.** Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`, store the run's
   durable decisions, resolved findings, and each gap to mempalace (rooms
   `decisions`, `problems`, `gaps`). Skip anything a doc already captures. Most
   per-step decisions were already persisted in the loop — here, fill only what
   is missing. Then mark the run journal (room `runs`, drawer `<plan>`)
   **complete**.

## Final gate & merge

Present the whole run at **one** human gate. **Read the run journal back and
render it** — do not reconstruct the run from what you remember of it. By this
point the run may have spanned dozens of dispatches, a compaction, or a
resource-cap handoff, and the journal is the only account that survived all
three intact. Recall room `runs`, drawer `<plan>`, and present:

- **The node records**, grouped by step — each step's commit, and every
  execution beneath it with its round, outcome, and any `skipped`/`blocked`
  `why`. Round counts are **counted from the records**, never recalled.
- **Coverage** vs the configured target, and the **acceptance** (per-criterion
  pass/fail) and **ux** (findings + a11y) results — each from its record, or its
  `skipped` record's `why`.
- **Model downgrades**, named on the nodes that ran under them.
- **The implementation stamps written** — each `covers:` doc and the state it
  was set to, with why anything is short of `complete`.
- **The consolidated gap list** from the plan doc's "Gaps surfaced during
  execution" section, marking which came from a **cap** and which from the
  **convergence guard** — they point reconciliation at different places.
- **The worktree path.**

If the journal is unavailable — mempalace was down for part or all of the run —
say so plainly and mark the report **reconstructed**. An approver needs to know
whether they are reading a record or a recollection; a reconstructed report is a
valid thing to approve, an undisclosed one is not.

Then wait.

- **Approve** → hand off to `/git-workflow` for the merge/push sequence
  behind its own approval gate.
- **Fix first** → the user names what to address → loop the affected steps back
  through the pipeline (code, then review + security concurrently; re-verify
  acceptance/ux if touched), then re-present the gate.
- **Reject** → leave the worktree intact and committed for inspection; nothing
  merges.

**Gap reconciliation (after the gate).** Whatever the merge decision, walk the
consolidated gap list and offer to close each — **never silently rewrite either
doc**: blueprint holes → `/blueprint` (the sweep re-stamps coverage); plan
holes → `/plan` to re-derive the slice against the now-updated blueprint.
When a gap is reconciled, note its resolution back into the `gaps` room so a
later cycle's recall sees it as closed.

## Archive

After a merge with no open gaps, **tell the user to run `/archive`** to
retire the completed plan. `/archive` is user-only — you cannot invoke it,
so recommend it by name and stop there. While gaps remain open, don't recommend
it — the plan doc is still the working record of what needs reconciling.

**Chain forward.** Scan the active plans under `docs/plans/` for any whose
`requires:` frontmatter lists the plan just completed. If one is now unblocked
(every prerequisite's `covers:` docs read `implementation: complete`), offer
`/execute <next-plan>` — chained plans land one focused run at a time.
