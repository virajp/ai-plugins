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

- **Flow** — `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md`, one uniform
  depth for UI and non-UI projects alike (always `index.md` only; a flow too big
  for one file is several flows). Flows are **grouped by their primary registry
  project** — the project that owns the journey (the UI project of its Screens;
  for a UI-less flow, the service/worker whose trigger starts it; ambiguous →
  ask, never guess). That is the **only** grouping the path carries: since
  format 14 a UI project's flows sit directly under the project and each
  declares its **device** in the `device:` frontmatter key — the project's
  primary surface (`mobile` for `frontend`, `web` for `site`/`console`) or one
  of its declared in-car platforms (`carplay`, `android-auto`), whose journeys
  are their **own subset flows** (§2 Automotive). Within a **device** (or a
  non-UI project group) flows are **numbered in execution order** (`010-splash`,
  `020-signin`, …): three digits, **gap numbering** in steps of 10 so an insert
  takes a number between its neighbors (`015-onboarding`) without renumbering;
  only when no integer remains between neighbors is the local tail renumbered
  (via the §7 rename reconcile). Because each device has its own number line,
  one project folder may hold two flows sharing an `<NNN>` — their full folder
  names still differ, and that full name is the join key. `flows/index.md` is
  the thin catalog — grouped per project, then per device (read from the
  `device:` keys), rows in numeric order — plus the cross-flow contracts.
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

| Doc              | Path                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Product          | `docs/blueprint/product.md`                                                                                        |
| Registry         | `docs/blueprint/architecture.md`                                                                                   |
| Conventions      | `docs/blueprint/conventions.md`                                                                                    |
| Design system    | `docs/blueprint/design-system.md`                                                                                  |
| Environment      | `docs/blueprint/environment.md`                                                                                    |
| Flow             | `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md` (device in the `device:` frontmatter key, UI projects only) |
| Flow catalog     | `docs/blueprint/flows/index.md`                                                                                    |
| Entity           | `docs/blueprint/entities/<entity>/` (`index.md` + schema)                                                          |
| Entity catalog   | `docs/blueprint/entities/index.md`                                                                                 |
| API contract     | `docs/blueprint/apis/<project>.openapi.yaml`                                                                       |
| Released APIs    | `docs/blueprint/apis/released/`                                                                                    |
| Flow template    | `${CLAUDE_PLUGIN_ROOT}/assets/templates/flow.md`                                                                   |
| Flow-cat. templ. | `${CLAUDE_PLUGIN_ROOT}/assets/templates/flows-index.md`                                                            |
| Entity template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/entity.md`                                                                 |
| Ent.-cat. templ. | `${CLAUDE_PLUGIN_ROOT}/assets/templates/entities-index.md`                                                         |
| Schema template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/schema.yaml`                                                               |
| OpenAPI template | `${CLAUDE_PLUGIN_ROOT}/assets/templates/openapi.yaml`                                                              |
| Conv. template   | `${CLAUDE_PLUGIN_ROOT}/assets/templates/conventions.md`                                                            |
| Env. template    | `${CLAUDE_PLUGIN_ROOT}/assets/templates/environment.md`                                                            |

Doctrine: the **blueprint-authoring** skill (contract-vs-realization,
flow-contract, entity-contract, api-and-schema-contracts, ui-ux-contract,
environment-catalog, frontmatter-and-links, quick-reference). API contracts also
apply the **rest-api-design** skill for endpoint contract depth.

Reserved names: `product`, `architecture`, `conventions`, `design-system`,
`environment`, `flows`, `entities`, `apis`, the device names (`mobile`, `web`,
`carplay`, `android-auto`), and `index` inside a flow group / `entities/` — a
flow or entity folder never takes one of these.

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
- every flow with a Screens section has passed its **visual review** (§6a) — a
  recorded skip (`screens/<project>/<NNN>-<flow>` in `remaining:`) is an open
  hole;
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

**Automotive (`carplay` / `android-auto`).** In-car surfaces are a **subset of
the mobile app** — always different screens and a limited feature set, never the
phone journey re-rendered. When a UI project declares an in-car platform,
**elicit which phone flows have an in-car subset** — a product decision; most do
not. Each in-car journey is authored as its **own flow** alongside the project's
other flows (`flows/<project>/<NNN>-<flow>/`) carrying
`device: carplay | android-auto`, numbered in its own in-car execution order (so
its numbers may repeat the phone flows'), with a mandatory **`Subset of:`** line
— now a sibling link, `../<NNN>-<flow>/index.md` — in Purpose linking the parent
phone flow (an OKF edge the reviewer verifies) alongside its `Serves:` goal
link. Its Screens elicitation pins the in-car specifics per screen: the platform
**template** it maps to (list / grid / map / now-playing / …), the glanceable
content subset vs the parent phone screen, and the driver-distraction
constraints. In-car UIs are template-constrained by the OS; custom layout does
not apply there.

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

- **The flow** — `flows/<project>/<NNN>-<flow>/index.md`, every applicable
  section (§2). A **new** flow lands in its primary project's group (for a UI
  project: with its `device:` key set) with the next gap number in that device's
  execution order (elicit where it slots when not obvious — the number is a
  product statement about when the journey runs). Every Screens row carries its
  **Code** (`<NNN><letter>` — letters in step order; stable once assigned, an
  insert takes the next free letter, never a re-letter) — the per-screen sync
  key the canvas frames and `/vwf:screens import` match on — and its
  **Components block** (format 12): the elements the screen displays, each with
  its rules (visibility/enable conditions, what activating it does,
  contract-pinned content), elicited per the ui-ux-contract bar. Every step
  names its actor and links the entity/service it touches; API-backed steps name
  an `operationId`. **Every flow carries an Acceptance block** — at least one
  success and one failure/compensation criterion as observable Given/When/Then;
  these are what `plan` turns into E2E test steps and `execute`'s acceptance
  stage verifies. Screens obey the **home rule** (a screen is defined in exactly
  one flow; other flows link it).
- **What it stands on** — for each entity a step references: create or extend
  `entities/<entity>/index.md` + `schema.yaml`; for each `operationId`: add or
  extend the operation in `apis/<project>.openapi.yaml` (from the OpenAPI
  template when the file is new). A flow-step state change must match a
  transition in the entity's Lifecycle table — add the transition or fix the
  step, never leave them disagreeing. Set each entity's `Used by:` line to the
  flows that reference it.
- **The catalogs** — update the flow's row in its **project's section** (under
  its device subsection for a UI project) of `flows/index.md`, keeping rows in
  numeric order (create from the flows-index template if missing) and, when
  relationships changed, the `erDiagram` in `entities/index.md` (create from the
  entities-index template) so it stays the exact union of the Relationships
  tables.
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
the canvas cards no longer show the contract. Normally §6a's re-render re-lists
it within this same pass; when §6a was explicitly skipped, the drop stands and a
later `/vwf:mockups <flow>` re-pushes it. (Like the build stamp: a state-only
edit, riding the same commit.)

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store this pass's
durable decisions and their rationale, plus any drift flagged, to mempalace
(rooms `decisions`, `problems`) — skip what the docs already capture verbatim.

### 6a. Render & review the screens (gates the pass — flows with Screens)

When this pass authored or materially changed a flow's `## Screens` section (UI
projects of type `site`, `console`, or `frontend` — a `cli` platform has no
screens), the pass approval (§7) **gates on a visual review** of those screens.
Screens are contracts with happy *and* sad paths; the user must see them before
approving the flow.

1. **Render.** Dispatch a fresh `mockup-generator` subagent for this flow (its
   Screens table + Components blocks + deviations, the design-system doc(s), a
   fresh build dir in the session scratch dir) — the default view plus **every
   pinned state**; the ui-ux-contract bar makes error and empty pins mandatory,
   so the sad paths are always in the set. `frontend` (Flutter) screens render
   as HTML approximations at the design system's device viewport.
2. **Push (canvas preferred).** Per
   `${CLAUDE_PLUGIN_ROOT}/assets/canvas-push.md`: resolve a surface, resolve the
   design project pinned for **the flow's UI project and platform**
   (`design.projects.<registry-project>.<platform>` — the flow's `device:` key
   names the platform), push under `mockups/<device>/<NNN>-<flow>/**` (the same
   path scheme as `/vwf:mockups`; deletes stay inside this flow's directory),
   verify a sample, and share the `open_url`. Record the flow in
   `design.flows_pushed`. In **local-only mode** the local render satisfies the
   gate: give the absolute build-dir paths to open in a browser.
3. **Review.** The user reviews the rendered screens. Remarks route **now**:
   screen-level → the Screens table / recorded deviations (re-elicit, update the
   doc; a material contract change re-runs the per-doc reviewer (§5) and
   re-renders — back to 1); visual-language-level → flag for
   `/vwf:design-system`, parked per the elicitation protocol's parked-scope rule
   when out of this pass's scope.
4. **Design-first (alternative to 1–3).** The user may prefer Claude Design to
   *design* these screens rather than review vwf's contract-derived render: run
   `/vwf:screens prompt <flow>` (it writes the per-device-type briefs under
   `docs/prompts/` — files the user pastes into the canvas chat), record
   `screens/<project>/<NNN>-<flow>` in `blueprint.remaining` — deferred by
   design, not skipped — and continue the sweep. The later
   `/vwf:screens import <flow>` closes it through a targeted pass here, folding
   what the canvas decided into the contract delta-by-delta.
5. **Skip (escape hatch).** The user may explicitly decline the review. Record
   it honestly: one line in the flow doc's Open Questions ("screens not yet
   visually reviewed") and `screens/<project>/<NNN>-<flow>` in
   `blueprint.remaining` at stamp time (§9) — coverage stays `partial` while any
   `screens/` entry remains, exactly like any other hole.

Flows without a Screens section skip this step silently.

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
touched, schema/API deltas, conventions, registry, catalogs, link fixups) plus
the §6a visual-review outcome (canvas-reviewed / locally reviewed /
skipped-as-gap) and wait for explicit approval. After approval, re-derive the
coverage worklist (§1) — this pass may have closed holes or opened new ones. If
units remain, proceed to the next (back to §2) — one flow per pass, each behind
its own approval. The user may stop early; note what remains in the approval
summary and the commit message, and stamp accordingly (§9). Never trim the
worklist to end sooner — coverage is checked, not negotiated.

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
  remaining: [] # when partial: flows/<project>/<NNN>-<flow>, entities/<entity>, apis/<project>, screens/<project>/<NNN>-<flow>, coherence
```

Stamp after **every** run — a targeted update that opened a hole (or skipped the
coherence re-run, or skipped a §6a visual review) downgrades a `complete` stamp
to `partial`. This stamp is what `/vwf:plan` gates on.

### 10. Commit (git-workflow)

After approval, hand **all** git actions to `/vwf:git-workflow` — it owns
worktree isolation and the commit (the stamp change rides the same commit). Use
a `blueprint(<flow|entity>):` or `docs(blueprint):` message. Do not run raw git
here.

**Chain forward.** When the sweep ends with `coverage: complete`, offer to
continue straight into `/vwf:plan` for the highest-priority slice (from the
product doc's slice priority) — the user can decline and plan later.
