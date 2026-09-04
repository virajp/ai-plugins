# Blocking and resume (§5 and §1)

Read this when a unit returns `UNRESOLVED:`, fails its verification, dies, or
when a run starts against a `BLOCKED` or `RUNNING` plan.

## Isolated versus all-blocking

A unit blocks when it returns `UNRESOLVED:`, when its agent errors twice, or
when its own Verification fails after the one mechanical re-dispatch below. A
`GAP:` never blocks — it is a stated assumption, recorded in the run log and
answered in the final report.

- **Isolated block.** Mark the unit `unresolved` or `failed`, mark every unit
  that transitively depends on it `skipped` with `depends on U<n>` as detail,
  and **continue** with every unit that does not. Later waves still run for
  their unblocked units. The two fixed final units do **not** run while anything
  is skipped — docs reconciled against a half-landed change would describe a
  state that never existed.
- **All-blocking.** When every remaining unit is skipped, there is nothing left
  to run. Go straight to the final report.

Either way the run stops **once**, at the final report, with every ruling needed
listed together — one question per blocked unit, specific enough that the answer
is a sentence the user pastes into the plan. Never mid-wave, never "how should I
proceed".

## The mechanical re-dispatch

If a unit's failure is inside its own scope and needs no ruling — a typo, a
stale fold width, a grep check it missed, a verification line it forgot to run —
re-dispatch that unit alone, once, with the failure appended to its prompt. A
second failure blocks. Anything that would need a decision the unit file does
not carry is not mechanical, however small it looks.

## What the status line records

`BLOCKED at wave <n> — U<a> UNRESOLVED: <text>; U<b> failed: <gate line or
agent died>; U<c>, U<d> skipped (depend on U<a>)`
plus the worktree path.

The Units table and the Run log carry the same facts per unit; the status line
is the summary a reader sees first.

## Resume

A re-run against `BLOCKED` or `RUNNING`:

1. Confirm the worktree in the status line exists. If it does not, the run
   cannot resume — say so and stop; the user decides whether to start over from
   `APPROVED`.
2. Confirm the ruling each `unresolved` unit asked for is now in its unit file
   or the decisions table. If the status line's `UNRESOLVED:` text still
   describes an unanswered question, stop and name it.
3. **The worktree is authoritative.** For every unit marked `green`, check its
   commit exists on the branch. A `green` unit whose commit is absent is reset
   to `pending` and re-run — the plan's table can be ahead of what landed if a
   session died between the report and the commit, and the committed tree is
   ground truth.
4. Reset `unresolved`, `failed` and `skipped` units to `pending`.
5. Re-run the preflight, then continue from the first wave with a pending unit.
   Run-log rows from the earlier attempt stay; new rows are appended with the
   round numbering continued, so the final report shows the whole history.

The user edits the plan and re-runs `/execute-plan <folder>`; nothing else is
needed to resume.
