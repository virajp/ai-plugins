# Plan: remove every statusline and context-caps trace

**Status: drafted 2026-08-23. Awaiting approval.**

The statusline and its `context-caps.js` hook have moved to
`@askviraj/claude-status`. The code that installed them left in `b142397`
(2026-08-21); what this plan removes is everything that stayed behind to clean
up after it — the legacy restore path, the debris cleanup, the retired flag
assertions, and roughly 90 lines of prose narrating a removal that is now two
versions old.

This index is written to be executed from cold. Read it end to end, then read
the workstream you are about to run.

## The decision this plan encodes

`uninstall.ts:56` states a drop condition — *"two releases after the statusline
major, or as soon as the maintainer's own machine and any reported install have
been through one `--uninstall`"*. **Neither clause is met, and the plan proceeds
anyway, by explicit decision on 2026-08-23.**

The reasoning:

- v5.2.0 is the latest tag and the statusline removal is **unreleased**, so
  every published version still installs the bar.
- The maintainer's machine is a test bed, not a sample of the installed base —
  its state is not evidence either way.
- The installed base outside that machine is not known to be non-empty, and the
  cost of being wrong is bounded: a user who upgrades keeps a `statusLine` key
  naming a script this plan's debris cleanup no longer deletes, and re-points it
  by installing `@askviraj/claude-status`.

**Do not silently re-litigate this.** If the decision is reversed, the parts to
keep are named per-file in `01-cli.md`.

## What is *not* in scope

- **The generic legacy-receipt reader stays.** `legacyItems`, the `receipt`
  removal kind, `revertLegacyReceipt` and `receipt.ts`'s `tree`/`command` entry
  kinds serve four other receipts — `claude.json`, `cursor.json`, `ohmypi.json`,
  `opencode.json` — from the retired render-target era. That is a separate
  removal with a separate rationale; touching it here would smuggle it in.
- **Every pointer to `@askviraj/claude-status` stays.** `/vwf:execute`'s
  autonomous pause depends on an external `PostToolUse` caps hook, and that
  package is what provides it. The contract in
  `plugins/vwf/skills/execute/SKILL.md`, and the four doc mentions that name the
  package, are load-bearing forward references, not residue.
- **Historical records stay.** `docs/memory/**`, `docs/plans/2026-08-17-*`,
  `docs/plans/plugin-support/**` and `archived/**` record what happened and are
  not reconciled by a later change.
- **Untracked trees are ignored.** `graphify-out/` and `docs/scratchpad/` carry
  matches; neither is in git.

## One correction to make while here

Three places assert that **`statusline.json`'s membership in `LEGACY_RECEIPTS`
is load-bearing** — that dropping it makes `--uninstall` stop finding the
receipt. **That is false as the code stands.** `legacyItems` enumerates every
`.json` in the receipt directory with no exclusion; `LEGACY_RECEIPTS` supplies a
display label and the `filesOnly` flag, nothing more. Removing the
`statusline.json` entry downgrades a row's label from *"the Claude statusline"*
to *"an install recorded in statusline.json"* and changes no behaviour.

The claim appears in `CLAUDE.md`, `.claude/skills/installer-cli/SKILL.md` and
`.config/mise/tasks/i/test`. All three are removed by this plan, so the
correction lands by deletion rather than by rewrite — but the workstreams say so
explicitly, because a reviewer who believes the claim will otherwise block the
change.

## Workstreams

Run in order. Each ends green on its own gates; the commit is at the end of WS3.

| #                         | Scope                                                              | Gates                                           |
| ------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| [01](./01-cli.md)         | `cli/src/**`, `.config/mise/tasks/i/test`                          | `vitest run`, `tsc --noEmit`, `mise run i:test` |
| [02](./02-docs.md)        | `CLAUDE.md`, `readme.md`, `docs/cli/**`                            | `dprint check`, links resolve                   |
| [03](./03-repo-skills.md) | `.claude/skills/installer-cli/**`, `.claude/agents/**`, plan index | `mise run plugins:check`, full pre-commit       |

## Execution: who does what

**This plan is executed by subagents.** The orchestrator owns sequencing, the
gates, the final sweep and the commit; it does not do the editing except where
named below.

Two of this repo's own agents fit and are used rather than reinvented:
`docs-reconciler` (stateless prose survey — writes nothing, returns the stale
passages) and `target-verifier` (real installs against a throwaway `HOME`).
Everything else is `general-purpose`.

### The rule that makes parallelism safe

**Every agent owns a disjoint set of files, named in its prompt, and touches
nothing outside it.** Two agents editing the same file is the failure mode this
plan is arranged to avoid — the files here cross-reference each other heavily,
and a concurrent write loses one side silently. Where a wave lists several
agents, their file sets do not intersect.

### Waves

| Wave | Runs                     | Owns                                                                                   |
| ---- | ------------------------ | -------------------------------------------------------------------------------------- |
| A    | **orchestrator, serial** | `cli/src/**` — `uninstall.ts`, `receipt.ts`, `args.ts` and their tests                 |
| B    | 2 agents, parallel       | ① `.config/mise/tasks/i/test` ② `docs-reconciler` survey of wave A's diff (read-only)  |
| C    | 3 agents, parallel       | ① `docs/cli/**` ② `CLAUDE.md` ③ `readme.md`                                            |
| D    | 2 agents, parallel       | ① `.claude/skills/installer-cli/**` ② `.claude/agents/target-verifier.md` + plan index |
| E    | `target-verifier`        | real `--uninstall` proof against a throwaway `HOME`                                    |
| F    | **orchestrator**         | final grep sweep, `dprint fmt`, full gates, commit                                     |

**Wave A stays with the orchestrator on purpose.** `uninstall.ts`, its type
surface and its tests are one coupled edit — `tsc` failures there need to be
read against the deletion that caused them, and handing that back and forth
across a subagent boundary costs more than it saves. It is also the only wave
that can change behaviour.

**Wave B before wave C.** The reconciler surveys the *landed* code change, so
every prose agent in wave C is seeded with `file:line` findings rather than
re-deriving what went stale. Pass each wave-C agent only the findings for its
own files.

**Wave E after all editing.** `target-verifier` runs real installs; running it
mid-edit proves a state that will not ship.

### What every agent is told

Put these in each prompt verbatim — they are the constraints that do not survive
being paraphrased:

- **Never commit, stage, push, tag or release.** Leave the working tree dirty.
- **Do not touch any file outside your named set**, even to fix something
  obviously wrong in it. Report it instead.
- The **do-not-touch list** from *What is not in scope* above, in full. An agent
  that has not read it will delete the `/vwf:execute` caps-hook contract, which
  is the one statusline reference that must survive.
- The tree is **dprint-formatted** (`.claude/**` and `docs/**` included; only
  `plugins/**/*.md` is excluded). Run `dprint fmt` on your own files before
  reporting.
- `cat > file <<EOF` writes ANSI escapes through this machine's `bat` alias.
  **Use the Write tool for whole-file rewrites.**
- Return a terse report: what you changed, and every `statusline`/`context-caps`
  hit you deliberately left, with `file:line` and one clause of why.

## Gates for the whole change

```sh
mise run plugins:marketplace --check   # unchanged; proves nothing regressed
mise run plugins:check
pnpm -C cli exec vitest run
pnpm -C cli exec tsc --noEmit
mise run i:test                        # builds the bundle and runs the E2E
dprint check
```

`plugins:check` and `plugins:marketplace` are untouched by this work — no plugin
manifest changes — but both run in pre-commit, so a green run is the evidence
that this change stayed inside `cli/`, `docs/` and `.claude/`.

## Commit

One commit, at the end of WS3:

```text
refactor(cli)!: remove the statusline and context-caps cleanup paths
```

Breaking, because `--uninstall` stops restoring a pre-statusline bar. The body
must state that, and name `@askviraj/claude-status` as the way back.

**Do not push, tag or release.** This plan ends at a local commit; releasing is
a separate ask.
