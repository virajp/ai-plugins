---
name: execute-plan
description: Run an approved plan folder from docs/plans/ autonomously in a
  fresh session — preflight, one worktree, subagent units in waves, a wave
  review with a capped finding loop, the full repo gate between waves, a
  commit per green wave, a run log the final report renders, docs reconciled
  and versions bumped by the fixed final units, then land per the plan's
  recorded consent and stop once before any release. Blocks only what a
  missing ruling blocks and resumes from its last green unit. Invoke as
  /execute-plan <plan-folder> in a session that has done nothing else.
argument-hint: "<plan-folder or its index.md>"
allowed-tools: Read Grep Glob Bash Edit Agent AskUserQuestion Skill
---

# execute-plan

The plan is the contract and `index.md` is the only input. Everything the run
needs — rulings, file scopes, waves, gates, consent — is already written there
by `/create-plan`; this skill reads it and does not re-ask it. The orchestrator
**decides, reviews and verifies, and never reads unit work inline**: every edit
is a subagent's, so this session's context stays the size of the reports.

Run it in a session that has done nothing else. It cannot check that, so the
plan's launch line says it and this skill trusts it.

## References

| Reference                                     | When to read                                                     |
| --------------------------------------------- | ---------------------------------------------------------------- |
| [The wave review](references/wave-review.md)  | §4 step 3 — the reviewer prompt, the finding loop, the guard     |
| [Blocking and resume](references/blocking.md) | §5 — what a failure skips, what it blocks, how a re-run picks up |

## Procedure

### 1. Resolve and refuse early

Resolve `$ARGUMENTS` to `<folder>/index.md`. Read the frontmatter and the
**Status**, **Consent**, **Units** and **Run log** blocks. Then:

- Status `DRAFT` → stop: "not approved; run /create-plan to finish it".
- Status `COMPLETE` → stop: nothing to do.
- Any `requires:` folder whose status is not `COMPLETE` → stop, name it: "run
  /execute-plan <that folder> first". No override.
- Status `BLOCKED` or `RUNNING` → a **resume**, per
  [blocking and resume](references/blocking.md): the worktree named in the
  status line exists, and the run starts at the first unit that is not `green`.
  The ruling a block asked for must now be in the plan — if the status line
  still reads the same `UNRESOLVED:`, stop and say which ruling is missing.
- Status `APPROVED` → a fresh run.

Set the status to `RUNNING` with the timestamp. The plan folder is edited in the
worktree only and committed with each wave, so a session that dies still leaves
a legible plan on the branch — never in the main checkout, which would dirty
`develop`.

### 2. One worktree for the whole run

Invoke the `vwf:git-workflow` skill with the declared preference *"isolate
without asking, branch from `develop`, name it after the plan folder; commit
only — never merge or push"*. Every unit works inside that worktree; **no unit
gets `isolation: "worktree"`** — units in a wave own disjoint paths, and merging
five trees back by hand is the collision the shared-file rule exists to avoid.
Record the worktree path in the status line.

### 3. Preflight

Run the full wave gate once, **before wave 1**, from the worktree root:

```sh
mise run plugins:check
mise run plugins:marketplace --check
mise run plugins:inventory --check
pnpm vitest run
pnpm exec tsc --noEmit -p installer && pnpm exec tsc --noEmit -p scripts
mise run plugins:npm-normalize-test
```

A red line here is `develop`'s, not the plan's. Stop and report it as such —
never start a run that would be blamed for a failure it inherited. Record the
green preflight as the first run-log row (`wave 0`, `preflight`).

### 4. Waves

For each wave in index.md order, skipping units already `green` on a resume:

1. **Dispatch** every unit in the wave in **one message with multiple `Agent`
   calls**, `subagent_type: "general-purpose"` unless the unit file names
   another, `name: "U<n>"`, on the model the unit file's `Model:` line names
   (`inherit` means the session's). The prompt is the unit contract from
   index.md: *"Read `<folder>/index.md` — Facts, New dependencies, Shared-file
   rule, Unit contract — then read `<folder>/NN-<unit>.md` in full. Execute its
   Edits in order inside `<worktree>`, run its Verification, and return the
   block the contract asks for and nothing else. Touch nothing outside your Owns
   list. Do not bump a version, run a generator, edit a doc, add a dependency
   the plan does not list, or commit."* Pass paths, never conversation context.
2. **Wait** for every report. As each returns, mark the unit in the Units table
   and append a run-log row — unit, model, round 1, outcome, the `DECIDED:` and
   `GAP:` lines condensed into *Detail*. A unit whose agent **errored** rather
   than returned is re-dispatched once with the same prompt; a second error
   marks it `failed` with `agent died` as detail. Write the row **when the
   report arrives**, not at the end of the wave — a row written late is a unit a
   resumed run repeats.
3. **Wave review**, per [the wave review](references/wave-review.md): one
   reviewer subagent over the wave's diff against the unit files, findings
   looped back to the owning unit, at most two rounds, under the convergence
   guard. Every round is a run-log row.
4. **Wave gate**, run by the orchestrator: the six lines from §3, plus whatever
   index.md's *Wave gate* section adds, plus every report read for
   `UNRESOLVED:`. A unit that returned `UNRESOLVED:` or `failed`, and every unit
   that depends on it, is **skipped** per
   [blocking and resume](references/blocking.md); the rest of the run continues.
   A red gate line no skipped unit explains is attributed to the unit whose Owns
   covers the failing path and handled as that unit's failure; one that cannot
   be attributed marks every unit in the wave `failed` with the gate line as
   detail.
5. **Commit** the green units via `vwf:git-workflow` step 3, one commit per unit
   in wave order using each unit file's commit line. Write the short hash into
   the Units table and the run-log row. Commits are free; they are what makes a
   later failure roll back to the last green unit instead of discarding the run.

The two fixed final units run as their own waves, and **only when no unit is
skipped**: the docs unit dispatches `docs-reconciler` first and applies its
findings plus every `DOCS FALSIFIED:` line the units returned; the
gates-and-bump unit bumps versions per the consent block (`plugin.json` by hand,
the installer via `mise run i:version`), runs the generators, runs
`target-verifier` when `plugins/` or `installer/` changed, and passes the full
gate. The orchestrator also runs every item under *Gates the orchestrator keeps*
before calling the run green — those are the checks a diff cannot prove.

### 5. On failure

The run **skips what a failure blocks and keeps going** with what it does not,
then stops once at the end with every ruling needed — never mid-wave, and never
with "how should I proceed". The exact semantics — isolated versus all-blocking,
the mechanical re-dispatch, what the status line records, and how a re-run
resumes — are [blocking and resume](references/blocking.md).

### 6. The final report

Before landing, **render the report from the Run log**, not from memory — by now
the run may have spanned dozens of dispatches or a compaction, and the log is
the account that survived. Present:

- every unit with its outcome, rounds, model, commit, and any `skipped` or
  `failed` reason
- every `GAP:` the units returned, with the assumption each proceeded on
- the review findings that survived the cap, marked `contested`
- the wave gate and orchestrator gate results
- the versions bumped and the worktree path

If any unit is `skipped`, `failed` or `unresolved`, this report is the block
notice and the run stops here with the status set to `BLOCKED`.

### 7. Land

With every unit `green` and every orchestrator gate passed, move the folder to
`docs/plans/archived/`, set Status to `COMPLETE` with the date and the commit
list, and commit as one final `docs:` commit. Then read the Consent block:

- **Merge to `develop` and push: yes** → `vwf:git-workflow` step 4, *merge, push
  & clean up*. A merge conflict is a hard halt: abort, keep the worktree, set
  `BLOCKED`, report the files.
- **no** → stop with the worktree path and the branch name, and say the branch
  is ready to land. Ask nothing further.

### 8. Release — always stops once

If any Consent row records a release, and the landing merged and pushed, ask
**one** question: run the release now? The answer authorises invoking the
`release` skill, which owns the `develop → main` merge, `plugins:release` and
`i:release`. It does not authorise anything else, and it is asked in the moment
even though the plan recorded the intent — `CLAUDE.md`'s hard rule stands, and
`i:release` is interactive in any case.

If the landing was not consented, there is nothing to release yet; say so in the
final line and stop.

## Resource caps

A session cannot measure its own context; the signal arrives as an injected cap
directive from an external hook (`claude-status` provides one). On that
directive, or on any sign the context is being compacted mid-wave: finish
writing the run-log rows for every report already in hand, commit the units that
are green, set Status to `RUNNING — paused at wave <n> for context`, and stop
with the launch line. A re-run resumes per
[blocking and resume](references/blocking.md); units in flight are re-run from
their prompt, since the worktree is the tie-break.

## What does not stop the run

The plan is approved and every ruling is in the folder. The run does **not**
pause to re-ask a ruling, confirm a file scope, report progress between waves,
ask whether to continue after a green gate, ask before a commit, or ask what to
do about a `GAP:` — a gap is recorded and the stated assumption stands until the
final report. It pauses for an inherited red preflight, a merge conflict, a
resource cap, and the release question. Everything else is recorded in the run
log and answered at the end.

## What this skill never does

- Reads a unit's owned files itself, or does a unit's work inline because it
  looks small
- Dispatches a wave whose predecessor is not green or explicitly skipped
- Runs a generator or bumps a version outside the gates-and-bump unit
- Runs `plugins:release` or `i:release` itself, or merges to `main`
- Picks up an item from *Out of scope* or *Parked*, however adjacent
- Reports the run from recollection when the run log exists
