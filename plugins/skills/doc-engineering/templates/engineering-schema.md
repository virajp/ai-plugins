# Schema & Contract Template

Shared data contract for one entity. Save as
`docs/engineering/packages/schemas/{entity}.md`. Lives in `packages` because
multiple projects depend on it. Defines the **shape** only — indexes and query
patterns are documented in the consuming `service` API doc.

> Replace `{datastore}` with the project's actual datastore from the
> architecture registry.

````template
# {Entity} Schema & Contract

> Shared data contract. Defines the shape only — indexes and query patterns live
> in the consuming `service` API doc. Persists to `{datastore}`.

## Data Contract

| Field | Type | Required | Constraints | Description |
| ----- | ---- | -------- | ----------- | ----------- |
| [field] | [type] | [yes/no] | [constraints] | [description] |

```jsonc
{
  // full contract shape with inline comments explaining each field
}
```

## Nested & Related Structures

> Include only if the entity has nested objects, child collections, or
> references to other entities. Write "None" if there are none.

### [nested or child structure]

| Field | Type | Required | Constraints | Description |
| ----- | ---- | -------- | ----------- | ----------- |
| [field] | [type] | [yes/no] | [constraints] | [description] |

```jsonc
{
  // nested/child shape
}
```

## Persistence Shape

[How the contract maps to {datastore} — path/table, document/record shape.
Stack-neutral description; the concrete datastore name comes from the registry.]

## Invariants

- [Rules that must always hold regardless of which consumer writes the data.]

## Consumers

- [Projects that depend on this contract — confirm against the architecture
  registry `depends_on`.]
````

## Field Documentation

| Field                                                  | Convention | Description                                                        |
| ------------------------------------------------------ | ---------- | ------------------------------------------------------------------ |
| `{entity}`                                             | variable   | Entity name, used in the heading and the doc path.                 |
| `{datastore}`                                          | variable   | The datastore from the project `stack` (e.g. Firestore, Postgres). |
| `[field]` / `[type]` / `[constraints]`                 | prose      | Contract field rows.                                               |
| `[nested or child structure]`                          | prose      | Name of a nested object or child collection.                       |
| `[Persistence Shape]` / `[Invariants]` / `[Consumers]` | prose      | Section bodies as described below.                                 |

## Section Specifications

| Section                     | Required              | Guidance                                                             |
| --------------------------- | --------------------- | -------------------------------------------------------------------- |
| Data Contract               | Always                | The canonical field table plus a `jsonc` shape with inline comments. |
| Nested & Related Structures | If nested data exists | One sub-block per nested object/collection. If none, write "None".   |
| Persistence Shape           | Always                | Map the contract to `{datastore}` in stack-neutral terms.            |
| Invariants                  | Always                | Cross-consumer rules. If none, write "None".                         |
| Consumers                   | Always                | Dependent projects, confirmed against the registry.                  |
