# U2 — Marketplace generator repo URL and vwf's repository field

- **Wave:** 1
- **Depends on:** —
- **Owns:** `scripts/src/marketplace.ts`, `scripts/src/marketplace.test.ts`,
  `scripts/package.json`, `plugins/vwf/.claude-plugin/plugin.json` (**only** the
  `repository` field)
- **Model:** inherit
- **Read first:** every owned file, top to bottom, before editing.
- **Lazy-load:** `.claude/docs/plugins.md` (the manifest shape, orientation only
  — do not edit it)

## Ruling

Quoted from index.md:

> 2 — Marketplace name: `virajp-plugins` stays. Rejected: rename it too; every
> existing install would need re-adding.

> 9 — Internal names: `@claude-plugins/installer`, `@claude-plugins/scripts`, …

> 11 — Generated manifest after wave 1: The orchestrator runs
> `mise run plugins:marketplace` after wave 1 and before its gate, because U2
> changes the generator's inputs. Rejected: deferring regeneration to U7, which
> would fail the wave-1 gate.

The new GitHub repo is `virajp/claude-plugins`.

## Edits

1. **`scripts/src/marketplace.ts`** — `REPO_URL` (line ~191) becomes
   `"https://github.com/virajp/claude-plugins.git"`. `HEADER.name` (line ~155)
   stays `"virajp-plugins"`. The `MANIFESTS` doc comment (line ~115) names the
   marketplace, not the repo — leave it.
2. **`scripts/src/marketplace.test.ts`** — the `source.url` assertion (line ~81)
   and the vwf `repository` assertion (line ~143) name the new URLs
   (`…/claude-plugins.git` and `https://github.com/virajp/claude-plugins`
   respectively). The `virajp-plugins` assertions (~49, ~145, ~175) stay.
3. **`scripts/package.json`** — `name` becomes `@claude-plugins/scripts`.
   Nothing references the old name.
4. **`plugins/vwf/.claude-plugin/plugin.json`** — `repository` (line ~9) becomes
   `https://github.com/virajp/claude-plugins`. **Do not touch `version`** or
   `dependencies[].marketplace`.

## Verification

- `pnpm exec tsc --noEmit -p scripts` — clean.
- `pnpm vitest run` — every scripts test green **except** the one at
  `marketplace.test.ts` line ~41, which compares `buildManifest()` against the
  committed `.claude-plugin/marketplace.json` and is expected to fail until the
  orchestrator regenerates after this wave (decision 11). Name that single
  expected failure in the return block; any other failure is yours.
- `mise run plugins:check` — green (no rule names the repo URL).
- `grep -rn "ai-plugins" scripts/src scripts/package.json plugins/vwf/.claude-plugin`
  returns only the tmpdir prefix in `check.test.ts` (~54), if that.

## Guardrails

- Do not run `mise run plugins:marketplace` — units never run generators; the
  orchestrator does it after the wave.
- Do not edit `.claude-plugin/marketplace.json` or anything under
  `.dev-marketplace/` by hand.
- Do not touch `scripts/src/check.ts` — the marketplace name it asserts does not
  change.
- `plugins/**` is **not** dprint-formatted; keep `plugin.json`'s existing
  indentation and key order exactly.
- Do not touch any doc; report falsified passages (`.claude/docs/plugins.md:76`
  carries the old URL in its worked example) as `DOCS FALSIFIED:`.

## Commit

`feat(scripts): point the marketplace manifest at virajp/claude-plugins` —
written by the orchestrator after the wave gate, not by the unit.
