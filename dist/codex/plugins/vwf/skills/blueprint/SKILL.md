---
name: blueprint
description: Maintain the always-current, full-product blueprint under
  docs/blueprint/ — flow docs as the primary unit, entity data contracts, and
  per-service OpenAPI contracts, plus conventions.md. Stack-agnostic; resolves
  section→project mapping from the architecture registry. Gated by fresh
  subagent completeness reviewers per doc and one whole-product coherence
  review at the end of the sweep. A run sweeps flow by flow until
  whole-product coverage holds, then stamps it in .config/vwf.yaml —
  $plan halts without a complete stamp.
---

# blueprint — Full-Product Blueprint (Flow-First)

Maintain the **whole product's** desired end state under `docs/blueprint/`. The
blueprint is product-wide and permanent — not feature-specific. It is organized
by **process**: the primary unit is the **flow** (a user or system journey to an
observable outcome), and flows are the goal-traceability spine — product goal →
flow → the entities, API operations, screens, and jobs the flow needs. Entities
are **supporting data contracts** the flows stand on.

The doc units:

- **Flow** — `docs/blueprint/flows/<project>/<NNN>-<flow>/`, one uniform depth
  for UI and non-UI projects alike. The folder holds **`index.md`** — the
  platform-agnostic contract (purpose, trigger, steps, diagram, jobs,
  acceptance; **no screens**) — plus **one `<platform>.md` per implemented
  platform** (`mobile` | `tablet` | `desktop` | `web` | `auto`) carrying only
  that platform's Screens + Components. A non-UI flow is `index.md` alone — and
  so is a flow of a `cli` project, since a terminal surface has no screens.
  Flows are **grouped by their primary registry project** — the project that
  owns the journey (the UI project of its Screens; for a UI-less flow, the
  service/worker whose trigger starts it; ambiguous → ask, never guess). Since
  format 15 the platform lives in the **filename**, so there is no `device:` key
  and **one number line per project**. `<NNN>` is **designated** per
  `%%AI_PLUGINS_ROOT%%/assets/standard-flows.md`: `010` splash, `020` signin,
  `030` recover-account, `040` onboarding, **`100` home** (the anchor, every UI
  project), `110`–`890` product flows (gap-numbered by 10), `910` profile, `920`
  settings, `930` notifications, `940` delete-account. The folder name
  (`<NNN>-<flow>`) is the join key. `flows/index.md` is the thin catalog — one
  section per project, rows in numeric order with a Platforms column — plus the
  cross-flow contracts.
- **Entity** — `docs/blueprint/entities/<entity>/`: always exactly `index.md`
  (lifecycle, relationships, invariants, concurrency) + `schema.yaml` (the
  authoritative data model). `entities/index.md` is the catalog plus the
  product-wide ER diagram.
- **API contract** — `docs/blueprint/apis/<project>.openapi.yaml`, one per
  **API-publishing** project (`role` is `service` or `fullstack` — a fullstack
  publishes its own API, which is exactly what separates it from a `site`);
  `apis/released/` holds the frozen production snapshots `$verify` writes
  for `service` projects.
- The `docs/blueprint/` **root holds only the system docs** (product,
  architecture, conventions, design-system, environment). A root
  `integration.md` or a flat/root entity folder is pre-format-9 drift;
  `$setup` migrates it.

**A run is a sweep, not a single flow.** The blueprint must describe the **whole
product's** as-of state before anything downstream consumes it — `$plan`
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

Reserved names: `product`, `architecture`, `conventions`, `design-system`,
`environment`, `flows`, `entities`, `apis`, the platform filenames (`mobile`,
`tablet`, `desktop`, `web`, `auto`), and `index` inside a flow group /
`entities/` — a flow or entity folder never takes one of these.

---

## Pipeline

### 1. Read the product doc & registry

Read `docs/blueprint/product.md`. **Halt if it does not exist:** "No product doc
found. Run `$product` first — the blueprint needs the goals every flow must
trace to." Hold its goal anchors (`#goal-<slug>`) and slice priority: goals
anchor every flow's Purpose; the priority list is what you suggest when the user
asks what to blueprint next.

Read `docs/blueprint/registry.yaml` — the machine-readable system description.
**Halt if it does not exist:** "No registry found. Run `$architecture` first
to bootstrap `docs/blueprint/registry.yaml`."

Read the registry, **not** `architecture.md`: the prose doc is the human view of
the same facts and carries nothing you need. The registry has no `stack` key by
design — you author a contract that holds whatever the stack is, and naming a
technology in a blueprint doc is a reviewer failure (see the prose nouns in
`%%AI_PLUGINS_ROOT%%/assets/capability-vocabulary.md`).

**Format check.** Run the preflight in
`%%AI_PLUGINS_ROOT%%/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `$setup` (proceed unless a needed artifact
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

Handle the surveyor's `SYNONYM CANDIDATES:` before working the worklist: each is
an existing flow whose journey may match a missing standard slug (per the
standard-flows asset). One MCQ per candidate — **rename** to the standard slug
(a §7 rename reconcile in that flow's pass: inbound links, catalogs, and canvas
join keys move together), **keep** (it is genuinely a different journey; the
standard flow stays on the worklist as missing), or **waive** (record
`standard-flows/<project>/<slug>` under `enforcement.rules` with the user's
reason — never re-asked). A missing mandatory standard flow with no synonym is
worked like any other worklist hole: elicited (§3) — including where its number
slots in the project's number line — then authored (§4). A standard flow takes
its **designated number** (standard-flows asset); only a product flow is placed
by elicitation, inside the `110`–`890` band.

If `$ARGUMENTS` named a flow or entity, start there (prepend it to the
worklist); otherwise start at the top. An empty worklist with a named unit means
a targeted update — do it, then re-check coverage in §7 (an update can open new
holes, e.g. a step referencing a not-yet-authored entity), and re-run coherence
(§8) before re-stamping `complete`.

### 2. Determine surfaces

**Density items short-circuit this.** A worklist entry of the form
`density/<unit>` is not an authoring pass: the unit's contract is already
decided and merely over-written. Skip §§2–4 entirely, dispatch a fresh
`blueprint-condenser` for that unit (pass the doc path, its budget and current
count, and the `conventions.md` anchors it references), then go straight to the
**§5 reviewer loop** — the reviewer's density bars are what confirm the pass
landed.

There is **no elicitation** on a density item. Condensation removes commentary
and decides nothing, so there is nothing to ask; that is precisely why the sweep
can clear these without a user in the loop. Handle the condenser's return:

- **`PERSIST:`** — file each to mempalace room `decisions` (the rationale leaves
  the contract but is not lost).
- **`PARKED:`** — file each to room `gaps` per the parked-scope rule, and mirror
  a terse line where the doc kept one.
- **`GAPS:`** — a contract hole the cut exposed (a guard that lived only in a
  diagram label, a rule with nowhere to live). This **does** need you: fold it
  into the normal per-flow pass (§§3–4) rather than leaving it, since a hole
  found while condensing is a hole either way.
- **`HELD:`** — the doc is still over budget with every line load-bearing.
  Accept it, report it at the end of the sweep, and **clear the entry** — an
  honest over-budget doc must not block the coverage stamp forever.

From the flow's nature and the registry, determine which sections apply. Map
**by project `role`, never by literal technology**:

| Flow section    | Resolves to (registry `role`)                               |
| --------------- | ----------------------------------------------------------- |
| Steps (API ops) | service/API project(s) — via `apis/<project>`               |
| Background Jobs | worker project(s)                                           |
| Screens         | UI project(s) (`role` is `site`, `fullstack` or `frontend`) |
| Entity schemas  | the schema/contract package                                 |

If no project carries the relevant role, **omit** that section for this flow.

**Platform extensions.** Read the registry project's `platforms:` — the single
source (it is not in `.config/vwf.yaml`). When a UI project declares targets
beyond its stack's default, the Screens elicitation covers what genuinely
differs per platform — navigation/input idiom, window/layout behavior,
platform-specific states — and records only the differences, never a
per-platform copy.

**Which platforms implement this flow.** A journey is one flow; each platform
that implements it gets a `<platform>.md`. **Elicit the platform set per flow**
— a product decision, bounded by the registry project's declared `platforms:`.
Most flows implement the project's primary platform only; `auto` in particular
is selective (signing in or onboarding while driving makes no sense). Record the
set in `index.md`'s **Platforms** table with a one-line note per platform on how
its take differs. Steps, acceptance, and jobs stay in `index.md` and are **never
forked per platform** — a platform that cannot perform a step omits the screens
for it and says so in its note.

**In-car (`auto`).** `auto` covers **CarPlay and Android Auto together** (the
vocabulary names form factors, not vendors). An in-car take is a *platform
file*, not its own flow — the pre-format-15 "in-car subset flow" with its
`Subset of:` link is retired. Its Screens elicitation pins the in-car specifics
per screen: the OS **template** it maps to (list / grid / map / now-playing /
…), the glanceable content subset vs the phone screen, and the
driver-distraction constraints — recorded under the platform file's **Platform
deviations**, noting any CarPlay-vs-Android-Auto difference there. In-car UIs
are template-constrained by the OS; custom layout does not apply.

**Doc unit.** Each registry project declares a `doc_unit` (`entity` / `page` /
`module`). Under format 9 these map as: `page` doc units (typically a project
carrying `site`) are authored as **flows** — a page journey is a flow; `module`
doc units (typically `packages`) stay under `entities/` — a module boundary is a
supporting contract, with `schema.yaml` written as `N/A — <reason>` when the
module has no data shape. The same section structure and completeness bars
apply; an inapplicable surface is `N/A — <reason>`, never silently omitted.

**Design-system gate.** If the flow has a **Screens** section (some registry
project's `role` is `site`, `fullstack` or `frontend`),
`docs/blueprint/design-system.md` must exist. **Halt if it does not:** "This
flow has UI but no design system. Run `$design-system` first." Screens
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
**registry** `docs/blueprint/registry.yaml` precisely — via `$architecture`
if the change is non-trivial. When this pass added a cross-cutting decision to
`conventions.md`, check the registry's `cross_cutting` block covers it and
reconcile any mismatch.

**Demote the build stamp.** If this pass **materially changed the contract
content** of a flow or entity doc whose frontmatter reads
`implementation: complete`, set it to `implementation: partial` — the contract
moved, so the code is no longer known to match; the next `$plan` for that
slice picks up the delta. (State-stamp edits are the only frontmatter the sweep
changes outside `status:`.)

**Drop the render stamp.** If this pass changed a flow's `## Screens` section
and `.config/vwf.yaml` lists that flow's platform under `design.flows_rendered`,
remove those entries — the scratchpad render no longer shows the contract.
Normally §6a's re-render re-lists it within this same pass; when §6a was
explicitly skipped, the drop stands and a later `$mockups <flow>` re-renders
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

1. **Render (local, never canvas).** Ensure `docs/scratchpad/` is gitignored
   (`git check-ignore -q docs/scratchpad`; if not, append `docs/scratchpad/` to
   `.gitignore` — the line rides this pass's commit). Dispatch a fresh
   `mockup-generator` subagent **per platform file** the pass touched (that
   platform's Screens table + Components blocks + deviations, the design-system
   doc(s), and its render dir
   `docs/scratchpad/<project>/<NNN>-<flow>/<platform>/` — overwritten in place;
   dispatch them in a single message to run concurrently) — the default view
   plus **every pinned state**; the ui-ux-contract bar makes error and empty
   pins mandatory, so the sad paths are always in the set. `frontend` (Flutter)
   screens render as HTML approximations at the design system's viewport for
   that platform. Mockups are **never pushed to Claude Design**.
2. **Hand over.** Give the user the absolute file paths to open in a browser,
   grouped per platform, then record each rendered platform in
   `design.flows_rendered` as `<project>/<NNN>-<flow>/<platform>` (the
   render-currency stamp).
3. **Review.** The user reviews the rendered screens. Remarks route **now**:
   screen-level → the Screens table / recorded deviations (re-elicit, update the
   doc; a material contract change re-runs the per-doc reviewer (§5) and
   re-renders — back to 1); visual-language-level → flag for
   `$design-system`, parked per the elicitation protocol's parked-scope rule
   when out of this pass's scope.
4. **Design-first (alternative to 1–3).** The user may prefer Claude Design to
   *design* these screens rather than review vwf's contract-derived render: run
   `$screens prompt <flow>` (it writes the per-platform briefs under
   `docs/prompts/` — files the user pastes into the canvas chat), record
   `screens/<project>/<NNN>-<flow>/<platform>` in `blueprint.remaining` —
   deferred by design, not skipped — and continue the sweep. The later
   `$screens import <flow>` closes it through a targeted pass here, folding
   what the canvas decided into the contract delta-by-delta.
5. **Skip (escape hatch).** The user may explicitly decline the review. Record
   it honestly: one line in the flow doc's Open Questions ("screens not yet
   visually reviewed") and `screens/<project>/<NNN>-<flow>/<platform>` in
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
**`blueprint-coherence-reviewer`** subagent (stateless, fresh) over the bundle,
naming its **scope**. Pass it **paths, not contents**: the `docs/blueprint/`
root, the goal-anchor list (names only), the registry block, the names-only flow
and entity lists, and the `apis/` file list (plus `apis/released/` when
present). It returns `NO GAPS` or a numbered gap list.

**Choose the shape by bundle size:**

- **≤ 6 flows** → one reviewer at scope `full`. Sharding a small bundle costs
  more than it saves.
- **more than 6 flows** → shard: one `flow-walk <flow>` reviewer per flow plus
  exactly one `bundle` reviewer, **all dispatched in a single message** so they
  run concurrently. The `flow-walk` shards each walk one flow end-to-end across
  its entities, schemas, and API contracts; the `bundle` shard owns every check
  that compares flows to each other (goal coverage, cross-flow consistency,
  entities and the `erDiagram`, API contracts, bundle hygiene). Merge the
  returns into one gap list — the shard prefixes keep them unambiguous.

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
to `partial`. This stamp is what `$plan` gates on.

A `density/<unit>` entry clears when the unit is within budget **or** the
condenser returned `HELD:` for it (every remaining line load-bearing). Report
both counts at the end of a sweep that condensed anything — how many docs came
under budget, and how many are honestly over. An over-budget doc whose every
line is contract is not a hole, and must never hold the stamp hostage.

### 10. Commit (git-workflow)

After approval, hand **all** git actions to `$git-workflow` — it owns
worktree isolation and the commit (the stamp change rides the same commit). Use
a `blueprint(<flow|entity>):` or `docs(blueprint):` message. Do not run raw git
here.

**Chain forward.** When the sweep ends with `coverage: complete`, offer to
continue straight into `$plan` for the highest-priority slice (from the
product doc's slice priority) — the user can decline and plan later.
