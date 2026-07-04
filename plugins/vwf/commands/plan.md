---
description: Produce a reviewable cycle plan as a diff for one slice of the
  blueprint
  (an entity or a section). Reads desired (blueprint) vs actual (code), writes only
  the delta to docs/plans/<date>-<time>-<slice>.md. Requires a blueprint to exist.
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

| Doc               | Path                                                       |
| ----------------- | ---------------------------------------------------------- |
| Registry          | `docs/blueprint/architecture.md`                           |
| Conventions       | `docs/blueprint/conventions.md`                            |
| Blueprint (slice) | `docs/blueprint/<entity>.md` or `docs/blueprint/<entity>/` |
| Plan              | `docs/plans/<date>-<time>-<slice>.md`                      |
| Plan template     | `${CLAUDE_PLUGIN_ROOT}/assets/templates/plan.md`           |

---

## Pipeline

### 1. Resolve the slice

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

### 4. Flag drift

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
proceed. Never guess; record a genuinely open item under Risks / drift.

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
section — steps ordered for TDD, each naming the failing test that defines
"done".

**Acceptance criteria.** Copy the Acceptance blocks of the flows this slice
touches **verbatim** into the plan's "Acceptance criteria (from blueprint)"
section (with a link to each flow), and make sure the ordered steps include the
**E2E tests** that cover each criterion — the coder implements them like any TDD
step; `execute`'s acceptance stage independently maps and runs them. A criterion
no step covers is a hole in the plan, not something to defer. When the slice
maps to no flow, write `none — no flow touched`.

### 8. Approval gate

Present the plan and wait for explicit approval before `/vwf:execute`.

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
