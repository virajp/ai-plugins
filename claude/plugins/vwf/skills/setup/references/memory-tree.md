# The Memory Tree & `mempalace.yaml` (§9)

Read this at §9, when writing the repo's memory layout. It sits beside
`${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, which owns the protocol itself.

## Write the memory tree

Create `docs/memory/` with the seven room directories, and add the
developer-specific ones to `.gitignore` (`docs/memory/handoff/`,
`docs/memory/doctor/`, `docs/memory/runs/`) if absent — the same way the
`docs/scratchpad/` line is added. Per
`${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, every memory write goes to both this
tree and mempalace, which is what makes the daemon optional. A pre-format-19
`docs/handoffs/next.md` moves to `docs/memory/handoff/next.md`.

## Write the mempalace config(s)

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, the product ends this step with one
`mempalace.yaml` **per mined tree, at that tree's root**, every one naming the
single confirmed `memory.wing`. That path is not a preference: mining reads the
config from the directory it is pointed at and nowhere else, so a file in
`.config/` or in a subdirectory is **silently inert** — the mine runs, falls back
to auto-detected defaults, and files everything into `general` without an error.

**How many trees there are follows the topology:**

| Topology | Configs to end with |
| --- | --- |
| `repo`, `monorepo` | one, at the repo root |
| `multi-repo` + `linkage: submodule` | one, at the base repo root — members are inside that tree and get none |
| `multi-repo` + `linkage: siblings` | one per repo: the base and every **locally-present** member |

The sibling row is the one that is easy to get wrong. A sibling member is
*outside* the base repo's tree, so a single config at the base mines the
blueprint and the `docs/memory/` mirror and **none of the product's code** —
silently, in exactly the way above. An absent member gets its config on the run
that first sees the repo, not a placeholder now.

Getting there is a **consolidation**, per tree, in five steps:

1. **Discover every existing config.** Look at the tree root, at `.config/`, and
   at each submodule root beneath it. `.config/` is checked precisely because a
   user may have put one there — it has to be found in order to be merged and
   removed.
2. **Union rooms, keywords and `exclude_patterns`** into one file. A room name
   appearing twice with **conflicting descriptions** is surfaced as a question,
   never silently merged: that is a real semantic collision (a backend
   `configuration` of `deploy/` versus a frontend `configuration` of `config/`),
   and picking one description silently discards the other project's routing.
3. **Drop every submodule path from `exclude_patterns`.** The base used to
   exclude them because each submodule mined itself; one config mines them all,
   so an inherited exclude now drops that project from the palace entirely.
   (This step is about submodules *within* a tree — it does not apply to sibling
   members, which are not in the tree and are mined by their own config.)
4. **Carry the secret excludes through** — the denylist in the memory asset's
   *Secrets* section — so consolidating never drops a protection the user
   already had, and a repo that never had one gains it here.
5. **Seed the rooms.** All seven protocol rooms (`decisions`, `problems`,
   `planning`, `gaps`, `runs`, `doctor`, `handoff`), then path-derived rooms
   from the product's actual top-level directories.

Then **present the merge as part of the step-4 dry-run** — the new file in full
and every stray file to be deleted — under this skill's existing consent
discipline (`project-setup`'s `migration-and-consent` reference); do not invent
a second gate. Confirm the wing **once** for the product, in the same pass (one
MCQ) — not once per repo; one wing per product is the rule, and asking per repo
invites the exact divergence `/vwf:doctor` blocks on. **On
approval**, write each tree's `<tree-root>/mempalace.yaml` and `git rm` the
strays. **On decline**, change nothing and say so.

Two things to get right while merging, both from the memory asset: room routing
returns on the **first** path-part match, so never key a room on a directory
that contains another room's path (`docs` on `documentation` shadows
`docs/memory/handoff/`); and an existing `mempalace.yaml` is **merged, never
overwritten** — rooms, keywords and patterns the user added survive
consolidation.
