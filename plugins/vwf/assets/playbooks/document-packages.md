<purpose>
Document a shared module or a schema/data contract for a `packages` project: read
context, elicit the public contract through tiered questions, and write the
packages engineering doc.
</purpose>

<user-story>
As a library/platform engineer, I want a code-grounded contract for a shared
module or schema, so that every consuming project can rely on what is exported
and how it is meant to be used.
</user-story>

<when-to-use>
- Documenting a `packages` (shared libraries, schemas & data contracts) project's
  module or schema during the pipeline's author phase of the `/vwf:engineering` command
- The architecture registry lists the project as `type: packages`
- The unit is a shared module consumed across projects, or a schema/data contract
  shared across `service`, `worker`, `frontend`, and `site`
</when-to-use>

**Persona:** Senior Library/Platform Engineer with deep expertise in the
project's declared stack (inject `stack` from the registry). Thinks in public
contracts, consumers, and breaking-change risk; documents what is exported and
how it is meant to be used, not the internals of a single consumer.

**Unit:** module. **Outputs:**

- Shared modules → `docs/engineering/packages/<module>.md`
- Schemas & data contracts → `docs/engineering/packages/schemas/<entity>.md`

Schemas and data contracts live here because they are shared across `service`,
`worker`, `frontend`, and `site`. This doc defines the **contract** (shape,
types, constraints, relationships). It does **not** define indexes or query
patterns — those are owned by the consuming `service` doc, because the same
shared type may be queried differently by different consumers.

<steps>

<step name="read_context" priority="first">
Read any existing doc for the target module/schema — do not silently overwrite.
From the registry, note which projects list this package in `depends_on` — those
are the consumers whose needs the contract must satisfy. For a
**schema/contract**, read the related entity's product docs at
`docs/product/<entity>/` for the conceptual model.
</step>

<step name="elicit_contract">
These are the questions for the pipeline's **audit + clarify** phases. The audit
subagent surfaces the applicable ones (the right Tier 1 set for a shared module
or a schema/contract; Tier 2 only if the capability is in the registry) and
frames multi-valued ones as options; the orchestrator asks them in batches. The
author subagent (this persona, injected stack) writes the answers — pre-filled
from the Codebase Map where unambiguous.

### Tier 1 — shared module

1. **Purpose** — what does this module provide, and why is it shared rather than
   local to one project?
2. **Public API / exports** — the exported types, functions, and constants that
   consumers rely on.
3. **Consumers** — which projects depend on it (confirm against the registry)?
4. **Stability & versioning** — breaking-change policy; how consumers are
   migrated.

### Tier 1 — schema / data contract

1. **Fields** — name, type, required/optional, constraints, description for
   each.
2. **Nested & related structures** — sub-objects, collections, references to
   other entities.
3. **Persistence shape** — how the contract maps to the datastore (if it
   persists). Describe the document/record shape in stack-neutral terms; the
   concrete `<datastore>` name comes from the stack.
4. **Invariants** — rules that must always hold regardless of which consumer
   writes the data.

### Tier 2 — ask only if the capability is in the registry

- `document-datastore` / `relational-datastore` → relationship modelling
  (embedded vs referenced), and any sub-collection/foreign-key structure.
- general serialization → validation/transform rules the shared schema enforces
  on parse/encode.
  </step>

<step name="write_doc">
Write the doc using `${CLAUDE_PLUGIN_ROOT}/assets/templates/engineering-schema.md` (for schemas) or
`${CLAUDE_PLUGIN_ROOT}/assets/templates/engineering-packages.md` (for other shared modules).

Update `docs/engineering/packages/schemas/readme.md` and/or
`docs/engineering/packages/readme.md` (indexes).
</step>

</steps>

> Review is centralized: the pipeline's **verify** phase runs the Ralph reviewer
> on the written docs and the orchestrator applies the per-unit approval gate.

<output>
`docs/engineering/packages/<module>.md` (shared modules) or
`docs/engineering/packages/schemas/<entity>.md` (schemas & data contracts) — the
shared contract — plus an updated packages and/or schemas index, passing the
Ralph reviewer.
</output>

<acceptance-criteria>
- [ ] Existing doc read; not silently overwritten
- [ ] Consumers identified from the registry's `depends_on`
- [ ] For a schema/contract, the related entity's product docs read
- [ ] Tier 1 questions answered (shared module or schema/contract as applicable); Tier 2 asked only for declared capabilities
- [ ] Doc written from the correct template (`engineering-schema.md` for schemas, `engineering-packages.md` for other shared modules)
- [ ] Indexes updated (`packages/schemas/readme.md` and/or `packages/readme.md`)
- [ ] Review delegated to the pipeline's verify phase (not run here)
</acceptance-criteria>
