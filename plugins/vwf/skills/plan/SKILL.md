---
name: plan
description: Produce reviewable cycle plans as diffs for one slice of the
  blueprint (a flow or an entity). Reads desired (blueprint) vs actual (code),
  writes only the delta to docs/plans/<date>-<time>-<slice>.md. Resolves the
  slice's transitive dependency chain and plans each unimplemented dependency
  as its own plan doc first, in order; routes any blueprint gap it uncovers
  back through /vwf:blueprint before writing — so no cycle builds on a gap.
  Requires the blueprint coverage stamp to read complete.
argument-hint: "[flow/<name> | entity/<name> | <name>]"
model: sonnet
effort: xhigh
disable-model-invocation: false
---

# plan — Cycle Plans (Diffs, Chained by Dependency)

Produce reviewable cycle plans for a chosen slice of the blueprint. A plan is a
**diff**: it reads the blueprint (desired state) and the actual code (actual
state) for one slice and writes only the delta — what exists, what is missing,
what changes, and in what order — as a reviewable artifact ordered for TDD.

A slice is never planned over unbuilt ground: the slice's **dependency chain**
is resolved first, and every dependency with an unimplemented delta gets **its
own plan doc**, planned and approved before the slice that stands on it — small,
focused plans executed in order, instead of one plan swallowing its
dependencies.

You own the user conversation and the approval gates. Do **not** restate the
blueprint; reference it.

Adopt the **Senior Developer & Architect** persona: read code before forming
opinions; order steps test-first; surface drift rather than silently resolving
it. When a planning decision is genuinely open, elicit it following the
**elicitation protocol** in `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`.

## Doc Paths

| Doc            | Path                                                      |
| -------------- | --------------------------------------------------------- |
| Registry       | `docs/blueprint/architecture.md`                          |
| Conventions    | `docs/blueprint/conventions.md`                           |
| Flow (slice)   | `docs/blueprint/flows/<flow>/index.md`                    |
| Entity (slice) | `docs/blueprint/entities/<entity>/` (`index.md` + schema) |
| API contract   | `docs/blueprint/apis/<project>.openapi.yaml`              |
| Released APIs  | `docs/blueprint/apis/released/`                           |
| Plan           | `docs/plans/<date>-<time>-<slice>.md`                     |
| Plan template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/plan.md`          |

---

## Pipeline

### 1. Resolve the slice

**Coverage gate.** Read the `blueprint:` block in `.config/vwf.yaml` (per the
vwf-config asset). **Halt unless `coverage: complete`:** "The blueprint is not
complete (`<remaining list, or 'never swept'>`). Run `/vwf:blueprint` to finish
the sweep — a plan cut from a partial blueprint builds gaps into the code." A
missing block means no sweep has stamped this repo yet — same halt.

The slice is a single unit from `$ARGUMENTS`: `flow/<name>`, `entity/<name>`, or
a bare `<name>` — resolve a bare name against `docs/blueprint/flows/` first,
then `docs/blueprint/entities/`; if both exist, ask (MCQ). There is no `api/`
slice — an API contract change rides the flow or entity plan that needs it.
**Halt if no blueprint doc exists** for the slice: "No blueprint found for
`<slice>`. Run `/vwf:blueprint` first." A request that spans **several flows**
is not one slice — apply the scope check (§2 of
`${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`): decompose it, agree on order,
and run this pipeline per slice.

**Format check.** Run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/vwf:setup` (proceed unless a needed artifact
is missing).

### 2. Resolve the dependency chain

**Recall first.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall prior
decisions and plan rationale for this slice (rooms `decisions`, `planning`)
before computing anything — build on them, don't re-derive resolved choices.
Skip silently if mempalace is unavailable.

Derive the slice's dependency graph from the blueprint's typed links:

- **Dependency edges:** a flow's Steps/Screens links to entities; a flow's link
  to a precondition flow; an entity's Relationships links to entities.
- **Not dependencies:** `Used by:` back-links (they invert the edge and would
  make every pair a cycle) and links to `conventions.md`, `design-system.md`,
  `product.md`, or `architecture.md` (references, not buildable units).

Traverse **transitively**. Prune every reached doc whose frontmatter reads
`implementation: complete` — and stop traversing through it (its own
dependencies are already built under it). What remains, plus the requested
slice, is the **chain**.

- **Cycles:** a strongly-connected component (e.g. two entities that reference
  each other) collapses into **one chain element** covering all its docs —
  planned together in a single plan; the only multi-doc plan.
- **Present the chain** in topological order, deepest dependency first, the
  requested slice last — one numbered line each:
  `1. entity/customer — implementation: none`, `2. flow/checkout — requested`.
  The user may **approve the chain**, **trim an element** (a conscious hole —
  record it under Risks / drift of every downstream plan in the chain), or
  **abort**. A chain of length 1 (no unbuilt dependencies) proceeds without
  ceremony.

Then run §§3–8 **once per chain element, in order** — each element produces its
own plan doc behind its own approval gate.

### 3. Read desired vs actual & compute the delta

- **Desired:** the blueprint docs for this element — a flow's doc plus the
  `schema.yaml` of each entity it links, the operations it names in
  `apis/<project>.openapi.yaml`, and its **Acceptance block** (the criteria the
  cycle must land); an entity's `index.md` + `schema.yaml` plus the API
  operations that serve it — plus `conventions.md`, the registry, and — when the
  element consumes external credentials/env vars —
  `docs/blueprint/environment.md`.
- **Actual:** the real code in the submodule(s) the registry maps this element
  to (resolve section→project by `type` and `doc_unit`, as in `blueprint` §2).

Survey the actual state **graph-first** per
`${CLAUDE_PLUGIN_ROOT}/assets/graphify.md`: when the repo carries a knowledge
graph, ask it what already realizes this element — which modules, routes, jobs,
and screens exist, where they live, who calls them — and read the files it
points to; fall back silently to direct reads when no graph is reachable. The
graph orients the survey; the delta itself is always computed from the files.

Determine what already exists, what is missing, what must change, and the order
to do it in. Reference blueprint sections; do not restate them.

**Stamp-heal.** If the element's computed delta is **empty** — the code already
conforms though the stamp reads `none`/`partial` — offer (user-confirmed, never
silent) to set that doc's `implementation: complete` (a state-only frontmatter
edit, committed via `/vwf:git-workflow`) and drop the element from the chain.
This self-heals conservative stamps.

**Released-contract check.** When the delta touches an
`apis/<project>.openapi.yaml` that has a released snapshot (latest = highest
semver under `apis/released/`), verify the desired change is additive per the
rest-api-design skill (reference 8). A breaking desired change is a blueprint
problem — route it per §4 (the sweep's coherence review enforces the
major-version bump); never plan code that breaks a released contract.

Apply the **minimalism decision ladder** in
`${CLAUDE_PLUGIN_ROOT}/assets/minimalism.md` as you size each step: include a
step only if a blueprint requirement needs it (rung 1), and prefer reusing
existing code, the stdlib, a native platform feature, or an installed dependency
over new code or a new dependency (rungs 2–5). The plan carries no speculative
steps and no unrequested abstraction or configurability — never at the cost of a
safety guardrail. Every **new third-party dependency** a step introduces is
named explicitly in that step (package + what it's for): the plan's approval
gate is where the user consents to new dependencies, and execute never installs
one the plan doesn't name.

**Harness preflight.** Per `${CLAUDE_PLUGIN_ROOT}/assets/harness.md`, work out
which harness capabilities this element's gates will need (acceptance criteria →
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
criterion, a schema property or API operation the element needs that no doc
specifies — do **not** settle it inside the plan and do not park it under Risks:
pause, present the gap, and offer `/vwf:blueprint <flow|entity>` (or
`/vwf:architecture` for a registry hole). After that pass lands (and re-stamps
coverage), re-derive the affected part of the diff (§3) against the updated
contract. A plan written over a known blueprint gap defeats execute's autonomy:
execute would hit the same hole mid-run and could only document it as a gap,
where the contract should already have answered it.

**Drift: the blueprint is the source of truth — code follows.** When the code
**contradicts** the blueprint (not merely lags it), never adjust the blueprint
to match the code silently. Either the plan carries steps that conform the code,
or the user consciously amends the contract via `/vwf:blueprint` (which demotes
the doc's `implementation:` stamp). List every contradiction under Risks / drift
with the conforming step (or the amendment decision) that resolves it. If the
blueprint implies a surface the registry/code lacks (e.g. a background job with
no worker project), surface that there too.

**Consume execution-surfaced gaps.** If a prior plan for this slice exists —
**the most recent un-archived plan** (filenames are timestamped; take the latest
one still under `docs/plans/`, not `archived/`) — read its "Gaps surfaced during
execution" section, and per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md` recall room
`gaps` for the slice. When this plan is a reconcile loop-back from
`/vwf:execute`, closing those plan holes is the point of the pass — fold each
into the ordered steps (against the now-updated blueprint) rather than
re-deriving blind. Skip the recall silently if mempalace is unavailable.

### 5. Elicit open decisions

The plan is a diff — most of it is mechanical. But where the blueprint
underdetermines **how** to land a change (step ordering with competing valid
sequences, how to resolve a drift §4 surfaced, an ambiguous delta with more than
one reasonable implementation path), elicit it per the protocol — one question
at a time, MCQ + "Other", proposing 2-3 approaches with a recommendation. Apply
the decisions-vs-mechanics filter: if exactly one idiomatic path exists given
the blueprint, conventions, and code, don't ask — proceed. Never guess — and
apply the **what-vs-how test**: a question about what the product should *do*
(behaviour, contract, data shape, acceptance) is a blueprint gap — route it per
§4, never settle it here. An approved plan carries no unresolved decisions;
Risks / drift holds risks and noted drift, not open questions execute would trip
on.

### 6. Setup (git-workflow)

Everything above (§§2–5) reads the blueprint and code from the **current
checkout** and is read-only — no worktree needed yet. Now, just before the first
write, invoke `/vwf:git-workflow` to ensure an isolated worktree. All git
actions in this command go through `git-workflow`. Keep the worktree **local** —
never push remotely here.

### 7. Write the plan

Write `docs/plans/<date>-<time>-<slice>.md` from the plan template — including
its **OKF frontmatter**: `type: vwf-plan`, `title`, `description`, `status`,
**`covers:`** (the blueprint doc(s) this element implements — one path, or the
cycle element's set), and **`requires:`** (the plan filenames of this element's
direct prerequisites in the chain — empty for the first). The Slice section
links the covered doc(s) and states the chain position ("Plan 2 of 3 — requires
`<file>`; required by `<file>`"; or "no dependency chain"). Steps are ordered
for TDD, each naming the failing test that defines "done".

**Acceptance criteria.** Copy the Acceptance blocks of the flow docs this
element touches **verbatim** into the plan's "Acceptance criteria (from
blueprint)" section (with a link to each flow), and make sure the ordered steps
include the **E2E tests** that cover each criterion — the coder implements them
like any TDD step; `execute`'s acceptance stage independently maps and runs
them. A criterion no step covers is a hole in the plan, not something to defer.
When the element maps to no flow, write `none — no flow touched`.

### 8. Approval gate (per chain element)

Present the plan and wait for explicit approval. Offer:

- **Approve & plan next** (mid-chain) — commit this plan per §9, proceed to the
  next chain element (§3).
- **Approve & execute** (the last element) — commit, then hand into
  `/vwf:execute` **for the first unexecuted plan of the chain** (execute
  enforces `requires:` order and offers each next plan as the previous one
  lands).
- **Approve only** — commit and stop (mid-chain: the rest of the chain stays
  unplanned; say so).
- **Reject** — then either **Revise** (apply feedback, re-present, looping until
  approved or abandoned) or **Abandon** (leave the plan doc **uncommitted**,
  state its exact path, offer via `/vwf:git-workflow` to remove it and the
  worktree — and abandon the chain's downstream elements too, since they stand
  on it). Never let a plan doc silently linger.

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store the approved
plan's durable "how to land it" decisions and any deliberately deferred options
to mempalace (room `planning`) — skip what the plan doc captures verbatim, and
skip silently if mempalace is unavailable.

### 9. Commit (git-workflow)

After each approval, commit that plan via `/vwf:git-workflow`. Use a
`blueprint(plan):` or `docs(plan):` message. Keep the worktree **local**. Do not
run raw git here.
