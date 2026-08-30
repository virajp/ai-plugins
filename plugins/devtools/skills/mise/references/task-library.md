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
**`/devtools:scaffold` copies them in** — author from those, not from scratch. The
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
source "${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/helpers"

print_header "Doing the thing ..."
```

- **Every task sources `helpers`** as its first real line, for uniform output.
- `#USAGE flag` args arrive as `$usage_<name>` env vars; the conventions are
  `--fix` (mutate vs check), `--debug` (verbose), `--clean` (delete first).
- Guard dev-only side effects (docker, emulators) with
  `[ "$MISE_ENV" != "dev" ]` so the identical task is a no-op in CI.
- Every task file is **bash** (`#!/usr/bin/env bash`) — the whole library is
  bash-only so it runs on CI runners that lack zsh.

## `_scripts/helpers` — sourced by every task

`_scripts/` is underscore-prefixed, so mise treats it as **not a task**. It
holds the shared shell library that every task sources for uniform output. Add a
`helpers.mjs` sibling for any Node-based (`.mjs`) task.

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
| `code/format`     | format (`--fix`) or check formatting                | **common ships a real default** — dprint over the repo's markdown. Node adds `sort-package-json`; Flutter adds `dart format lib/` |
| `code/lint`       | lint (`--fix` applies fixes)                        | **slot** — common ships a placeholder. Flutter adds `dart analyze --fatal-infos` + `dependency_validator`                        |
| `code/sec`        | dependency + secret scan                            | **slot** — the scanners come from the pinned repo-gate components                                                                |
| `code/precommit`  | run pre-commit on changed files (`--all` for all)   | identical. **Fails when a hook fails** — the caller decides whether to ignore it                                                  |
| `code/git-config` | reject forbidden local git config (`--fix` removes) | identical — identity & gpg keys must stay global, never local                                                                    |
| `code/worktrees`  | list worktrees across the repo and its submodules   | identical — git only                                                                                                             |
| `code/all`        | aggregator: `format` → `lint` → `sec`               | compiled stacks (TS monorepo) prepend a typecheck, e.g. `code:check` → `turbo check`                                             |

`code:all` is the one-command gate. `precommit` and `git-config` are wired into
the pre-commit hooks and `setup` — not into `code:all`.

**Formatting has a default and linting does not**, which looks inconsistent and
is deliberate: dprint is a single binary and every repo has markdown in it from
the first commit, so a format default costs nothing. Every linter worth running
belongs to a language, and the one this ecosystem uses for prose would drag a
package manager into a repo that holds only docs.

A stack's `code:sec` fill will typically shell out to scanners the three-file
split places in **`mise.dev.toml`** — so running the aggregate gate requires the
dev toolchain to be loaded (`MISE_ENV=dev`).

## Slots and their placeholders

Four common tasks ship **unfilled**: `code/lint`, `code/sec`, `setup/secrets`
and `setup/deps/install`. The task name is the contract; the mechanism belongs to
whichever stack the repo pins.

Each carries a `#PLACEHOLDER` marker, sources `_scripts/placeholder`, and calls
`placeholder_notice`. That prints the reason, then greps the repo's own task
tree for the marker and lists **every** unconfigured task — a user who hits one
slot will hit the rest, and one round of setup answers all of them.

**A placeholder always exits 0.** An unconfigured repo has to be able to run
`code:all` and `setup:all` end to end: the docs a product is defined in get
formatted and gated from day one, and the unfilled slots announce themselves
rather than halting the aggregator that called them.

A slot stops being one by being **overwritten** — the overlay ships its own file
at the same path, marker and all gone. Nothing edits a placeholder in place.

## `setup/*` — bootstrap & upgrade

`setup:all` is **the entrypoint** a human runs — on clone, and to re-sync a
machine afterwards. It declares `#MISE depends=["init"]`, and it is **common,
not stack-specific**: it names no tool at all, only the tasks it calls in order.

```text
setup:all  (--clean wipes deps/caches · --all recurses into submodules)
  ├─ setup:mise        # mise reshim · doctor · install · upgrade --local   (common)
  ├─ setup:secrets     # install/configure the pinned secret manager        (SLOT)
  ├─ setup:deps:all    # the package manager's install — see below          (SLOT)
  ├─ setup:external:update  # pull/build services, if this repo has any     (optional)
  ├─ setup:precommit   # pre-commit autoupdate + install --install-hooks    (common)
  ├─ setup:ai          # verify claude, refresh marketplaces + plugins      (common)
  └─ <each submodule>  # only with --all
```

Alias it for the humans who run it, in `[shell_alias]`:

```toml
setup     = "mise run setup:all"
setup-all = "mise run setup:all --all"   # when the repo has submodules
```

### `setup/deps/*` — the package manager, and only that

Two sibling surfaces, kept apart because a repo routinely has one and not the
other in both directions:

- **`setup/deps/*`** — the language's **package manager**. Always present.
- **`setup/external/*`** — emulators, containers, local queues. **Optional.**

`deps/` is a folder rather than a file because a package manager has verbs:

| Task                 | Required | Is                                                              |
| -------------------- | -------- | --------------------------------------------------------------- |
| `setup:deps:all`     | yes      | the aggregator `setup:all` calls                                |
| `setup:deps:install` | yes      | **the slot** — install from the lockfile                        |
| `setup:deps:upgrade` | no       | move the lockfile forward                                       |
| `setup:deps:outdated` | no      | report what has moved on                                        |
| `setup:deps:audit`   | no       | report known vulnerabilities in the tree                        |
| `setup:deps:cleanup` | no       | delete installed deps, lockfiles and caches (`--clean` runs it) |

**The task path carries no tool name.** `setup:pnpm:*`, `setup:uv:*` and
`setup:app:*` are gone — the overlay fills `setup:deps:install` and the contract
reads the same on every stack. One task library serves one package manager; a
polyglot monorepo already gets one library per project, via
`mise run --cd <project> setup:all`.

**Only `install` is required, and only it ships as a slot.** The others are
probed by name. That distinction matters: an overlay with no `upgrade` is not
unconfigured — pnpm simply does not separate installing from upgrading — and a
placeholder there would report a gap that does not exist. A slot means *the
tool is unchosen*; absence means *this manager has no such verb*.

- **Node**'s fill: `install` (`pnpm install --recursive`), `outdated`, `audit`,
  `cleanup` (dist/`node_modules`/lockfiles/tsbuildinfo + store prune). No
  `upgrade` — nothing in the Node overlay moves a lockfile forward.
- **Python**'s: `install` (`uv sync --all-extras`), `upgrade`
  (`uv lock --upgrade` + re-sync), `outdated`, `cleanup` (`.venv` + cache
  prune). The only overlay that distinguishes install from upgrade.
- **Flutter**'s: `install` (SDK config **and** `flutter pub get` — one task,
  because `pub get` resolves against whichever platforms the SDK has enabled),
  `outdated`, `cleanup`.

### `setup/external/*` — optional, and absent when unwanted

Not a slot. A repo that runs against no external service has **no
`setup/external/` folder at all** — no placeholder, no marker, nothing telling
the user to go configure something they do not want. `setup:all` probes for it
by name, so its absence is silent.

Where it exists, the verbs are `update`, `pull`, `check`, `start`, `stop`,
`restart` — the names brownfield repos already use, so adopting this library is
a move rather than a rewrite.

`setup:all` wires **only `update`**: it pulls and builds, and starts nothing.
Booting services is a deliberate act (`setup:external:start`), not a side effect
of refreshing your toolchain. Guard the lifecycle tasks with
`[ "$MISE_ENV" != "dev" ]` so CI skips them.

`worktree:init` is the lighter sibling — submodules, mise, `setup:deps:install`,
and nothing else. Note it calls `install` directly rather than `deps:all`: a
fresh worktree shares the machine's tools and the running services, so it needs
its own dependencies and no service refresh, no secret setup, no plugin
reconciliation and no upgrades. **vwf's git-workflow probes for it by name**
before falling back to `setup:all`, so a repo without it silently takes the
slower path.

Keep it idempotent: re-running `setup:all` must converge, never error.
