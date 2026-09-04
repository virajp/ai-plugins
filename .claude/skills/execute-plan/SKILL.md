---
name: execute-plan
description: Run an approved plan folder from docs/plans/ autonomously in a
  fresh session — one worktree, subagent units in waves, the full repo gate
  between waves, a commit per green wave, docs reconciled and versions bumped
  by the fixed final units, then land per the plan's recorded consent and stop
  once before any release. Resumes a BLOCKED plan from its last green wave.
  Invoke as /execute-plan <plan-folder> in a session that has done nothing
  else.
argument-hint: "<plan-folder or its index.md>"
allowed-tools: Read Grep Glob Bash Edit Agent AskUserQuestion Skill
---

# execute-plan

The plan is the contract and `index.md` is the only input. Everything the run
needs — rulings, file scopes, waves, gates, consent — is already written there
by `/create-plan`; this skill reads it and does not re-ask it. The orchestrator
**decides and verifies, and never reads unit work inline**: every edit is a
subagent's, so this session's context stays the size of the reports.

Run it in a session that has done nothing else. It cannot check that, so the
plan's launch line says it and this skill trusts it.

## Procedure

### 1. Resolve and refuse early

Resolve `$ARGUMENTS` to `<folder>/index.md`. Read the **Status**, **Consent**
and **Units** blocks. Then:

- Status `DRAFT` → stop: "not approved; run /create-plan to finish it".
- Status `COMPLETE` → stop: nothing to do.
- Status `BLOCKED` → this is a **resume**: the worktree named in the status line
  exists, every `green` unit's commit exists on its branch, and the run starts
  at the first unit that is not `green`. The ruling the block asked for must now
  be present in the plan — if the status line still reads the same
  `UNRESOLVED:`, stop and say which ruling is missing.
- Status `APPROVED` or `RUNNING` → a fresh run, or one that died mid-wave.
  `RUNNING` with a worktree that exists is resumed the same way as `BLOCKED`.

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

### 3. Waves

For each wave in index.md order:

1. **Dispatch** every unit in the wave in **one message with multiple `Agent`
   calls**, `subagent_type: "general-purpose"` unless the unit file names
   another, `name: "U<n>"`. The prompt is the unit contract from index.md:
   *"Read `<folder>/index.md` — Facts, Shared-file rule, Unit contract — then
   read `<folder>/NN-<unit>.md` in full. Execute its Edits in order inside
   `<worktree>`, run its Verification, and return the report the contract asks
   for. Touch nothing outside your Owns list. Do not bump a version, run a
   generator, edit a doc, or commit."* Pass paths, never conversation context.
2. **Wait** for every report. Mark each unit `green`, `failed` or `unresolved`
   in the Units table as reports arrive.
3. **Wave gate**, run by the orchestrator, from the worktree root:

   ```sh
   mise run plugins:check
   mise run plugins:marketplace --check
   mise run plugins:inventory --check
   pnpm vitest run
   pnpm exec tsc --noEmit -p installer && pnpm exec tsc --noEmit -p scripts
   mise run plugins:npm-normalize-test
   ```

   plus whatever index.md's *Wave gate* section adds, plus every report read for
   `UNRESOLVED:`. **A wave with any `UNRESOLVED:` or any red line does not
   advance.**
4. **Commit** the green wave via `vwf:git-workflow` step 3, one commit per unit
   in wave order using each unit file's commit line, `mise x -- git
   commit`.
   Write the short hash into the Units table. Commits are free; they are what
   makes a later failure roll back to the last green wave instead of discarding
   the run.

The two fixed final units run as their own waves: the docs unit dispatches
`docs-reconciler` first and applies its findings; the gates-and-bump unit bumps
versions per the consent block (`plugin.json` by hand, the installer via
`mise run i:version`), runs the generators, runs `target-verifier` when
`plugins/` or `installer/` changed, and passes the full gate. The orchestrator
also runs every item under *Gates the orchestrator keeps* before calling the run
green — those are the checks a diff cannot prove.

### 4. On failure

A red gate or an `UNRESOLVED:` stops the run **once**, with the specific ruling
needed — never "how should I proceed". Before stopping:

- set Status to `BLOCKED at wave <n>` with the unit ids and the exact
  `UNRESOLVED:` text or the failing gate line
- leave the worktree and its commits intact
- mark the failed units so a resume starts there

If the fix is mechanical and inside the failed unit's scope — a typo, a stale
fold, a missed grep — re-dispatch that unit alone with the finding appended to
its prompt, once. A second failure blocks.

The user re-runs `/execute-plan <folder>` after editing the plan; step 1's
resume path picks it up.

### 5. Land

With every unit `green` and every orchestrator gate passed, move the folder to
`docs/plans/archived/` and set Status to `COMPLETE` with the date and the commit
list, as one final `docs:` commit. Then read the Consent block:

- **Merge to `develop` and push: yes** → `vwf:git-workflow` step 4, *merge, push
  & clean up*. A merge conflict is a hard halt: abort, keep the worktree, set
  `BLOCKED`, report the files.
- **no** → stop with the worktree path and the branch name, and say the branch
  is ready to land. Ask nothing further.

### 6. Release — always stops once

If any Consent row records a release, and the landing merged and pushed, ask
**one** question: run the release now? The answer authorises invoking the
`release` skill, which owns the `develop → main` merge, `plugins:release` and
`i:release`. It does not authorise anything else, and it is asked in the moment
even though the plan recorded the intent — `CLAUDE.md`'s hard rule stands, and
`i:release` is interactive in any case.

If the landing was not consented, there is nothing to release yet; say so in the
final line and stop.

## What does not stop the run

The plan is approved and every ruling is in the folder. The run does **not**
pause to re-ask a ruling, confirm a file scope, report progress between waves,
ask whether to continue after a green gate, or ask before a commit. It pauses
for a red gate, an `UNRESOLVED:`, a merge conflict, and the release question.
Nothing else.

## What this skill never does

- Reads a unit's owned files itself, or does a unit's work inline because it
  looks small
- Dispatches a wave whose predecessor is not green
- Runs a generator or bumps a version outside the gates-and-bump unit
- Runs `plugins:release` or `i:release` itself, or merges to `main`
- Picks up an item from *Out of scope*, however adjacent
