# U4 — Generators run, full gate, real install — no version moves

- **Wave:** 3
- **Depends on:** U3
- **Owns:** `.claude-plugin/marketplace.json`,
  `plugins/stackgen/stacks/inventory.md` — both generated. Touch nothing outside
  this list. **No `plugin.json` and no `site/package.json` changes**: consent is
  none for every project.
- **Model:** inherit
- **Read first:** index.md §Consent and §Waves (the inventory caveat).
- **Lazy-load:** `.claude/skills/release/SKILL.md` only to confirm that an
  unreleased change is a valid state — "a shipped plugin change with no release
  recorded is a valid answer".

## Ruling

D14: "No release yet" for stackgen; "No site release." The final unit runs gates
and generators and moves no version.

`CLAUDE.md`: "Ask the user before running `plugins:release`, `i:release` or
`site:release`" — this unit never tags.

## Edits

1. Confirm `plugins/stackgen/.claude-plugin/plugin.json`,
   `plugins/vwf/.claude-plugin/plugin.json` and `site/package.json` are
   unchanged against `develop` and say so.
2. Run `mise run plugins:marketplace` and `mise run plugins:inventory`; stage
   nothing (the orchestrator commits). The inventory should already be current
   (the orchestrator regenerated it at the wave-1 commit); report whether either
   generator changed anything.

## Verification

- The full wave gate, each line reported with its exit code:
  `mise run
  plugins:marketplace --check`,
  `mise run plugins:inventory --check`, `mise
  run plugins:check`,
  `mise run plugins:shellcheck`, `pnpm vitest run`,
  `pnpm
  exec tsc --noEmit -p installer`, `pnpm exec tsc --noEmit -p scripts`,
  `mise
  run plugins:npm-normalize-test`, `mise run site:check`.
- `git diff --stat` against the wave-2 commit is **empty**, or shows only the
  two generated files if a generator moved something — and then explain what
  moved.
- **`target-verifier`** is dispatched by the orchestrator after this unit
  reports: a hermetic `CLAUDE_CONFIG_DIR=/tmp/…` install of the working tree's
  dev marketplace shows `stackgen` at the version `plugin.json` carries and
  `vwf@19.12.0`, the installed stackgen tree contains
  `stacks/framework/astro/pack.yaml`,
  `stacks/framework/astro/skills/astro/
  SKILL.md` and all three
  `stacks/bundles/typescript-astro-*.md`, and uninstall leaves only Claude's own
  version-keyed cache. Never the real config dir.

## Guardrails

- Do not run `plugins:release`, `i:release` or `site:release`.
- Do not bump any version — none is consented.
- Do not edit any doc, pack, asset or skill — a failing gate is a finding routed
  back to the owning unit, not fixed here.
- Write with Write/Edit; `cat` is `bat`.

## Commit

`ops: regenerate the marketplace and inventory for the astro pack` — written by
the orchestrator after the wave gate, only if a generated file changed;
otherwise no commit.
