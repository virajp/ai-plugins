---
type: vwf-entity
title: <Name>
description: <one-line purpose of this entity>
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner: [<project from registry>]  resource: <url|path>  tags: [<...>]
---

# Entity: <Name>

<!-- OKF frontmatter above: type/title/description/status are mandatory;
     timestamp/owner/resource/tags are optional (see frontmatter-and-links).
     For the folder form, index.md carries type: vwf-entity for the whole entity;
     each surface file (data/api/jobs/screens) also opens with frontmatter, its
     title naming the surface (e.g. "<Name> — Data"). See the blueprint-authoring
     skill's frontmatter-and-links reference. -->

<!-- One entity per doc. This template is the single-file form
     (docs/blueprint/<entity>.md). For a large entity, use the folder form
     (docs/blueprint/<entity>/) instead: the same sections split across files —
     index.md holds Purpose…Invariants + References + Open Questions (above the
     marker); data.md holds Data Model + Relationships + Concurrency; api.md the
     API Surface; jobs.md Background Jobs; screens.md Screens. Both forms are
     first-class; pick by size.

     Stack-agnostic: section headings below map to projects
     via the Project Registry in docs/blueprint/architecture.md (by project `type`),
     never by literal technology. Omit any engineering section whose project type
     is absent from the registry.

     Decisions vs mechanics: if a choice has more than one reasonable answer, it
     belongs here (in the blueprint). If it has exactly one idiomatic answer given
     architecture.md + conventions.md, leave it to `execute` at codegen time.
     Spend the precision budget on Data Model and API Surface.

     See the blueprint-authoring skill for the contract-vs-realization line and
     the per-surface completeness bars. -->

## Purpose

One paragraph. What it is and why it exists. No implementation detail.

Serves: [<goal name>](./product.md#goal-<slug>)

<!-- Every entity serves at least one product.md goal — the OKF edge the
     blueprint-reviewer verifies. An entity no goal justifies is scope drift:
     either a goal is missing from product.md (run /vwf:product) or the entity
     shouldn't exist. In the folder form this line lives in index.md. -->

## Out of Scope

- Explicit exclusions. Highest-value section for preventing scope drift.

## Actors & Actions

| Actor | Action | Precondition | Authorization | Outcome (observable) |
| ----- | ------ | ------------ | ------------- | -------------------- |

## Lifecycle / State Machine

| From | To | Trigger | Guard | Side effect |
| ---- | -- | ------- | ----- | ----------- |

## Invariants

- Business rules that must never be violated.

<!-- ───────────── above = product intent (stable) ───────────── -->
<!-- ───────────── below = engineering detail (volatile) ───────────── -->

## Data Model → <schema/contract project, from registry>

| Field | Type | Optional | Default | Validation / Format |
| ----- | ---- | -------- | ------- | ------------------- |

<!-- Enumerate every enum member; state optionality/nullability explicitly;
     note id/format conventions so the schema is fully determined. -->

## Relationships

| Related entity          | Cardinality | Ownership | On delete | Required |
| ----------------------- | ----------- | --------- | --------- | -------- |
| [<Other>](./<other>.md) |             |           |           |          |

<!-- "Related entity" MUST be a markdown link to the other entity's blueprint doc
     (the OKF edge): [Customer](./customer.md), or ../customer/index.md from a
     folder surface file. This makes the relationship graph machine-traversable
     and lets the reviewer verify every edge resolves.
     Ownership: composition (child can't exist without the parent) vs reference.
     On delete: cascade / restrict / nullify. Multi-entity flows belong in
     docs/blueprint/integration.md, not here. -->

## Concurrency & Consistency

- Concurrent-write resolution (optimistic version / last-write-wins / merge /
  conflict error):
- Uniqueness guarantees under races:
- Idempotency of each mutating action:

## API Surface → <service project(s), from registry>

| Method | Path | Auth (role) | Request | Response | Errors | Idempotent |
| ------ | ---- | ----------- | ------- | -------- | ------ | ---------- |

<!-- Errors: name the cases only; the envelope shape lives in conventions.md. -->

## Background Jobs → <worker project(s), from registry>

| Job | Trigger | Timer / Retry | Activities | On failure |
| --- | ------- | ------------- | ---------- | ---------- |

## Screens → <frontend/app project(s), from registry>

| Screen | Route | Reads (API) | States (loading/error/empty) | Actions | Form validation |
| ------ | ----- | ----------- | ---------------------------- | ------- | --------------- |

<!-- Visual language (tokens, type, spacing, motion, component behavior) comes
     from docs/blueprint/design-system.md — reference it; record only deviations.
     Per-screen interaction/state/form decisions: blueprint-authoring skill
     (ui-ux-contract). -->

## References

<!-- Markdown links (OKF edges), not bare text — each must resolve. -->

- [auth](./conventions.md#auth), [errors](./conventions.md#errors),
  [ids](./conventions.md#ids) (only the cross-cutting sections this entity
  relies on)
- [design-system](./design-system.md) — for any entity with Screens (tokens,
  type, components)

## Open Questions

- [ ] item + date
