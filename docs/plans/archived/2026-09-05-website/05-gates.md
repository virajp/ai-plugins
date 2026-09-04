# U5 — Gates (no bump)

- **Wave:** 4
- **Depends on:** U4
- **Owns:** `.claude-plugin/marketplace.json`,
  `plugins/stackgen/stacks/inventory.md` (regenerated; both expected
  byte-identical). Touch nothing outside this list.
- **Model:** inherit
- **Read first:** `docs/plans/2026-09-05-website/index.md` Consent, Wave gate
  and Gates the orchestrator keeps.
- **Lazy-load:** nothing.

## Ruling

Consent: "Release `vwf` none, `stackgen` none, installer none, site 1.0.0 —
first release, standalone, cut by the user with `mise run site:release`." "This
plan tags nothing." Out of scope: "Plugin and installer changes. No file under
`plugins/` or `installer/src` changes; no version bumps; no `target-verifier`
run is needed."

## Edits

1. **No version bump.** `plugins/*/.claude-plugin/plugin.json` and the root
   `package.json` are untouched; `site/package.json` already reads `1.0.0` (U1).
   If `git diff develop -- plugins/ installer/src package.json` is not empty,
   return `UNRESOLVED:` naming the file.
2. Run `mise run plugins:marketplace` and `mise run plugins:inventory`; confirm
   `git status --short` shows no change to the two generated files.
3. Run the full wave gate and the plan's additions: `mise run plugins:check`,
   `mise run plugins:marketplace --check`, `mise run plugins:inventory --check`,
   `pnpm vitest run`, `pnpm exec tsc --noEmit -p installer`,
   `pnpm exec tsc --noEmit -p scripts`, `mise run plugins:npm-normalize-test`,
   `pnpm install --frozen-lockfile`, `mise run site:check`,
   `mise run code:format`,
   `pre-commit run --all-files -c .config/pre-commit-config.yaml`.
4. Report the numbers `site:check` prints: pages built, pages indexed, links
   checked, fragments checked.

## Verification

- Every line in step 3 exits 0.
- `git status --short` is empty after step 2.
- `test -f site/dist/index.html && test -f site/dist/plugins/vwf/index.html`.
- `git diff --stat develop -- .github/workflows/release.yml` is empty.

## Guardrails

- Do not run `plugins:release`, `i:release` or `site:release`.
- Do not bump any version.
- Do not run `target-verifier`: nothing under `plugins/` or `installer/`
  changed.

## Commit

None expected. If step 2 produced a diff, that is a finding, not a commit:
return it as `UNRESOLVED:`.
