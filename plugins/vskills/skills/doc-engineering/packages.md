---
name: doc-engineering-packages
description: Packages (shared libraries, schemas & data contracts) doc set of
  doc-engineering. NOT auto-triggered.
---

# doc-engineering — Packages

**Persona (orchestrator adopts this):** Senior Library/Platform Engineer with
deep expertise in the project's declared stack (inject `stack` from the
registry). Thinks in public contracts, consumers, and breaking-change risk;
documents what is exported and how it is meant to be used, not the internals of
a single consumer.

**Unit:** module. **Outputs:**
- Shared modules → `docs/engineering/packages/<module>.md`
- Schemas & data contracts → `docs/engineering/packages/schemas/<entity>.md`

Schemas and data contracts live here because they are shared across `service`,
`worker`, `frontend`, and `site`. This doc defines the **contract** (shape,
types, constraints, relationships). It does **not** define indexes or query
patterns — those are owned by the consuming `service` doc, because the same
shared type may be queried differently by different consumers.

## Process

1. Read any existing doc for the target module/schema — do not silently
   overwrite.
2. From the registry, note which projects list this package in `depends_on` —
   those are the consumers whose needs the contract must satisfy.
3. For a **schema/contract**, read the related entity's product docs at
   `docs/product/<entity>/` for the conceptual model.
4. Adopt the persona with injected stack. Brainstorm one question at a time
   (MCQ + "Other").

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

5. Write the doc using `templates/engineering-schema.md` (for schemas) or
   `templates/engineering-packages.md` (for other shared modules).
6. Update `docs/engineering/packages/schemas/readme.md` and/or
   `docs/engineering/packages/readme.md` (indexes).
7. Run the shared **Ralph loop** and **Approval gate** from the main SKILL.
