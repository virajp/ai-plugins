# Frontmatter & Links (the OKF profile)

The `docs/blueprint/` tree is an **Open Knowledge Format (OKF) bundle** — vwf is
an opinionated *profile* of OKF v0.1. Each doc is an OKF **concept** (a markdown
file whose path is its identity); cross-doc relationships are **edges**
(ordinary markdown links). This is what lets any OKF-aware tool — not just vwf's
own commands — read, visualize, and traverse a blueprint.

**Producer / consumer.** The `architecture`, `design-system`, and `blueprint`
commands are the *producers*; `execute`/`autopilot`'s reviewers (and any OKF
tool) are *consumers*. The files on disk are the contract between them — keep
them well-formed, not just human-readable.

## Frontmatter (mandatory on every blueprint doc)

Every doc opens with a YAML frontmatter block. Four fields are **required**;
four are optional-but-standardized.

```yaml
---
type: vwf-entity                                   # required — fixed vocabulary
title: Orders                                      # required
description: One row per completed customer order  # required
status: draft                                      # required — draft | reviewed | stable
# optional, standardized:
# timestamp: 2026-07-01T14:30:00Z   # ISO 8601, last updated (git already tracks this in-repo)
# owner: [orders-service]           # owning project(s) from the architecture registry
# resource: https://…               # pointer to the realizing code/URL (often unknown at blueprint time)
# tags: [sales, revenue]            # freeform labels for grouping/search
---
```

- **`status`** — `draft` before the reviewer gate passes, `reviewed` once it
  returns `NO GAPS`, `stable` when the entity has shipped and settled.
- **`timestamp`** — optional. In-repo, git already tracks last-modified time
  authoritatively, so a hand-maintained field would just duplicate it (and can
  go stale). Record it only when the bundle travels **outside** git (tarball,
  mount, visualizer/graphify ingestion), bumping it on every substantive edit
  when you do.
- **`resource`** stays optional on purpose: the blueprint is code-independent,
  so the realizing path/URL frequently does not exist yet. Fill it only when it
  does and is stable.

### `type` vocabulary

| `type`              | Doc                                             |
| ------------------- | ----------------------------------------------- |
| `vwf-product`       | `product.md`                                    |
| `vwf-architecture`  | `architecture.md`                               |
| `vwf-conventions`   | `conventions.md`                                |
| `vwf-design-system` | `design-system.md`                              |
| `vwf-environment`   | `environment.md`                                |
| `vwf-integration`   | `integration.md`                                |
| `vwf-entity`        | an entity doc (single file, or the folder form) |
| `vwf-plan`          | a `docs/plans/` cycle plan                      |
| `vwf-gap-report`    | an autopilot `*.gap-report.md`                  |

For the **folder form**, `index.md` carries `type: vwf-entity` for the whole
entity; each surface file (`data.md` / `api.md` / `jobs.md` / `screens.md`) also
opens with frontmatter, its `title` naming the surface (e.g. `Orders — Data`).
The reviewer still treats all files of a folder as **one** entity.

## Links (the edges)

Cross-doc relationships are **typed markdown links**, never bare prose — so the
graph is machine-traversable and every edge can be verified to resolve:

- An entity's **Relationships** table links the related entity's doc in the
  "Related entity" cell: `[Customer](./customer.md)` (or `../customer/index.md`
  from a folder surface file).
- An entity's **References** link `conventions.md` anchors and
  `design-system.md`: `[errors](./conventions.md#errors)`,
  `[design-system](./design-system.md)`.
- `integration.md` flows link each entity/service they touch:
  `[Order](./order.md)`.
- `environment.md` links the injection mechanism it defers to:
  `[config](./conventions.md#config)`.

**Every link must resolve to an existing blueprint doc/anchor.** A dangling edge
is a gap the reviewer flags — the graph analogue of the code-independence and
completeness bars.

## Worked example (conformance bundle)

A small, format-valid bundle lives at
`${CLAUDE_PLUGIN_ROOT}/assets/examples/blueprint/` — a two-entity commerce slice
where every edge resolves. Read
[`order.md`](${CLAUDE_PLUGIN_ROOT}/assets/examples/blueprint/order.md) as the
entry point; it links `customer.md`, `conventions.md` (auth/errors/ids anchors),
and `design-system.md`. The bundle also carries `environment.md` (type
`vwf-environment`), linking `conventions.md#config`. Use it as the concrete
reference for what a conforming entity doc looks like — frontmatter filled,
relationships and references as resolving links, Screens deferring visual
language to the design system.
