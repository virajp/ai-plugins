# Shared Package Template

Engineering contract for one shared module that is **not** a schema. Save as
`docs/engineering/packages/{module}.md`. Schemas use `engineering-schema.md`
instead.

````template
# {Module} — Shared Package

## Purpose

[What this module provides and why it is shared rather than local to one
project.]

## Public API / Exports

| Export | Kind | Signature / Type | Description |
| ------ | ---- | ---------------- | ----------- |
| [export] | [type/function/constant] | [signature] | [description] |

## Usage

```ts
// minimal example of a consumer using this module
```

## Consumers

[Projects that depend on this module — confirm against the architecture
registry `depends_on`.]

## Stability & Versioning

[Breaking-change policy and how consumers are migrated.]
````

## Field Documentation

| Field                                                    | Convention | Description                                        |
| -------------------------------------------------------- | ---------- | -------------------------------------------------- |
| `{module}`                                               | variable   | Module name, used in the heading and the doc path. |
| `[export]` / `[signature]`                               | prose      | Exported symbols and their types/signatures.       |
| `[Purpose]` / `[Consumers]` / `[Stability & Versioning]` | prose      | Section bodies as described below.                 |

## Section Specifications

| Section                | Required | Guidance                                                            |
| ---------------------- | -------- | ------------------------------------------------------------------- |
| Purpose                | Always   | Why the module is shared rather than local.                         |
| Public API / Exports   | Always   | One row per exported type, function, or constant consumers rely on. |
| Usage                  | Always   | A minimal consumer example.                                         |
| Consumers              | Always   | Dependent projects, confirmed against the registry.                 |
| Stability & Versioning | Always   | Breaking-change policy and migration approach.                      |
