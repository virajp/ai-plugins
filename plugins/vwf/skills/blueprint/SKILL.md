---
name: blueprint
description: Maintain the always-current, full-product blueprint under
  docs/blueprint/ — flow docs as the primary unit, entity data contracts, and
  per-service OpenAPI contracts, plus conventions.md. Stack-agnostic; resolves
  section→project mapping from the architecture registry. Gated by fresh
  subagent completeness reviewers per doc and one whole-product coherence
  review at the end of the sweep. A run sweeps flow by flow until
  whole-product coverage holds, then stamps it in .config/vwf.yaml —
  /vwf:plan halts without a complete stamp.
argument-hint: "[flow | entity]"
model: sonnet
effort: xhigh
disable-model-invocation: false
---

# blueprint — Full-Product Blueprint (Flow-First)

Maintain the **whole product's** desired end state under `docs/blueprint/`. The
blueprint is product-wide and permanent — not feature-specific. It is organized
by **process**: the primary unit is the **flow** (a user or system journey to an
observable outcome), and flows are the goal-traceability spine — product goal →
flow → the entities, API operations, screens, and jobs the flow needs. Entities
are **supporting data contracts** the flows stand on.

The doc units:

- **Flow** — `docs/blueprint/flows/<flow>/index.md` (always `index.md` only; a
  flow too big for one file is several flows). `flows/index.md` is the thin
  catalog plus the cross-flow contracts.
- **Entity** — `docs/blueprint/entities/<entity>/`: always exactly `index.md`
  (lifecycle, relationships, invariants, concurrency) + `schema.yaml` (the
  authoritative data model). `entities/index.md` is the catalog plus the
  product-wide ER diagram.
- **API contract** — `docs/blueprint/apis/<project>.openapi.yaml`, one per
  registry `service` project; `apis/released/` holds the frozen production
  snapshots `/vwf:verify` writes.
- The `docs/blueprint/` **root holds only the system docs** (product,
  architecture, conventions, design-system, environment). A root
  `integration.md` or a flat/root entity folder is pre-format-9 drift;
  `/vwf:setup` migrates it.

**A run is a sweep, not a single flow.** The blueprint must describe the **whole
product's** as-of state before anything downstream consumes it — `/vwf:plan`
hard-halts unless the coverage stamp (§9) reads `complete`. A run therefore
works flow by flow (§§2–7 per flow) and does not end at one flow: it continues
down the coverage worklist (§1) until whole-product coverage holds **including a
clean whole-product coherence review (§8)**, or the user stops early — in which
case the stamp records `partial` with what remains, and planning stays blocked
until a later run finishes the sweep.

You own the user conversation. Elicitation is **interactive and stays with you**
— do not spawn a subagent for it (a subagent cannot pause to ask a question).
Only the completeness and coherence reviews are delegated, to fresh stateless
subagents.

Adopt the **Product & Engineering Author** persona: capture user goals and
observable outcomes precisely, then pin down the flows, data model, and API
surface without ambiguity. Surface open decisions rather than guessing.

## Doc Paths

| Doc              | Path                                                       |
| ---------------- | ---------------------------------------------------------- |
| Product          | `docs/blueprint/product.md`                                |
| Registry         | `docs/blueprint/architecture.md`                           |
| Conventions      | `docs/blueprint/conventions.md`                            |
| Design system    | `docs/blueprint/design-system.md`                          |
| Environment      | `docs/blueprint/environment.md`                            |
| Flow             | `docs/blueprint/flows/<flow>/index.md`                     |
| Flow catalog     | `docs/blueprint/flows/index.md`                            |
| Entity           | `docs/blueprint/entities/<entity>/` (`index.md` + schema)  |
| Entity catalog   | `docs/blueprint/entities/index.md`                         |
| API contract     | `docs/blueprint/apis/<project>.openapi.yaml`               |
| Released APIs    | `docs/blueprint/apis/released/`                            |
| Flow template    | `${CLAUDE_PLUGIN_ROOT}/assets/templates/flow.md`           |
| Flow-cat. templ. | `${CLAUDE_PLUGIN_ROOT}/assets/templates/flows-index.md`    |
| Entity template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/entity.md`         |
| Ent.-cat. templ. | `${CLAUDE_PLUGIN_ROOT}/assets/templates/entities-index.md` |
| Schema template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/schema.yaml`       |
| OpenAPI template | `${CLAUDE_PLUGIN_ROOT}/assets/templates/openapi.yaml`      |
| Conv. template   | `${CLAUDE_PLUGIN_ROOT}/assets/templates/conventions.md`    |
| Env. template    | `${CLAUDE_PLUGIN_ROOT}/assets/templates/environment.md`    |

Doctrine: the **blueprint-authoring** skill (contract-vs-realization,
flow-contract, entity-contract, api-and-schema-contracts, ui-ux-contract,
environment-catalog, frontmatter-and-links, quick-reference). API contracts also
apply the **rest-api-design** skill for endpoint contract depth.

Reserved names: `product`, `architecture`, `conventions`, `design-system`,
`environment`, `flows`, `entities`, `apis`, and `index` inside `flows/` /
`entities/` — a flow or entity folder never takes one of these.

---

## Pipeline

### 1. Read the product doc & registry

Read `docs/blueprint/product.md`. **Halt if it does not exist:** "No product doc
found. Run `/vwf:product` first — the blueprint needs the goals every flow must
trace to." Hold its goal anchors (`#goal-<slug>`) and slice priority: goals
anchor every flow's Purpose; the priority list is what you suggest when the user
asks what to blueprint next.

Read `docs/blueprint/architecture.md`. **Halt if it does not exist:** "No
registry found. Run `/vwf:architecture` first to bootstrap
`docs/blueprint/architecture.md`."

**Format check.** Run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/vwf:setup` (proceed unless a needed artifact
is missing).

**Build the coverage worklist.** Whole-product coverage holds when, all at once:

- every product goal (`#goal-<slug>`) is `Serves:`-linked by at least one flow;
- every flow doc is `status: reviewed` (it passed the reviewer loop);
- every entity a flow step, screen, or relationship points at is authored
  (`index.md` + `schema.yaml`) and `status: reviewed` (no "target not yet
  authored" holes);
- every `operationId` a flow references exists in the named
  `apis/<project>.openapi.yaml`;
- every registry project's surfaces are represented per its `doc_unit`
  (`N/A — <reason>` counts as represented);
- the whole-product **coherence review** (§8) returned `NO GAPS` since the last
  content change.

List every flow and entity that fails a check, **flows first**, ordered by the
product doc's slice priority — this is the run's worklist. The sweep's spine is
goals → flows: entities, schemas, and API operations are derived from the flows
that need them, never authored speculatively. Deciding whether a goal genuinely
needs a *new* flow (vs. an existing one extended) is elicitation, not inference:
when a goal is unserved, ask.

If `$ARGUMENTS` named a flow or entity, start there (prepend it to the
worklist); otherwise start at the top. An empty worklist with a named unit means
a targeted update — do it, then re-check coverage in §7 (an update can open new
holes, e.g. a step referencing a not-yet-authored entity), and re-run coherence
(§8) before re-stamping `complete`.

### 2. Determine surfaces

From the flow's nature and the registry, determine which sections apply. Map
**by project `type`, never by literal technology**:

| Flow section    | Resolves to (registry `type`)                    |
| --------------- | ------------------------------------------------ |
| Steps (API ops) | service/API project(s) — via `apis/<project>`    |
| Background Jobs | worker project(s)                                |
| Screens         | UI project(s) (`site`, `frontend`, or `console`) |
| Entity schemas  | the schema/contract package                      |

If a type is absent from the registry, **omit** that section for this flow.

**Platform extensions.** Read `.config/vwf.yaml` `projects.<name>.platforms`
(per the vwf-config asset). When a UI project declares targets beyond its
stack's default, the Screens elicitation covers what genuinely differs per
platform — navigation/input idiom, window/layout behavior, platform-specific
states — and records only the differences, never a per-platform copy.

**Doc unit.** Each registry project declares a `doc_unit` (`entity` / `page` /
`module`). Under format 9 these map as: `page` doc units (typically a `site` or
`console`) are authored as **flows** — a page journey is a flow; `module` doc
units (typically `packages`) stay under `entities/` — a module boundary is a
supporting contract, with `schema.yaml` written as `N/A — <reason>` when the
module has no data shape. The same section structure and completeness bars
apply; an inapplicable surface is `N/A — <reason>`, never silently omitted.

**Design-system gate.** If the flow has a **Screens** section (the registry has
a `site`, `frontend`, or `console` project), `docs/blueprint/design-system.md`
must exist. **Halt if it does not:** "This flow has UI but no design system. Run
`/vwf:design-system` first." Screens reference the design system; they never
re-decide visual language.

### 3. Interactive elicitation (orchestrator)

**Recall first.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall prior
decisions, drift, and unreconciled gaps for this flow/entity (rooms `decisions`,
`problems`, `gaps`) before eliciting — build on them and don't re-ask resolved
questions. When execution surfaced a blueprint gap (room `gaps`), treat closing
it as a first-class goal of this pass. Skip silently if mempalace is
unavailable.

Adopt the authoring persona and elicit following the **elicitation protocol** in
`${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md` (explore → scope-check → one
question at a time → propose 2-3 approaches → present in sections → gate →
self-review). Elicit the flow first — trigger, actors, steps to the observable
outcome, consistency, failure/compensation, screens, jobs, acceptance — then pin
down what it stands on (entity shapes, API operations). Where a cross-cutting
decision surfaces, fill the conventions skeleton.

Blueprint-specific notes layered on the protocol:

- **Apply the `blueprint-authoring` skill:** the contract-vs-realization line
  (record only decisions true regardless of how the code is written today; leave
  reuse/placement/ordering/library choices to `plan`), plus the per-surface bars
  — **flow-contract** (steps, consistency, failure, idempotency, acceptance, the
  screen home rule), **entity-contract** (lifecycle, relationships,
  concurrency), **api-and-schema-contracts** (schema.yaml and OpenAPI bars), and
  per-screen **UI/UX** (referencing the design system, not re-deciding it).
- **Decisions-vs-mechanics (protocol §4):** spend the precision budget on the
  flow's Steps + Acceptance and on `schema.yaml` / the OpenAPI operations; the
  Purpose half may stay prose-light.
- **Apply the `product-foundations` skill** for every foundation the registry's
  `cross_cutting` block accepted: expand its contract into `conventions.md`
  under the anchor its reference names (on first touch), and elicit the per-flow
  surface as the flow is authored — audit-recorded markers on Trigger & Actors
  rows and steps (all operator + destructive triggers by default), notification
  triggers, **sync/async classification per mutating step with worker-vs-service
  placement** decided on the flow's Background Jobs table (apply the placement
  rule; MCQ only when both placements are defensible), and the runtime-settings
  keys the flow reads. Foundations expand into existing sections — never new
  mandatory structure.
- **Approaches (protocol §5):** where a flow, data-model, or API shape has
  competing designs (e.g. embed vs reference, sync vs async surface), present
  the options before committing.
- Minimalism rung 1 (`${CLAUDE_PLUGIN_ROOT}/assets/minimalism.md`, applied to
  requirements) and the protocol's scope check (§2, one flow per pass) carry
  over unchanged.

### 4. Write the docs

Open every markdown doc with the **OKF frontmatter** block (`type`, `title`,
`description`, `status`; flow/entity docs also carry `implementation` — **never
set or change it here**: it is the pipeline's build-state stamp, seeded by setup
and written by execute; a new doc starts at `implementation: none`). Write links
as resolving markdown links per the blueprint-authoring
**frontmatter-and-links** reference. Set `status: draft` until the reviewer loop
(§5) returns `NO GAPS`, then `reviewed`.

Write, from the templates:

- **The flow** — `flows/<flow>/index.md`, every applicable section (§2). Every
  step names its actor and links the entity/service it touches; API-backed steps
  name an `operationId`. **Every flow carries an Acceptance block** — at least
  one success and one failure/compensation criterion as observable
  Given/When/Then; these are what `plan` turns into E2E test steps and
  `execute`'s acceptance stage verifies. Screens obey the **home rule** (a
  screen is defined in exactly one flow; other flows link it).
- **What it stands on** — for each entity a step references: create or extend
  `entities/<entity>/index.md` + `schema.yaml`; for each `operationId`: add or
  extend the operation in `apis/<project>.openapi.yaml` (from the OpenAPI
  template when the file is new). A flow-step state change must match a
  transition in the entity's Lifecycle table — add the transition or fix the
  step, never leave them disagreeing. Set each entity's `Used by:` line to the
  flows that reference it.
- **The catalogs** — update the flow's row in `flows/index.md` (create from the
  flows-index template if missing) and, when relationships changed, the
  `erDiagram` in `entities/index.md` (create from the entities-index template)
  so it stays the exact union of the Relationships tables.
- **Conventions** — update `docs/blueprint/conventions.md` for any cross-cutting
  decision raised.

**Released-contract guard.** When editing an `apis/<project>.openapi.yaml` that
has a released snapshot under `apis/released/` (latest = highest semver in its
filename), changes must be **additive-only** per the rest-api-design skill
(reference 8) — or the contract takes an explicit major-version bump
(`info.version` major + `/vN` paths), elicited with the user, never assumed.
This is a hard bar; the coherence review (§8) re-checks it.

**Environment & secrets.** If this pass introduces an external integration or a
credential/env var a project must consume, maintain
`docs/blueprint/environment.md` — create it from the environment template if it
does not yet exist, then add/update a row per variable under its consuming
project (name, purpose, issuer, used-by, required, classification), **never the
value**. Apply the blueprint-authoring **environment-catalog** reference;
`environment.md` defers the injection mechanism to `conventions.md#config`.

**Self-review before the reviewer.** Run the elicitation protocol's self-review
pass (§8) over every written doc — no `TBD`/`TODO`/placeholder outside Open
Questions, no section contradicting another, no requirement reading two ways,
frontmatter and links filled, YAML artifacts parse — and fix inline before
dispatching the reviewer. Don't burn a reviewer round on trivia.

### 5. Reviewer loop (fresh subagent)

Loop until each written doc passes. Dispatch a **fresh** `blueprint-reviewer`
subagent (stateless) per doc, naming its **mode**:

- **Flow mode** — pass the flow doc, the relevant `conventions.md` anchors and
  registry block, the **product doc's goal-anchor list** (names only), the
  names-only lists of existing flow and entity docs, and the path of each
  `apis/*.openapi.yaml` the flow references (for operationId existence checks).
- **Entity mode** — pass the entity's `index.md` **and** `schema.yaml`, the
  relevant `conventions.md` anchors and registry block, and the names-only lists
  of existing flow and entity docs (so it can verify `Used by:` and relationship
  links resolve).

No conversation context either way. The reviewer checks the doc against the
checklist in its own instructions, **verifies every outbound link resolves on
disk**, and returns `NO GAPS` or a numbered gap list. Tell it the doc's
`doc_unit` so it accepts an explicit `N/A — <reason>` on unit-inapplicable
surfaces (§2). The names-only lists let it separate a broken/wrong-path link
from a link to a not-yet-authored doc: the latter comes back as a gap of kind
"target not yet authored", which you present to the user and may accept (it
lands on the worklist).

**Gaps** → present them, re-elicit the specific open decisions with the user
(one at a time), update the doc, dispatch a fresh reviewer. **`NO GAPS`** → set
`status: reviewed`, exit.

**Convergence guard:** before another round, compare to the prior round. Pause
and ask the user if the gap count did not strictly decrease, or a resolved gap
resurfaced. No fixed round cap.

### 6. Reconcile architecture & persist

If the blueprint's project or capability shape changed (a new project,
capability, or cross-cutting decision implied by this pass), update the
**registry block** in `docs/blueprint/architecture.md` precisely — via
`/vwf:architecture` if the change is non-trivial. When this pass added a
cross-cutting decision to `conventions.md`, check the registry's `cross_cutting`
block covers it and reconcile any mismatch.

**Demote the build stamp.** If this pass **materially changed the contract
content** of a flow or entity doc whose frontmatter reads
`implementation: complete`, set it to `implementation: partial` — the contract
moved, so the code is no longer known to match; the next `/vwf:plan` for that
slice picks up the delta. (State-stamp edits are the only frontmatter the sweep
changes outside `status:`.)

**Drop the canvas stamp.** If this pass changed a flow's `## Screens` section
and `.config/vwf.yaml` lists that flow under `design.flows_pushed`, remove it —
the canvas cards no longer show the contract; the next `/vwf:mockups <flow>`
re-pushes and re-lists it. (Like the build stamp: a state-only edit, riding the
same commit.)

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store this pass's
durable decisions and their rationale, plus any drift flagged, to mempalace
(rooms `decisions`, `problems`) — skip what the docs already capture verbatim.

### 7. Reconcile inbound links (rename / delete) & continue the sweep

When this pass **renames** or **removes** a flow or entity, no dangling OKF edge
may be left behind. Grep `docs/blueprint/` (both catalogs, every flow and entity
folder, `conventions.md`, `environment.md`) and the active plans under
`docs/plans/` (including their `covers:` frontmatter) for inbound links to the
old doc.

- **Rename** → update every inbound link (and the catalogs) in this same pass.
- **Delete** → list every inbound link and require the user to resolve each
  (re-point to another doc, or remove it) before the commit. A step or
  relationship pointing at a deleted doc is never left dangling.

**Approval & continuation.** Summarize what was written/changed (flow, entities
touched, schema/API deltas, conventions, registry, catalogs, link fixups) and
wait for explicit approval. After approval, re-derive the coverage worklist (§1)
— this pass may have closed holes or opened new ones. If units remain, proceed
to the next (back to §2) — one flow per pass, each behind its own approval. The
user may stop early; note what remains in the approval summary and the commit
message, and stamp accordingly (§9). Never trim the worklist to end sooner —
coverage is checked, not negotiated.

### 8. Whole-product coherence review (before a `complete` stamp)

When the worklist is otherwise empty, dispatch the
**`blueprint-coherence-reviewer`** subagent (stateless, fresh) once over the
whole bundle. Pass it **paths, not contents**: the `docs/blueprint/` root, the
goal-anchor list (names only), the registry block, the names-only flow and
entity lists, and the `apis/` file list (plus `apis/released/` when present). It
walks every flow end-to-end across entities, schemas, and API contracts — the
cross-doc consistency no per-doc review can see — and returns `NO GAPS` or a
numbered gap list. A **breaking change to a released API contract without a
major-version bump is a hard gap**: it blocks the `complete` stamp until the
contract is fixed or explicitly re-versioned.

**Gaps** → route each to the owning flow/entity pass (§§2–7: re-elicit, rewrite,
per-doc review), then re-run the coherence review. **Convergence guard:** pause
and ask the user if the coherence gap count does not strictly decrease across
rounds. Coverage may only stamp `complete` (§9) after a clean coherence pass;
stopping early stamps `partial` with the open coherence gaps in `remaining:`.

### 9. Stamp coverage

Record the sweep's result in `.config/vwf.yaml` (per the vwf-config asset):

```yaml
blueprint:
  coverage: complete # or partial
  remaining: [] # when partial: flows/<flow>, entities/<entity>, apis/<project>, coherence
```

Stamp after **every** run — a targeted update that opened a hole (or skipped the
coherence re-run) downgrades a `complete` stamp to `partial`. This stamp is what
`/vwf:plan` gates on.

### 10. Commit (git-workflow)

After approval, hand **all** git actions to `/vwf:git-workflow` — it owns
worktree isolation and the commit (the stamp change rides the same commit). Use
a `blueprint(<flow|entity>):` or `docs(blueprint):` message. Do not run raw git
here.

**Chain forward.** When the sweep ends with `coverage: complete`, offer to
continue straight into `/vwf:plan` for the highest-priority slice (from the
product doc's slice priority) — the user can decline and plan later.
