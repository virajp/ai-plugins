---
name: mise
version: 0.1.0
category: development
description: mise as the repo's toolchain manager — the .config/ three-file
  split (mise.toml / mise.dev.toml / mise.ci.toml) selected by MISE_ENV,
  runtime-vs-dev-vs-ci tool placement, the env-value split, the mandatory
  file-based task library, and the CI parity rules. Auto-applies when editing
  any mise config or task file.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/mise.toml"
  - "**/mise.dev.toml"
  - "**/mise.ci.toml"
  - "**/.config/mise.toml"
  - "**/.config/mise.dev.toml"
  - "**/.config/mise.ci.toml"
  - "**/.config/mise/tasks/**"
---

# mise — the repo's toolchain manager

mise does three jobs: it **pins** the tool versions this repo runs on, **holds**
the environment values those tools and tasks read, and **runs** the repo's
tasks. Keep all of it under **`.config/`** — mise resolves `MISE_ENV` variants
there, so the config never clutters the repo root.

This is a router. The two references below carry the depth; read the one that
matches the file you are about to touch.

| Read                                             | Before                                          |
| ------------------------------------------------ | ----------------------------------------------- |
| [Config files](references/config-files.md)       | writing or editing any of the three TOML files  |
| [Task library](references/task-library.md)       | writing or editing anything under `tasks/`      |

## 1. Tool pinning & the config split

A repo that is built or deployed through CI/CD splits its config by `MISE_ENV`.
Each file has one job, and **nothing is duplicated across files** — a tool
pinned twice is a version that can disagree with itself, and the disagreement
surfaces on someone else's machine. Put each tool, setting and env value in the
**lowest layer that needs it**.

| File            | Loaded when        | Holds                                                                         |
| --------------- | ------------------ | ----------------------------------------------------------------------------- |
| `mise.toml`     | always (every env) | shared `[settings]`, runtime `[tools]`, common `[env]`, `[tasks.init]`        |
| `mise.dev.toml` | `MISE_ENV=dev`     | dev-only tooling, shell aliases, local/dev env values                         |
| `mise.ci.toml`  | `MISE_ENV=ci`      | CI/production-only settings + tools, per-runtime CI workarounds, prod values  |

mise loads `mise.toml` first, then **deep-merges** the active `MISE_ENV` variant
on top — so a variant only ever holds **deltas**, never a copy of the base.

### Selecting the layer

- **Developers** export `MISE_ENV=dev` in their shell, so the dev toolchain and
  the local env values load automatically.
- **Pipelines** set `MISE_ENV=ci` in the workflow env, so the CI/production
  overrides apply.
- With `MISE_ENV` **unset**, only `mise.toml` loads — the minimal, portable
  base.

A repo with **no CI/CD and no deploy target** needs only `mise.toml`; add the
variants when a pipeline or a deployed environment appears. Guard variant-only
behaviour in a task with `[ "$MISE_ENV" != "dev" ]` rather than assuming a
variant is loaded.

### What goes where

- **`mise.toml`** — `[tools]` here is the **runtime**, nothing else. Formatters,
  linters, security scanners and AI tooling are development concerns and belong
  in `mise.dev.toml`, so a fresh checkout and a CI build do not pull them. The
  one exception is **`[tasks.init]`**: it lives in the base because the
  file-based tasks must be executable under `MISE_ENV=ci` too, not only on a
  developer laptop. Common `[env]` keys such as `DISABLE_TELEMETRY` go here.
  `npm.package_manager = "pnpm"`, and the Node and Python `[settings]` blocks,
  are included **only** for the matching runtime.
- **`mise.dev.toml`** — everything a human needs locally that a pipeline does
  not: formatters, linters, secret scanners, pre-commit, secret managers. It
  also holds the repo's **shell aliases**, of which two are part of the
  bootstrap contract:

  ```toml
  [shell_alias]
  setup     = "mise run setup:all"
  setup-all = "mise run setup:all --all"   # when the repo has submodules
  ```

- **`mise.ci.toml`** — the pipeline's and the deployed runtime's overrides, plus
  any per-runtime CI workaround (topic 5).

### Prerequisites this component names but does not own

The shipped task library expects **`dprint.json`** and
**`.config/pre-commit-config.yaml`** at the repo root. Those files belong to the
gate components, not here — `code/format` already no-ops with a warning when
`dprint.json` is absent. Name any the repo still needs; never write one from
this side.

## 2. Environment values

**Names are shared across layers; values are split by layer.** Development and
production override the *same* keys rather than each inventing their own, so the
two differ in value and never in vocabulary.

- `mise.toml` `[env]` — only what is identical everywhere (`DISABLE_TELEMETRY`).
- `mise.dev.toml` `[env]` — the **development** values: verbose logging, local
  hosts, emulator endpoints, test credentials.
- `mise.ci.toml` `[env]` — the **production** values for those same keys. One
  variant, two roles: it covers the pipeline and the deployed runtime both.

Never invent project-specific env vars. If none differ between local and
production, leave the override sections holding just the common keys.

## 3. The task library contract

Once tasks grow past one-liners, drive everything through **executable task
files** under `.config/mise/tasks/`, where the directory path *is* the task
name: `.config/mise/tasks/code/format` → `mise run code:format`. The contract —
headers, flags, the shared helpers, and the discipline for a slot the repo must
fill — is [references/task-library.md](references/task-library.md). Read it
before writing or editing a task file.

## 4. The mandatory task set

Every repo ships the same names, because the names are what the rest of the
toolkit invokes: the `code/*` quality gates and the `setup/*` bootstrap, plus
`worktree/init`. **A name here is a contract, not a convention** — renaming one
breaks every caller that never read this file. The full set, its per-stack
divergence, and the `deps` / `external` split are in
[references/task-library.md](references/task-library.md).

## 5. Bootstrap & CI parity

The pipeline runs the **identical task names** a developer runs. CI installs
mise, sets `MISE_ENV=ci` in the workflow env, and calls `mise run code:all` —
a gate that passes locally and fails in the pipeline is a gate that ran a
different command.

- **`setup:all`** is what a human runs on clone and to re-sync afterwards.
  **`worktree:init`** is the lighter sibling for a fresh worktree — submodules,
  mise, `setup:deps:install`, nothing else. **vwf's git-workflow probes for
  `worktree:init` by name** before falling back to `setup:all`, so a repo
  without it silently takes the slower path.
- **`code:all` needs the dev toolchain.** A stack's `code:sec` fill shells out
  to scanners the three-file split places in `mise.dev.toml`, so the aggregate
  gate runs under `MISE_ENV=dev` — in the pipeline too, wherever the pipeline
  runs the gate rather than the build.
- **Per-runtime CI workarounds live in `mise.ci.toml` alone.** The one that
  ships: for a **Node** project, set `node.gpg_verify = false` there. mise's
  bundled Node release-key gpg import fails on Linux CI runners ("no valid
  OpenPGP data found"); only Node's signature check is disabled, the tarball is
  still SHA256-verified, and the general `gpg_verify = true` in `mise.toml`
  stays intact.
- If a pipeline definition exists, `MISE_ENV=ci` has to be set in it — that is
  the one wiring step outside this component's own files.

## Materializing this into a repo

The three config files and the common task library ship as this component's
`config/` payload and are **copied**, not hand-written. What still takes
judgment after they land:

- **Do not fill a slot by hand.** `code/lint`, `code/sec`, `setup/secrets` and
  `setup/deps/install` stay as shipped unless a stack overlay overwrote them. A
  repo that has picked no stack is *supposed* to see the placeholder output;
  writing a tool into it is the guess the slot exists to prevent.
- **A linter default is the author's, not the repo's.** Where an overlay's
  `code/lint` runs a personal default such as `@askviraj/linter`, flag it and
  offer to swap in the linter the repo already configures.
- **Name the missing prerequisites** — `dprint.json`,
  `.config/pre-commit-config.yaml` — rather than writing them.
- **Leave the `[ "$MISE_ENV" != "dev" ]` guards intact.** They are what keeps
  local-only side effects (emulators, docker) out of CI.
- Beyond the above, do not edit the copied files unless the user asks. They are
  the standard.
