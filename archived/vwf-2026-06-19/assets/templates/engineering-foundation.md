# Foundation Template

Cross-cutting engineering contract for one concern (auth, errors, observability,
config, testing, integrations). Not entity-scoped — this is the canonical source
other engineering docs link to. Save as
`docs/engineering/foundations/{concern}.md` (e.g. `foundations/auth.md`).

> Replace `{concern}` with the concern slug and `{decision}` with the one-line
> selection recorded in `docs/architecture.md` (e.g. `auth: firebase-id-token`).
> Stack placeholders (`{datastore}`, etc.) come from the architecture registry.

````template
# {Concern} — Foundation Contract

> Cross-cutting contract. Other engineering docs link here instead of restating.
> Decision recorded in `docs/architecture.md`: `{decision}`.

## Purpose & Scope

[What this concern covers across the system, and the boundary of what it does
not cover. One short paragraph.]

## Contract

[The canonical specification for this concern. Shape it to the concern:]

[- **auth** → mechanism, token/credential verification flow, and the
  role/claim/permission model.]
[- **errors** → the error-code registry and the error-envelope shape.]
[- **observability** → the log / event / metric schema and correlation strategy.]
[- **config** → the configuration & secret inventory and where each is read.]
[- **testing** → the testing strategy, layers, and conventions to target.]
[- **integrations** → the external-service contract: endpoints, auth, webhooks.]

| [Key] | Type | [Detail column — code / status / value] | Description |
| ----- | ---- | --------------------------------------- | ----------- |
| [key] | [type] | [detail] | [description] |

```jsonc
{
  // canonical shape for this concern (envelope, claims, log entry, config map)
}
```

## Rules & Invariants

- [Rules that must always hold for this concern, regardless of which project
  applies it.]

## How Consumers Apply This

[How an entity/project doc references this contract — what it states locally
versus what it links here. Keep entity docs thin; this doc is the source.]

## Consumers

- [Projects/docs that depend on this contract — confirm against the architecture
  registry `depends_on` and the engineering docs that link here.]
````

## Field Documentation

| Field                               | Convention | Description                                                                          |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `{Concern}` / `{concern}`           | variable   | Concern name / slug — e.g. `Auth` / `auth`, `Errors` / `errors`.                     |
| `{decision}`                        | variable   | The one-line selection from `docs/architecture.md` (e.g. `auth: firebase-id-token`). |
| `{datastore}` and other stack terms | variable   | Injected from the project `stack` in the architecture registry.                      |
| `[Purpose & Scope]`                 | prose      | What the concern covers and its boundary.                                            |
| `[Contract]` rows / shape           | prose      | The canonical spec, shaped to the concern (see the bracketed concern hints).         |
| `[Rules & Invariants]`              | prose      | Always-true rules for this concern.                                                  |
| `[How Consumers Apply This]`        | prose      | The link-don't-restate guidance for entity docs.                                     |
| `[Consumers]`                       | prose      | Dependent projects/docs, confirmed against the registry.                             |

## Section Specifications

| Section                  | Required | Guidance                                                                                                                                                                                                                                           |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose & Scope          | Always   | One paragraph. Name what is in and out of scope so entity docs know what they may assume.                                                                                                                                                          |
| Contract                 | Always   | The heart of the doc. Use the concern hints to pick shape: a registry table for `errors`, a flow + role matrix for `auth`, a schema for `observability`. Include the `jsonc` shape only when a canonical structure exists; otherwise write "None". |
| Rules & Invariants       | Always   | Cross-project rules. If none, write "None".                                                                                                                                                                                                        |
| How Consumers Apply This | Always   | The rule that makes the foundation pay off: entity docs link here and state only their concern-specific detail (e.g. the role an endpoint requires), never the mechanism.                                                                          |
| Consumers                | Always   | List dependents; if not yet known, write "None recorded".                                                                                                                                                                                          |

## Status Handling

Apply the same status callouts as every other engineering doc. A `planned` or
`partially-live` foundation opens its unbuilt sections with:

```markdown
> **Status: Planned** — Not yet implemented. This section is a build spec.
```
