# Writing the Plan Doc (§7)

Read this at §7, once the delta is computed and every open decision is settled —
it is the shape of the artifact, not a gate. §8's approval gate and §9's commit
stay in `SKILL.md`.

Write `docs/plans/<date>-<time>-<slice>.md` from the plan template — including
its **OKF frontmatter**: `type: vwf-plan`, `title`, `description`, `status`,
**`covers:`** (the blueprint doc(s) this element implements — one path, or the
cycle element's set), and **`requires:`** (the plan filenames of this element's
direct prerequisites in the chain — empty for the first). The Slice section
links the covered doc(s) and states the chain position ("Plan 2 of 3 — requires
`<file>`; required by `<file>`"; or "no dependency chain"). Steps are ordered
for TDD, each naming the failing test that defines "done".

**Acceptance criteria.** Copy the Acceptance blocks of the flow docs this
element touches **verbatim** into the plan's "Acceptance criteria (from
blueprint)" section (with a link to each flow), and make sure the ordered steps
include the **E2E tests** that cover each criterion — the coder implements them
like any TDD step; `execute`'s acceptance stage independently maps and runs
them. A criterion no step covers is a hole in the plan, not something to defer.
When the element maps to no flow, write `none — no flow touched`.
