<!-- Merged into a project's CLAUDE.md by /vwf:setup, preserving existing content.
     Keep it short — a pointer into the workflow, not a copy of vwf's docs. -->

## vwf workflow

This repo uses the **vwf** Blueprint → Plan → Execute workflow. Docs live under
`docs/blueprint/` (the desired state) and `docs/plans/` (the diffs to apply).

**Order:** `/vwf:setup` → `/vwf:architecture` → `/vwf:design-system` (once a UI
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
- `docs/blueprint/conventions.md` — cross-cutting decisions (auth, errors, ids,
  config…).
- `docs/blueprint/environment.md` — per-project inventory of env vars + secrets,
  no values (if the system has an external integration/secret).
- `docs/blueprint/integration.md` — cross-entity flows + inter-service
  contracts.
- `docs/blueprint/<entity>.md` (or `docs/blueprint/<entity>/` for a large
  entity) — one contract per entity.

**The blueprint is an OKF bundle.** `docs/blueprint/` is an Open Knowledge
Format (OKF) v0.1 bundle — every doc is a typed concept (YAML frontmatter) and
relationships are markdown links. So it is portable: any OKF-aware tool (e.g.
the OKF static-HTML graph visualizer) can render it, and it can be ingested by a
knowledge-graph tool like graphify — no vwf-specific reader required.

Re-run `/vwf:setup` after upgrading vwf to migrate the docs to the latest
format.
