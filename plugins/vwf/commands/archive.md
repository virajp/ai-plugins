---
description: Move completed cycle plans out of the active set into
  docs/plans/archived/. Never deletes. May be run manually or offered at the end
  of execute.
argument-hint: "[plan-file]"
model: sonnet
effort: low
---

# archive — Retire Completed Plans

Move completed cycle plans out of the active set. **Never delete** — archive.

## Doc Paths

| Doc          | Path                   |
| ------------ | ---------------------- |
| Active plans | `docs/plans/`          |
| Archived     | `docs/plans/archived/` |

---

## Pipeline

### 1. Resolve which plan(s)

- If a plan file is named in `$ARGUMENTS`, archive that one.
- Otherwise list the plans in `docs/plans/` (excluding `archived/`) and ask the
  user which to archive.

### 2. Move (never delete)

Move each `docs/plans/<plan>.md` → `docs/plans/archived/<plan>.md`. Create
`docs/plans/archived/` if absent. If a move fails, halt and report — do not
delete or overwrite.

### 3. Report & commit

Report the moved paths. Commit the move via `/vwf:git-workflow` (a
`docs(plan): archive <slice>` message); all git actions go through
`git-workflow`.
