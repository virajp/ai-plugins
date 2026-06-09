# <Entity> API

## <Action Name>

```http
METHOD /path/{param}
```

**Auth:** Bearer token (Firebase ID token) | None

**Request**

```jsonc
{
  "field": "type", // description
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
| 401    | `UNAUTHORIZED`  | No valid Firebase ID token              |
| 403    | `FORBIDDEN`     | Caller lacks permission for this action |
| 404    | `NOT_FOUND`     | Entity does not exist                   |
