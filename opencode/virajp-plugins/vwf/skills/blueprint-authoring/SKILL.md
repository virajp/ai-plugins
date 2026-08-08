---
name: blueprint-authoring
description: Authoring discipline for vwf blueprints — the code-independence
  line
  that keeps a blueprint a durable technical contract, plus the per-entity,
  cross-entity/integration, and UI/UX completeness bars. Auto-applies when
  editing any docs/blueprint file. Read the reference matching the surface you
  are pinning down.
license: MIT
metadata:
  version: 0.1.0
  category: development
---

# Blueprint Authoring

A blueprint is the **whole product's desired end state as a technical contract**
— detailed enough that `plan` and `execute` *decide* instead of asking or
assuming. It is organized around **flows** (the primary unit, under
`docs/blueprint/flows/`), which carry the process — steps, screens, jobs, and
acceptance. Entities (`docs/blueprint/entities/`) are supporting data contracts
(an `index.md` + an authoritative `schema.yaml`), and each service's API is one
authoritative OpenAPI file under `docs/blueprint/apis/`. The traceability spine
runs product goal → flow (`Serves:`) → entity (`Used by:`, transitively).

The bar: a blueprint records every decision that has **more than one reasonable
answer** AND is **true regardless of how the code is written today**. Everything
else belongs to `plan` (code-aware realization) or `execute` (mechanical). Read
**Contract vs realization** first — it is the line the whole skill turns on.

Two bars, not one. Completeness asks *"is this decided?"* and can only ask for
more; **Density** asks *"does this line change what gets built?"* and is the
only thing that asks for less. A doc fails review for being long exactly as it
fails for being thin. Every audience for these docs is an agent that re-reads
them on every turn — write for that reader, not for a human skimming a spec.

| Topic                                                                                                             | When to read                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Contract vs realization](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/contract-vs-realization.md) | **Read first.** Sorting any decision into blueprint / plan / execute; the code-independence test                        |
| [Density](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/density.md)                                 | **Read with it.** Per-doc line budgets, the delete test, and the anti-patterns that inflate a contract                  |
| [Flow contract](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/flow-contract.md)                     | The primary unit: per-flow sections, the screen home rule, jobs, the sequence diagram, acceptance, and `flows/index.md` |
| [Entity contract](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/entity-contract.md)                 | The slimmed entity: lifecycle, invariants, relationships, `Used by:`, the schema link — and what moved to flows         |
| [API & schema contracts](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/api-and-schema-contracts.md) | The YAML artifacts: `schema.yaml` and `apis/<project>.openapi.yaml` bars, path-typing, released-snapshot additive rule  |
| [UI / UX contract](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/ui-ux-contract.md)                 | Per-screen decisions (on the owning flow): navigation, interaction patterns, state UX, forms                            |
| [Environment & secrets](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/environment-catalog.md)       | The `environment.md` catalog: env-var/secret inventory, classification, no values, the config-mechanism line            |
| [Frontmatter & links](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/frontmatter-and-links.md)       | The OKF profile: mandatory frontmatter, the `type` vocabulary, the `implementation:` key, YAML path-typing, typed links |
| [Quick reference](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/quick-reference.md)                 | The sort test + per-surface completeness checklist (also the reviewer's bar)                                            |
| [Worked example](%%AI_PLUGINS_ROOT%%/assets/examples/blueprint/entities/order/index.md)                         | A format-valid conformance bundle (flows + entities + apis + conventions + design-system + environment)                 |

For API contract depth (resources, methods, errors, pagination, idempotency,
versioning), use the **rest-api-design** skill — do not restate it here.

**Scope.** This skill's `docs/blueprint/**` glob also matches
`design-system.md`, but that doc is governed by the **design-system-authoring**
skill — the entity completeness bars here do not apply to it. Plan and
gap-report docs under `docs/plans/**` (types `vwf-plan` / `vwf-gap-report`) are
in scope for **only** the
[Frontmatter & links](%%AI_PLUGINS_ROOT%%/skills/blueprint-authoring/references/frontmatter-and-links.md)
reference (valid frontmatter + resolving typed links) — none of the entity
doctrine applies to them.
