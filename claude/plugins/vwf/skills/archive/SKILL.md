---
name: archive
description: Move completed cycle plans out of the active set into
  docs/plans/archived/.
  Never deletes. May be run manually or offered at the end of execute.
argument-hint: "[plan-file]"
model: haiku
effort: low
disable-model-invocation: true
---

# archive — Retire Completed Plans

Move completed cycle plans out of the active set. **Never delete** — archive.

## Doc Paths

| Doc          | Path                                                |
| ------------ | --------------------------------------------------- |
| Plan index   | `docs/plans/index.md` (base repo)                   |
| Active plans | `<target-repo>/docs/plans/`                         |
| Gap-report   | `<target-repo>/docs/plans/<plan>.gap-report.md`     |
| Archived     | `<target-repo>/docs/plans/archived/`                |
| Membership   | `${CLAUDE_PLUGIN_ROOT}/assets/membership.md`        |

---

## Pipeline

### 1. Resolve which plan(s)

- If a plan file is named in `$ARGUMENTS`, archive that one.
- Otherwise list the active plans from the base repo's `docs/plans/index.md`
  (excluding archived rows) and ask the user which to archive. **Read the index,
  never walk the members** — under `multi-repo` most are not on this machine, so
  a walk would list the product's plans as a function of what happens to be
  cloned (`${CLAUDE_PLUGIN_ROOT}/assets/membership.md`).
- **A plan is archived in its own repo.** If the target repo is not present,
  offer the consent-gated clone; on decline, skip that plan and say so — moving
  a file in a repo you do not have is not something to fake.

### 2. Completion check

Before moving, verify each plan is actually complete. **Warn and ask to
proceed** (don't hard-halt) when any of these are unfinished:

- the plan doc's "Gaps surfaced during execution" section has **unresolved
  entries**;
- a companion `docs/plans/<plan>.gap-report.md` exists with **open** rows (a
  legacy autopilot gap-report, un-reconciled);
- an **execute run journal** (mempalace room `runs`, drawer `<plan>`) is not
  marked complete;
- an **active plan** anywhere in the product (per the index, whatever repo it
  sits in) lists this plan
  in its `requires:` frontmatter — archiving it out from under a dependent plan;
- a blueprint doc named in this plan's `covers:` frontmatter is **not**
  `implementation: complete` — the plan is being retired before what it covers
  is fully built.

Surface what's outstanding and let the user decide whether to archive anyway.
Skip the run-journal check silently if mempalace is unavailable.

### 3. Move (never delete)

Move each `<target-repo>/docs/plans/<plan>.md` →
`<target-repo>/docs/plans/archived/<plan>.md`, and when a
companion `<plan>.gap-report.md` exists, move it **together** into the same
`archived/` directory. Create that directory if absent. A plan never changes
repo when archived — it is retired where it was written.

Then **update the row in the base repo's `docs/plans/index.md`** to read
archived, in the same commit set. The index is the product's only view of its
plans; a moved file with a stale row makes a retired plan look active
everywhere except the one repo it lives in.

**Guard collisions.** Before each move, check the destination does **not**
already exist. On a collision, suffix the archived name (e.g. `-2`) or ask the
user — **never overwrite**. If a move fails, halt and report — do not delete or
overwrite.

### 4. Report, commit & mark archived

Report the moved paths. Commit the move via `/vwf:git-workflow` (a
`docs(plan): archive <slice>` message); all git actions go through
/vwf:git-workflow. Then, if mempalace is available, mark the plan's run journal
(room `runs`, drawer `<plan>`) **archived** (`mempalace_update_drawer`); skip
silently otherwise.
