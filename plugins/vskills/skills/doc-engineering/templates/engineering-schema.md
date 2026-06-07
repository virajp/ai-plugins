# <Entity> Schema & Contract

> Shared data contract. Lives in `packages` because multiple projects depend on
> it. Defines the **shape** only — indexes and query patterns are documented in
> the consuming `service` API doc. Replace `<datastore>` with the project's
> actual datastore from the architecture registry.

## Data Contract

| Field | Type | Required | Constraints | Description |
| ----- | ---- | -------- | ----------- | ----------- |

```jsonc
{
  // full contract shape with inline comments explaining each field
}
```

## Nested & Related Structures

> Include only if the entity has nested objects, child collections, or
> references to other entities. Omit if none.

### `<nested or child structure>`

| Field | Type | Required | Constraints | Description |
| ----- | ---- | -------- | ----------- | ----------- |

```jsonc
{
  // nested/child shape
}
```

## Persistence Shape

> How the contract maps to `<datastore>` (path/table, document/record shape).
> Stack-neutral description; the concrete datastore name comes from the registry.

## Invariants

- Rules that must always hold regardless of which consumer writes the data.

## Consumers

- Projects that depend on this contract (confirm against the architecture
  registry `depends_on`).
