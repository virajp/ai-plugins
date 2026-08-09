---
name: blueprint
description: Maintain the always-current, full-product blueprint under
  docs/blueprint/ — flow docs as the primary unit, entity data contracts, and
  per-service OpenAPI contracts, plus conventions.md. Stack-agnostic; resolves
  section→project mapping from the architecture registry. Gated by fresh
  subagent completeness reviewers per doc and one whole-product coherence
  review at the end of the sweep. A run sweeps flow by flow until
  whole-product coverage holds, then stamps it in .config/vwf.yaml —
  /skill:plan halts without a complete stamp.
---

# blueprint — Full-Product Blueprint (Flow-First)

Maintain the **whole product's** desired end state under `docs/blueprint/`. The
blueprint is product-wide and permanent — not feature-specific. It is organized
by **process**: the primary unit is the **flow** (a user or system journey to an
observable outcome), and flows are the goal-traceability spine — product goal →
flow → the entities, API operations, screens, and jobs the flow needs. Entities
are **supporting data contracts** the flows stand on.

The doc units are the **flow folder** (`index.md` + one `<platform>.md` per
implemented platform), the **entity folder** (`index.md` + `schema.yaml`), and
the per-project **OpenAPI contract**; the `docs/blueprint/` root holds only the
system docs. Their exact shape, the designated number line, and the
synonym-candidate MCQ are in [flow placement](references/flow-placement.md) —
read it before placing or naming a **new** flow or entity, or when the surveyor
returns `SYNONYM CANDIDATES:`. Paths for all of them are in the Doc Paths table
below.

**A run is a sweep, not a single flow.** The blueprint must describe the **whole
product's** as-of state before anything downstream consumes it — `/skill:plan`
hard-halts unless the coverage stamp (§9) reads `complete`. A run therefore
works flow by flow (§§2–7 per flow) and does not end at one flow: it continues
down the coverage worklist (§1) until whole-product coverage holds **including a
clean whole-product coherence review (§8)**, or the user stops early — in which
case the stamp records `partial` with what remains, and planning stays blocked
until a later run finishes the sweep.

You own the user conversation — and little else. Elicitation is **interactive
and stays with you** (a subagent cannot pause to ask a question), as do the
judgment calls that shape it: where a new flow slots in the execution order,
which approach to propose, what a gap means. **Everything read-heavy or
mechanical is delegated** to fresh stateless subagents: the coverage survey
(§1), the flow and entity writing (§4), the per-doc completeness reviews (§5),
the screen render (§6a), and the coherence review (§8).

That split is deliberate. Anything you load stays in your context and is
re-processed on every later turn of the sweep, so a scan you run yourself taxes
the whole run. Take subagent returns as given; read a file yourself only when a
specific decision genuinely needs its contents.

Adopt the **Product & Engineering Author** persona: capture user goals and
observable outcomes precisely, then pin down the flows, data model, and API
surface without ambiguity. Surface open decisions rather than guessing.

## Doc Paths

| Doc              | Path                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Product          | `docs/blueprint/product.md`                                                                                          |
| Registry         | `docs/blueprint/registry.yaml`                                                                                       |
| Conventions      | `docs/blueprint/conventions.md`                                                                                      |
| Design system    | `docs/blueprint/design-system.md`                                                                                    |
| Environment      | `docs/blueprint/environment.md`                                                                                      |
| Flow contract    | `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md` (platform-agnostic; no screens)                               |
| Flow platform    | `docs/blueprint/flows/<project>/<NNN>-<flow>/<platform>.md` (`mobile`/`tablet`/`desktop`/`web`/`auto`; screens only) |
| Flow catalog     | `docs/blueprint/flows/index.md`                                                                                      |
| Entity           | `docs/blueprint/entities/<entity>/` (`index.md` + schema)                                                            |
| Entity catalog   | `docs/blueprint/entities/index.md`                                                                                   |
| API contract     | `docs/blueprint/apis/<project>.openapi.yaml`                                                                         |
| Released APIs    | `docs/blueprint/apis/released/`                                                                                      |
| Flow template    | `%%AI_PLUGINS_ROOT%%/assets/templates/flow.md`                                                                     |
| Platform templ.  | `%%AI_PLUGINS_ROOT%%/assets/templates/flow-platform.md`                                                            |
| Flow-cat. templ. | `%%AI_PLUGINS_ROOT%%/assets/templates/flows-index.md`                                                              |
| Entity template  | `%%AI_PLUGINS_ROOT%%/assets/templates/entity.md`                                                                   |
| Ent.-cat. templ. | `%%AI_PLUGINS_ROOT%%/assets/templates/entities-index.md`                                                           |
| Schema template  | `%%AI_PLUGINS_ROOT%%/assets/templates/schema.yaml`                                                                 |
| OpenAPI template | `%%AI_PLUGINS_ROOT%%/assets/templates/openapi.yaml`                                                                |
| Conv. template   | `%%AI_PLUGINS_ROOT%%/assets/templates/conventions.md`                                                              |
| Env. template    | `%%AI_PLUGINS_ROOT%%/assets/templates/environment.md`                                                              |

Doctrine: the **blueprint-authoring** skill — a **router**. Read only the
reference its own "when to read" table names for the surface you are currently
on, and read it **when you reach that surface**, not upfront. Never preload the
full set: it is ~800 lines and every line loaded early is re-processed on each
later turn of the sweep. `quick-reference` is the **reviewer's** bar (§5) — not
the orchestrator's to carry. API contracts likewise apply the
**rest-api-design** skill for endpoint contract depth, pulled on demand when you
reach the API surface.

## References (read on demand, never upfront)

| Reference                                            | Read it when                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| [flow-placement](references/flow-placement.md)       | placing/naming a new flow or entity; the surveyor returned synonyms (§1)    |
| [density-pass](references/density-pass.md)           | the worklist entry is `density/<unit>` (§2)                                |
| [platforms](references/platforms.md)                 | the flow touches a UI project, or a project's `doc_unit` is non-obvious (§2) |
| [screen-review](references/screen-review.md)         | the pass authored or changed a `## Screens` section (§6a)                  |
| [rename-and-delete](references/rename-and-delete.md) | the pass renames or removes a flow or entity (§7)                          |
| [coherence-review](references/coherence-review.md)   | the worklist is empty and the coherence review is next (§8)                |

Reserved names: `product`, `architecture`, `conventions`, `design-system`,
`environment`, `flows`, `entities`, `apis`, the platform filenames (`mobile`,
`tablet`, `desktop`, `web`, `auto`), and `index` inside a flow group /
`entities/` — a flow or entity folder never takes one of these.

---

## Pipeline

### 1. Read the product doc & registry

Read `docs/blueprint/product.md`. **Halt if it does not exist:** "No product doc
found. Run `/skill:product` first — the blueprint needs the goals every flow must
trace to." Hold its goal anchors (`#goal-<slug>`) and slice priority: goals
anchor every flow's Purpose; the priority list is what you suggest when the user
asks what to blueprint next.

Read `docs/blueprint/registry.yaml` — the machine-readable system description.
**Halt if it does not exist:** "No registry found. Run `/skill:architecture` first
to bootstrap `docs/blueprint/registry.yaml`."

Read the registry, **not** `architecture.md`: the prose doc is the human view of
the same facts and carries nothing you need. The registry has no `stack` key by
design — you author a contract that holds whatever the stack is, and naming a
technology in a blueprint doc is a reviewer failure (see the prose nouns in
`%%AI_PLUGINS_ROOT%%/assets/capability-vocabulary.md`).

**Format check.** Run the preflight in
`%%AI_PLUGINS_ROOT%%/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/skill:setup` (proceed unless a needed artifact
is missing).

**Build the coverage worklist (delegated).** Dispatch a fresh
`blueprint-surveyor` subagent rather than walking the bundle yourself — it reads
every flow, entity, and API file and returns only the ordered worklist, so the
scan never lands in your context. Pass it **paths and name lists, not
contents**: the `docs/blueprint/` root, the goal-anchor list (names only), the
product doc's slice priority, the registry `projects:` block, the current
`blueprint.remaining` list, and any `enforcement.rules` waivers with a
`standard-flows/` prefix. It returns `COVERAGE:` plus the ordered `WORKLIST:` —
consume that as given.

Whole-product coverage holds when, all at once:

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
  recorded skip (`screens/<project>/<NNN>-<flow>/<platform>` in `remaining:`) is
  an open hole;
- every UI project carries its **mandatory standard flows** per
  `%%AI_PLUGINS_ROOT%%/assets/standard-flows.md` (conditional slugs resolved
  from the registry's auth capabilities; waivers in `enforcement.rules`
  honored);
- the whole-product **coherence review** (§8) returned `NO GAPS` since the last
  content change.

These are the conditions the surveyor checks; its `WORKLIST:` is the run's
worklist (flows first, then entities, APIs, coherence — ordered by the product
doc's slice priority). Do not re-derive it. The sweep's spine is goals → flows:
entities, schemas, and API operations are derived from the flows that need them,
never authored speculatively. Deciding whether a goal genuinely needs a *new*
flow (vs. an existing one extended) is elicitation, not inference — so the
surveyor's `UNSERVED GOALS:` list is a prompt to **ask**, never to author.

Handle the surveyor's `SYNONYM CANDIDATES:` before working the worklist — each
is an existing flow whose journey may match a missing standard slug, resolved by
one MCQ per candidate (rename / keep / waive). The procedure is in
[flow placement](references/flow-placement.md); read it when the list is
non-empty. A missing mandatory standard flow with no synonym is worked like any
other worklist hole: elicited (§3), then authored (§4).

If `$ARGUMENTS` named a flow or entity, start there (prepend it to the
worklist); otherwise start at the top. An empty worklist with a named unit means
a targeted update — do it, then re-check coverage in §7 (an update can open new
holes, e.g. a step referencing a not-yet-authored entity), and re-run coherence
(§8) before re-stamping `complete`.

### 2. Determine surfaces

**Density items short-circuit this.** A worklist entry of the form
`density/<unit>` is not an authoring pass: skip §§2–4 entirely, dispatch a fresh
`blueprint-condenser` for that unit, then go straight to the **§5 reviewer
loop** — the reviewer's density bars are what confirm the pass landed. There is
**no elicitation** on a density item. Read
[the density pass](references/density-pass.md) for the dispatch payload and how
to handle each part of the condenser's return.

From the flow's nature and the registry, determine which sections apply. Map
**by project `role`, never by literal technology**:

| Flow section    | Resolves to (registry `role`)                               |
| --------------- | ----------------------------------------------------------- |
| Steps (API ops) | service/API project(s) — via `apis/<project>`               |
| Background Jobs | worker project(s)                                           |
| Screens         | UI project(s) (`role` is `site`, `fullstack` or `frontend`) |
| Entity schemas  | the schema/contract package                                 |

If no project carries the relevant role, **omit** that section for this flow.

**Platforms and doc units.** A UI flow's platform set is **elicited per flow**,
bounded by the registry project's declared `platforms:` — and steps, acceptance
and jobs stay in `index.md`, **never forked per platform**. An inapplicable
surface is `N/A — <reason>`, never silently omitted. Read
[platforms & doc units](references/platforms.md) for the platform-extension
rules, the in-car (`auto`) specifics, and the `doc_unit` mapping — when the flow
touches a UI project, or when a project's `doc_unit` is not the obvious one.

**Design-system gate.** If the flow has a **Screens** section (some registry
project's `role` is `site`, `fullstack` or `frontend`),
`docs/blueprint/design-system.md` must exist. **Halt if it does not:** "This
flow has UI but no design system. Run `/skill:design-system` first." Screens
reference the design system; they never re-decide visual language.

### 3. Interactive elicitation (orchestrator)

**Recall first.** Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`, recall prior
decisions, drift, and unreconciled gaps for this flow/entity (rooms `decisions`,
`problems`, `gaps`) before eliciting — build on them and don't re-ask resolved
questions. When execution surfaced a blueprint gap (room `gaps`), treat closing
it as a first-class goal of this pass. Skip silently if mempalace is
unavailable.

Adopt the authoring persona and elicit following the **elicitation protocol** in
`%%AI_PLUGINS_ROOT%%/assets/elicitation.md` (explore → scope-check → one
question at a time, **each naming its scope** → propose 2-3 approaches → present
in sections → gate → self-review).

**Scope matters more here than anywhere.** A sweep crosses projects and
platforms in one sitting, so per §3a every question carries the registry project
(and its `role` on first mention) in the text and `<project>` — or
`<project>·<platform>` for a screens decision — in the `header`. The user is
looking at a conversation, not at the flow folder you are writing: "should this
retry?" is answerable only once they know whether "this" is the `worker` or the
operator back-office. Elicit the flow first — trigger, actors, steps to the
observable outcome, consistency, failure/compensation, screens, jobs, acceptance
— then pin down what it stands on (entity shapes, API operations). Where a
cross-cutting decision surfaces, fill the conventions skeleton.

Blueprint-specific notes layered on the protocol:

- **Apply the `blueprint-authoring` skill:** read **contract-vs-realization** up
  front — it is the sort test that governs what you elicit at all (record only
  decisions true regardless of how the code is written today; leave
  reuse/placement/ordering/library choices to `plan`). Pull any **other**
  reference only as you reach the surface it covers, per the skill's routing
  table. Do not preload the per-surface completeness bars to self-check against
  — enforcing them is the reviewer's job (§5), and carrying them here doubles
  the orchestrator's context for no added rigor.
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
- **Engineering baseline (never re-elicited):** the defaults in
  `%%AI_PLUGINS_ROOT%%/assets/engineering-baseline.md` are settled — do not
  ask about write versioning, boundary validation, idempotency, error shape,
  pagination, retries, timestamps, soft-delete, log hygiene, or money units
  unless the user raises a deviation. Entity Concurrency defaults to
  `default — per conventions#baseline`; API operations assume the idempotency /
  error-envelope / cursor-pagination rules. Elicitation spends its questions on
  what is genuinely open, not on the baseline.
- **Standard slugs, numbers & screen names:** when the journey being elicited
  matches an entry in `%%AI_PLUGINS_ROOT%%/assets/standard-flows.md` (splash,
  signin, recover-account, onboarding, home, profile, settings, notifications,
  delete-account), the flow takes that exact slug **and its designated number**
  — never a synonym, never another number (`home` is always `100`). Its
  **primary screen takes the flow's slug** too: the `home` flow's main screen is
  named `home`, never "Dashboard" or "Main Feed". Secondary screens stay
  free-named.
- **Approaches (protocol §5):** where a flow, data-model, or API shape has
  competing designs (e.g. embed vs reference, sync vs async surface), present
  the options before committing.
- Minimalism rung 1 (`%%AI_PLUGINS_ROOT%%/assets/minimalism.md`, applied to
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

**Delegate the bulk writing.** The flow and entity docs are rendered by writer
subagents, not by you — they read the templates and the per-surface authoring
references themselves, which is exactly the doctrine load you are keeping out of
your own context. Dispatch them with the **decisions the user confirmed**; they
never elicit and never invent. Anything they could not fill comes back under
`UNRESOLVED:` — re-elicit it and re-dispatch, never let a plausible default
stand.

- **The flow** → one `flow-writer`. Pass the placement (project, `<NNN>`, slug,
  and the platform set), the contract decisions (purpose and goal anchors,
  trigger & actors, ordered steps with actors/entities/`operationId`s, jobs,
  acceptance criteria) **and, per platform, that platform's screens** with their
  shared `<NNN><letter>` codes, Components blocks, and deviations, plus the
  relevant `conventions.md` anchors and registry block. It writes `index.md`,
  **one `<platform>.md` per platform**, and the `flows/index.md` catalog row. A
  **new** standard flow takes its **designated** number; a product flow takes
  the next gap number in the `110`–`890` band — elicit where it slots when not
  obvious, since the number states when the journey runs. Screen codes are
  **shared across the platform files**: assign a code per screen concept, and a
  platform-only screen takes the next letter free across the whole flow.
- **What it stands on** — for each entity a step references, dispatch one
  `entity-writer`. Entities in a pass are independent: **dispatch them all in a
  single message so they run concurrently.** Each writes its
  `entities/<entity>/index.md` + `schema.yaml`, its `entities/index.md` catalog
  row, and its own edges in the product-wide `erDiagram`. A flow-step state
  change must match a transition in the entity's Lifecycle table — pass the
  transition explicitly so the writer records it; never leave step and lifecycle
  disagreeing.
- **The API contracts (yours)** — for each `operationId`: add or extend the
  operation in `apis/<project>.openapi.yaml` (from the OpenAPI template when the
  file is new), applying the **rest-api-design** skill and the
  blueprint-authoring **api-and-schema-contracts** reference. Read those two
  only when a pass actually touches an API surface.
- **Conventions & environment (yours)** — update `docs/blueprint/conventions.md`
  for any cross-cutting decision raised, and `environment.md` per the rule
  below. On the **first touch** of `conventions.md` in a repo (or when the
  anchor is missing), seed the **engineering baseline** per
  `%%AI_PLUGINS_ROOT%%/assets/engineering-baseline.md` (`#baseline` — the 15
  default technical rules) and the **delivery pipeline** per
  `%%AI_PLUGINS_ROOT%%/assets/delivery-pipeline.md` (`#pipeline` — the
  canonical environment table and tag-triggered deploy rules), each omitting any
  rule covered by a product-wide `enforcement.rules` waiver. These are enforced
  defaults, not elicitation material: never ask the user whether to adopt one; a
  deviation arrives only when the user raises it, and lands as the doc note +
  scoped waiver pair. An environment named by a synonym (`dev`/`test`/`prod`
  etc.) anywhere in the docs or config is drift — propose the canonical name,
  never normalize silently.

Read only the template a surface you write yourself needs — never all eight up
front.

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
subagent (stateless) per doc, naming its **mode**. The per-doc reviews are
mutually independent — **dispatch every doc's reviewer in a single message so
the whole round runs concurrently**, rather than one doc at a time. A pass that
wrote a flow plus four entities then costs one round, not five.

- **Flow mode** — pass the flow doc, the relevant `conventions.md` anchors and
  registry block, the **product doc's goal-anchor list** (names only), the
  names-only lists of existing flow and entity docs, and the path of each
  `apis/*.openapi.yaml` the flow references (for operationId existence checks).
- **Entity mode** — pass the entity's `index.md` **and** `schema.yaml`, the
  relevant `conventions.md` anchors and registry block, and the names-only lists
  of existing flow and entity docs (so it can verify `Used by:` and relationship
  links resolve).

Either mode also gets any `enforcement.rules` waivers with a `baseline/` prefix
that scope to the doc under review (for the baseline deviation ↔ waiver pairing
check).

No conversation context either way. The reviewer checks the doc against the
checklist in its own instructions, **verifies every outbound link resolves on
disk**, and returns `NO GAPS` or a numbered gap list. Tell it the doc's
`doc_unit` so it accepts an explicit `N/A — <reason>` on unit-inapplicable
surfaces (§2). The names-only lists let it separate a broken/wrong-path link
from a link to a not-yet-authored doc: the latter comes back as a gap of kind
"target not yet authored", which you present to the user and may accept (it
lands on the worklist).

**Gaps** → present them, re-elicit the specific open decisions with the user
(one at a time), update the doc, dispatch a fresh reviewer. Only the docs that
came back with gaps go into the next round — a doc that returned `NO GAPS` is
done. **`NO GAPS`** → set `status: reviewed`, exit.

**Convergence guard:** before another round, compare to the prior round. Pause
and ask the user if the gap count did not strictly decrease, or a resolved gap
resurfaced. No fixed round cap.

**Context guard.** A concurrent round returns every reviewer's findings at once.
If a round's returns would push you past the handoff threshold, review the docs
in two smaller concurrent batches instead of one — parallelism is a wall-clock
optimization, never a reason to blow the context budget mid-sweep.

### 6. Reconcile architecture & persist

If the blueprint's project or capability shape changed (a new project,
capability, or cross-cutting decision implied by this pass), update the
**registry** `docs/blueprint/registry.yaml` precisely — via `/skill:architecture`
if the change is non-trivial. When this pass added a cross-cutting decision to
`conventions.md`, check the registry's `cross_cutting` block covers it and
reconcile any mismatch.

**Demote the build stamp.** If this pass **materially changed the contract
content** of a flow or entity doc whose frontmatter reads
`implementation: complete`, set it to `implementation: partial` — the contract
moved, so the code is no longer known to match; the next `/skill:plan` for that
slice picks up the delta. (State-stamp edits are the only frontmatter the sweep
changes outside `status:`.)

**Drop the render stamp.** If this pass changed a flow's `## Screens` section
and `.config/vwf.yaml` lists that flow's platform under `design.flows_rendered`,
remove those entries — the scratchpad render no longer shows the contract.
Normally §6a's re-render re-lists it within this same pass; when §6a was
explicitly skipped, the drop stands and a later `/skill:mockups <flow>` re-renders
it. (Like the build stamp: a state-only edit, riding the same commit.)

**Persist.** Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`, store this pass's
durable decisions and their rationale, plus any drift flagged, to mempalace
(rooms `decisions`, `problems`) — skip what the docs already capture verbatim.

### 6a. Render & review the screens (gates the pass — flows with Screens)

When this pass authored or materially changed a flow's `## Screens` section (UI
projects whose `role` is `site`, `fullstack` or `frontend` — a `cli` platform
has no screens), the pass approval (§7) **gates on a visual review** of those
screens. Screens are contracts with happy *and* sad paths; the user must see
them before approving the flow.

The procedure — the `mockup-generator` dispatch per platform file, the hand-over
and the `design.flows_rendered` stamp, how review remarks route, the
design-first alternative, and the explicit skip — is in
[screen render & review](references/screen-review.md). Read it now. Whichever
path the user takes, a deferred or declined review records
`screens/<project>/<NNN>-<flow>/<platform>` in `blueprint.remaining`, and
coverage stays `partial` while any `screens/` entry remains — exactly like any
other hole. Mockups are **never pushed to the design tool**.

Flows without a Screens section skip this step silently.

### 7. Reconcile inbound links (rename / delete) & continue the sweep

When this pass **renames** or **removes** a flow or entity, no dangling OKF edge
may be left behind — a step or relationship pointing at a deleted doc is never
left dangling. Read [rename & delete](references/rename-and-delete.md) for where
to grep and how each case resolves; a pass that only adds or edits in place
skips it.

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
**`blueprint-coherence-reviewer`** subagent (stateless, fresh) over the bundle,
naming its **scope**. It returns `NO GAPS` or a numbered gap list. The dispatch
payload (paths, never contents) and the shape to pick — one `full` reviewer for
a small bundle, or sharded `flow-walk` + `bundle` reviewers for a large one —
are in [the coherence review](references/coherence-review.md). Read it now.

The `bundle` shard is **mandatory** whichever shape you pick: it carries the
released-contract diff. A **breaking change to a released API contract without a
major-version bump is a hard gap** — it blocks the `complete` stamp until the
contract is fixed or explicitly re-versioned. Never stamp `complete` on
`flow-walk` returns alone.

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
  remaining: [] # when partial: flows/<project>/<NNN>-<flow>, entities/<entity>, apis/<project>, screens/<project>/<NNN>-<flow>/<platform>, density/<unit>, coherence
```

Stamp after **every** run — a targeted update that opened a hole (or skipped the
coherence re-run, or skipped a §6a visual review) downgrades a `complete` stamp
to `partial`. This stamp is what `/skill:plan` gates on.

A `density/<unit>` entry clears when the unit is within budget **or** the
condenser returned `HELD:` for it (every remaining line load-bearing). Report
both counts at the end of a sweep that condensed anything — how many docs came
under budget, and how many are honestly over. An over-budget doc whose every
line is contract is not a hole, and must never hold the stamp hostage.

### 10. Commit (git-workflow)

After approval, hand **all** git actions to `/skill:git-workflow` — it owns
worktree isolation and the commit (the stamp change rides the same commit). Use
a `blueprint(<flow|entity>):` or `docs(blueprint):` message. Do not run raw git
here.

**Chain forward.** When the sweep ends with `coverage: complete`, offer to
continue straight into `/skill:plan` for the highest-priority slice (from the
product doc's slice priority) — the user can decline and plan later.
