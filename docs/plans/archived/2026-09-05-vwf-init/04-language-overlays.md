# U4 — Language and package-manager overlays: new task names, dprint flag, hook fragments

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/stacks/package-manager/pnpm/config/**`,
  `plugins/stackgen/stacks/package-manager/uv/config/**`,
  `plugins/stackgen/stacks/toolchain-gate/ruff/config/**`,
  `plugins/stackgen/stacks/toolchain-gate/eslint/config/**` (new),
  `plugins/stackgen/stacks/app-framework/flutter/config/**`. Touch nothing
  outside this list — the packs' `conventions.md`, `pack.yaml` and skills are
  **not** yours (U2 owns four other gate packs; nobody edits ruff/eslint prose
  this plan; report a needed prose change as `DOCS FALSIFIED:`).
- **Model:** inherit
- **Read first:** every owned task file; index.md's U1 mandatory-set table (the
  flag spellings and slot names your overlays must match);
  `plugins/stackgen/stacks/toolchain-manager/mise/skills/mise/references/
  task-library.md`
  §slots and §`setup/deps/*` as they stand **before** U1's rewrite (U1 runs
  concurrently; the slot names are fixed by index.md, not by U1's output).
- **Lazy-load:**
  `~/Projects/github.com/95octane/95octane/.config/
  pre-commit-config.yaml`
  (the `package-json-sorter` and Dart hooks, as specimens),
  `~/Projects/github.com/virajp/linter/.config/pre-commit-config.
  yaml`.

## Ruling

D8: every task sources
`${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/
helpers` (no underscore on
the file).

D9: separators come from `print_header` / `print_subheader`; overlays call no
`line_sep`.

D10: bash, `set -euo pipefail`, shellcheck-clean.

D17: `code:format` passes `--config .config/dprint.json`.

D20: "pnpm, uv/ruff, flutter and eslint packs ship one fragment each"
(`.config/pre-commit.d/<pack>.yaml`).

D32 (legacy names): `setup:pnpm:*`, `setup:uv:*`, `setup:app:*` →
`setup:deps:*`.

Index U1 table: `setup:deps:{install,cleanup,upgrade,outdated,audit}`, `install`
honours `--frozen`; `code:lint [--fix]`; `code:format [--fix]`.

## Edits

1. **`pnpm/config/.config/mise/tasks/`** — `code/format`: dprint with
   `--config .config/dprint.json`, then `pnpm dlx sort-package-json` (`--check`
   unless `--fix`). `code/lint`: keep whatever it runs today (the repo linter is
   the **eslint** pack's, not this one's); only re-source `helpers` and
   re-header. `setup/deps/
   install` (`pnpm install`, `--frozen` →
   `--frozen-lockfile`), `cleanup` (`dist`, `node_modules` except `.pnpm`,
   `*.tsbuildinfo`, `.turbo`, then `pnpm store prune`), `upgrade` (new:
   `pnpm self-update`, `pnpm update
   --recursive --latest`), `outdated`,
   `audit`. Add **`.config/pre-commit.d/
   pnpm.yaml`**: a `repos:` list with
   one `local` hook `package-json-sorter`
   (`mise x -- pnpm dlx sort-package-json`, `files: (^|.*/)package\.json$`).
2. **`uv/config/.config/mise/tasks/`** —
   `setup/deps/{install,cleanup,upgrade,
   outdated}` re-headered and
   re-sourced; `install` honours `--frozen` → `uv sync --frozen`; add `audit`
   (`uv run pip-audit` or `uvx pip-audit`, documented as advisory).
   **`.config/pre-commit.d/uv.yaml`**: `uv lock
   --check` as a local hook on
   `pyproject.toml` changes.
3. **`ruff/config/.config/mise/tasks/`** — `code/{format,lint}` re-headered;
   `format` runs dprint `--config .config/dprint.json` then
   `uv run ruff
   format` (`--check` unless `--fix`).
   **`.config/pre-commit.d/ruff.yaml`**: `astral-sh/ruff-pre-commit` `ruff` +
   `ruff-format`.
4. **`eslint/config/.config/pre-commit.d/eslint.yaml`** (new tree) — the local
   `linter` hook (`mise x -- pnpm dlx @askviraj/linter --fix`,
   `pass_filenames:
   false`). No task files: `code/lint` for the linter
   already comes from the eslint pack's doctrine; if the pack has no task
   overlay today, add `config/.config/mise/tasks/code/lint` running that command
   with `--fix` / `--debug` passthrough, so the mise slot is filled when eslint
   is picked.
5. **`flutter/config/.config/mise/tasks/`** — `code/{format,lint}`,
   `setup/
   deps/{cleanup,install,outdated}` re-headered; `format` dprint
   `--config` then `dart format`; `install` honours `--frozen`
   (`flutter pub get
   --enforce-lockfile`).
   **`.config/pre-commit.d/flutter.yaml`**: `dart-
   analyze --fatal-infos`,
   `flutter-import-sorter`, `flutter-dependency-
   validator`, all
   `files: ^lib/.*\.dart$`, entries via `mise x --`.
6. Every fragment: a top comment "merged into `.config/pre-commit-config.yaml`
   by `/vwf:init`; edit here, re-run init", then `repos:`.

## Verification

- `mise run plugins:check` green (rule 11 exec bits; U6's fragment rule once
  landed).
- `shellcheck -x` clean over every owned task file.
- Every fragment parses as YAML with a top-level `repos:` list.
- `grep -rn 'line_sep\|_helpers' <owned>` returns nothing;
  `grep -rn -- '--config .config/dprint.json' <owned>/code/format` finds every
  format overlay.

## Guardrails

- Do not edit any `conventions.md`, `pack.yaml` or `skills/` file — report
  falsified prose instead.
- Do not touch the mise pack (U1) or the dprint/pre-commit/gitleaks/grype packs
  (U2).
- Write with Write/Edit; `cat` is `bat`; a line with `npm` after a pipe is
  rewritten to `pnpm` — write those lines with the Write tool.
- No maintainer repo names.

## Commit

`feat(stackgen): language overlays follow the setup:deps contract and ship pre-commit fragments`
— written by the orchestrator after the wave gate, not by the unit.
