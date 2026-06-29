---
name: mise
version: 0.1.1
category: development
description: Opinionated mise configuration — the .config/ three-file split
  (mise.toml / mise.dev.toml / mise.ci.toml) selected by MISE_ENV, the shared
  settings block, runtime-vs-dev-vs-ci tool placement, the env-value split,
  the CI node-gpg workaround, and the mandatory file-based task library
  (init,_scripts/_helpers, code/*, setup/*). Auto-applies when editing any
  mise config or task file.
license: MIT
user-invocable: false
paths:
  - "**/mise.toml"
  - "**/mise.dev.toml"
  - "**/mise.ci.toml"
  - "**/.config/mise.toml"
  - "**/.config/mise.dev.toml"
  - "**/.config/mise.ci.toml"
  - "**/.config/mise/tasks/**"
---

# mise Configuration

mise pins the toolchain, holds environment variables, and runs tasks. Keep all
of it under **`.config/`** — mise resolves `MISE_ENV` variants there, so the
config never clutters the repo root.

## The three-file split

A repo that is built or deployed through CI/CD splits its config by `MISE_ENV`.
Each file has one job; **never duplicate a tool or setting across files** — put
it in the lowest layer that needs it.

| File            | Loaded when        | Holds                                                                         |
| --------------- | ------------------ | ----------------------------------------------------------------------------- |
| `mise.toml`     | always (every env) | shared `[settings]`, runtime `[tools]`, common `[env]`, `[tasks.init]`        |
| `mise.dev.toml` | `MISE_ENV=dev`     | dev-only tooling, shell aliases, local/dev env values                         |
| `mise.ci.toml`  | `MISE_ENV=ci`      | CI/production-only settings + tools, the node-gpg workaround, prod env values |

mise loads `mise.toml` first, then deep-merges the active `MISE_ENV` variant on
top — so the variant only ever holds **deltas**, not a copy of the base.

### Selecting the environment

- **Developers** export `MISE_ENV=dev` in their shell so the dev toolchain and
  local env values load automatically.
- **CI/CD pipelines** set `MISE_ENV=ci` (in the workflow env) so the CI/prod
  overrides apply.
- With `MISE_ENV` unset, only `mise.toml` loads — the minimal, portable base.

A repo with **no CI/CD and no deploy target** needs only `mise.toml`; add the
variants when a pipeline or deployed environment appears. Guard variant-only
behaviour in task scripts with `[ "$MISE_ENV" != "dev" ]` rather than assuming a
variant is loaded.

## `mise.toml` — the common base

```toml
[settings]
activate_aggressive  = true     # let mise shims win on PATH
env_shell_expand     = true     # expand $VARS in [env]
gpg_verify           = true     # verify tool signatures (see CI exception below)
raw                  = true     # streams output
status.missing_tools = "always"

# Node settings — only when the project uses Node
node.compile        = false
npm.package_manager = "pnpm" # pnpm is the package manager

# Python settings — only when the project uses Python
pipx.uvx            = true
python.compile      = false
python.uv_venv_auto = true

[env]
DISABLE_TELEMETRY = 1

[tools]
# Language RUNTIME only — the minimum to run/build the project anywhere
node = { version = "latest" }
pnpm = { version = "latest" }

[tasks.init]
# Mandatory — chmod the file-based tasks under .config/mise/tasks/ executable.
# Lives in the BASE (not dev) so tasks are runnable in every env, CI included.
description = "Initialize mise tasks"
hide        = true
run         = "find .config/mise/tasks/ -name '*' -type f -not -path '*/*.env' -exec chmod 755 {} \\;"
```

`[tools]` in the base is the **runtime**, nothing else. Formatters, linters,
security scanners, and AI tooling are dev concerns — they belong in
`mise.dev.toml`, so a fresh checkout or a CI build doesn't pull them. The one
exception is `[tasks.init]`: it lives here because file-based tasks (below) must
be executable under `MISE_ENV=ci` too, not just on a developer laptop.

## `mise.dev.toml` — the developer laptop

Everything a human needs locally but a pipeline does not: formatters, linters,
secret scanners, pre-commit, secret managers, plus shell aliases.

```toml
[settings]
env_shell_expand     = true
status.missing_tools = "always"

[tools]
dprint     = { version = "latest" }
gitleaks   = { version = "latest" }
grype      = { version = "latest" }
pre-commit = { version = "latest" }
taplo      = { version = "latest" }

[shell_alias]
npx   = "pnpm dlx"
setup = "mise run setup:all"

[env]
NEXT_TELEMETRY_DISABLED = 1
NODE_NO_WARNINGS        = 1
PRE_COMMIT_HOME         = "$HOME/.cache/pre-commit"
_.path                  = { path = "node_modules/.bin", tools = true }

# Local/dev values for anything the app reads at runtime
LOG_LEVEL   = "trace"
RUNTIME_ENV = "development"
```

Put the **development values** of runtime env vars here (verbose logging, local
hosts, emulator endpoints, test credentials). The variable names should match
what `mise.ci.toml` overrides, so dev and prod differ only in value.

## `mise.ci.toml` — CI builds & deployed runtime

This variant covers both the CI/CD pipeline and the deployed (production)
environment. It carries the **production overrides** for the same env vars dev
sets locally, plus any CI-only settings.

```toml
[settings]
# CI runs on Linux, where mise's bundled Node release-key gpg import can fail
# ("no valid OpenPGP data found"). Disable ONLY the Node signature check — the
# tarball is still SHA256-verified. Include this only for Node projects.
node.gpg_verify = false

[tools]
# Usually empty — CI reuses the runtime from mise.toml. Add a tool here only if
# the pipeline genuinely needs it and dev does not.

[env]
# Production VALUES for the same keys mise.dev.toml sets locally
LOG_LEVEL   = "warn"
RUNTIME_ENV = "production"
```

**Node gpg rule:** for any Node project, `mise.ci.toml` must set
`node.gpg_verify = false`. Keep the general `gpg_verify = true` in `mise.toml`
intact — only Node's release-key check is disabled, and only in CI/prod.

## Mandatory tasks

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

### Task-file anatomy

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

### `_scripts/_helpers` — sourced by every task

`_scripts/` is underscore-prefixed, so mise treats it as **not a task**. It
holds the shared shell library — colors plus `print_header` / `print_ok` /
`print_warn` / `print_error` / `line_sep` — that every task sources for uniform
output. Add a `_helpers.mjs` sibling for any Node-based (`.mjs`) task.

```bash
#!/usr/bin/env bash
#MISE description="Helper functions for mise tasks"
#MISE hide=true

readonly BOLD='\033[1m' NORMAL='\033[0m' GREEN='\033[0;32m' YELLOW='\033[0;33m' RED='\033[0;31m'

print_header() { echo -e "${GREEN}${BOLD}$1${NORMAL}"; }
print_warn()   { echo -e "${YELLOW}${BOLD}$1${NORMAL}"; }
print_error()  { echo -e "${RED}${BOLD}$1${NORMAL}"; }
line_sep()     { local c; c=$(stty size 2>/dev/null | awk '{print $2}'); printf -v l '%*s' "${c:-80}" ''; printf '%s\n' "${l// /$1}"; }
```

### `code/*` — quality gates

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

### `setup/*` — bootstrap & upgrade

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
