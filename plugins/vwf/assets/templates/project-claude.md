<!-- Merged into a project's CLAUDE.md by /vwf:init, preserving existing content.
     Keep it short — a pointer into the workflow, not a copy of vwf's docs. -->

## vwf workflow

This repo uses the **vwf** Blueprint → Plan → Execute workflow. Docs live under
`docs/blueprint/` (the desired state) and `docs/plans/` (the diffs to apply).

**Order:** `/vwf:init` → `/vwf:architecture` → `/vwf:design-system` (once a UI
exists) → `/vwf:blueprint <entity>` → `/vwf:plan <slice>` → `/vwf:execute` (or
`/vwf:autopilot`) → `/vwf:archive`.

**The blueprint is a code-independent contract.** It records only decisions that
have more than one reasonable answer *and* are true regardless of how the code
is written today. Reuse-vs-build, file placement, step ordering, and library
choices are `plan`'s job — not the blueprint's.

**Docs:**

- `docs/blueprint/architecture.md` — system shape + machine-readable Project
  Registry.
- `docs/blueprint/design-system.md` — product-wide UX/visual contract (if UI).
- `docs/blueprint/conventions.md` — cross-cutting decisions (auth, errors,
  ids…).
- `docs/blueprint/integration.md` — cross-entity flows + inter-service
  contracts.
- `docs/blueprint/<entity>.md` (or `docs/blueprint/<entity>/` for a large
  entity) — one contract per entity.

Re-run `/vwf:init` after upgrading vwf to migrate the docs to the latest format.
