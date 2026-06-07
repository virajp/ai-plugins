# <Entity> Schema

## Firestore Document (`<collection>/{<id>}`)

| Field | Type | Required | Constraints | Description |
| ----- | ---- | -------- | ----------- | ----------- |

```jsonc
{
  // full document shape with inline comments explaining each field
}
```

## Sub-collections

> Include this section only if the entity has sub-collections. Omit entirely if
> none exist.

### `<collection>/{<id>}/<sub-collection>/{<subId>}`

| Field | Type | Required | Constraints | Description |
| ----- | ---- | -------- | ----------- | ----------- |

```jsonc
{
  // sub-collection document shape
}
```

## Indexes

| Fields | Query Type | Reason |
| ------ | ---------- | ------ |
