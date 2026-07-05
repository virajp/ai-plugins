---
name: blueprint-authoring
version: 0.1.0
category: development
description: Authoring discipline for vwf blueprints — the code-independence
  line
  that keeps a blueprint a durable technical contract, plus the per-entity,
  cross-entity/integration, and UI/UX completeness bars. Auto-applies when
  editing any docs/blueprint file. Read the reference matching the surface you
  are pinning down.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write
paths:
  - "docs/blueprint/**/*.md"
  - "docs/plans/**/*.md"
---

# Blueprint Authoring

A blueprint is the **whole product's desired end state as a technical contract**
— detailed enough that `plan` and `execute` *decide* instead of asking or
assuming. It is organized by entity, with cross-entity flows and UI/UX captured
alongside.

The bar: a blueprint records every decision that has **more than one reasonable
answer** AND is **true regardless of how the code is written today**. Everything
else belongs to `plan` (code-aware realization) or `execute` (mechanical). Read
**Contract vs realization** first — it is the line the whole skill turns on.

| Topic                                                                                                             | When to read                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Contract vs realization](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/contract-vs-realization.md) | **Read first.** Sorting any decision into blueprint / plan / execute; the code-independence test                         |
| [Entity contract](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/entity-contract.md)                 | One entity's data, lifecycle, invariants, authorization, concurrency, limits — and the entity/page/module doc units      |
| [Integration & flows](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/integration-and-flows.md)       | Relationships, multi-entity workflows, inter-service contracts, consistency                                              |
| [UI / UX contract](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/ui-ux-contract.md)                 | Navigation, interaction patterns, state UX, forms, accessibility, responsive                                             |
| [Environment & secrets](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/environment-catalog.md)       | The `environment.md` catalog: env-var/secret inventory, classification, no values, the config-mechanism line             |
| [Frontmatter & links](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/frontmatter-and-links.md)       | The OKF profile: mandatory frontmatter, the `type` vocabulary, and typed relationship/reference links                    |
| [Quick reference](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/quick-reference.md)                 | The sort test + per-surface completeness checklist (also the reviewer's bar)                                             |
| [Worked example](${CLAUDE_PLUGIN_ROOT}/assets/examples/blueprint/order/index.md)                                  | A format-valid conformance bundle (Order/Customer + conventions + design-system + environment) where every edge resolves |

For API contract depth (resources, methods, errors, pagination, idempotency,
versioning), use the **rest-api-design** skill — do not restate it here.

**Scope.** This skill's `docs/blueprint/**` glob also matches
`design-system.md`, but that doc is governed by the **design-system-authoring**
skill — the entity completeness bars here do not apply to it. Plan and
gap-report docs under `docs/plans/**` (types `vwf-plan` / `vwf-gap-report`) are
in scope for **only** the
[Frontmatter & links](${CLAUDE_PLUGIN_ROOT}/skills/blueprint-authoring/references/frontmatter-and-links.md)
reference (valid frontmatter + resolving typed links) — none of the entity
doctrine applies to them.
