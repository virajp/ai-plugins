# U1 — The mise pack: five config files, the helper library, the task contract

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/stacks/toolchain-manager/mise/**` — `pack.yaml`,
  `conventions.md`, `skills/mise/SKILL.md`, `skills/mise/references/*.md`, and
  everything under `config/`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** every owned file top to bottom, then
  `plugins/stackgen/assets/kinds.md` §`toolchain-manager` (line ~335) and
  `plugins/stackgen/assets/output-tree.md` §"The fourth target" (line ~101).
- **Lazy-load:** the maintainer's specimens, read-only, for shape and comment
  style —
  `~/Projects/github.com/virajp/claude-status/.config/mise/tasks/
  _scripts/{_helpers,_checks,_merge}`,
  `~/Projects/github.com/95octane/
  95octane/.config/mise/tasks/{setup/all,worktree/init,code/worktrees,
  code/precommit}`,
  `~/Projects/github.com/95octane/95octane/backend/.config/
  mise/tasks/_scripts/_helpers.mjs`,
  `~/Projects/github.com/95octane/
  95octane/backend/.config/mise.test.toml`,
  `~/Projects/github.com/virajp/
  virajp.dev/.config/mise.{toml,dev.toml,ci.toml}`,
  `~/Projects/github.com/virajp/macos-setup/.config/mise/tasks/_scripts/
  _helpers`.
  Copy shapes and *why*-comments, never paths or repo names.

## Ruling

D5 (reversal 4 and 5): "`worktree:init` becomes `setup:worktree`"; "the mise
pack's three-file split becomes five".

D8: "`_scripts/helpers`, one file + optional siblings: every task sources
`${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/helpers`; repo-specific
libraries sit beside it (`_scripts/checks`, `_scripts/merge`,
`_scripts/<name>.env`). No second underscore."

D9: "Baked into print_header / print_subheader: `print_header` emits a
full-width `=` line then the title; `print_subheader` a `-` line then the title.
Single-step tasks call neither. `line_sep <char>` stays public for the rare
direct use."

D10: "Bash (`#!/usr/bin/env bash`, `set -euo pipefail`, shellcheck-clean) for
every shipped task … `_scripts/helpers.mjs` mirrors the bash print API; no
`helpers.py`."

D11: "`[shell_alias]` in mise.dev.toml: `setup = "mise run setup:all"`,
`precommit = "mise run code:precommit"`,
`worktrees = "mise run
code:worktrees"`, plus one
`setup-<project-id> = "mise run setup:all
--<project-id>"` per member. CI never
loads them."

D12, D13: `p:<project-id>:*` naming; "`--all` plus `--<project-id>` per member:
flags are generated from registry ids or submodule names … Without members,
`setup:all` takes no flags."

D14: "`code:precommit` runs pre-commit over the working tree's changed files
(staged + unstaged, `--diff-filter=d`) **before** staging … The merge tasks'
pre-check runs `pre-commit run --all-files` as a safety net and **fails** if it
changed anything."

D15: the merge pre-check list, quoted in full in index.md.

D17: `code:format` passes `--config .config/dprint.json`.

D22: "`code:ai` registers the marketplace and runs the installer CLI for `vwf`
(which pulls `stackgen`) at user or repo scope, then `claude plugin
autoremove`;
a stack pack may overlay it."

D27: secrets packs ship `.config/mise/conf.d/<provider>.toml`; `mise.toml` stays
provider-free.

D28: "init creates `p/<id>/_default` as a `#PLACEHOLDER` slot …
`task-
library.md` carries one worked example (`p/site/{dev,build}`)."

D31: "`mise.test.toml` shipped with a banner 'deltas only — layer on dev:
`MISE_ENV=dev,test`' and an empty `[env]`; `mise.local.toml` is never shipped,
only gitignored and documented in `mise.toml`'s banner."

D32: the *Legacy names* table, quoted in full in index.md.

D34: the `setup:all` and `setup:worktree` orders, quoted in full in index.md.

Index facts: `minimum_release_age = "10h"`, `lockfile = true` in `mise.toml`,
`locked = true` in `mise.ci.toml`; the user's freshness rule is "latest, but
defer anything released under 10 hours ago; CI installs from the lockfile".

## Edits

1. **`config/.config/mise.toml`** — base, loaded in every environment. Banner
   comment naming the five-file set and the rule "a tool CI runs lives here,
   because `MISE_ENV=ci` never loads the dev file". `[settings]`:
   `minimum_release_age = "10h"`, `lockfile = true`,
   `task.output =
   "interleave"`, the existing settings kept. `[tools]`: none
   by default (a package-manager or language pack adds its runtime via its own
   tier; see D27's `conf.d` shape — note that in the pack's own comment).
   `[env]` `_.path = { path = "node_modules/.bin", tools = true }` only when a
   later pack asks; ship the block commented with the reason. `[tasks.init]`
   hidden: `chmod 755` every file under `.config/mise/tasks/` except
   `_scripts/*.env`. Document `mise.local.toml` and `mise.<env>.local.toml` as
   the gitignored per-user override in the banner.
2. **`config/.config/mise.dev.toml`** — `MISE_ENV=dev`. `[tools]`: `pre-commit`,
   `dprint`, `taplo`, `gitleaks`, `grype`, `shellcheck`, `shfmt`, `actionlint`,
   `jq`, all `latest`. `[env] PRE_COMMIT_HOME = "$HOME/.cache/pre-commit"`.
   `[shell_alias]` per D11 (member aliases as a commented example, since the
   pack cannot know members). No secrets provider tool here — the provider
   pack's `conf.d` file carries its own `[tools]` entry.
3. **`config/.config/mise.ci.toml`** — `MISE_ENV=ci`.
   `[settings] locked =
   true`, `node.gpg_verify = false` with the existing
   Linux-runner comment, empty `[tools]`, `[env]` empty with a comment on what
   belongs (CI-only values, never secrets).
4. **`config/.config/mise.test.toml`** — new, per D31.
5. **`config/.config/mise/tasks/_scripts/helpers`** — rewrite. Colour constants
   (`BOLD NORMAL GREEN YELLOW RED BLUE`), `line_sep <char>` (terminal width from
   `stty size`, default 80), `print_header` (= line + green bold title),
   `print_subheader` (- line + green bold title), `print_success`, `print_ok`,
   `print_wait` (yellow, no newline), `print_warn` (yellow), `print_error` (red,
   to stderr), `print_newline`. Keep the file sourceable under `set -u`. Move
   `placeholder_notice` from `_scripts/placeholder` into a sibling that stays
   (`_scripts/placeholder` is kept; make sure it sources `helpers`).
6. **`config/.config/mise/tasks/_scripts/helpers.mjs`** — new; exports the same
   names as ESM functions plus `run(cmd, args)`; a `//USAGE`/`//MISE` header
   example in `task-library.md`.
7. **`config/.config/mise/tasks/_scripts/checks`** — new:
   `has_uncommitted_
   changes`, `has_untracked_files`, `is_local_branch`,
   `has_unpushed_commits`, `is_git_worktree`, `get_main_worktree_path`, each
   silent, exit-status only.
8. **`config/.config/mise/tasks/_scripts/merge`** — new:
   `merge_to_destination_branch <dst> [<src>]` implementing D15 in order: refuse
   if already on `<dst>`; refuse `<src>` = `main`; `<dst>` = `main` accepts only
   `<src>` = `develop`; untracked → uncommitted → unpushed; the D14 safety net
   (`pre-commit run --config .config/pre-commit-config.yaml
   --all-files`,
   then `git status --porcelain` must be empty, else `print_error` naming the
   changed files and exit 1); hop to the main worktree when linked;
   `git checkout <dst>`; `git pull --tags`;
   `git merge --no-ff
   --no-edit <src>` (a conflict exits non-zero and leaves
   the tree mid-merge — say so in the message); `git push --follow-tags`; return
   to the original branch and directory.
9. **Task files** — every file `#!/usr/bin/env bash`, `set -euo pipefail`,
   `#MISE description=`, `#USAGE` for every flag or arg, sources `helpers`,
   shellcheck-clean. The mandatory set:

   | Task                                                  | Does                                                                                                                                           |
   | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
   | `setup:all [--all] [--<id>…]`                         | D34 order, each step under `print_header`; member recursion via `mise run --cd <path> setup:all`; the flag block is a commented template       |
   | `setup:mise`                                          | `mise reshim`, `mise doctor`, `mise install`, `mise upgrade --local`, `dprint config update --config .config/dprint.json` when present         |
   | `setup:secrets`                                       | slot (`#PLACEHOLDER`) — a provider pack's overlay fills it                                                                                     |
   | `setup:external:{start,stop,pull}`                    | slots — a container / process pack fills them; each is a `MISE_ENV != dev` no-op                                                               |
   | `setup:deps:all`                                      | `cleanup → install → upgrade → outdated → audit`, each a `print_subheader`                                                                     |
   | `setup:deps:{install,cleanup,upgrade,outdated,audit}` | slots — a package-manager pack fills them; `install` honours `--frozen`                                                                        |
   | `setup:precommit`                                     | `pre-commit autoupdate -c …`, unset `core.hooksPath`, `pre-commit install -c .config/pre-commit-config.yaml --all --install-hooks --overwrite` |
   | `setup:worktree`                                      | D34; replaces `worktree/init` (delete that file)                                                                                               |
   | `code:all [--fix] [--debug]`                          | `format → lint → sec` under `print_subheader`s                                                                                                 |
   | `code:format [--fix]`                                 | dprint `check`/`fmt` with `--config .config/dprint.json --allow-no-files`; a language pack may overlay                                         |
   | `code:lint [--fix]`                                   | slot                                                                                                                                           |
   | `code:sec`                                            | `gitleaks dir . --config .config/gitleaks.toml --redact 50` then `grype dir:. --config .config/grype.yaml --fail-on medium`                    |
   | `code:precommit [--all]`                              | D14: default files = `git diff --name-only --diff-filter=d HEAD` ∪ untracked; `--all` = `--all-files`                                          |
   | `code:git-config [--fix]`                             | as today                                                                                                                                       |
   | `code:worktrees`                                      | as today, submodule-aware                                                                                                                      |
   | `code:merge:develop <branch>`                         | `merge_to_destination_branch develop "$usage_branch"`                                                                                          |
   | `code:merge:main`                                     | `merge_to_destination_branch main develop`                                                                                                     |
   | `code:ai`                                             | D22; replaces `setup/ai` (delete that file)                                                                                                    |

10. **`skills/mise/references/task-library.md`** — rewrite the helper table to
    the new API; the mandatory-set table above; the slot contract; the
    `p:<id>:*` group with D12's naming rule, D28's `_default` slot and one
    worked `p/site/{dev,build}` example; the *Legacy names* table (D32); a
    `//USAGE` node example; the `setup:all` member-flag template. Retired names
    at the old `:197` move into the legacy table (keep a
    `RETIRED_LINE_EXEMPT`-style marker on lines naming them, per checks.md
    169-175).
11. **`skills/mise/references/config-files.md`** and **`conventions.md`** — five
    files, what each holds, `MISE_ENV` selection, `mise.local.toml` gitignored,
    `minimum_release_age`, the lockfile in CI, `conf.d/` as the tier a provider
    pack contributes to (D27), `[shell_alias]` in dev.
12. **`skills/mise/SKILL.md`** — update the task-name examples and the
    description line if it names the three-file split.
13. **`pack.yaml`** — `version: 1.0.0`; summary names the five-file split and
    the `setup:*` / `code:*` / `p:*` groups.

## Verification

- `mise run plugins:check` green (rule 11: every task file executable; run
  `chmod 755` on new files and confirm with `git ls-files -s`).
- `shellcheck -x config/.config/mise/tasks/**` and
  `_scripts/{helpers,checks,
  merge,placeholder}` report nothing; `shfmt -d`
  likewise (U6 adds the gate; run the tools directly meanwhile via
  `mise x shellcheck@latest --`).
- `grep -rn 'worktree:init\|setup:ai\|setup:pnpm' .` inside the pack returns
  only the legacy table lines.
- `grep -c 'print_header' config/.config/mise/tasks/setup/all` ≥ 6 and
  `grep -c 'line_sep' config/.config/mise/tasks/setup/all` = 0.
- Every task file with a `--` flag or positional has a `#USAGE` line.

## Guardrails

- Do not edit `stacks/bundles/mise.md` (U5's), any other pack (U2/U3/U4's), or
  any asset under `plugins/stackgen/assets/` (U5's).
- `plugins/**/*.md` is not dprint-formatted: match the surrounding fold width by
  hand.
- BSD `sed` on this machine; `cat` is aliased to `bat` — write files with
  Write/Edit, never heredocs. Pipes containing `npm` are rewritten to `pnpm` by
  the npm-normalize hook — use Write for any line containing `npm`.
- No repo names, no absolute paths, no `95octane`/`virajp` strings in shipped
  files.
- Do not add a `helpers.py`.

## Commit

`feat(stackgen): mise pack ships the five-file split, the helper library and the setup/code/p task contract`
— written by the orchestrator after the wave gate, not by the unit.
