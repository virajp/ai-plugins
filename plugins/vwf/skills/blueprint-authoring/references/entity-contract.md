# Entity Contract

An entity is a **supporting data contract**, no longer the primary blueprint
unit. One entity per **folder** `docs/blueprint/entities/<entity>/`, always
exactly two files: `index.md` (type `vwf-entity`) and `schema.yaml` (the
authoritative data model — see
[api-and-schema-contracts](./api-and-schema-contracts.md)). The small/large
split, the surface files (`data.md` / `api.md` / `jobs.md` / `screens.md`), and
the flat root entity file are all **retired** — an entity is one folder of two
files, and its behavior in context lives on the **flows** that use it.

Fill every applicable section to the **no-two-reasonable-answers** bar. Spend
the precision budget on `schema.yaml`.

## The slimmed entity sections (`index.md`)

- **Purpose** — one paragraph: what it is and why it exists, no implementation
  detail. Plus a mandatory `Used by:` line (below).
- **Out of Scope** — explicit exclusions; the highest-value section for
  preventing scope drift.
- **Lifecycle / State Machine** — the transition table + diagram bar (below).
- **Invariants** — business rules that must never be violated, stated so they
  can be turned into a test.
- **Data Model** — a **required link to `./schema.yaml`** plus short notes only
  (id/format conventions, derived fields). Never a second field table; the
  schema is the single source of truth.
- **Relationships** — per relation: the related entity as a resolving markdown
  link (`[<Other>](../<other>/index.md)` — sibling folder), cardinality (1–1,
  1–N, N–M), ownership (composition — child can't exist without the parent — vs
  reference), on-delete (cascade / restrict / nullify), and whether required.
  Unchanged from before; the product-wide `erDiagram` in `entities/index.md` is
  a view of the union of these tables.
- **Concurrency & Consistency** — how concurrent writes resolve (optimistic
  version / last-write-wins / merge / conflict error), uniqueness guarantees
  under races, and the idempotency of each mutating action. A contract decision,
  not an implementation detail — pin it.
- **References** — resolving markdown links to the `conventions.md` anchors this
  entity relies on.
- **Open Questions** — dated, genuinely-open items; never silent assumptions.

Reference `conventions.md` anchors instead of repeating cross-cutting decisions.

## What the entity no longer carries

Process-orientation moved everything about an entity's *behavior in context*
onto the flows that exercise it:

- **Screens** → the **flow's** Screens section (the flow that owns the journey;
  see [flow-contract](./flow-contract.md), the home rule).
- **Background Jobs** → the **flow's** Background Jobs section (sync/async and
  worker-vs-service placement decided there).
- **API Surface** → the per-service **OpenAPI** file
  (`apis/<project>.openapi.yaml`); the entity is `$ref`'d for its shapes.
- **Actors & Actions** — **retired**, absorbed by the flow's Trigger & Actors
  table, the OpenAPI `security`, and the lifecycle Trigger column.
- **The stable/volatile marker** — **retired**.
- **Limits & NFRs** that constrain a *process* live on the flow; generic ones
  stay in `conventions.md`.

## The `Used by:` traceability rule

Where flows carry `Serves:` (a direct edge to a product goal), an entity carries
**`Used by:`** — one line in Purpose linking at least one flow
(`[<Flow>](../../flows/<project>/[<device>/]<NNN>-<flow>/index.md)`). Entities
serve product goals **transitively**, through the flows that reference them
(entity → flow → goal). An entity no flow references is a speculative surface:
either a flow is missing from the blueprint or the entity shouldn't exist. The
coherence reviewer verifies these back-links match the flows that actually link
the entity.

## The lifecycle bar

Every state transition has a trigger, a guard, and a side effect; no implied-
but-unlisted transitions. The **Trigger column names the acting actor or
system** (this is part of what absorbed the retired Actors & Actions surface). A
lifecycle with **three or more states, or any branching** also carries a mermaid
`stateDiagram-v2` beside the table — a user lifecycle read row-by-row is exactly
where a contract stops being scannable. The diagram shows the same states and
transitions as the table (which stays authoritative), nothing more; follow the
documentation-standards diagram conventions. Delete the diagram block for a
trivial (≤2-state, linear) lifecycle.

**Flow-step ↔ lifecycle-transition agreement.** A flow step that moves this
entity between states must match a row in this table, and every transition here
should be reachable from some flow step. The coherence reviewer checks the two
agree — a lifecycle transition no flow drives, or a flow step that names a
transition absent here, is a gap.

## The Data-Model-links-schema rule

The Data Model section is **a link to `./schema.yaml` plus short notes** — never
a field table. Duplicating fields into the markdown creates two sources of truth
that drift; the schema is authoritative and the reviewer checks that `index.md`
does not restate it.

## Doc units

The commands still route each registry project onto a **doc unit**, but format 9
splits where each is authored:

- **page** / user-journey units (typically a `site` or `console` project) are
  authored as **flows** under `docs/blueprint/flows/` — a page *is* a UI
  journey, and journeys live on flows now, so there is no separate page entity
  doc.
- **module** units (typically a `packages` project — its public contract,
  invariants, consumers) stay under `entities/` as an entity folder. A module
  that genuinely has no data model writes `schema.yaml` as `N/A — <reason>` (a
  bare `N/A` with no reason is a gap); its contract lives in the `index.md`
  Invariants/Relationships and, where it exposes an API, the OpenAPI file.
- **entity** units — the default; one business entity, one folder, as above.
