# Handoff: next

The vwf re-architecture ran to completion. All eight waves landed, every gate is
green, nothing is pushed. Two follow-up items were then directed by the user and
are **not started**.

## Workspace

|                       |                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Worktree**          | `/Users/virajpatel/Projects/github.com/virajp/ai-plugins/.claude/worktrees/template-build-architecture` |
| **Branch**            | `worktree-template-build-architecture`                                                                  |
| **HEAD**              | `dc4082a`                                                                                               |
| **Ahead of `main`**   | 81 commits; `main` untouched at `94478e4`                                                               |
| **Tree**              | clean; rendered trees match a fresh render                                                              |
| **Pushed / released** | no, and no — version `2.7.3` unbumped                                                                   |

Do **not** use `EnterWorktree` or branch from `origin/main`; that ref does not
contain this work. The branch descends from 34 commits recovered from dangling
objects — never rebase it.

## The long-form handoff

**`docs/scratchpad/next.md` in the MAIN checkout is the detailed handoff** and
is the first thing to read. It is gitignored, so it exists only there — not in
this worktree, not in git. It carries the full state, the gate set, the review
priorities, both new work items with their traps, the open decisions and the
parked scope. This drawer is the pointer; that file is the content.

The plan it executed is `docs/scratchpad/re-architecture/` (also main checkout,
also gitignored): master `README.md` plus sixteen slice files.

## What landed

Waves 0–7, sixteen slices, each closing on a green gate:

- Rendered trees moved `dist/<target>/` → repo root; Codex dropped (four
  targets); binary channel dropped (npm only).
- 15 plugins now, each with a `docs/<plugin>.md`. `effect`, `markdown`,
  `context7`, `mise`, `claude-design`, `lovable`, `stitch` and `github-actions`
  are absorbed or renamed.
- **vwf ships no stack templates and names no tool**, and `plugins:check` now
  fails if either regresses. All three guards were tested by breaking them.
- `blueprint_format` 20, `config_format` 13, role `iac`, per-project axes.
- `readme.md` is a 368-line landing page; vwf's manual is `docs/vwf.md`.

Three mise tasks were renamed: `plugins:dist-clean` → `plugins:render-clean`,
`vwf:test` → `typescript:test`. An old name fails as "task not found", which
reads like a broken gate rather than a rename.

## Open items (not started)

1. **Port `tools/opencode/mempalace-hooks.js` to TypeScript and install it for
   OpenCode.** mempalace does not install on OpenCode at all today —
   `cli/src/plan.ts:135` skips any plugin with no rendered bundle, and
   url-sourced plugins have none. The hook file is currently dead code with no
   consumer anywhere in `cli/`, `build/`, `.config/` or `package.json`.
2. **Fold mempalace's skills into vwf and drop the upstream dependency**, so
   memory ships with the workflow on every target. **This supersedes decision 15
   of the plan** ("mempalace stays url-sourced… no third-party code is
   vendored") — the plan's Decisions table still says the old thing; the user
   changed it after the run. Handle licence/attribution, upstream drift, and
   skill-name collisions against vwf's existing 23 skills before moving.
3. **Test everything** — unit tests for the ported hook, an OpenCode install
   test, a test that OpenCode actually gets the skills, then the full gate set.
   Note `vitest.config.mts` collects only `{schema,build,cli}/src/**/*.test.ts`;
   a test file anywhere else is silently never run.
4. **Review before merging.** 81 commits. Highest-value target is
   `git diff main...HEAD -- templates/vwf/skills/` — wave 5 restructured eleven
   skills, and "no always-applies rule moved into a reference" is the one claim
   no gate can check.
5. Two undecided: whether to extend the regression guard's token list to design
   tools, and what happens to the `mempalace` marketplace entry.

## Next prompt

```text
Read /Users/virajpatel/Projects/github.com/virajp/ai-plugins/docs/scratchpad/next.md
in full. Work in the EXISTING worktree .claude/worktrees/template-build-architecture
(branch worktree-template-build-architecture @ dc4082a) — do NOT create a new
worktree from origin/main and do NOT rebase.

Implement section 2 of that file: port tools/opencode/mempalace-hooks.js to
TypeScript and wire it into the OpenCode adapter so it installs and uninstalls
with a receipt entry, then fold mempalace's skills into vwf and remove mempalace
from vwf's dependencies. Section 2b supersedes decision 15 of the re-architecture
plan — the plan's Decisions table is stale on that one point and must not be
"fixed" back.

Then do section 3: unit tests for the hook, an OpenCode install test, a test that
OpenCode actually receives the skills, and the full gate set in the file's gate
section — every command, green, before you report.

Check skill-name collisions against vwf's existing skills before moving anything;
names are a flat global namespace and plugins:check fails on a collision. Do not
push and do not release.
```
