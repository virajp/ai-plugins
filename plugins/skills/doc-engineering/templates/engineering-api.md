# <Entity> API

> Replace `<auth-mechanism>` with the project's auth from the registry (e.g. a
> bearer ID token). Request/response shapes reference the shared schema in
> `packages/schemas/<entity>.md` — link, don't restate.

## <Action Name>

```http
METHOD /path/{param}
```

**Auth:** `<auth-mechanism>` | None — and the role/permission required.

**Request**

```jsonc
{
  "field": "type", // description (see shared schema)
}
```

**Response `<2xx status>`**

```jsonc
{
  "field": "value",
}
```

**Errors**

| Status | Code            | Condition                               |
| ------ | --------------- | --------------------------------------- |
| 400    | `MISSING_FIELD` | Required field not provided             |
| 401    | `UNAUTHORIZED`  | No valid credential                     |
| 403    | `FORBIDDEN`     | Caller lacks permission for this action |
| 404    | `NOT_FOUND`     | Entity does not exist                   |

**Idempotency:** state whether this write is idempotent and how (e.g. client
key, natural key) — or N/A for reads.

## Query Patterns & Indexes

> Owned here, not in the schema doc: the same shared schema may be queried
> differently by different consumers. Include only for types backed by a
> queryable datastore.

| Fields | Query Type | Index Needed | Reason |
| ------ | ---------- | ------------ | ------ |
