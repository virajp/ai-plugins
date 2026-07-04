---
description: Produce a reviewable cycle plan as a diff for one slice of the
  blueprint
  (an entity or a section). Reads desired (blueprint) vs actual (code), writes only
  the delta to docs/plans/<date>-<time>-<slice>.md. Pulls unimplemented
  dependencies of the slice into the plan (transitively) and routes any
  blueprint gap it uncovers back through /vwf:blueprint before writing — so no
  cycle builds on a gap. Requires the blueprint coverage stamp to read complete.
argument-hint: "[entity | entity/section | integration]"
model: sonnet
effort: xhigh
---

# plan — Cycle Plan (a Diff, not a re-Blueprint)

Produce a reviewable cycle plan for a chosen slice of the blueprint. A plan is a
**diff**: it reads the blueprint (desired state) and the actual code (actual
state) for the slice and writes only the delta — what exists, what is missing,
what changes, and in what order — as a reviewable artifact ordered for TDD.

You own the user conversation and the approval gate. Do **not** restate the
blueprint; reference it.

Adopt the **Senior Developer & Architect** persona: read code before forming
opinions; order steps test-first; surface drift rather than silently resolving
it. When a planning decision is genuinely open, elicit it following the
**elicitation protocol** in `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`.

## Doc Paths

| Doc               | Path                                                    |
| ----------------- | ------------------------------------------------------- |
| Registry          | `docs/blueprint/architecture.md`                        |
| Conventions       | `docs/blueprint/conventions.md`                         |
| Blueprint (slice) | `docs/blueprint/<entity>/` (`index.md` ± surface files) |
| Plan              | `docs/plans/<date>-<time>-<slice>.md`                   |
| Plan template     | `${CLAUDE_PLUGIN_ROOT}/assets/templates/plan.md`        |

---

## Pipeline

### 1. Resolve the slice

**Coverage gate.** Read the `blueprint:` block in `.config/vwf.yaml` (per the
vwf-config asset). **Halt unless `coverage: complete`:** "The blueprint is not
complete (`<remaining list, or 'never swept'>`). Run `/vwf:blueprint` to finish
the sweep — a plan cut from a partial blueprint builds gaps into the code." A
missing block means no sweep has stamped this repo yet — same halt.

The slice is a single unit from `$ARGUMENTS`: an entity, a section of one, or
`integration` (the cross-entity `docs/blueprint/integration.md` doc). **Halt if
no blueprint exists** for it: "No blueprint found for `<slice>`. Run
`/vwf:blueprint` first." A request that spans **several entities** is not one
slice — apply the scope check (§2 of
`${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`): decompose it into independent
pieces, agree on order, and produce a **sequential plan per piece** (one plan
per slice), starting with the first.

**Format check.** Run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/vwf:setup` (proceed unless a needed artifact
is missing).

### 2. Read desired vs actual

**Recall first.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall prior
decisions and plan rationale for this slice (rooms `decisions`, `planning`)
before computing anything — build on them, don't re-derive resolved choices.
Skip silently if mempalace is unavailable.

- **Desired:** the blueprint part for the slice, plus `conventions.md`, the
  registry, the **Acceptance blocks of any `integration.md` flow this slice
  touches** (the criteria the cycle must land), and — when the slice consumes
  external credentials/env vars — `docs/blueprint/environment.md` (the variables
  it must read).
- **Actual:** the real code in the submodule(s) the registry maps this slice to
  (resolve section→project by `type` and `doc_unit`, as in `blueprint` §2).

### 3. Compute the delta only

Determine what already exists, what is missing, what must change, and the order
to do it in. Reference blueprint sections; do not restate them.

**Dependency closure.** A slice is planned **in full**, including what it stands
on: from the slice's blueprint Relationships/References and the `integration.md`
flows it touches, collect every entity this slice depends on, and compute
desired-vs-actual for each — **transitively** (a dependency's dependencies too).
Any dependency with an unimplemented delta is **included in this plan** as
leading steps, ordered before the steps that need it (planning `operator` while
`settings` is unbuilt pulls the `settings` delta into the `operator` plan —
otherwise the cycle ships `operator` with a hole where `settings` should be).
List each included dependency in the plan's Slice section with a link to its
blueprint; the approval gate (§8) is where the user vetoes scope. Depended-on
work that is already implemented is not restated — closure pulls in deltas, not
history.

Apply the **minimalism decision ladder** in
`${CLAUDE_PLUGIN_ROOT}/assets/minimalism.md` as you size each step: include a
step only if a blueprint requirement needs it (rung 1), and prefer reusing
existing code, the stdlib, a native platform feature, or an installed dependency
over new code or a new dependency (rungs 2–5). The plan carries no speculative
steps and no unrequested abstraction or configurability — never at the cost of a
safety guardrail.

**Harness preflight.** Per `${CLAUDE_PLUGIN_ROOT}/assets/harness.md`, work out
which harness capabilities this slice's gates will need (acceptance criteria →
`e2e_local` + `local_stack`; changed screens in a web UI → `dev` +
`screenshots`; a touched cloud project → `health`; flows + a deploy target →
`e2e_staging`). Read the `.config/vwf.yaml` `harness:` block (plus any
per-project `projects.<name>.harness` override) and **re-verify just those**
against the repo (the stamp may be stale). For each one missing, **inject a
bootstrap step** into the ordered steps — the coder builds it under the normal
pipeline. Harness steps are gate-required guardrails: the minimalism ladder
never strikes them, and they order **before** the steps whose verification
depends on them.

### 4. Route blueprint gaps back; flag drift

**A blueprint gap goes back to the blueprint — before the plan is written.**
When diffing or elicitation exposes a hole in the *contract* — a behaviour the
blueprint never pinned down, a missing relationship, flow, or acceptance
criterion, a surface the slice needs that no doc specifies — do **not** settle
it inside the plan and do not park it under Risks: pause, present the gap, and
offer `/vwf:blueprint <entity>` (or `/vwf:architecture` for a registry hole).
After that pass lands (and re-stamps coverage), re-derive the affected part of
the diff (§§2–3) against the updated contract. A plan written over a known
blueprint gap defeats execute's autonomy: execute would hit the same hole
mid-run and could only document it as a gap, where the contract should already
have answered it.

If the blueprint implies a surface the registry/code lacks (e.g. a background
job with no worker project), **surface it** under Risks / drift rather than
silently resolving it.

**Consume execution-surfaced gaps.** If a prior plan for this slice exists —
**the most recent un-archived plan for the slice** (filenames are timestamped,
so several may share a slice; take the latest one still under `docs/plans/`, not
`archived/`) — read its "Gaps surfaced during execution" section, and per
`${CLAUDE_PLUGIN_ROOT}/assets/memory.md` recall room `gaps` for the slice. When
this plan is a reconcile loop-back from `/vwf:execute`, closing those plan holes
is the point of the pass — fold each into the ordered steps (against the
now-updated blueprint) rather than re-deriving blind. Skip the recall silently
if mempalace is unavailable.

### 5. Elicit open decisions

The plan is a diff — most of it is mechanical. But where the blueprint
underdetermines **how** to land a change (step ordering with competing valid
sequences, how to resolve a drift the §5 step surfaced, an ambiguous delta with
more than one reasonable implementation path), elicit it per the protocol — one
question at a time, MCQ + "Other", proposing 2-3 approaches with a
recommendation. Apply the decisions-vs-mechanics filter: if exactly one
idiomatic path exists given the blueprint, conventions, and code, don't ask —
proceed. Never guess — and apply the **what-vs-how test**: a question about what
the product should *do* (behaviour, contract, data shape, acceptance) is a
blueprint gap — route it per §4, never settle it here. An approved plan carries
no unresolved decisions; Risks / drift holds risks and noted drift, not open
questions execute would trip on.

### 6. Setup (git-workflow)

Everything above (§§2–5) reads the blueprint and code from the **current
checkout** and is read-only — no worktree needed yet. Now, just before the only
write, invoke `/vwf:git-workflow` to ensure an isolated worktree. All git
actions in this command go through `git-workflow`. Keep the worktree **local** —
never push remotely here.

### 7. Write the plan

Write `docs/plans/<date>-<time>-<slice>.md` from the plan template — including
its **OKF frontmatter** (`type: vwf-plan`, `title`, `description`, `status`;
optional `timestamp`) and a markdown link to the blueprint slice in the Slice
section (plus one line per dependency the closure pulled in, each linked) —
steps ordered for TDD, each naming the failing test that defines "done".

**Acceptance criteria.** Copy the Acceptance blocks of the flows this slice
touches **verbatim** into the plan's "Acceptance criteria (from blueprint)"
section (with a link to each flow), and make sure the ordered steps include the
**E2E tests** that cover each criterion — the coder implements them like any TDD
step; `execute`'s acceptance stage independently maps and runs them. A criterion
no step covers is a hole in the plan, not something to defer. When the slice
maps to no flow, write `none — no flow touched`.

### 8. Approval gate

Present the plan and wait for explicit approval. Offer three paths: **Approve &
execute** (commit the plan per §9, then hand straight into `/vwf:execute` — the
common case), **Approve only** (commit and stop), or **Reject**.

**If rejected at the gate**, take one of two paths — never let the plan doc
silently linger:

- **Revise** — the user gives feedback → apply it (re-reading code as needed)
  and re-present, looping until approved or abandoned.
- **Abandon** — the user drops the slice → leave the plan doc **uncommitted**,
  state its exact path, and offer (via `/vwf:git-workflow`) to remove it and the
  worktree. Do not commit an abandoned plan.

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store the approved
plan's durable "how to land it" decisions and any deliberately deferred options
to mempalace (room `planning`) — skip what the plan doc captures verbatim, and
skip silently if mempalace is unavailable.

### 9. Commit (git-workflow)

After approval, commit the plan via `/vwf:git-workflow`. Use a
`blueprint(plan):` or `docs(plan):` message. Keep the worktree **local**. Do not
run raw git here.
