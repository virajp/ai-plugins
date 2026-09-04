# U7 — Gates and bump: installer 1.0.0, stackgen minor, generators, real install

- **Wave:** 3
- **Depends on:** U6
- **Owns:** root `package.json` (**only** the `version` field),
  `plugins/stackgen/.claude-plugin/plugin.json` (`version` only),
  `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`
- **Model:** inherit
- **Read first:** the consent block in index.md, then each owned file.
- **Lazy-load:** `.claude/skills/release/SKILL.md` (the release ritual; do not
  run it)

## Ruling

Quoted from index.md:

> Release `vwf`: none. Release `stackgen`: minor. Release installer: yes —
> `1.0.0`, the first release under the new name.

> 7 — New package version: `1.0.0`, a fresh start; the bump unit runs
> `pnpm version 1.0.0 --no-git-tag-version` directly. Rejected: `7.0.0`
> continuing the line; extending `i:version` with a set flag.

> 10 — Root `package.json` ownership: U1 edits `name`, `description`,
> `repository`, `bin`; U7 edits `version` only.

## Edits

1. **Root `package.json`** — `pnpm version 1.0.0 --no-git-tag-version` at the
   repo root. Confirm the diff touches the `version` field only.
2. **`plugins/stackgen/.claude-plugin/plugin.json`** — bump `version` by one
   minor (plain `X.Y.Z`, no build metadata), by hand, preserving indentation.
3. **`plugins/vwf/.claude-plugin/plugin.json`** — **not bumped** (consent:
   none).
4. **Generators** — `mise run plugins:marketplace` and
   `mise run plugins:inventory`; stage the regenerated
   `.claude-plugin/marketplace.json` and `inventory.md`. The manifest's stackgen
   entry must now carry the new tag ref and every `source.url` the new repo URL.

## Verification

Run the full wave gate and report each line's result:

- `mise run plugins:check`
- `mise run plugins:marketplace --check` (the dev manifest is regenerated on
  this machine, so it must read fresh, not stale)
- `mise run plugins:inventory --check`
- `pnpm vitest run` (all suites, including the manifest byte-compare at
  `scripts/src/marketplace.test.ts` ~41)
- `pnpm exec tsc --noEmit -p installer` and `-p scripts`
- `mise run plugins:npm-normalize-test`
- `mise run i:build` — `--help` shows `claude-plugins [options]`;
  `pnpm pack --dry-run` reports `@virajp.dev/claude-plugins@1.0.0` and bin
  `claude-plugins`
- `mise run i:test`
- `node bin/installer.mjs --version` names `@virajp.dev/claude-plugins 1.0.0`
  (the npm-latest lookup will 404 until the first publish — that is expected;
  confirm the report says so rather than crashing)
- Dispatch **`target-verifier`** with: "The repo moved to
  `virajp/claude-plugins`, the installer is `@virajp.dev/claude-plugins` with
  bin `claude-plugins`, marketplace name unchanged. Prove hermetically that
  `claude plugin marketplace add virajp/claude-plugins` registers
  `virajp-plugins`, that `claude plugin install vwf@virajp-plugins` lands, and
  that `node bin/installer.mjs --user vwf --dry-run` names those two commands;
  then that the uninstall path leaves nothing behind." Pass condition: both land
  and the uninstall is clean. Its report is the run's final gate.

## Guardrails

- Do not run `mise run i:release`, `mise run plugins:release`, `npm publish`, or
  `npm deprecate` — the user runs those per the post-landing sequence.
- Do not run `mise run i:version` — from `6.0.2` no bump level yields `1.0.0`;
  the explicit `pnpm version 1.0.0` is the ruling.
- Do not edit any other field of either `package.json`/`plugin.json`.
- `target-verifier` must use a scratch `CLAUDE_CONFIG_DIR` — residue in the real
  plugin cache has produced phantom results before.
- Do not touch docs; if the release notes format needs a line for the sunset
  step, report it as `DOCS FALSIFIED:` for the orchestrator.

## Commit

`chore(release): installer 1.0.0 as @virajp.dev/claude-plugins, stackgen minor`
— written by the orchestrator after the wave gate, not by the unit.
