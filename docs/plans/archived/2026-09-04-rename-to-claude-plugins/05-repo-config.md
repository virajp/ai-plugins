# U5 — Repo config: mise tasks, the release workflow, commit-URL config

- **Wave:** 1
- **Depends on:** —
- **Owns:** `.config/mise/tasks/i/publish`, `.config/mise/tasks/i/release`,
  `.config/mise/tasks/i/test`, `.config/mise/tasks/setup/ai`,
  `.config/mise.dev.toml`, `.config/claude-status.json`,
  `.config/git-conventional-commits.yaml`, `.github/workflows/release.yml`,
  `mempalace.yaml`
- **Model:** inherit
- **Read first:** every owned file, top to bottom, before editing.
- **Lazy-load:** `.claude/docs/ci-and-releases.md` (why `release.yml`'s trigger
  surface must stay untouched — orientation only, do not edit)

## Ruling

Quoted from index.md:

> 1 — Command name (reversal): The bin key becomes `claude-plugins`.

> 9 — Internal names: … `--name 'claude-plugins'` in `mise.dev.toml`, …
> `projectName: virajp/claude-plugins`.

> 14 — On-disk names: Receipts dir, payload path, mempalace state dir and wing
> all stay.

> 2 — Marketplace name: `virajp-plugins` stays.

New identities: npm package `@virajp.dev/claude-plugins`, command
`claude-plugins`, GitHub repo `virajp/claude-plugins`.

## Edits

1. **`.config/mise/tasks/i/publish`** — the dry-run and publish banners (lines
   ~29, ~35, ~37) name `@virajp.dev/claude-plugins@${VERSION}`.
2. **`.config/mise/tasks/i/release`** — the success banner (line ~120) names
   `@virajp.dev/claude-plugins@${VERSION}`. The tag family `installer-v*` stays.
3. **`.config/mise/tasks/i/test`** — the asserted dry-run string (line ~80)
   becomes `claude plugin marketplace add virajp/claude-plugins`; the second
   (`claude plugin install vwf@virajp-plugins --scope user`) stays. The
   legacy-receipt seed path `$E2E_HOME/.config/ai-plugins/receipts` (line ~106)
   **stays** — it is the on-disk name. If the E2E invokes the CLI by its bin
   name anywhere (grep for `ai-plugins`), switch that to `claude-plugins`;
   invocations via `node bin/installer.mjs` are unchanged.
4. **`.config/mise/tasks/setup/ai`** — the `pnpx @askviraj/ai-plugins …` line
   (~12) becomes `pnpx @virajp.dev/claude-plugins …` with the same flags.
5. **`.config/mise.dev.toml`** — the three `--name 'ai-plugins'` labels (lines
   ~31-33) become `--name 'claude-plugins'`.
6. **`.config/claude-status.json`** — `projectName` becomes
   `virajp/claude-plugins`. Leave the `$schema` URL (a different repo).
7. **`.config/git-conventional-commits.yaml`** — `commitUrl`, `commitRangeUrl`,
   `issueUrl` (lines ~27, ~28, ~32) point at
   `https://github.com/virajp/claude-plugins/…`.
8. **`.github/workflows/release.yml`** — the header comment (line ~3), the
   release banner (~74), and the two idempotence lines (~115-116) name
   `@virajp.dev/claude-plugins`. **Nothing else in this file changes**: not
   `on:`, not `permissions:`, not the tag glob, not the job structure — the
   Trusted Publisher validates this file's name and the trigger surface is
   load-bearing.
9. **`mempalace.yaml`** — the prose `description` at line ~86 names
   `@virajp.dev/claude-plugins`. **`wing: ai-plugins` at line ~28 stays** — it
   is the memory-store partition key.

## Verification

- `bash -n` on each edited task script — parses.
- `mise run i:build && mise run i:test` — green once U1 has landed in the same
  wave (the orchestrator runs the gate after the wave; if you run it before U1's
  edits exist, the assertion at ~80 fails, which is expected — say so in the
  return block rather than reverting).
- `grep -n "ai-plugins\|askviraj" <each owned file>` returns only
  `mempalace.yaml:28` and the receipts-seed line in `i/test`.
- `git diff --stat .github/workflows/release.yml` shows only the four
  comment/string lines changed.

## Guardrails

- Do not touch `installer/**`, root `package.json`, or any doc.
- Do not touch `.config/mise/tasks/plugins/**` — they name the marketplace,
  which does not change.
- Do not touch `deps-update.yml` or `plugins.yml` — no old name in either.
- Do not touch `.config/mise/tasks/i/version` — the one-off `1.0.0` is U7's
  direct `pnpm version` call, by ruling 7.
- The npm-normalize hook rewrites `npm` after a pipe in Bash tool input — edit
  these files with the Edit tool, not `sed`.

## Commit

`chore(config): name the new package and repo in the mise tasks, release workflow and commit URLs`
— written by the orchestrator after the wave gate, not by the unit.
