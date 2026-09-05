# U6 — Gates and bump

- **Wave:** 4
- **Depends on:** U5
- **Owns:** `site/package.json` (the version field, through `site:version`),
  `plugins/*/.claude-plugin/plugin.json` (untouched by this plan), the generated
  files `.claude-plugin/marketplace.json` and
  `plugins/stackgen/stacks/inventory.md` (regenerated, expected byte-identical).
  Touch nothing outside this list.
- **Model:** inherit
- **Read first:** `index.md`'s Consent block, `.config/mise/tasks/site/version`,
  `site/package.json`, `.config/mise/tasks/code/format:27` (the
  `sort-package-json` run).
- **Lazy-load:** the run log so far, to know whether decision 9's fallback fired
  (it changes nothing here; it is context for the report).

## Ruling

Consent: "Release site: minor." "Release `vwf`: none. Release `stackgen`: none.
Release installer: none." "Releases are intent: execute-plan stops once before
the `main` merge and the tags and asks, per `CLAUDE.md`. `site:release` is asked
for separately."

From `CLAUDE.md`: "A tracked plugin version is always plain `X.Y.Z`." No plugin
changed, so no plugin version moves.

## Edits

1. **`site/package.json`** — `mise run site:version -- --minor` (read the task's
   argument convention at `.config/mise/tasks/site/version:1-26` and use exactly
   that form); the result is `1.1.0`. Run
   `pnpm exec sort-package-json site/package.json` afterwards so `code:format`
   finds nothing to reorder; confirm `git diff site/package.json` is the version
   line alone.
2. **Generators** — `mise run plugins:marketplace` and
   `mise run plugins:inventory`; both outputs must be byte-identical to the
   committed files
   (`git diff --stat -- .claude-plugin/marketplace.json
   plugins/stackgen/stacks/inventory.md`
   empty). A diff here is an `UNRESOLVED:`, since no plugin was meant to change.

## Verification

The full wave gate, every line green, in this order:

- `mise run plugins:marketplace --check`
- `mise run plugins:inventory --check`
- `mise run plugins:check`
- `mise run plugins:npm-normalize-test`
- `pnpm vitest run`
- `pnpm exec tsc --noEmit -p installer` and `pnpm exec tsc --noEmit -p scripts`
- `mise run site:check` (astro check, build, pagefind, the extended link
  checker)
- the plan's own checks from `index.md`'s Wave gate: the inline-script grep, the
  `<style>` grep, the W3C validator on the two pages, the mirror spot check, the
  headers pass-through list
- `mise x -- pre-commit run --all-files`
- `pnpm exec wrangler deploy --dry-run` from `site/`
- `git diff develop...HEAD --stat -- plugins/ installer/src package.json` is
  empty (no plugin or installer change, so no `target-verifier` run)
- `grep '"version"' site/package.json` shows `1.1.0`

## Guardrails

- Do not edit any doc; U5 has run. If a gate line fails because of a doc, return
  `UNRESOLVED:` naming it rather than fixing it here.
- Do not run `site:release`, `i:release` or `plugins:release`; do not tag.
- Do not commit; the orchestrator commits the bump as its own commit.
- `cat` is aliased to `bat` on this machine: use Read for any file you open.

## Commit

`ops: bump site to 1.1.0` — written by the orchestrator after the wave gate, not
by the unit.
