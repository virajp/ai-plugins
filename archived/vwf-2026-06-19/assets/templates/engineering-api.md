# Service API Template

Engineering contract for one entity's HTTP API. Save as
`docs/engineering/service/api/{entity}.md`. Request/response shapes reference
the shared schema in `packages/schemas/{entity}.md` — link, don't restate. Auth
and standard error codes reference the foundation docs — link, don't restate.

````template
# {Entity} API

> Auth mechanism is defined in `../../foundations/auth.md`; this doc states only
> the role each action requires. Standard error codes are defined in
> `../../foundations/errors.md`; only entity-specific codes are listed below.
> Request/response shapes reference `../../packages/schemas/{entity}.md`.

## [Action Name]

```http
[METHOD] /path/{param}
```

**Auth:** links to `foundations/auth.md` — and the role/permission this action
requires ([e.g. creator only, group member, any authed user]).

**Request**

```jsonc
{
  "[field]": "[type]", // [description — see shared schema]
}
```

**Response `[2xx status]`**

```jsonc
{
  "[field]": "[value]",
}
```

**Errors**

Standard codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, …) are defined in
`foundations/errors.md`. List only entity-specific codes here:

| Status | Code | Condition |
| ------ | ---- | --------- |
| [4xx]  | `[ENTITY_SPECIFIC_CODE]` | [condition unique to this entity] |

**Idempotency:** [state whether this write is idempotent and how (client key,
natural key) — or N/A for reads].

## Query Patterns & Indexes

> Owned here, not in the schema doc: the same shared schema may be queried
> differently by different consumers. Include only for types backed by a
> queryable datastore.

| Fields | Query Type | Index Needed | Reason |
| ------ | ---------- | ------------ | ------ |
| [fields] | [query type] | [index] | [reason] |
````

## Field Documentation

| Field                                 | Convention | Description                                                                        |
| ------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `{entity}`                            | variable   | Entity name, used in the heading and the doc path.                                 |
| `{param}`                             | variable   | Path parameter name(s) for the route.                                              |
| `[Action Name]`                       | prose      | Human name of the operation (e.g. "Create Ride").                                  |
| `[METHOD]` / `[2xx status]` / `[4xx]` | prose      | HTTP method and status codes for this action.                                      |
| `[field]` / `[type]` / `[value]`      | prose      | Request/response field names, types, and example values.                           |
| `[ENTITY_SPECIFIC_CODE]`              | prose      | Error code unique to this entity (standard codes live in `foundations/errors.md`). |

## Section Specifications

| Section                  | Required               | Guidance                                                                                                                                                                |
| ------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Action (repeatable)      | One per operation      | Method + path, the role required (link to `foundations/auth.md`), request and response shapes, entity-specific errors, idempotency.                                     |
| Auth line                | Always                 | Link to `foundations/auth.md` for the mechanism; state only the role/permission this action needs. Never restate the auth flow.                                         |
| Errors                   | Always                 | List only codes unique to this entity. Link to `foundations/errors.md` for the standard set. If none unique, write "None — all standard (see `foundations/errors.md`)". |
| Query Patterns & Indexes | If queryable datastore | Document how this service queries the shared schema; omit for non-queryable types.                                                                                      |
