# U6 — This repo's gates: rule 11 widens, fragments parse, shellcheck runs

- **Wave:** 1 — **committed first** in the wave (its pre-commit config must be
  staged before any other unit's commit can run).
- **Depends on:** —
- **Owns:** `scripts/src/check.ts`, `scripts/src/check.test.ts`,
  `.config/mise/tasks/plugins/shellcheck` (new), `.config/mise.dev.toml`,
  `.config/pre-commit-config.yaml`, `.github/workflows/plugins.yml`. Touch
  nothing outside this list.
- **Model:** inherit
- **Read first:** `scripts/src/check.ts` `:250-310` (`PACK_MISE_TASKS`,
  `checkPackTaskModes`, `filesUnder`) and the rule registration in `check()` at
  `:76`; the matching describe block in `check.test.ts`;
  `.config/mise/tasks/plugins/check` (shape of a plugins task);
  `.config/pre-commit-config.yaml` `:40-60`; `.github/workflows/plugins.yml`
  `:50-60`; `.claude/skills/plugin-authoring/references/checks.md` `:8-20` and
  `:79`.
- **Lazy-load:** `.config/mise/tasks/_scripts/_helpers` (this repo's helper, for
  the task's print calls — this repo is **not** reshaped this plan).

## Ruling

D23: "`plugins:shellcheck` task in plugins.yml and pre-commit: shellcheck (with
`-x`) over `plugins/**/config/.config/mise/tasks/**` and every `_scripts/*`
without an extension; shfmt `-d` too. Tools added to this repo's
`mise.dev.toml`."

D37 (the checker's allowlist): "Files allowed at the repo root by the hygiene
doctrine and the checker allowlist: `.gitignore`, `.editorconfig`,
`.gitattributes`, `LICENSE`, `SECURITY.md`, `readme.md`, `CLAUDE.md`,
`fnox.toml`, `eslint.config.mjs` (the linter's shim), language-mandated
manifests and lockfiles. Everything else lives under `.config/`."

Index wave-gate lines: "Every
`plugins/stackgen/stacks/*/*/config/.config/
pre-commit.d/*.yaml` parses as YAML
with a top-level `repos:` list"; every task file "starts with
`#!/usr/bin/env bash`".

New dependencies: shellcheck, shfmt, actionlint as mise tools.

## Edits

1. **`scripts/src/check.ts`** — widen rule 11 (`checkPackTaskModes`) into a
   `checkPackConfigTier` (keep the exported name stable if tests import it, or
   update the tests): for every `stacks/*/*/config/` tree, (a) task files
   executable (as today) **and** their first line is `#!/usr/bin/env bash`,
   `#!/usr/bin/env node` or `#!/usr/bin/env python3`; (b) every file at
   `config/` top level is in the allowlist
   `{.gitignore, .editorconfig,
   .gitattributes, LICENSE, SECURITY.md, readme.md, fnox.toml,
   eslint.config.mjs}`
   or is a directory named `.config` or `_*`; (c) every
   `config/.config/pre-commit.d/*.yaml` parses (the strict YAML parser rule 4
   already imports) and has a top-level `repos` array; (d) every
   `config/.config/mise/conf.d/*.toml` parses as TOML (use the TOML parser
   already in `scripts/` deps if one exists; otherwise a `DECIDED:` to skip (d)
   with the reason — do not add a dependency). Findings keep the existing
   `{scope, message}` shape and rule numbering in `checks.md` (U9 documents the
   widened rule; you report the passage as `DOCS FALSIFIED:`).
2. **`scripts/src/check.test.ts`** — fixtures for each of (a)–(d): a pass and a
   fail per assertion, using the existing temp-plugin fixture helper.
3. **`.config/mise/tasks/plugins/shellcheck`** — bash,
   `#MISE description=
   "shellcheck and shfmt over every pack task file and helper"`,
   sources this repo's `_helpers`; collects
   `plugins/*/stacks/*/*/config/.config/mise/tasks/**` regular files without a
   `.mjs`/`.py`/`.env` extension; runs `shellcheck -x -s bash` and
   `shfmt -d
   -i 2 -ci`; exits non-zero on any finding; prints counts.
4. **`.config/mise.dev.toml`** — `[tools]` gains `shellcheck`, `shfmt`,
   `actionlint`, each `{ version = "latest" }`, under a `# Shell gates` comment.
   (`actionlint` is added now so the pre-commit hook in edit 5 can run; leave
   the hook's `files:` scoped to `.github/workflows/`.)
5. **`.config/pre-commit-config.yaml`** — a local hook `plugins-shellcheck`
   (`entry: mise x -- mise run plugins:shellcheck`, `pass_filenames: false`,
   `files: ^plugins/.*/config/`) after `plugins:check`; and an `actionlint`
   local hook (`mise x -- actionlint`, `files: ^\.github/workflows/`).
6. **`.github/workflows/plugins.yml`** — a step `mise run plugins:shellcheck`
   after `plugins:check` (`:59`); the tools resolve from `mise.dev.toml` only if
   the job sets `MISE_ENV=dev` — check what the job sets today and, if it is
   `ci`, add the three tools to the step via
   `mise x shellcheck@latest
   shfmt@latest -- mise run plugins:shellcheck`
   instead of touching `mise.ci.toml` (not yours).

## Verification

- `pnpm vitest run` green, including the new cases;
  `pnpm exec tsc --noEmit -p
  scripts` clean.
- `mise run plugins:check` green against the tree as it stands at your commit
  (wave 1 peers may not have landed; the rule must pass on today's packs — the
  mise pack's existing task files already start with the bash shebang; confirm
  and report any that do not as a finding the orchestrator routes to U1).
- `mise run plugins:shellcheck` runs and exits 0 on today's packs, or exits
  non-zero with findings the orchestrator routes to U1/U4 — report which.
- `pre-commit validate-config -c .config/pre-commit-config.yaml` passes;
  `actionlint .github/workflows/plugins.yml` passes.

## Guardrails

- Do not reshape this repo: no `_helpers` rename, no task renames, no new
  `.config/` files beyond the one task. That is plan 2.
- `.config/pre-commit-config.yaml` and the workflow are YAML formatted by
  dprint; run `pnpm exec dprint fmt --config dprint.json <file>` (this repo's
  dprint config is still at the root until plan 2).
- `scripts/src/**` is TypeScript under the repo linter; run
  `pnpm exec dprint
  fmt` on the two files.
- Write with Write/Edit; `cat` is `bat`.
- No new npm dependency; the YAML parser rule 4 already imports is the one to
  reuse.

## Commit

`ops: widen the pack config-tier check, gate pre-commit fragments, add plugins:shellcheck`
— written by the orchestrator after the wave gate, not by the unit.
