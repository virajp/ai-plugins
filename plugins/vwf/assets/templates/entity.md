# Entity: <Name>

<!-- One file per entity. Stack-agnostic: section headings below map to projects
     via the Project Registry in docs/specs/architecture.md (by project `type`),
     never by literal technology. Omit any engineering section whose project type
     is absent from the registry.

     Decisions vs mechanics: if a choice has more than one reasonable answer, it
     belongs here (in the spec). If it has exactly one idiomatic answer given
     architecture.md + conventions.md, leave it to `execute` at codegen time.
     Spend the precision budget on Data Model and API Surface. -->

## Purpose

One paragraph. What it is and why it exists. No implementation detail.

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

## References

- conventions.md#auth, conventions.md#errors, conventions.md#ids (only the
  cross-cutting sections this entity relies on)

## Open Questions

- [ ] item + date
