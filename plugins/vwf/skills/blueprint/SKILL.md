---
name: blueprint
description: Maintain the always-current, full-product blueprint under
  docs/blueprint/ —
  one entity doc per entity plus conventions.md. Stack-agnostic; resolves
  section→project mapping from the architecture registry. Gated by a fresh
  subagent completeness reviewer loop. A run sweeps entity by entity until
  whole-product coverage holds, then stamps it in .config/vwf.yaml — /vwf:plan
  halts without a complete stamp.
argument-hint: "[entity]"
model: sonnet
effort: xhigh
disable-model-invocation: true
---

# blueprint — Full-Product Blueprint

Maintain the **whole product's** desired end state under `docs/blueprint/`. The
blueprint is product-wide and permanent — not feature-specific. It is organized
by **entity**: one entity holds the full-stack picture (data model, API,
background jobs, screens), with stable product intent at the top and volatile
engineering detail at the bottom, separated by a marker.

An entity is always documented as a **folder** `docs/blueprint/<entity>/`: a
small entity holds every section in a single `index.md`; a large one splits the
engineering surfaces into sibling files (see §4). The `docs/blueprint/` **root
holds only the system docs** (product, architecture, conventions, design-system,
environment, integration) — entity content never sits flat at the root. A flat
`<entity>.md` is pre-format-8 drift; `/vwf:setup` migrates it.

**A run is a sweep, not a single entity.** The blueprint must describe the
**whole product's** as-of state before anything downstream consumes it —
`/vwf:plan` hard-halts unless the coverage stamp (§9) reads `complete`. A run
therefore works entity by entity (§§2–8 per entity) but does not end at one
entity: it continues down the coverage worklist (§1) until whole-product
coverage holds, or the user stops early — in which case the stamp records
`partial` with what remains, and planning stays blocked until a later run
finishes the sweep.

You own the user conversation. Elicitation is **interactive and stays with you**
— do not spawn a subagent for it (a subagent cannot pause to ask a question).
Only the completeness review is delegated, to a fresh stateless subagent.

Adopt the **Product & Engineering Author** persona: capture user goals and
observable outcomes precisely, then pin down the data model and API surface
without ambiguity. Surface open decisions rather than guessing.

## Doc Paths

| Doc             | Path                                                    |
| --------------- | ------------------------------------------------------- |
| Product         | `docs/blueprint/product.md`                             |
| Registry        | `docs/blueprint/architecture.md`                        |
| Conventions     | `docs/blueprint/conventions.md`                         |
| Entity          | `docs/blueprint/<entity>/` (`index.md` ± surfaces, §4)  |
| Design system   | `docs/blueprint/design-system.md`                       |
| Environment     | `docs/blueprint/environment.md`                         |
| Integration     | `docs/blueprint/integration.md`                         |
| Entity template | `${CLAUDE_PLUGIN_ROOT}/assets/templates/entity.md`      |
| Conv. template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/conventions.md` |
| Env. template   | `${CLAUDE_PLUGIN_ROOT}/assets/templates/environment.md` |
| Integ. template | `${CLAUDE_PLUGIN_ROOT}/assets/templates/integration.md` |

Doctrine: the **blueprint-authoring** skill (contract-vs-realization,
entity-contract, integration-and-flows, ui-ux-contract, environment-catalog,
quick-reference). Entities with an **API Surface** also apply the
**rest-api-design** skill for endpoint contract depth.

Reserved entity names: `product`, `architecture`, `conventions`,
`design-system`, `environment`, `integration` — the root's system docs; an
entity folder never takes one of these names.

---

## Pipeline

### 1. Read the product doc & registry

Read `docs/blueprint/product.md`. **Halt if it does not exist:** "No product doc
found. Run `/vwf:product` first — the blueprint needs the goals every entity
must trace to." Hold its goal anchors (`#goal-<slug>`) and slice priority: goals
anchor every entity's Purpose; the priority list is what you suggest when the
user asks what to blueprint next.

Read `docs/blueprint/architecture.md`. **Halt if it does not exist:** "No
registry found. Run `/vwf:architecture` first to bootstrap
`docs/blueprint/architecture.md`."

**Format check.** Run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/vwf:setup` (proceed unless a needed artifact
is missing).

**Build the coverage worklist.** Whole-product coverage holds when, all at once:

- every product goal (`#goal-<slug>`) is `Serves:`-linked by at least one
  entity's Purpose;
- every entity a relationship, reference, or `integration.md` flow points at
  exists on disk (no "target not yet authored" holes);
- every entity doc is `status: reviewed` (it passed the reviewer loop);
- every registry project's surfaces are represented per its `doc_unit`
  (`N/A — <reason>` counts as represented).

List every entity that fails a check, ordered by the product doc's slice
priority — this is the run's worklist. Deciding whether a goal genuinely needs a
*new* entity (vs. an existing one extended) is elicitation, not inference: when
a goal is unserved, ask.

If `$ARGUMENTS` named an entity, start there (prepend it to the worklist);
otherwise start at the top. An empty worklist with a named entity means a
targeted update — do it, then re-check coverage in §8 (an update can open new
holes, e.g. a relationship to a not-yet-authored entity).

### 2. Determine surfaces

From the entity's nature and the registry, determine which engineering sections
apply. Map **by project `type`, never by literal technology**:

| Entity section  | Resolves to (registry `type`)                    |
| --------------- | ------------------------------------------------ |
| Data Model      | the schema/contract package                      |
| API Surface     | service/API project(s)                           |
| Background Jobs | worker project(s)                                |
| Screens         | UI project(s) (`site`, `frontend`, or `console`) |

If a type is absent from the registry, **omit** that section for this entity.

**Platform extensions.** Read `.config/vwf.yaml` `projects.<name>.platforms`
(per the vwf-config asset). When a UI project declares targets beyond its
stack's default (e.g. a Flutter `frontend` also shipping `macos`/`windows`), the
Screens elicitation covers what genuinely differs per platform —
navigation/input idiom, window/layout behavior, platform-specific states — and
records only the differences, never a per-platform copy of the screen.

**Doc unit.** Each registry project also declares a `doc_unit` (`entity` /
`page` / `module`) — the unit its slice of the blueprint is documented in.
`entity` is the default and everything below reads as entity-first, but the
other units are first-class and use the **same doc structure, sections, and
completeness bars**:

- `entity` → `docs/blueprint/<entity>/`, unchanged.
- `page` (typically a `site` or `console`) → the doc's unit is a page or user
  journey; an engineering surface the unit genuinely lacks (e.g. Data Model for
  a static page) is written as `N/A — <reason>`, never silently omitted.
- `module` (typically `packages`) → the doc's unit is a module boundary — its
  public contract, invariants, and consumers; the same `N/A — <reason>` rule
  applies to surfaces a library doesn't have.

When a slice spans projects with different doc units, author at the product's
dominant unit and let each section's target project keep its own vocabulary.

**Design-system gate.** If the doc has a **Screens** surface (the registry has a
`site`, `frontend`, or `console` project), `docs/blueprint/design-system.md`
must exist. **Halt if it does not:** "This entity has UI but no design system.
Run `/vwf:design-system` first." Screens reference the design system; they never
re-decide visual language.

### 3. Interactive elicitation (orchestrator)

**Recall first.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall prior
decisions, drift, and unreconciled gaps for this entity (rooms `decisions`,
`problems`, `gaps`) before eliciting — build on them and don't re-ask resolved
questions. When execution surfaced a blueprint gap (room `gaps`), treat closing
it as a first-class goal of this pass. Skip silently if mempalace is
unavailable.

Adopt the authoring persona and elicit following the **elicitation protocol** in
`${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md` (explore → scope-check → one
question at a time → propose 2-3 approaches → present in sections → gate →
self-review). Fill the entity template (§4.1) and, where a cross-cutting
decision surfaces, the conventions skeleton.

Blueprint-specific notes layered on the protocol:

- **Apply the `blueprint-authoring` skill:** the contract-vs-realization line
  (record only decisions true regardless of how the code is written today; leave
  reuse/placement/ordering/library choices to `plan`), plus the per-surface bars
  — **Relationships** (cardinality, ownership, cascade), **Concurrency &
  consistency**, multi-entity **flows**, and per-screen **UI/UX** (referencing
  the design system, not re-deciding it).
- **Decisions-vs-mechanics (protocol §4):** spend the precision budget on **Data
  Model** and **API Surface**; the product half may stay prose-light.
- **Apply the `product-foundations` skill** for every foundation the registry's
  `cross_cutting` block accepted: expand its contract into `conventions.md`
  under the anchor its reference names (on first touch), and elicit the
  per-entity surface as this entity is authored — audit-recorded rows in Actors
  & Actions (all operator + destructive rows by default), notification triggers,
  **sync/async classification per mutating action with worker-vs-service
  placement** (apply the placement rule; MCQ only when both placements are
  defensible), and the runtime-settings keys the entity reads. Foundations
  expand into existing sections — never new mandatory structure.
- **Approaches (protocol §5):** where a data-model or API shape has competing
  designs (e.g. embed vs reference, sync vs async surface), present the options
  before committing.
- Minimalism rung 1 (`${CLAUDE_PLUGIN_ROOT}/assets/minimalism.md`, applied to
  requirements) and the protocol's scope check (§2, one entity per pass) carry
  over unchanged — no blueprint-specific delta.

### 4. Write the entity doc

Open every doc with the **OKF frontmatter** block (`type: vwf-entity`, `title`,
`description`, `status`; optional `timestamp`/`owner`/`resource`/`tags`) and
write Relationships/References as resolving markdown links — per the
blueprint-authoring **frontmatter-and-links** reference. Set `status: draft`
until the reviewer loop (§5) returns `NO GAPS`, then `reviewed`.

Write the entity as a **folder** `docs/blueprint/<entity>/` — same sections
either way, only the file boundary differs by size:

- **Small entity** — everything in `index.md`: stable product sections (Purpose
  … Invariants) above the marker; volatile engineering sections below. The
  default for an entity that reads comfortably in one file.
- **Large entity** — split across sibling files: `index.md` (Purpose …
  Invariants, References, Open Questions — the stable product half) + `data.md`
  (Data Model, Relationships, Concurrency & Consistency) + `api.md` (API
  Surface) + `jobs.md` (Background Jobs) + `screens.md` (Screens). Omit any
  surface file whose project type is absent from the registry. Split when the
  entity is too large to read in one sitting — a rough cue is **~400 lines, or
  all engineering surfaces present with more than one job/screen each** — a
  judgement call, not a forced migration.

Because the folder is the unit, growing a small entity later just moves sections
into sibling files — inbound links (`<entity>/index.md`) never break. Update
`docs/blueprint/conventions.md` for any cross-cutting decisions raised.

**Environment & secrets.** If this entity introduces an external integration or
a credential/env var a project must consume (a third-party API key, signing key,
service-account credential, webhook secret, or new operational env var),
maintain `docs/blueprint/environment.md` — create it from the environment
template if it does not yet exist, then add/update a row per variable under its
consuming project (name, purpose, issuer, used-by, required, classification),
**never the value**. Apply the blueprint-authoring **environment-catalog**
reference (the catalog-not-wiring line, the classification, and its self-gate
checklist); `environment.md` defers the injection mechanism to
`conventions.md#config`. Secrets are project/integration-scoped — they live
here, not in the entity doc.

**Cross-entity.** Record each relation in the entity's **Relationships**
section. Capture any multi-entity flow or inter-service contract in
`docs/blueprint/integration.md` (from the integration template) — not inside a
single entity doc. A single-entity journey that **crosses projects** (app →
service → datastore) is a flow too. **Every flow carries an Acceptance block** —
elicit at least one success and one failure/compensation criterion as observable
Given/When/Then outcomes per the integration-and-flows reference; these are what
`plan` turns into E2E test steps and `execute`'s acceptance stage verifies.

**Self-review before the reviewer.** Run the elicitation protocol's self-review
pass (§8) over the written doc — no `TBD`/`TODO`/placeholder outside Open
Questions, no section contradicting another, no requirement reading two ways,
frontmatter and links filled — and fix inline before dispatching the reviewer.
Don't burn a reviewer round on trivia.

### 5. Reviewer loop (fresh subagent)

Loop until the doc passes:

1. Dispatch a **fresh** `blueprint-reviewer` subagent (stateless) with **only**
   the written entity doc — **all files** of the entity folder (`index.md` + any
   surface files) — plus the relevant `conventions.md` anchors and registry
   block it references, and the **current list of entity docs** under
   `docs/blueprint/` (names only) — no conversation context. Also pass the
   **product doc's goal-anchor list** (`#goal-<slug>` names only) so it can
   verify the entity's goal links. When this pass **touched `integration.md`**,
   pass that doc too and name the flows added/changed — the reviewer applies its
   integration-doc items (incl. the Acceptance block bar) to exactly those
   flows. It checks the doc against the completeness checklist in its own
   instructions, **verifies every outbound relationship/reference link resolves
   on disk**, and returns `NO GAPS` or a numbered gap list. Tell it the doc's
   `doc_unit` so it accepts an explicit `N/A — <reason>` on unit-inapplicable
   surfaces (§2). The entity-doc list lets it separate a broken/wrong-path link
   from a link to a not-yet-authored entity: the latter comes back as a gap of
   kind "target not yet authored", which you present to the user and may accept.
2. **Gaps** → present them, re-elicit the specific open decisions with the user
   (one at a time), update the doc, return to step 1.
3. **`NO GAPS`** → exit.

**Convergence guard:** before another round, compare to the prior round. Pause
and ask the user if the gap count did not strictly decrease, or a resolved gap
resurfaced. No fixed round cap.

### 6. Reconcile architecture

If the blueprint's project or capability shape changed (a new project,
capability, or cross-cutting decision implied by this entity), update the
**registry block** in `docs/blueprint/architecture.md` precisely — via
`/vwf:architecture` if the change is non-trivial. Do not rewrite the prose
unless the topology genuinely changed.

When this pass added a cross-cutting decision to `conventions.md` (a new
integration, a `config`/secrets mechanism, an auth or error convention), check
the registry's `cross_cutting` block covers it and reconcile any mismatch —
through `/vwf:architecture` for a non-trivial change.

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store this entity's
durable decisions and their rationale, plus any drift flagged, to mempalace
(rooms `decisions`, `problems`) — skip what the entity doc already captures
verbatim.

### 7. Reconcile inbound links (rename / delete)

When this pass **renames** or **removes** an entity, no dangling OKF edge may be
left behind. Grep `docs/blueprint/` (every entity folder, `conventions.md`,
`integration.md`, `environment.md`) and the active plans under `docs/plans/` for
inbound markdown links to the old doc — the folder form `./<entity>/index.md`
(and the legacy flat form `./<entity>.md` in a not-yet-migrated repo).

- **Rename** → update every inbound link to the new path in this same pass.
- **Delete** → list every inbound link and require the user to resolve each
  (re-point the relationship to another entity, or remove it) before the commit.
  A relationship pointing at a deleted entity is never left dangling.

If neither happened, skip this step.

### 8. Approval gate & sweep continuation

Summarize what was written/changed (entity doc, conventions, registry, any link
fixups) and wait for explicit approval.

**Continue the sweep.** After approval, re-derive the coverage worklist (§1) —
this pass may have closed holes or opened new ones. If entities remain, proceed
to the next one (back to §2) — one entity per pass, each behind its own
approval. The user may stop early; note what remains in the approval summary and
the commit message, and stamp accordingly (§9). Never trim the worklist to end
sooner — coverage is checked, not negotiated.

### 9. Stamp coverage

Record the sweep's result in `.config/vwf.yaml` (per the vwf-config asset):

```yaml
blueprint:
  coverage: complete # or partial
  remaining: [] # the unresolved worklist entities when partial
```

Stamp after **every** run — a targeted update that opened a hole downgrades a
`complete` stamp to `partial`. This stamp is what `/vwf:plan` gates on.

### 10. Commit (git-workflow)

After approval, hand **all** git actions to `/vwf:git-workflow` — it owns
worktree isolation and the commit (the stamp change rides the same commit). Use
a `blueprint(<entity>):` or `docs(blueprint):` message. Do not run raw git here.

**Chain forward.** When the sweep ends with `coverage: complete`, offer to
continue straight into `/vwf:plan` for the highest-priority slice (from the
product doc's slice priority) — the user can decline and plan later.
