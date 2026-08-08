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

## Write the mempalace config

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, write a `mempalace.yaml` to
**each repo root** — the parent and every submodule — all naming the single
confirmed `memory.wing`. Seed all seven protocol rooms (`decisions`, `problems`,
`planning`, `gaps`, `runs`, `doctor`, `handoff`), then add path-derived rooms
per repo from its actual top-level directories. Give the parent
`exclude_patterns` for the submodule paths so a root mine does not double-file
their contents.

Two things to get right, both from the memory asset: room routing returns on the
**first** path-part match, so never key a room on a directory that contains
another room's path (`docs` on `documentation` shadows `docs/memory/handoff/`);
and because the wing is shared, a room name reused across repos **merges** —
propose a distinguishing name wherever the same name would mean two different
things. Present the files as part of the step-4 dry-run and confirm the wing
(one MCQ) before writing; an existing `mempalace.yaml` is **merged, never
overwritten** — preserve rooms and patterns the user added.
