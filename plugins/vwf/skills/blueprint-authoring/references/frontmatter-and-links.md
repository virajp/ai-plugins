# Frontmatter & Links (the OKF profile)

The `docs/blueprint/` tree is an **Open Knowledge Format (OKF) bundle** — vwf is
an opinionated *profile* of OKF v0.1. Each doc is an OKF **concept** (a markdown
file whose path is its identity); cross-doc relationships are **edges**
(ordinary markdown links). This is what lets any OKF-aware tool — not just vwf's
own commands — read, visualize, and traverse a blueprint.

**Producer / consumer.** The `architecture`, `design-system`, and `blueprint`
commands are the *producers*; `execute`'s reviewers (and any OKF tool) are
*consumers*. The files on disk are the contract between them — keep them
well-formed, not just human-readable.

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
  returns `NO GAPS`, `stable` when the concept has shipped and settled. This is
  the **contract-maturity** axis; it is orthogonal to `implementation:` (below).
- **`timestamp`** — optional. In-repo, git already tracks last-modified time
  authoritatively, so a hand-maintained field would just duplicate it (and can
  go stale). Record it only when the bundle travels **outside** git (tarball,
  mount, visualizer/graphify ingestion), bumping it on every substantive edit
  when you do.
- **`resource`** stays optional on purpose: the blueprint is code-independent,
  so the realizing path/URL frequently does not exist yet. Fill it only when it
  does and is stable.

### `type` vocabulary

| `type`              | Doc                                                |
| ------------------- | -------------------------------------------------- |
| `vwf-product`       | `product.md`                                       |
| `vwf-architecture`  | `architecture.md`                                  |
| `vwf-conventions`   | `conventions.md`                                   |
| `vwf-design-system` | `design-system.md`                                 |
| `vwf-environment`   | `environment.md`                                   |
| `vwf-flow`          | a flow doc `flows/<project>/<NNN>-<flow>/index.md` |
| `vwf-integration`   | `flows/index.md` (the flow catalog + contracts)    |
| `vwf-entity`        | an entity doc `entities/<entity>/index.md`         |
| `vwf-entities`      | `entities/index.md` (the entity catalog + ERD)     |
| `vwf-plan`          | a `docs/plans/` cycle plan                         |
| `vwf-gap-report`    | a legacy `*.gap-report.md` (retired autopilot)     |

Every flow is a **folder** (`docs/blueprint/flows/<project>/<NNN>-<flow>/`)
holding `index.md` alone (`type: vwf-flow`). Every entity is a **folder**
(`docs/blueprint/entities/<entity>/`) holding exactly `index.md`
(`type: vwf-entity`) + `schema.yaml`. The reviewer treats a folder as one
concept.

## YAML artifacts are typed by path

Two authoritative surfaces are YAML, not markdown, and carry **no vwf
frontmatter** — they are typed by their path, not by a `type:` field:

- `entities/<entity>/schema.yaml` — the data model. It has no metadata block;
  the governing `status:` is its entity `index.md`'s frontmatter (the two files
  are one concept).
- `apis/<project>.openapi.yaml` — the API contract. Its review stamp lives
  inline as `info.x-vwf.status` (`draft` | `reviewed`), not in frontmatter;
  frozen snapshots under `apis/released/` follow the same shape. See
  [api-and-schema-contracts](./api-and-schema-contracts.md).

## The `implementation:` key (build state)

Flow and entity `index.md` docs carry a second frontmatter key beside `status:`:

```yaml
implementation: none # none | partial | complete
```

- **`none`** — nothing of this contract is built yet.
- **`partial`** — some of it landed; a delta remains.
- **`complete`** — the whole contract is realized in code.

**Written by the pipeline only** — never hand-edited during authoring. The
exhaustive writer list:

- `execute`'s **Reconcile** step stamps what a run actually landed.
- `/vwf:plan` **may heal** a stale value, with user confirmation.
- A **blueprint sweep** that materially edits contract content demotes
  `complete` → `partial` (the built code no longer matches the contract).

**Orthogonal axes:** `status:` is **contract maturity** (draft → reviewed →
stable, moved by the reviewer gate); `implementation:` is **build state** (none
→ partial → complete, moved by the pipeline). A flow can be
`status: stable,
implementation: none` (a settled contract not yet built) or
`status: draft,
implementation: complete` (built ahead of review) — the two
never conflate.

## Links (the edges)

Cross-doc relationships are **typed markdown links**, never bare prose — so the
graph is machine-traversable and every edge can be verified to resolve. Entities
live **two levels deep** (`entities/<entity>/`); flows live **three levels
deep** (`flows/<project>/<NNN>-<flow>/`), so from a flow the root system docs
are three levels up, from an entity two:

- A flow's **`Serves:`** line links a product goal anchor:
  `[<goal>](../../../product.md#goal-<slug>)`.
- A flow's **Steps** and **References** link the entities/services and contracts
  they touch: `[Order](../../../entities/order/index.md)`,
  `[api API contract](../../../apis/api.openapi.yaml)`,
  `[errors](../../../conventions.md#errors)`.
- An entity's **`Used by:`** line links the owning flow:
  `[Place order](../../flows/web/010-place-order/index.md)`.
- An entity's **Relationships** table links the sibling entity in the "Related
  entity" cell: `[Customer](../customer/index.md)` — one level up from this
  entity's folder, into the sibling's.
- An entity's **References** link `conventions.md` anchors:
  `[ids](../../conventions.md#ids)`.
- `flows/index.md` (the catalog) links each flow and goal:
  `[Place order](./web/010-place-order/index.md)`,
  `[<goal>](../product.md#goal-<slug>)` (it sits one level under the root).
- `environment.md` (a root doc) links the injection mechanism it defers to:
  `[config](./conventions.md#config)`.

**Every link must resolve to an existing blueprint doc/anchor.** A dangling edge
is a gap the reviewer flags — the graph analogue of the code-independence and
completeness bars.

## Worked example (conformance bundle)

A small, format-valid bundle lives at
`${CLAUDE_PLUGIN_ROOT}/assets/examples/blueprint/` — a commerce slice where
every edge resolves. Read
[`flows/web/010-place-order/index.md`](${CLAUDE_PLUGIN_ROOT}/assets/examples/blueprint/flows/web/010-place-order/index.md)
as the entry point: it `Serves:` a product goal, its steps link
`entities/order/index.md` and name operationIds in `apis/api.openapi.yaml`, and
its Screens defer visual language to `design-system.md`. The
[`entities/order/index.md`](${CLAUDE_PLUGIN_ROOT}/assets/examples/blueprint/entities/order/index.md)
doc carries `Used by:` back to the flow, links its `schema.yaml`, and relates to
`../customer/index.md`. The bundle also carries `environment.md` (type
`vwf-environment`), linking `conventions.md#config`. Use it as the concrete
reference for what conforming flow/entity docs look like — frontmatter filled
(incl. `implementation:`), edges as resolving links, YAML artifacts typed by
path.
