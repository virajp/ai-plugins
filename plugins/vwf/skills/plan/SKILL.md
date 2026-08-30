---
name: plan
description: Produce reviewable cycle plans as diffs for one slice of the
  blueprint (a flow or an entity). Reads desired (blueprint) vs actual (code),
  writes only the delta to docs/plans/<date>-<time>-<slice>.md. Resolves the
  slice's transitive dependency chain and plans each unimplemented dependency
  as its own plan doc first, in order; routes any blueprint gap it uncovers
  back through /vwf:blueprint before writing — so no cycle builds on a gap.
  Requires the blueprint coverage stamp to read complete, and halts on any
  /vwf:doctor blocking finding across the chain's projects.
argument-hint: "[flow/<name> | entity/<name> | <name>]"
model: opus
effort: high
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

| Doc            | Path                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| Registry       | `docs/blueprint/registry.yaml`                                                      |
| Conventions    | `docs/blueprint/conventions.md`                                                     |
| Flow (slice)   | `docs/blueprint/flows/<project>/<NNN>-<flow>/` (`index.md` + `<platform>.md` files) |
| Entity (slice) | `docs/blueprint/entities/<entity>/` (`index.md` + schema)                           |
| API contract   | `docs/blueprint/apis/<project>.openapi.yaml`                                        |
| Released APIs  | `docs/blueprint/apis/released/`                                                     |
| Plan           | `<target-repo>/docs/plans/<date>-<time>-<slice>.md` — **the repo whose code it changes** |
| Plan index     | `docs/plans/index.md` (base repo) — one row per plan: plan, target repo, status      |
| Plan template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/plan.md`                                    |
| Membership     | `${CLAUDE_PLUGIN_ROOT}/assets/membership.md`                                        |

## References

| Reference                                    | When to read                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [§3 conditional checks](references/delta-checks.md) | While working §3 — stamp-heal (empty delta), the released-contract check (a touched `apis/released/` snapshot), the harness preflight (always), and the visual-review advisory (a flow with platform files) |
| [Writing the plan doc](references/plan-doc.md)      | At §7, once the delta is computed and every decision is settled — the doc's frontmatter, chain position, and acceptance-criteria transcription |

---

## Pipeline

### 1. Resolve the slice

**Coverage gate.** Read the `blueprint:` block in `.config/vwf.yaml` (per the
vwf-config asset). **Halt unless `coverage: complete`:** "The blueprint is not
complete (`<remaining list, or 'never swept'>`). Run `/vwf:blueprint` to finish
the sweep — a plan cut from a partial blueprint builds gaps into the code." A
missing block means no sweep has stamped this repo yet — same halt.

The slice is a single unit from `$ARGUMENTS`: `flow/<name>`, `entity/<name>`, or
a bare `<name>` — resolve a bare name against `docs/blueprint/flows/` first
(matching the flow **slug**, ignoring the project group and `NNN-` prefix —
`signin` matches `flows/app/020-signin/`; the same slug in two projects → MCQ),
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
  `product.md`, `architecture.md`, or `registry.yaml` (references, not buildable
  units).

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

**Member gate.** Before the stack gate, resolve which repo each chain project
lives in, per `${CLAUDE_PLUGIN_ROOT}/assets/membership.md`. For every repo not on this
machine, say what it is needed for and **offer a consent-gated clone**. On
accept, clone and continue. **On decline, continue with that project excluded
and record the blind spot** — name every uninspected project in the §8 approval
presentation *and* in the plan doc's Risks section, so a reader knows the delta
was computed without seeing them. A plan written against incomplete knowledge is
useful; one that looks complete is not.

**Stack gate.** Once the chain is approved, run `/vwf:doctor` scoped to every
registry project the chain's elements map to **that is present on this machine**,
and **halt on any `blocking`
finding** — report it with its remedy and stop. An absent, declined project is
skipped rather than blocking: it is already recorded as a blind spot, and
halting on a repo the user chose not to clone would override the consent they
just gave. A stack no installed plugin
defines (an **unknown** language, a `custom` template pin) is the finding this
gate exists for: a plan's steps are sized against the selected templates'
conventions, and when there is no template there are no conventions — the plan
would read as ordinary while resting on nothing
(`${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`).

**An `unresolved` axis halts too, and doctor is not what catches it** — doctor
reports deferral as a degradation, deliberately, since defining a product with
no stack chosen is a supported state. The halt belongs to the step below and
fires there, before any adapter is called: see *Resolving the conventions* in
`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`, step 1. Report it
**distinguishably from a failed fetch** — one is a question nobody answered and
points at `/vwf:architecture`, the other is a plugin that broke.

Three things about its placement and scope, each deliberate:

- **Here, not in §1.** The scope is the *chain's* projects, not the requested
  slice's — a dependency planned into another project must be gated too, and
  which projects those are is not known until the chain resolves.
- **Before §3, because §3 is the expensive part.** The surveyor is the largest
  inline read in the workflow; halting after it would spend exactly the work the
  gate exists to avoid.
- **Blocking only.** Unlike `/vwf:execute` this gate does **not** ask about a
  missing LSP server, and notes the rest rather than acting on it: planning
  compiles nothing, so an absent toolchain is `execute`'s question to ask, not
  this command's to ask twice.

This is a delegation, never a second copy of the rule — the finding kinds and
their remedies live in `doctor` alone, so closing the menu further never means
editing this file.

**Resolve the stack conventions.** With the gate clean, fetch the `conventions:`
prose for every template the chain's projects pin, per *Resolving the
conventions* in `${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md` — deduped by
slug, **once for the whole chain**, before §3. Its step 1 is where an
`unresolved` axis halts, ahead of any fetch. The config block names the
templates; only the plugin holds what they say, and the *how* questions this
command settles — where a file goes, what a test looks like, which existing
shape to extend — are answered by that prose. Sizing steps without it is
guessing at a layout the repo already has an opinion about.

Once per chain rather than per element, because every element of a chain sits in
the same few projects and the prose cannot change between them. Hold the result
for §§3–7.

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
  to (resolve section→project by `role` and `doc_unit`, as in `blueprint` §2).

**Delegate the survey.** Dispatch a fresh `plan-surveyor` subagent per chain
element rather than reading the codebase yourself — this is the largest inline
read in the workflow, and everything it loads would otherwise tax every
subsequent turn of the pass. Pass it the element's blueprint doc path(s), the
registry `projects:` block, **each project's `stack` block** from
`.config/vwf.yaml` (the registry carries none — the surveyor's Inputs require
it, and it is what lets a reuse candidate be recognised as one), the relevant
`conventions.md` anchors, and the API contract path(s) the element references.

The resolved **stack conventions prose** stays here rather than going with it.
The surveyor answers *what exists*; the prose answers *where a new thing
belongs*, which is this command's question when it sizes the steps. Sending it
along would grow the workflow's largest read to settle a question the surveyor is
not asked. It surveys **graph-first** per
`${CLAUDE_PLUGIN_ROOT}/assets/graphify.md` (falling back silently to direct
reads when no graph is reachable) and returns terse `PRESENT:` / `PARTIAL:` /
`ABSENT:` / `REUSE CANDIDATES:` / `CONTRADICTIONS:` / `HARNESS:` lines with
`file:line` pointers — never code. When a chain has several unimplemented
elements, **dispatch their surveyors in a single message** so they run
concurrently.

Read a pointed-at file yourself only when a specific decision genuinely needs
its contents. From the surveyor's return, determine what must change and the
order to do it in. Reference blueprint sections; do not restate them.

A `CONTRADICTIONS:` entry is never resolved in the plan — route it per §4, like
any blueprint gap. `HARNESS:` seeds the preflight below.

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

**Then run the four checks** in
[§3 conditional checks](references/delta-checks.md) — stamp-heal, the
released-contract check, the harness preflight, and the visual-review advisory.
The harness preflight fires on every element; the other three only when their
condition holds.

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
actions in this command go through /vwf:git-workflow. Keep the worktree **local** —
never push remotely here.

### 7. Write the plan

Write `docs/plans/<date>-<time>-<slice>.md` from the plan template, following
[Writing the plan doc](references/plan-doc.md) — the OKF frontmatter (`covers:`
and `requires:` in particular), the chain position, TDD-ordered steps, and the
verbatim acceptance-criteria transcription.

**Into the repo whose code this plan changes.** In a `repo` or `monorepo`
topology that is the one checkout and the rule costs nothing. In `multi-repo` it
is the member holding the chain element's project — resolve it from `members:`
per `${CLAUDE_PLUGIN_ROOT}/assets/membership.md`. A chain spanning two members already
produces one plan per element, so each simply lands in its own repo; a plan is
never split across repos.

Then **append a row to `docs/plans/index.md` in the base repo** — the plan's
filename, its target repo, and its status. That index is the only place the
product's plans are visible as a set, and it is what
`/vwf:archive` and `/vwf:execute` read to find a
plan without walking every member.

**The dependency gate does not move.** `execute` halts until every `requires:`
plan's `covers:` docs read `implementation: complete`, and those stamps live in
the blueprint — in the base repo. So the chain resolves from the base alone even
when the upstream plans sit in members that are not cloned here.

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
