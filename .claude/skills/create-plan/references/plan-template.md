# The plan folder template

`docs/plans/<YYYY-MM-DD>-<kebab-name>/` holds `index.md` and one `NN-<unit>.md`
per unit. Every section below is required. The **Status**, **Consent** and
**Units** blocks have a fixed shape: execute-plan parses them and rewrites the
status column, so keep the headings and the column order exactly.

Two archived plans are the worked specimens: `2026-09-01-devtools-dissolution`
for waves and the shared-file rule, `2026-09-02-doctrine-gaps` for the folder
form and the unit prompt.

## index.md

```markdown
# Plan — <title> (<date>)

## Status

**DRAFT** | **APPROVED** | **RUNNING** | **BLOCKED** | **COMPLETE** <one line:
when it changed and by what — "APPROVED 2026-09-04 by the user"; "BLOCKED at
wave 2, U4 UNRESOLVED: <ruling needed>">

## Consent

| Action                                   | Granted                      |
| ---------------------------------------- | ---------------------------- |
| Merge to `develop` and push on green run | yes / no                     |
| Release `vwf`                            | none / patch / minor / major |
| Release `stackgen`                       | none / patch / minor / major |
| Release installer                        | none / patch / minor / major |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`.

## Goal

<one paragraph: what is true after this lands. Then the framing that produced
the plan, if any.>

## Facts the survey established

<what the Explore pass found, so no unit re-derives it: counts, paths, the gates
that cover the trees, the docs that describe today's behaviour>

## Assumed decisions — confirm or override at review

| # | Decision | Ruling | Unit |
| - | -------- | ------ | ---- |

## Units

| Id   | Wave   | Unit file              | Owns                                                                                 | Depends on | Status  | Commit |
| ---- | ------ | ---------------------- | ------------------------------------------------------------------------------------ | ---------- | ------- | ------ |
| U1   | 1      | [01-x.md](01-x.md)     | `path/a`, `path/b`                                                                   | —          | pending |        |
| …    |        |                        |                                                                                      |            |         |        |
| Un-1 | last   | `NN-docs.md`           | `readme.md`, `CLAUDE.md`, `docs/**`, `.claude/docs/**`, `.claude/skills/*-plugin/**` | all        | pending |        |
| Un   | last+1 | `NN-gates-and-bump.md` | `plugins/*/.claude-plugin/plugin.json`, generated files                              | Un-1       | pending |        |

Status is one of `pending`, `running`, `green`, `failed`, `unresolved`.

## Shared-file rule

| File                                                                      | Why it collides                                    | Owner                    |
| ------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------ |
| `plugins/*/.claude-plugin/plugin.json`                                    | several units bumping one version is a lost update | gates-and-bump unit only |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md` | generated; regenerating mid-wave races             | gates-and-bump unit only |
| `readme.md`, `CLAUDE.md`, `docs/**`, `.claude/docs/**`                    | n units editing one doc                            | docs unit only           |
| <any other file two units would touch>                                    |                                                    |                          |

## Waves

<one line per wave: which units, why they are safe together>

## Wave gate

`mise run plugins:check`, `mise run plugins:marketplace --check`,
`mise run plugins:inventory --check`, `pnpm vitest run`,
`pnpm exec tsc --noEmit -p installer` and `-p scripts`,
`mise run plugins:npm-normalize-test`, plus every report read for `UNRESOLVED:`.
<Add the plan's own checks here.>

## Gates the orchestrator keeps

<what cannot be proven by a diff: target-verifier runs, scratch-repo smoke
tests, each with its pass condition>

## Unit contract

Every unit prompt carries, in order: its ruling quoted from this file, its owned
paths plus "touch nothing outside this list", the facts section, the shared-file
rule, and the return contract. A unit returns a terse report — files changed,
decisions taken inside scope, `UNRESOLVED:` for anything it could not settle.
Never file contents. A unit never bumps a version, never runs a generator, never
edits a doc, never commits.

## Out of scope

<each declined or deferred item, with the reason>

## Launch

Run in a fresh session:

/execute-plan docs/plans/<date>-<name>
```

## NN-<unit>.md

```markdown
# U<n> — <title>

- **Wave:** <n>
- **Depends on:** <ids or —>
- **Owns:** <explicit paths>
- **Read first:** every owned file, top to bottom, before editing.
- **Lazy-load:** <files to open only if an edit needs them>

## Ruling

<quoted verbatim from index.md's assumed decisions and the user's answers —
never paraphrased>

## Edits

1. **`<path>`** — <what changes, precisely enough that two readers would make
   the same edit>
2. …

## Verification

- <the gate lines this unit must pass before returning>
- <grep-level checks specific to the edit>

## Guardrails

- Do not touch <the neighbour another unit owns>.
- <the trap specific to this tree — dprint, strict-YAML frontmatter, BSD sed,
  byte-copy not retype>

## Commit

`<type>: <description>` — written by the orchestrator after the wave gate, not
by the unit.
```

## The two fixed final units

**Docs.** Dispatched as the `docs-reconciler` agent with the run's diff, then a
`general-purpose` unit applying its findings plus the list from index.md's
survey facts. Under `CLAUDE.md`'s rule docs ship with the change, so this unit
is never optional. A confirmed reversal from the interview also lands here, as a
`docs/memory/decisions/<date>-<slug>.md`.

**Gates and bump.** Bumps each released project's version per the consent block,
runs `mise run plugins:marketplace` and `mise run plugins:inventory`, and passes
the full wave gate. Runs `target-verifier` when `plugins/` or `installer/`
changed. Its report is the run's final gate.
