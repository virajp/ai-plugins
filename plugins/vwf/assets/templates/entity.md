---
type: vwf-entity
title: <Name>
description: <one-line purpose of this entity>
status: draft # draft | reviewed | stable
implementation: none # none | partial | complete — written by the pipeline only (see frontmatter-and-links)
# optional, standardized: timestamp: <ISO 8601>  owner: [<project from registry>]  resource: <url|path>  tags: [<...>]
---

# Entity: <Name>

<!-- One entity per FOLDER: docs/blueprint/entities/<entity>/ — always exactly
     index.md (this file) + schema.yaml (the authoritative data model). An
     entity is a SUPPORTING DATA CONTRACT: its behavior in context lives in the
     flows that use it (docs/blueprint/flows/), its API surface in
     docs/blueprint/apis/<project>.openapi.yaml, its screens and jobs on the
     flows that need them. See the blueprint-authoring skill (entity-contract).

     Decisions vs mechanics: if a choice has more than one reasonable answer, it
     belongs here or in schema.yaml. If it has exactly one idiomatic answer
     given architecture.md + conventions.md, leave it to `execute` at codegen
     time. -->

## Purpose

One paragraph. What it is and why it exists. No implementation detail.

Used by: [<Flow name>](../../flows/<project>/<NNN>-<flow>/index.md)

<!-- Every entity is used by at least one flow — entities serve product goals
     TRANSITIVELY through the flows that reference them (entity → flow → goal).
     An entity no flow references is a speculative surface: either a flow is
     missing from the blueprint or the entity shouldn't exist. The coherence
     reviewer verifies these back-links match the flows that actually link
     this entity. -->

## Out of Scope

- Explicit exclusions. Highest-value section for preventing scope drift.

## Lifecycle / State Machine

| From | To | Trigger (actor/system) | Guard | Side effect |
| ---- | -- | ---------------------- | ----- | ----------- |

<!-- The Trigger column names the acting actor or system. Flow steps that move
     this entity between states must match a row here — the coherence reviewer
     checks the two agree. With three or more states, or any branching, also
     draw the lifecycle as a mermaid stateDiagram-v2 below the table — same
     states and transitions as the table (which stays authoritative), nothing
     more. Delete the block for a trivial (≤2-state, linear) lifecycle. -->

```mermaid
stateDiagram-v2
    [*] --> <state>
    <state> --> <next>: <trigger>
```

## Invariants

- Business rules that must never be violated.

## Data Model

Authoritative schema: [schema.yaml](./schema.yaml)

- Optional short notes only (id/format conventions, derived fields) — never a
  second field table; the schema is the single source of truth.

## Relationships

| Related entity                 | Cardinality | Ownership | On delete | Required |
| ------------------------------ | ----------- | --------- | --------- | -------- |
| [<Other>](../<other>/index.md) |             |           |           |          |

<!-- "Related entity" MUST be a markdown link to the other entity's blueprint doc
     (the OKF edge) — sibling folders under entities/. Ownership: composition
     (child can't exist without the parent) vs reference. On delete: cascade /
     restrict / nullify. The product-wide erDiagram in ../index.md is a view of
     the union of these tables — keep them in sync. Multi-entity flows belong
     in docs/blueprint/flows/, not here. -->

## Concurrency & Consistency

- Concurrent-write resolution (optimistic version / last-write-wins / merge /
  conflict error):
- Uniqueness guarantees under races:
- Idempotency of each mutating action:

## References

<!-- Markdown links (OKF edges), not bare text — each must resolve. -->

- [ids](../../conventions.md#ids) (only the cross-cutting sections this entity
  relies on)

## Open Questions

- [ ] item + date
