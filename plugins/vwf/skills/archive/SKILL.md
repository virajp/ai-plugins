---
name: archive
description: Move completed cycle plans out of the active set into
  docs/plans/archived/.
  Never deletes. May be run manually or offered at the end of execute.
argument-hint: "[plan-file]"
model: sonnet
effort: low
disable-model-invocation: false
---

# archive — Retire Completed Plans

Move completed cycle plans out of the active set. **Never delete** — archive.

## Doc Paths

| Doc          | Path                              |
| ------------ | --------------------------------- |
| Active plans | `docs/plans/`                     |
| Gap-report   | `docs/plans/<plan>.gap-report.md` |
| Archived     | `docs/plans/archived/`            |

---

## Pipeline

### 1. Resolve which plan(s)

- If a plan file is named in `$ARGUMENTS`, archive that one.
- Otherwise list the plans in `docs/plans/` (excluding `archived/`) and ask the
  user which to archive.

### 2. Completion check

Before moving, verify each plan is actually complete. **Warn and ask to
proceed** (don't hard-halt) when any of these are unfinished:

- the plan doc's "Gaps surfaced during execution" section has **unresolved
  entries**;
- a companion `docs/plans/<plan>.gap-report.md` exists with **open** rows (a
  legacy autopilot gap-report, un-reconciled);
- an **execute run journal** (mempalace room `runs`, drawer `<plan>`) is not
  marked complete;
- an **active plan** under `docs/plans/` (excluding `archived/`) lists this plan
  in its `requires:` frontmatter — archiving it out from under a dependent plan;
- a blueprint doc named in this plan's `covers:` frontmatter is **not**
  `implementation: complete` — the plan is being retired before what it covers
  is fully built.

Surface what's outstanding and let the user decide whether to archive anyway.
Skip the run-journal check silently if mempalace is unavailable.

### 3. Move (never delete)

Move each `docs/plans/<plan>.md` → `docs/plans/archived/<plan>.md`, and when a
companion `docs/plans/<plan>.gap-report.md` exists, move it **together** →
`docs/plans/archived/<plan>.gap-report.md`. Create `docs/plans/archived/` if
absent.

**Guard collisions.** Before each move, check the destination does **not**
already exist. On a collision, suffix the archived name (e.g. `-2`) or ask the
user — **never overwrite**. If a move fails, halt and report — do not delete or
overwrite.

### 4. Report, commit & mark archived

Report the moved paths. Commit the move via `/vwf:git-workflow` (a
`docs(plan): archive <slice>` message); all git actions go through
`git-workflow`. Then, if mempalace is available, mark the plan's run journal
(room `runs`, drawer `<plan>`) **archived** (`mempalace_update_drawer`); skip
silently otherwise.
