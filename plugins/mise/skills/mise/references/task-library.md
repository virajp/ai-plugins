# The mise task library

Once tasks grow past one-liners, drive everything through **executable task
files** under `.config/mise/tasks/`. mise turns nested directories into
colon-separated names: `.config/mise/tasks/code/format` →
`mise run code:format`. Discover them with `mise tasks`; reserve `[tasks.*]`
toml entries (like `init`) for trivial run-strings and `depends` aggregations.

Every repo ships the same mandatory set. The **contract** — helpers, headers,
flags — is identical across stacks; only the commands *inside* `code/*` and
`setup/*` change with the tech stack.

These tasks ship as ready-made templates with this plugin under `assets/tasks/`
(a shared `common/` set plus a `node/`, `flutter/`, or `python/` overlay).
**`/mise:scaffold` copies them in** — author from those, not from scratch. The
snippets below show the shape; the templates are the source of truth.

## Task-file anatomy

```bash
#!/usr/bin/env bash
#MISE description="Check or format files"   # shown in `mise tasks`
#MISE hide=true                             # hide sub-tasks; aggregators stay visible
#MISE dir="{{ config_root }}"               # run from repo root, not the caller's cwd
#MISE depends=["init"]                      # ordering / fan-out

#USAGE flag "--fix"   help="apply fixes"    # arrives inside as $usage_fix ("true"/"false")
#USAGE flag "--debug" help="emit debug logs"

set -e
source "${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/_helpers"

print_header "Doing the thing ..."
```

- **Every task sources `_helpers`** as its first real line, for uniform output.
- `#USAGE flag` args arrive as `$usage_<name>` env vars; the conventions are
  `--fix` (mutate vs check), `--debug` (verbose), `--clean` (delete first).
- Guard dev-only side effects (docker, emulators) with
  `[ "$MISE_ENV" != "dev" ]` so the identical task is a no-op in CI.
- Every task file is **bash** (`#!/usr/bin/env bash`) — the whole library is
  bash-only so it runs on CI runners that lack zsh.

## `_scripts/_helpers` — sourced by every task

`_scripts/` is underscore-prefixed, so mise treats it as **not a task**. It
holds the shared shell library that every task sources for uniform output. Add a
`_helpers.mjs` sibling for any Node-based (`.mjs`) task.

The shipped file defines styling constants (`BOLD`, `NORMAL`, and the `GREEN` /
`YELLOW` / `RED` / `BLUE` colors) and this print/format vocabulary:

| Helper              | Output                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `print_header`      | green bold line — a section heading                                                        |
| `print_header_wait` | green bold, no newline — a heading awaiting a same-line result                             |
| `print_wait`        | yellow bold, no newline — an in-progress step                                              |
| `print_ok`          | green bold `OK`                                                                            |
| `print_newline`     | a blank line                                                                               |
| `print_warn`        | yellow bold line                                                                           |
| `print_error`       | red bold line                                                                              |
| `print_yellow`      | plain yellow line (not bold)                                                               |
| `line_sep "<char>"` | a full-width separator built from `<char>` (terminal width via `stty`, falling back to 80) |

```bash
#!/usr/bin/env bash

#MISE description="Helper functions for mise tasks"
#MISE hide=true

# Style
readonly BOLD='\033[1m'
readonly NORMAL='\033[0m'
# Colors
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'

print_header()      { echo -e "${GREEN}${BOLD}$1${NORMAL}"; }
print_header_wait() { echo -en "${GREEN}${BOLD}$1${NORMAL}"; }
print_wait()        { echo -en "${YELLOW}${BOLD}$1${NORMAL}"; }
print_ok()          { echo -e "${GREEN}${BOLD}OK${NORMAL}"; }
print_newline()     { echo ""; }
print_warn()        { echo -e "${YELLOW}${BOLD}$1${NORMAL}"; }
print_error()       { echo -e "${RED}${BOLD}$1${NORMAL}"; }
print_yellow()      { echo -e "${YELLOW}$1${NORMAL}"; }

line_sep() {
  local COL
  COL=$(stty size 2>/dev/null | awk '{print $2}')
  local line
  printf -v line '%*s' "${COL:-80}" ''
  printf '%s\n' "${line// /$1}"
}
```

## `code/*` — quality gates

The same set everywhere; the **commands inside differ by stack**.

| Task              | Does                                                | Stack-specific bits                                                                  |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `code/format`     | format (`--fix`) or check formatting                | Node: `dprint` + `sort-package-json`; Flutter: `dprint` + `dart format lib/`         |
| `code/lint`       | lint (`--fix` applies fixes)                        | Flutter adds `dart analyze --fatal-infos` + `dependency_validator`                   |
| `code/sec`        | security scan — `grype` + `gitleaks`                | identical                                                                            |
| `code/precommit`  | run pre-commit on changed files (`--all` for all)   | identical                                                                            |
| `code/git-config` | reject forbidden local git config (`--fix` removes) | identical — identity & gpg keys must stay global, never local                        |
| `code/all`        | aggregator: `format` → `lint` → `sec`               | compiled stacks (TS monorepo) prepend a typecheck, e.g. `code:check` → `turbo check` |

`code:all` is the one-command gate. `precommit` and `git-config` are wired into
the pre-commit hooks and `setup` — not into `code:all`.

`code:sec` (and therefore the `code:all` aggregate) shells out to `grype` and
`gitleaks`, which the three-file split places in **`mise.dev.toml`** — so
running the aggregate gate requires the dev toolchain to be loaded
(`MISE_ENV=dev`).

## `setup/*` — bootstrap & upgrade

`setup:all` is **the entrypoint** — like `code:all`, it directly invokes every
setup sub-task. Run it on clone and to re-sync. It declares
`#MISE
depends=["init"]` and is **stack-specific**, because it names the stack's
own install tasks; the pieces it calls are partly common, partly per-stack:

```text
setup:all  (--clean wipes deps/caches first)   #MISE depends=["init"]   STACK-SPECIFIC
  ├─ setup:mise        # mise reshim · doctor · install · upgrade --local   (common)
  ├─ <install steps>   # the stack's own sub-tasks — see below
  └─ setup:precommit   # pre-commit autoupdate + install --install-hooks    (common)
```

- **Common pieces** (every repo): `setup:mise` and `setup:precommit`. Only these
  two live in the shared set; `setup:all` lives per-stack since it calls the
  install tasks by name.
- **Node**: `setup:pnpm:{upgrade,outdated,audit,cleanup}` (+ a `linter --init`),
  surfacing outdated/audit and, on `--clean`, wiping
  `node_modules`/locks/caches.
- **Flutter**: `setup:flutter` (flutter/dart config), `setup:app:install`
  (`flutter pub get`), `setup:app:{outdated,cleanup}`.
- **Python**: `setup:uv:{sync,outdated,upgrade}` (`uv sync`; `--clean` recreates
  `.venv`).
- **Local service deps** (e.g. docker compose) added under `setup:*` are guarded
  by `[ "$MISE_ENV" != "dev" ]` so CI skips them.

Keep it idempotent: re-running `setup:all` must converge, never error.
