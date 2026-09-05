# U7 — Versions bumped, generators run, full gate, real install

- **Wave:** 3
- **Depends on:** U6
- **Owns:** `plugins/vwf/.claude-plugin/plugin.json` (unchanged — listed so no
  other unit touches it), `plugins/stackgen/.claude-plugin/plugin.json`,
  `site/package.json`, `.claude-plugin/marketplace.json`,
  `plugins/stackgen/stacks/inventory.md`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** index.md §Consent;
  `plugins/stackgen/.claude-plugin/
  plugin.json`;
  `.claude/skills/release/SKILL.md` (the version rules, not the ritual);
  `.config/mise/tasks/site/version`.
- **Lazy-load:** `.claude/docs/ci-and-releases.md` if a version rule is unclear.

## Ruling

Consent: "Release `stackgen` minor; Release site patch; vwf none; installer
none."

D16: `1.0.0` → `1.1.0` for "minor".

`CLAUDE.md`: "A tracked plugin version is always plain `X.Y.Z`"; "Ask the user
before running `plugins:release`, `i:release` or `site:release`" — this unit
bumps, never tags.

## Edits

1. **`plugins/stackgen/.claude-plugin/plugin.json`** — `1.0.0` → `1.1.0`.
2. **`plugins/vwf/.claude-plugin/plugin.json`** — no change; confirm it still
   reads `19.12.0` and say so.
3. **`site/package.json`** — `1.1.2` → `1.1.3`. The previous run found
   `mise run site:version` refuses a dirty tree (`pnpm version` aborts with
   `ERR_PNPM_UNCLEAN_WORKING_TREE`) and that `patch` is its no-arg default, not
   a flag; a direct edit of the one field is equivalent and is the expected
   path. Report which you did.
4. Run `mise run plugins:marketplace` and `mise run plugins:inventory`; stage
   nothing (the orchestrator commits). The inventory should already be current
   for the pack, bundle and category (the orchestrator regenerated it at the
   wave-1 commit); after the bump it changes only if a pack version moved —
   report what actually moved.

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
- `git diff --stat` shows exactly `plugins/stackgen/.claude-plugin/plugin.json`,
  `site/package.json`, `.claude-plugin/marketplace.json` and (only if a version
  moved in it) `plugins/stackgen/stacks/inventory.md`.
- **`target-verifier`** is dispatched by the orchestrator after this unit
  reports, not by this unit: a hermetic `CLAUDE_CONFIG_DIR=/tmp/…` install of
  the working tree's dev marketplace shows `stackgen@1.1.0` and `vwf@19.12.0`,
  the installed stackgen tree contains
  `stacks/cloud-service/workers-static-assets/config/wrangler.jsonc` and
  `stacks/bundles/cloudflare-workers-static.md`, and uninstall leaves only
  Claude's own version-keyed cache. Never the real config dir.

## Guardrails

- Do not run `plugins:release`, `i:release` or `site:release`.
- Do not edit any doc, pack, asset or skill — a failing gate is a finding routed
  back to the owning unit, not fixed here.
- Write with Write/Edit; `cat` is `bat`.

## Commit

`ops: bump stackgen to 1.1.0, site to 1.1.3` — written by the orchestrator after
the wave gate, not by the unit.
