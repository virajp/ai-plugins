# Format Versioning

vwf's blueprint format evolves. `setup` records the format a repo conforms to
and, on re-run, migrates the gap.

**The stamp** lives inside the **vwf config** — `.config/vwf.yaml` (see
`${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md` for the full schema):

```yaml
config_format: 7
blueprint_format: 14
topology: monorepo # or polyrepo | workspace
ui: true # design-system required
integrations: true # environment.md required (external integration / secret exists)
# plus: product, projects (nuances), harness, enforcement, pipeline,
# environments, memory, docs_sync — per the vwf-config asset
```

Pre-format-6 repos carry the legacy stamp at `docs/blueprint/.vwf.yml`; its
presence is itself drift (the `5 → 6` move below). Everything in the config
**other than `blueprint_format`** is vwf-internal operating state — adding or
changing those keys never requires a blueprint-format bump (`config_format`
versions the file's own schema instead).

**Source of truth (shipped).** The format the installed vwf ships is the integer
in `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`. The workflow commands
self-check the repo stamp against it via
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md` and nudge `/vwf:setup` on drift —
this is what reaches each repo, since vwf is installed once at user level and an
upgrade does not re-run per repo.

**Current format = 14.** (13 is deliberately **skipped** — no format ever
carried it; a repo stamped 13 is impossible and would be treated as 12.) Format
14 = format 12 **plus** the **device-out-of-path** restructure (the `12 → 14`
delta below): a UI project's flows no longer nest under a device-type subgroup —
every flow sits directly at `flows/<project>/<NNN>-<flow>/`, UI and non-UI
alike, and the device type moves into a **`device:` frontmatter key** (`mobile`
| `web` | `carplay` | `android-auto`, required for UI-project flows, omitted for
non-UI). The same segment drops out of the prompts tree
(`docs/prompts/screens/<project>/<NNN>-<flow>/<platform>.md`, with
`CLAUDE--<platform>.md` at the project root). NNN stays gap-numbered **per
device**, so one project folder may hold two flows sharing a number. Format 12 =
format 11 **plus** **screen components as contract** (the `11 → 12` delta
below): every Screens table row carries a **Components block** (headed by the
row's code, per the flow template) — the elements the screen displays (text,
info, error surfaces, buttons, inputs, lists, media), each with its rules:
visibility/enable conditions, what activating it does, and content where the
wording is a product decision. `/vwf:screens prompt` transcribes the block into
the design brief; the blueprint-reviewer enforces it per row. Format 11 = format
10 **plus** the **device-grouped flows and pinned screen codes** restructure
(the `10 → 11` delta below): a UI project's flows nest under a **device-type
subgroup** (`flows/<project>/<device>/<NNN>-<flow>/` — `mobile` for `frontend`,
`web` for `site`/`console`, plus `carplay`/`android-auto` subgroups holding
in-car journeys authored as their **own subset flows** with a `Subset of:`
parent link; flows of non-UI projects keep `flows/<project>/<NNN>-<flow>/`), and
every Screens table row carries a **Code** (`<NNN><letter>` — `020a`, `020b`, …
in step order, stable once assigned) — the per-screen sync key the canvas frames
and `/vwf:screens import` match on. Format 10 = format 9 **plus** the
**project-grouped, execution-ordered flows** restructure (the `9 → 10` delta
below). Format 9 = format 8 **plus** the **process-based restructure** — flows
become the primary doc unit and structured contracts get structured formats:

- **Flows** live at `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md` (type
  **`vwf-flow`**, grouped by primary registry project, NNN = execution order in
  gap numbering, always `index.md` only): Purpose with mandatory `Serves:` goal
  link(s) — flows are the goal-traceability spine — Trigger & Actors (with
  authorization and audit markers), ordered Steps (linking the entities/services
  touched; API-backed steps name an `operationId`), consistency boundary,
  failure handling, idempotency, the `sequenceDiagram`, **Screens** and
  **Background Jobs** (both moved here from entities — process orientation puts
  journeys and their jobs on the process; every screen has exactly one home
  flow), and the **Acceptance** block. The root `integration.md` dissolves:
  `flows/index.md` (type `vwf-integration`) keeps only the flow catalog + the
  Inter-Service Contracts and Consistency Boundaries.
- **Entities** move under `docs/blueprint/entities/<entity>/` and slim to
  supporting data contracts — always exactly `index.md` (Purpose with
  **`Used by:`** flow links replacing `Serves:`; Lifecycle; Invariants;
  Relationships; Concurrency) + **`schema.yaml`** (the authoritative data model
  as JSON Schema 2020-12 in YAML). The surface files
  (`data.md`/`api.md`/`jobs.md`/`screens.md`), the small/large split, and the
  entity Actors & Actions section are retired. `entities/index.md` (type
  **`vwf-entities`**) holds the catalog + the product-wide `erDiagram`.
- **API contracts** move to `docs/blueprint/apis/<project>.openapi.yaml` — one
  authoritative OpenAPI 3.1 document per registry `service` project
  (`info.x-vwf.status` carries the review stamp; YAML artifacts are typed by
  path, not frontmatter). `apis/released/<project>@<version>.openapi.yaml` holds
  the frozen production snapshots `/vwf:verify` writes; from the first snapshot
  on, living-contract changes are additive-only or take a major-version bump.
- Flow and entity docs carry the **`implementation:`** frontmatter key
  (`none`/`partial`/`complete`) — the pipeline's build-state stamp (see the
  blueprint-authoring frontmatter-and-links reference).

Format 8 = format 7 **plus** **folders-only entities**: every entity lives at
`docs/blueprint/<entity>/` — `index.md` alone when the entity is small (all
sections in that one file), `index.md` + the surface files (`data.md` / `api.md`
/ `jobs.md` / `screens.md`) when it is large. The `docs/blueprint/` **root holds
only the system docs** (`product.md`, `architecture.md`, `conventions.md`,
`design-system.md`, `environment.md`, `integration.md`); a flat `<entity>.md` at
the root is drift. Two reasons: the root stops mixing entity content with the
system docs, and inbound links (`<entity>/index.md`) stay stable when an entity
later outgrows one file — no link rewrite on growth.

Format 7 = format 6 **plus** **flow diagrams as contract views** — complicated
flows must be readable at a glance, not only as tables (see the
blueprint-authoring **integration-and-flows** and **entity-contract**
references):

- `architecture.md` System Overview carries a **mermaid `flowchart`** of the
  system shape — one node per registry project, edges for the interconnects —
  kept in sync with the registry.
- Every flow in `integration.md` carries a **mermaid `sequenceDiagram`** of its
  steps (participants = the entities/services the steps name), including the
  failure/compensation branch.
- Every entity **Lifecycle** with three or more states, or any branching,
  carries a **mermaid `stateDiagram-v2`** alongside the transition table.

Diagrams **complement** the tables/steps (which stay the machine-checkable
contract) and follow the markdown plugin's documentation-standards diagram
conventions; they are code-independent like everything else — entity, service,
and state names only.

Format 6 = format 5 **plus** the **vwf config**: the stamp moves from
`docs/blueprint/.vwf.yml` to `.config/vwf.yaml` and becomes the operating config
(per the vwf-config asset) — carrying the harness inventory, the
**`enforcement:` block** (structure/stack/rule opt-outs, moved out of the
registry, which now purely describes the system), per-project nuances (e.g.
Flutter `platforms`), pipeline knobs, verify environments, and the explicit
mempalace wing.

Format 5 = format 4 **plus** the **Product** foundation:
`docs/blueprint/product.md` (type **`vwf-product`**, authored by `/vwf:product`)
— problem, target users, goals with stable `#goal-<slug>` anchors and measurable
metrics, slice priority, non-goals, risks. It is **required unconditionally**
(like the registry — `blueprint` halts without it), and every entity doc's
Purpose carries a **Serves:** line linking at least one goal anchor.

Format 4 = format 3 **plus** an **Acceptance** block on every flow in
`integration.md`: observable Given/When/Then outcomes — at least one success and
one failure/compensation criterion per flow — the contract `plan` turns into E2E
test steps and `execute`'s acceptance stage verifies (see the
blueprint-authoring **integration-and-flows** reference). A repo whose
`integration.md` has no flows (or that has no `integration.md` because no
cross-entity/cross-project flow exists yet) is **not** in drift.

Format 3 = format 2 **plus** an **Environment & Secrets** foundation. A format-2
repo is a format-1 repo whose every `docs/blueprint/` doc is a well-formed **OKF
concept** (vwf is an opinionated profile of Google's Open Knowledge Format — see
the blueprint-authoring skill's frontmatter-and-links reference). Concretely,
format 2 = format 1 **plus**:

- Every blueprint doc opens with **YAML frontmatter** carrying the mandatory
  `type`, `title`, `description`, `status` (optional standardized `timestamp` /
  `owner` / `resource` / `tags`). `type` is from the vwf vocabulary
  (`vwf-architecture`, `vwf-conventions`, `vwf-design-system`,
  `vwf-environment`, `vwf-integration`, `vwf-entity`, `vwf-plan`,
  `vwf-gap-report`; `vwf-environment` arrives with format 3 below).
- Cross-doc relationships are **typed markdown links** (the OKF edge), not
  prose: an entity's **Relationships** rows link the related entity's doc, and
  **References** link `conventions.md` anchors / `design-system.md`.

And format 3 adds one artifact + one type:

- `docs/blueprint/environment.md` (type **`vwf-environment`**) — the
  product-wide per-project inventory of env vars and secrets (no values), a
  foundation alongside `conventions.md`. **Required once `integrations: true`**
  — i.e. the architecture registry's `cross_cutting.integrations` is non-empty
  or `config` selects a secrets manager. `conventions.md#config` keeps only the
  injection *mechanism* (the decision); the per-variable catalog lives in
  `environment.md`.

A format-5 repo therefore also has (unchanged from formats 1–4):

- `docs/blueprint/architecture.md` (registry) and `conventions.md`
- `design-system.md` **if** `ui: true`
- `environment.md` **if** `integrations: true`
- `integration.md` once cross-entity flows exist
- entity docs with **Relationships**, **Concurrency & Consistency**, and
  **Screens** that reference `design-system.md`. Through format 7 an entity is
  **either** a single file `docs/blueprint/<entity>.md` **or** a folder
  `docs/blueprint/<entity>/` (`index.md` + `data.md` / `api.md` / `jobs.md` /
  `screens.md`) — the folder form is never drift and must not be collapsed to a
  single file on migration. **From format 8 the folder is the only form** (see
  above).
- `docs/plans/` with `archived/`

**Drift → migration map.** On re-run, compare the stamp's `blueprint_format` to
the current format and apply the delta:

- **no stamp / legacy `docs/specs/`** → migrate `docs/specs/` →
  `docs/blueprint/` (rename), add the format-1 artifacts, then apply the `1 → 2`
  delta below, write the stamp.
- **`1 → 2`** → for every existing `docs/blueprint/` doc: (a) prepend the OKF
  frontmatter block — infer `type` from the doc's role, `title` from the H1,
  `description` from its purpose line, and set `status: reviewed` for docs
  already in use (else `draft`); leave the optional
  `timestamp`/`owner`/`resource`/`tags` out unless useful (git already tracks
  edit time in-repo). (b) Rewrite each entity's **Relationships** "Related
  entity" cell and its **References** as markdown links to the target doc
  (`[Customer](./customer.md)`, or `../customer/index.md` from a folder surface
  file). Content is otherwise unchanged. Then bump the stamp to `2`.
- **`2 → 3`** → add the **Environment & Secrets** foundation **when the registry
  declares integrations or a secrets-manager `config`** (else no-op — a repo
  with no external integration/secret does not need it, and its absence is not
  drift). Scaffold `docs/blueprint/environment.md` from the environment template
  (type `vwf-environment`). Populate its per-project rows from the repo's
  **existing** env-var/secret usage — config schemas, `.env`/`.env.example`
  files, mise env values, CI secrets/variables — one row per variable (name,
  purpose, issuer, used-by, required, classification), **never the values**. If
  a prior `conventions.md#config` (or any doc) held a secrets/env-var *catalog*,
  move those rows into `environment.md` and leave `#config` with only the
  injection *mechanism*, linking `environment.md`. Add `integrations: true` to
  the stamp. Then bump the stamp to `3`.
- **`3 → 4`** → for every flow in `docs/blueprint/integration.md`, add an
  **Acceptance** block (per the integration template): elicit — never invent —
  at least one success and one failure/compensation criterion as observable
  Given/When/Then outcomes. No flows (or no `integration.md`) → no-op, not
  drift. Then bump the stamp to `4`.
- **`4 → 5`** → author `docs/blueprint/product.md` via `/vwf:product` (elicit —
  never invent — the problem, users, goals/metrics, slice priority). Entity docs
  then gain their **Serves:** goal links **as each is next touched by
  `/vwf:blueprint`** (the reviewer enforces it on touch) — the migration does
  not retrofit every entity in one pass; a missing Serves line on an untouched
  entity is tolerated drift, a missing `product.md` is not. Then bump the stamp
  to `5`.
- **`5 → 6`** → `git mv docs/blueprint/.vwf.yml .config/vwf.yaml` (move, never
  delete) and restructure per the vwf-config asset: add `config_format: 1`; keep
  the stamp keys and `harness:` block; add `product.name` and `memory.wing`
  (derive from the repo/registry, confirm with the user); **move the registry's
  `deviations:` block** into `enforcement:` (`structure`/`stacks`/`rules` form)
  and remove it from `docs/blueprint/architecture.md`; leave
  `pipeline`/`environments`/`docs_sync` absent (defaults) unless the user pins
  them. Then bump the stamp to `6`.
- **`6 → 7`** → add the diagrams, **derived from content that already exists**
  (a mechanical migration — no elicitation): generate the system-shape
  `flowchart` in `architecture.md` from the registry (`projects` +
  `depends_on`/interconnect prose); a `sequenceDiagram` per `integration.md`
  flow from its written steps + failure handling; a `stateDiagram-v2` per entity
  Lifecycle table with ≥3 states or branching. A diagram must not add or
  contradict anything its table says — the table stays authoritative. No flows /
  no qualifying lifecycles → those parts are no-ops, not drift. Then bump the
  stamp to `7`.
- **`7 → 8`** → for every flat entity doc `docs/blueprint/<entity>.md`: `git mv`
  it to `docs/blueprint/<entity>/index.md` (move, never delete; entities already
  in folder form are untouched), then rewrite links mechanically — content
  otherwise unchanged: (a) **inbound** — every link to `./<entity>.md` across
  the bundle and the active `docs/plans/` becomes `./<entity>/index.md` (or
  `../<entity>/index.md` from inside another entity folder); (b) **outbound** —
  links inside each moved file gain one level: `./product.md#goal-x` →
  `../product.md#goal-x`, `./conventions.md#auth` → `../conventions.md#auth`,
  `./design-system.md` → `../design-system.md`, and a sibling entity →
  `../<other>/index.md`. Verify every edge resolves after the pass (the OKF
  bar). No flat entity docs → no-op. Then bump the stamp to `8`.
- **`8 → 9`** → the process-based restructure, in **two phases**:

  **Phase 1 — mechanical scaffold** (this migration, consent-gated as usual):

  1. Create `entities/` and
     `git mv docs/blueprint/<entity>/ →
     docs/blueprint/entities/<entity>/`
     for every entity folder (move, never delete). Rewrite links mechanically:
     from inside an entity, root system docs gain one level (`../product.md` →
     `../../product.md`); sibling entity links are unchanged
     (`../<other>/index.md`).
  2. `git mv docs/blueprint/integration.md docs/blueprint/flows/index.md`, then
     cut each `### <flow>` body into `flows/<flow-slug>/index.md` (type
     `vwf-flow`, `status: draft`) — the Inter-Service Contracts and Consistency
     Boundaries sections stay in `flows/index.md`, which gains the flow-catalog
     table.
  3. Per entity: convert the Data Model table into `schema.yaml`
     (Field/Type/Optional/Default/Validation → properties/`required`/`default`;
     unmappable validation prose → the property's `description`); replace the
     markdown section with the schema link + notes.
  4. Extract every API Surface table into `apis/<project>.openapi.yaml` stubs by
     the section's registry target (generated `operationId`s like `cancelOrder`;
     `info.x-vwf.status: draft`; `info.version: 0.1.0`). Create the empty
     `apis/released/` dir.
  5. Move each Screens/Jobs row under the single flow whose steps touch it when
     unambiguous; ambiguous rows go to a **triage checklist** under
     `flows/index.md` Open Questions — reviewed, never silently guessed.
  6. Rewrite each entity's `Serves:` line to `Used by:`, linking the migrated
     flows that reference it; an entity no flow references keeps its old
     `Serves:` line and is flagged as drift for the follow-up sweep.
  7. Dissolve surface files: `data.md` content merges into `index.md` +
     `schema.yaml`; `api.md`/`jobs.md`/`screens.md` dissolve into steps 4–5.
  8. Seed `implementation:` on every flow and entity doc — `none` by default,
     with one elicited bulk option ("everything currently blueprinted is built"
     → `complete`). Set `status: draft` on every doc whose content changed.
     Scaffold `entities/index.md` (catalog + `erDiagram` from the Relationships
     tables).
  9. Bump the stamp to `9`, apply the config `2 → 3` migration (per the
     vwf-config asset), and downgrade `blueprint.coverage` to `partial`
     (remaining = the draft flows + the triage list).

  **Phase 2 — elicited fill** (not this migration): the scaffold cannot invent
  flow actors, missing goal links, triage placements, or acceptance criteria for
  flows that never existed — offer `/vwf:blueprint` (consent-gated); coverage
  stamps `complete` only after that sweep, including the new whole-product
  coherence review.

- **`9 → 10`** → **project-grouped, execution-ordered flows**:

  1. For every flow folder, resolve its **primary project** — the registry
     project that owns the journey (the UI project of its Screens; for a UI-less
     flow, the service/worker whose trigger starts it). Unambiguous → state it;
     ambiguous → MCQ, never guessed.
  2. Elicit each project group's **execution order** (the order the journeys run
     on that surface — e.g. splash before signin) and assign **NNN gap numbers**
     in steps of 10 (`010`, `020`, …) so later inserts slot between neighbors
     without renumbering.
  3. `git mv docs/blueprint/flows/<flow>/ →
     docs/blueprint/flows/<project>/<NNN>-<flow>/`
     (move, never delete). Rewrite links mechanically: outbound links from moved
     flow docs gain one level (`../../entities/…` → `../../../entities/…`,
     `../index.md` → `../../index.md`); inbound links (entity `Used by:` lines,
     catalogs, active plans' `covers:`) re-point to the new path. Verify every
     edge resolves (the OKF bar).
  4. Regroup the `flows/index.md` catalog by project (one subsection per
     registry project, rows in numeric order).
  5. Rewrite flow identifiers in `.config/vwf.yaml`: `design.flows_pushed`
     entries and `blueprint.remaining` `flows/…`/`screens/…` entries become
     `<project>/<NNN>-<flow>`. Note that pushed canvas folders still carry the
     old names — the next `/vwf:mockups` sweep or `/vwf:screens` session renames
     them (drop stale `flows_pushed` entries if strictness is preferred; elicit
     once).
  6. Bump the stamp to `10`. No content changes — `status:` and
     `implementation:` stamps are preserved; coverage is preserved when every
     link resolves after the pass.

- **`10 → 11`** → **device-grouped flows + pinned screen codes**:

  1. For every **UI** registry project (`site`, `frontend`, `console`), resolve
     its **primary device subgroup** — `mobile` for `frontend`, `web` for
     `site`/`console` — and
     `git mv docs/blueprint/flows/<project>/<NNN>-<flow>/ →
     docs/blueprint/flows/<project>/<device>/<NNN>-<flow>/`
     for each of its flows (move, never delete). Flows of non-UI projects are
     untouched. Rewrite links mechanically: outbound links from moved flow docs
     gain one level (`../../../entities/…` → `../../../../entities/…`,
     `../../index.md` → `../../../index.md`); inbound links (entity `Used by:`
     lines, catalogs, active plans' `covers:`) re-point to the new path. Verify
     every edge resolves (the OKF bar). NNN execution order is now **per device
     subgroup**; existing numbers are preserved by the move.
  2. Add the **Code** column to every Screens table: `<NNN><letter>` (`020a`,
     `020b`, …), letters assigned in existing row (step) order. Codes are stable
     once assigned — a later insert takes the next free letter, never a
     re-letter.
  3. In-car variants recorded as Screens-row deviations under the format-10
     automotive shape cannot be migrated mechanically — an in-car journey is now
     its **own flow** (`flows/<project>/<carplay|android-auto>/<NNN>-<flow>/`,
     Purpose carrying a `Subset of:` link to the parent phone flow). Flag each
     such deviation, downgrade `blueprint.coverage` to `partial` with the
     pending in-car flows in `remaining:`, and offer `/vwf:blueprint`
     (consent-gated) to elicit them — the migration never invents journeys.
  4. `git mv docs/prompts/screens/<project>/<NNN>-<flow>/ →
     docs/prompts/screens/<project>/<device>/<NNN>-<flow>/`
     for each existing brief folder. Numbered `<seq>.md` briefs are superseded —
     since format 11 a brief is `<platform>.md` (one per flow per device type,
     always the full flow blueprint, regenerated in place); elicit once whether
     to delete the old numbered briefs or keep them as history (git holds them
     either way).
  5. Rewrite flow identifiers in `.config/vwf.yaml`: `design.flows_pushed` and
     `blueprint.remaining` `flows/…`/`screens/…` entries gain the device segment
     (`<project>/<device>/<NNN>-<flow>`). Canvas **page names**
     (`<NNN>-<flow>--<platform>`) are unchanged, so no canvas rename is needed;
     the `mockups/` card folder scheme gains the device segment on the next
     `/vwf:mockups` sweep.
  6. Bump the stamp to `11`. Beyond the Code column, no content changes —
     `status:` and `implementation:` stamps are preserved.

- **`11 → 12`** → **screen components as contract**: every Screens row gains a
  **Components block** (per the flow template) — the elements the screen
  displays, each with its rules. Component rules are product decisions the
  migration must never invent: they are elicited **as each flow is next touched
  by `/vwf:blueprint`** (the reviewer enforces the block on touch) — a missing
  Components block on an untouched flow is tolerated drift, never a coverage
  downgrade. The migration itself is a stamp bump to `12` plus the config
  `5 → 6` migration (per the vwf-config asset) — the per-device
  `design.projects` pins the format-12 screens machinery reads.

- **`12 → 14`** → **device out of the path, into frontmatter** (13 is skipped —
  no repo ever carried it; treat a stamped `13` as `12`). Fully mechanical, no
  elicitation — every value the migration needs is already in the tree:

  1. `git mv docs/blueprint/flows/<project>/<device>/<NNN>-<flow>/ →
     docs/blueprint/flows/<project>/<NNN>-<flow>/`
     for each flow of each UI project (move, never delete). Non-UI project flows
     are already flat and are untouched. **Collision guard:** if two device
     subgroups hold a folder with the *same* `<NNN>-<flow>` name, the move would
     clobber — halt and elicit a rename for one of them before continuing (NNN
     alone may repeat; the full folder name may not).
  2. Add `device: <subgroup>` to the frontmatter of each moved flow, taking the
     value from the subgroup directory it came from — placed after `status:`,
     before `implementation:`. Non-UI flows get no key.
  3. Rewrite links mechanically, the inverse of the `10 → 11` step. From each
     moved flow doc:
     - **root-ward links lose one level** — `../../../../entities/…` →
       `../../../entities/…`, likewise `product.md`, `conventions.md`,
       `design-system.md`, `apis/…`;
     - **the flow-catalog back-link** `../../../index.md` → `../../index.md`;
     - **every flow → flow link collapses to a sibling path** —
       `../../<device>/<NNN>-<flow>/index.md` → `../<NNN>-<flow>/index.md`. This
       covers an in-car flow's `Subset of:` parent **and** the ordinary
       cross-flow links the Screens **home rule** produces (a flow linking the
       row of the flow that homes a screen); both must be rewritten, not just
       `Subset of:`.

     Inbound links from `flows/index.md`, entity `Used by:` lines, and plan docs
     drop the `<device>` segment. Verify every edge resolves afterwards (the OKF
     bar) — a dangling link is a failed migration, not tolerated drift.
  4. `git mv docs/prompts/screens/<project>/<device>/<NNN>-<flow>/ →
     docs/prompts/screens/<project>/<NNN>-<flow>/`
     for each brief folder, and `git mv` each `CLAUDE--<platform>.md` up to
     `docs/prompts/screens/<project>/`. Same collision guard as step 1.
  5. Rewrite flow identifiers in `.config/vwf.yaml`: `design.flows_pushed` and
     `blueprint.remaining` `flows/…`/`screens/…` entries **drop** the device
     segment (`<project>/<NNN>-<flow>`). Canvas **page names**
     (`<NNN>-<flow>--<platform>`) are unchanged, so no canvas rename is needed;
     the canvas-side `mockups/<device>/` card folders are unchanged too — that
     segment is now sourced from the flow's `device:` key rather than its path.
  6. Regroup `flows/index.md`'s catalog headings by the new `device:` key rather
     than the (now absent) directory level. Row order and content are unchanged.
  7. Bump the stamp to `14` and `config_format` to `7` (per the vwf-config asset
     — the `6 → 7` migration is exactly this entry-format rewrite). No content
     changes: `status:` and `implementation:` stamps are preserved.

- **future bumps** → add an `N → N+1` entry here describing exactly what to add
  or change, so a re-run is a mechanical, reviewable migration.

Bump `blueprint_format` whenever a vwf change requires restructuring an existing
repo: increment `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`, add the `N→N+1`
delta here so `setup` can carry it out, and the workflow commands will start
nudging stale repos automatically.
