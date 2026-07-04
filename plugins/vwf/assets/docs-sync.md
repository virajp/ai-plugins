# Docs Sync (end of every change)

**Stale docs are more harmful than no docs** — a doc that contradicts reality
actively misleads the next reader (human or agent). Every vwf run that changes
reality therefore ends by reconciling the repo's human-facing docs with what
changed, in the same worktree and commit flow as the change itself. Docs are
never "updated later".

## When it fires

| Run                          | Reality that changed              | Sync |
| ---------------------------- | --------------------------------- | ---- |
| `execute` / `autopilot`      | landed code, new capabilities     | yes  |
| `architecture` (update mode) | system shape, projects, stacks    | yes  |
| `product` (update mode)      | the product's framing/goals       | yes  |
| `setup`                      | (owns full doc authoring already) | n/a  |
| `blueprint` / `plan`         | only blueprint/plan docs changed  | no   |

`blueprint`/`plan` are exempt because their output *is* documentation of intent,
not reality — the README must describe what the product **does**, and that
changes when code lands, not when a contract is written.

## What to check

1. **README** — every claim the change touches: features, commands, endpoints,
   setup steps, project layout, badges/versions. A landed change that
   contradicts a README sentence means that sentence is updated **now**.
2. **CLAUDE.md** — the repo's agent instructions: stack claims, task names,
   layout, the vwf section (`/vwf:setup` owns its shape; this sync only fixes
   claims the change falsified).
3. **Other human docs** the change contradicts (`docs/` guides, per-project
   READMEs in a monorepo) — same rule.

## How

- **Surgical by default**: update only passages the change falsified or that now
  omit a landed capability. Do not rewrite style, restructure, or document
  unchanged behavior — every edited line must trace to the change.
- **Broad drift** (the README no longer resembles the repo): regenerate via
  `markdown:readme` instead of patching sentence by sentence.
- **Same commit flow**: the sync lands through `/vwf:git-workflow` with the
  run's other reconcile output (a `docs:` commit when standalone).
- **Report it**: state at the run's final gate/report which docs were synced —
  or the explicit line `docs: nothing contradicted` — never a silent skip.
