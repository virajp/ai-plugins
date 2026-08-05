# The Project CLAUDE.md vwf Section

`setup` merges a vwf section into the repo's `CLAUDE.md` (from the
project-claude template), **preserving existing content** — never overwrite the
file. If a vwf section already exists, update it in place.

The section states, briefly:

- The workflow and order:
  `setup → architecture → design-system → blueprint → plan → execute`.
- The doc tree under `docs/blueprint/` and what each doc is.
- The foundations: architecture (always), design-system (once a UI exists), and
  environment (once an external integration or secret exists).
- The **contract-vs-realization** rule: the blueprint records only decisions
  that have more than one reasonable answer *and* are true regardless of how the
  code is written; reuse / placement / ordering / library choices are `plan`'s
  job.
- How to run a cycle and where plans live.
- That `docs/blueprint/` is an **OKF v0.1 bundle** (typed frontmatter + linked
  edges), so it is portable to any OKF tool (visualizer, graphify ingestion) —
  not a vwf-only format.

Keep it short — a pointer into the workflow, not a copy of vwf's own docs.
