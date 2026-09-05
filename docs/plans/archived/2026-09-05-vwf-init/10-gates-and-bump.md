# U10 — Versions bumped, generators run, full gate, real install

- **Wave:** 4
- **Depends on:** U9
- **Owns:** `plugins/vwf/.claude-plugin/plugin.json`,
  `plugins/stackgen/.claude-plugin/plugin.json`, `site/package.json`,
  `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`.
  Touch nothing outside this list.
- **Model:** inherit
- **Read first:** index.md §Consent; the two `plugin.json` files;
  `.claude/skills/release/SKILL.md` (the version rules, not the release ritual);
  `.config/mise/tasks/site/version`.
- **Lazy-load:** `.claude/docs/ci-and-releases.md` if a version rule is unclear.

## Ruling

Consent: "Release `vwf` minor; Release `stackgen` major; Release site patch;
installer none."

D35: "`0.22.0` → `1.0.0` for 'major'. Say so at review if `0.23.0` (0.x
convention) is preferred." — apply `1.0.0` unless index.md's consent block has
been edited to say otherwise.

`CLAUDE.md`: "A tracked plugin version is always plain `X.Y.Z`"; "Ask the user
before running `plugins:release`, `i:release` or `site:release`" — this unit
bumps, never tags.

## Edits

1. **`plugins/vwf/.claude-plugin/plugin.json`** — `19.11.0` → `19.12.0`.
2. **`plugins/stackgen/.claude-plugin/plugin.json`** — `0.22.0` → `1.0.0` (D35).
3. **`site/package.json`** — via `mise run site:version patch` (`1.1.1` →
   `1.1.2`); if the task also touches a file outside your list, report it as a
   `GAP:` and leave that file as the task wrote it.
4. Run `mise run plugins:marketplace` and `mise run plugins:inventory`; stage
   the regenerated `.claude-plugin/marketplace.json` and
   `plugins/stackgen/stacks/inventory.md` (the inventory gains the
   `repo-hygiene` kind and pack counts).

## Verification

- The full wave gate: `mise run plugins:marketplace --check`,
  `mise run plugins:inventory --check`, `mise run plugins:check`,
  `mise run plugins:shellcheck`, `pnpm vitest run`,
  `pnpm exec tsc --noEmit -p installer` and `-p scripts`,
  `mise run plugins:npm-normalize-test`, `mise run site:check`.
- `target-verifier`: a hermetic `CLAUDE_CONFIG_DIR=/tmp/…` install of the
  working tree's marketplace shows `vwf@19.12.0` and `stackgen@1.0.0`,
  `claude plugin list` names both, and the installed vwf tree contains
  `skills/init/SKILL.md`; uninstall leaves no residue. (Never the real config
  dir — a phantom bump was caused by cache residue on 2026-09-03.)
- `git diff --stat` shows exactly the five owned files changed.

## Guardrails

- Do not run `plugins:release`, `i:release` or `site:release`.
- Do not edit any doc, pack or skill — a failing gate is a finding routed back
  to the owning unit, not fixed here.
- Write with Write/Edit; `cat` is `bat`.

## Commit

`ops: bump vwf to 19.12.0, stackgen to 1.0.0, site to 1.1.2` — written by the
orchestrator after the wave gate, not by the unit.
