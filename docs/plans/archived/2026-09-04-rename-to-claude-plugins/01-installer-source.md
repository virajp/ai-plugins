# U1 — Installer source: new package name, command, repo path

- **Wave:** 1
- **Depends on:** —
- **Owns:** `installer/src/**` (source and tests), `installer/package.json`,
  root `package.json` (**only** the `name`, `description`, `repository` and
  `bin` fields), `tsup.config.ts`
- **Model:** inherit
- **Read first:** every owned file, top to bottom, before editing.
- **Lazy-load:** `.claude/docs/installer/packaging.md` (the package-root walk
  and the `--version` contract, for orientation only — do not edit it)

## Ruling

Quoted from index.md:

> 1 — Command name (reversal): The bin key becomes `claude-plugins`. Rejected:
> keep `ai-plugins` under the new package.

> 9 — Internal names: `@claude-plugins/installer`, `@claude-plugins/scripts`,
> `--name 'claude-plugins'` in `mise.dev.toml`, `CLAUDE_PLUGINS_SOURCE_DIR`,
> `projectName: virajp/claude-plugins`.

> 10 — Root `package.json` ownership: U1 edits `name`, `description`,
> `repository`, `bin`; U7 edits `version` only.

> 14 — On-disk names: Receipts dir, payload path, mempalace state dir and wing
> all stay.

> The marketplace name `virajp-plugins` stays. (decision 2)

The new identities: npm package `@virajp.dev/claude-plugins`, command
`claude-plugins`, GitHub repo `virajp/claude-plugins`.

## Edits

1. **`installer/src/context.ts`** — `PACKAGE_NAME` (line ~162) becomes
   `"@virajp.dev/claude-plugins"`. `MARKETPLACE_NAME` stays `"virajp-plugins"`.
2. **`installer/src/install.ts`** — `MARKETPLACE_SOURCE` (line ~44) becomes
   `"virajp/claude-plugins"`.
3. **`installer/src/version.ts`** — `NPM_LATEST_URL` (line ~32) becomes
   `https://registry.npmjs.org/@virajp.dev/claude-plugins/latest`;
   `REMOTE_MARKETPLACE_URL` (line ~34) becomes
   `https://raw.githubusercontent.com/virajp/claude-plugins/main/.claude-plugin/marketplace.json`;
   the `--version` output literal (line ~198) names
   `@virajp.dev/claude-plugins`. Keep the column alignment the surrounding lines
   use.
4. **`installer/src/report.ts`** — the run-report header literal (line ~143)
   names `@virajp.dev/claude-plugins`.
5. **`installer/src/args.ts`** — the usage line (line ~160) reads
   `claude-plugins [options]`; the usage text (line ~169) reads
   `claude plugin marketplace add virajp/claude-plugins`. Any other `ai-plugins`
   in the help text follows suit.
6. **`installer/src/index.ts`** — the doc comment (line ~13) names
   `virajp/claude-plugins`; the env var read (line ~323) becomes
   `process.env["CLAUDE_PLUGINS_SOURCE_DIR"]` and its doc comment follows. **Do
   not change** `receiptDir()` (line ~368) — `ai-plugins/receipts` is an on-disk
   name. Leave the `brew install virajp/tap/claude-status` line (line ~123)
   alone.
7. **`installer/src/uninstall.ts`** — no edit. The
   `basename(parent) ===
   "ai-plugins"` rule (line ~503) and the
   `~/.local/share/virajp/` comment are on-disk contracts.
8. **Tests** — update every assertion that names the old package, command or
   repo path: `args.test.ts` (~133), `report.test.ts` (~89), `version.test.ts`
   (~151-153), `install.test.ts` (~154, ~226, ~261), `github.test.ts` (~76, the
   fixture URL — update for consistency). `uninstall.test.ts` assertions on
   `ai-plugins/` and `share/virajp/ai-plugins/` stay. Temp-dir prefixes may
   stay.
9. **`installer/package.json`** — `name` becomes `@claude-plugins/installer`;
   the description names `@virajp.dev/claude-plugins`.
10. **Root `package.json`** — `name` → `@virajp.dev/claude-plugins`;
    `description` names the new package (the marketplace `virajp-plugins`
    mention stays true); `repository` → `github:virajp/claude-plugins`; `bin` →
    `{ "claude-plugins": "./bin/installer.mjs" }`. **Do not touch `version`.**
11. **`tsup.config.ts`** — rewrite the comment (lines ~25-29) that says the bin
    key stays `ai-plugins` and is what the Trusted Publisher is bound to. State
    instead: the artifact is `bin/installer.mjs`, the command is
    `claude-plugins`, and npm's Trusted Publisher binds to the package name, not
    the bin key. Drop the stale `@ai-plugins/schema` mention at line ~10 only if
    it sits inside the same comment block you are already editing; otherwise
    leave it.

## Verification

- `pnpm vitest run` — the installer suite green.
- `pnpm exec tsc --noEmit -p installer` — clean.
- `mise run i:build` — emits `bin/installer.mjs`; the `--help` smoke prints
  `claude-plugins [options]`; `pnpm pack --dry-run` names the bin
  `claude-plugins`.
- `grep -rn "ai-plugins\|askviraj" installer/src` returns only the on-disk names
  in `index.ts` (`receiptDir`), `uninstall.ts`, and `uninstall.test.ts`.
- `grep -rn "AI_PLUGINS_SOURCE_DIR" installer/` returns nothing.
- Report in the return block the two exact strings the `--user vwf --dry-run`
  output now contains (`claude plugin marketplace add virajp/claude-plugins` and
  `claude plugin install vwf@virajp-plugins --scope user`) so the orchestrator
  can confirm U5's E2E assertion matches.

## Guardrails

- Do not touch `.config/mise/tasks/i/test` — U5 owns the E2E assertion.
- Do not touch any doc, including `installer/CLAUDE.md` — report falsified
  passages as `DOCS FALSIFIED:`.
- Do not run `pnpm version`, and do not edit the `version` field.
- Do not rename `receiptDir()`'s path segment or any `share/virajp/ai-plugins`
  string — decision 14.
- `installer/**` is dprint-formatted; let the pre-commit hook or
  `pnpm exec dprint fmt` handle padding, do not hand-align.

## Commit

`feat(installer): publish as @virajp.dev/claude-plugins with command claude-plugins`
— written by the orchestrator after the wave gate, not by the unit.
