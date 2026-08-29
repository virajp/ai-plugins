# Postgres — data model constraints

What the store forces on the blueprint's entities. Postgres forces less than
most, which is exactly why the few real constraints are easy to miss until they
bite.

## It does not force denormalization — resist doing it anyway

The most common mistake carried in from document stores is denormalizing "for
read performance" before any read is slow. Postgres joins are fast, and a
normalized schema keeps one fact in one place, which is what makes the
`version`-column concurrency rule in
[contract satisfaction](contract-satisfaction.md) meaningful. Duplicated data
needs every copy updated in the same transaction, or the invariant is a lie.

Denormalize when a measured query is slow and the join is the cause. Record the
duplication as a decision, because the next writer needs to know it exists.

## Indexes are a write cost, and the blueprint should say which reads matter

Every index makes writes slower and takes storage that never shrinks
([cost shape](cost-shape.md)). So indexes follow from the flows' actual query
patterns, not from every column someone might filter on.

The pattern worth naming: an index on a column with very few distinct values
usually earns nothing — the planner will scan anyway. Composite indexes are
order-sensitive, and an index on `(a, b)` serves queries on `a` and on
`(a, b)`, never on `b` alone.

## Nullable is a modelling decision, not a default

A nullable column asks every reader to handle absence. Where the blueprint says
a field is required, the column is `NOT NULL` and the constraint is the
enforcement — not a comment, and not application-layer validation that a second
writer will forget.

## `jsonb` for genuinely open shapes only

`jsonb` is the right answer for a payload whose shape the product does not
control — a webhook body, an external provider's response, user-authored
settings. It is the wrong answer for entity fields the blueprint names, because
those lose their constraints, their types, and their place in the erDiagram.

The test: if the blueprint's entity schema lists the field, it is a column.

## Enumerations: constraint over convention

A status field with a closed set of values is a check constraint or an enum
type, so an impossible value cannot be written. The blueprint's entity lifecycle
already states the closed set; the schema should enforce it rather than trust
every writer to.

## What it punishes

- **Very wide rows read partially.** Postgres reads whole rows; a table with
  large rarely-read columns beside hot ones pays on every scan. Split them.
- **Unbounded growth without partitioning.** A table that only ever grows makes
  every index bigger and vacuum slower. If the blueprint has a retention rule,
  the schema should be shaped so it can be applied.
- **Chatty per-row access.** The engine rewards set-based work. A loop issuing
  one query per entity is the shape to catch in review.
