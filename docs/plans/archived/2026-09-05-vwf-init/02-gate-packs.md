# U2 — The four gate packs ship their config files

- **Wave:** 1
- **Depends on:** —
- **Owns:**
  `plugins/stackgen/stacks/toolchain-gate/{dprint,pre-commit,gitleaks,grype}/**`
  — each pack's `pack.yaml`, `conventions.md`, `skills/<name>/**`, and a new
  `config/` tree. Touch nothing outside this list; `ruff/` and `eslint/` are
  U4's.
- **Model:** inherit
- **Read first:** the four packs top to bottom;
  `plugins/stackgen/assets/kinds.md` §`repo-gate` (line ~261);
  `plugins/stackgen/assets/output-tree.md` §"The fourth target" (line ~101), so
  the tree lands where the materializer expects.
- **Lazy-load:** the maintainer's specimens, read-only —
  `~/Projects/github.com/virajp/claude-status/.config/{pre-commit-config.yaml,
  gitleaks.toml,grype.yaml,git-conventional-commits.yaml}`,
  `~/Projects/github.com/95octane/95octane/{dprint.json,.config/taplo.toml}`,
  `~/Projects/github.com/95octane/95octane/.config/pre-commit-config.yaml`. Copy
  shapes and why-comments, never repo names, URLs or custom rules bound to the
  maintainer's services.

## Ruling

D1 (reversal 1): "The charter fence opens for gate config files … the dprint,
pre-commit, gitleaks, grype, doppler and fnox packs ship `config/` trees.
`package.json` and CI workflows stay fenced."

D3: "shellcheck + shfmt hooks (actionlint only when `.github/workflows`
exists)".

D14: `code:precommit` runs before staging; pre-commit is the gate the tasks
call.

D17: "`.config/dprint.json`, --config everywhere: the pre-commit hook and
`code:format` pass `--config .config/dprint.json`; init writes the editor
pointer, whose exact setting name U2 verifies against the extension docs.
Submodules get their own copy, not a symlink."

D19: the ten commit types, quoted in full in index.md, "Each type carries a
comment; scopes carry the sub-project; `changelog:` block with headlines,
`commitIgnoreRegexPattern: '^[wW][iI][pP]\b'`, `featureCommitTypes: [feat]`."

D20: "the pre-commit pack ships the base config; pnpm, uv/ruff, flutter and
eslint packs ship one fragment each; init concatenates every fragment present
into `.config/pre-commit-config.yaml` between marker comments, re-runnable."

D33: the marker format `# >>> pre-commit.d/<name>.yaml` … `# <<< …`.

Index facts: pre-commit-hooks v6.0.0 ids; gitleaks `gitleaks-system` id;
`[extend] useDefault = true`; grype `fail-on-severity` + `ignore:`; grype ships
no pre-commit hook; `install -c` bakes the path in; git-conventional-commits'
schema uses `featureCommitTypes`.

## Edits

1. **`pre-commit/config/.config/pre-commit-config.yaml`** — the base:
   `minimum_pre_commit_version`,
   `default_install_hook_types: [pre-commit,
   commit-msg]`,
   `default_stages: [pre-commit]`, global `exclude:
   ^graphify-out/` with the
   why-comment. Hooks, each with `name:` and a one-line `description:` of the
   failure it exists for:
   - `repo: meta` → `check-hooks-apply`, `check-useless-excludes`.
   - `pre-commit/pre-commit-hooks` `rev: v6.0.0` → `check-added-large-files`
     (`--maxkb=1024`), `check-case-conflict`, `check-illegal-windows-names`,
     `check-executables-have-shebangs`, `check-shebang-scripts-are-executable`,
     `check-merge-conflict`, `check-symlinks`, `destroyed-symlinks`,
     `check-json`, `check-toml`, `check-yaml`, `detect-private-key`,
     `end-of-file-fixer`, `trailing-whitespace`,
     `mixed-line-ending
     --fix=lf`, `no-commit-to-branch --branch main`.
   - `repo: local`, `language: system`, each `entry: mise x -- …`: `git-config`
     (`mise run code:git-config --fix`, `always_run`), `formatter`
     (`dprint fmt
     --config .config/dprint.json --allow-no-files --log-level warn`),
     `shellcheck` (`shellcheck -x`, `types: [shell]`, plus `files:` matching
     extension-less task files under `.config/mise/tasks/`), `shfmt`
     (`shfmt
     -d -i 2 -ci`), `actionlint` (`files: ^\.github/workflows/`;
     harmless when none exist).
   - `gitleaks/gitleaks` `rev: v8.30.0` → `gitleaks-system`,
     `args:
     [--config, .config/gitleaks.toml]`.
   - `qoomon/git-conventional-commits` `rev: v2.9.0` → `conventional-commits`,
     `args: [--config, .config/git-conventional-commits.yaml]`,
     `stages:
     [commit-msg]`.
   - End the `repos:` list with a comment block: "fragments from
     `.config/pre-commit.d/*.yaml` are merged below this line by `/vwf:init`
     between `# >>>` / `# <<<` markers; do not hand-edit between markers." Also
     add **`pre-commit/config/.config/git-conventional-commits.yaml`**: the ten
     types (D19) each with a comment stating when to use it,
     `commitScopes:
   []` with a comment "one scope per sub-project; init fills
     from the registry", `featureCommitTypes: [feat]`,
     `releaseTagGlobPattern: '*'`, `changelog:` with
     `commitTypes: [feat, fix, perf, refactor, revert, merge]`,
     `includeInvalidCommits: false`, the wip ignore pattern, headlines for feat
     / fix / perf / refactor / revert / merge / breakingChange, and `commitUrl`
     / `commitRangeUrl` / `issueUrl` left as commented templates naming the
     placeholders init fills. (This file lives in the pre-commit pack because
     the commit-msg hook is what enforces it; say so in `conventions.md`.)
2. **`dprint/config/.config/dprint.json`** — plugins pinned by URL and version
   (markdown, json, toml via `exec` →
   `taplo fmt --config .config/taplo.toml
   -`, yaml, dockerfile, markup,
   typescript), `excludes` for `node_modules/`, `dist/`, `build/`, lockfiles,
   `graphify-out/`; plus **`dprint/config/.config/taplo.toml`** (align entries,
   reorder keys, column 80). In `dprint/conventions.md` and
   `skills/dprint/SKILL.md`: `--config
   .config/dprint.json` on every
   invocation, the editor pointer (verify the VS Code extension's setting name
   in its README and quote it), submodules carry a copy.
3. **`gitleaks/config/.config/gitleaks.toml`** — `title`,
   `[extend]
   useDefault = true` with the comment that a `--config` file
   *replaces* the built-ins otherwise, an empty `[[rules]]` example commented
   out, `[allowlist] paths` for `node_modules/`, `dist/`, `graphify-out/`.
   Conventions: `gitleaks dir` in `code:sec`, `gitleaks-system` in pre-commit,
   `--redact`, baseline procedure.
4. **`grype/config/.config/grype.yaml`** — `fail-on-severity: medium`,
   `ignore: []` with the written bar for what an ignore entry must claim
   (vulnerability, package, reason, expiry). Conventions: `grype dir:.` in
   `code:sec`, SBOM-first in CI as the recommended shape (not written).
5. **Each `pack.yaml`** — `version: 1.0.0`; summary mentions the shipped config
   file.
6. **Each `conventions.md`** — a section "What this pack writes" listing the
   `config/` files, and the sentence "the fence in `output-tree.md` was opened
   for gate config files on 2026-09-05; `package.json` and CI workflows remain
   outside it".

## Verification

- `mise run plugins:check` green.
- `python3 -c 'import yaml,sys; yaml.safe_load(open(sys.argv[1]))'` (or
  `pre-commit validate-config -c <file>` via `mise x pre-commit@latest --`) on
  the pre-commit config passes; `taplo check` on `gitleaks.toml` and
  `taplo.toml` passes; `dprint check --config …/dprint.json` accepts the config.
- `grep -c 'description:' pre-commit-config.yaml` equals the hook count.
- `grep -n 'useDefault' gitleaks.toml` finds `true`.
- No `virajp`, `95octane`, `revenuecat`, `grafana` strings in any shipped file.

## Guardrails

- Do not touch `ruff/` or `eslint/` (U4), `stacks/bundles/repo-gates.md` (U5),
  or the mise pack (U1). The mise pack's `code:format` and `code:sec` call the
  flags above; keep the flag spellings identical to U1's table in index.md.
- `plugins/**/*.md` is not dprint-formatted; match fold width by hand. The
  shipped `dprint.json` **is** JSON — keep it valid, 2-space, sorted keys.
- Write with Write/Edit; `cat` is `bat`; any `npm` after a pipe is rewritten to
  `pnpm` by a hook.
- Do not write an editor settings file into the pack; only document the pointer
  for init (U7) to write.

## Commit

`feat(stackgen): gate packs ship pre-commit, conventional-commits, dprint, gitleaks and grype config`
— written by the orchestrator after the wave gate, not by the unit.
