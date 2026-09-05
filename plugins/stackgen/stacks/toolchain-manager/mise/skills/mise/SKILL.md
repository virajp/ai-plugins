---
name: mise
version: 1.0.0
category: development
description: mise as the repo's toolchain manager — the .config/ five-file
  split (mise.toml / mise.dev.toml / mise.ci.toml / mise.test.toml / the
  gitignored mise.local.toml) selected by MISE_ENV, runtime-vs-dev-vs-ci tool
  placement, the env-value split, the mandatory file-based task library and its
  setup/code/p groups, and the CI parity rules. Auto-applies when editing any
  mise config or task file.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/mise.toml"
  - "**/mise.dev.toml"
  - "**/mise.ci.toml"
  - "**/mise.test.toml"
  - "**/mise.local.toml"
  - "**/.config/mise.toml"
  - "**/.config/mise.dev.toml"
  - "**/.config/mise.ci.toml"
  - "**/.config/mise.test.toml"
  - "**/.config/mise/conf.d/**"
  - "**/.config/mise/tasks/**"
---

# mise — the repo's toolchain manager

mise does three jobs: it **pins** the tool versions this repo runs on, **holds**
the environment values those tools and tasks read, and **runs** the repo's
tasks. Keep all of it under **`.config/`** — mise resolves `MISE_ENV` variants
there, so the config never clutters the repo root.

This is a router. The two references below carry the depth; read the one that
matches the file you are about to touch.

| Read                                       | Before                                         |
| ------------------------------------------ | ---------------------------------------------- |
| [Config files](references/config-files.md) | writing or editing any of the five TOML files  |
| [Task library](references/task-library.md) | writing or editing anything under `tasks/`     |

## 1. Tool pinning & the config split

A repo that is built or deployed through CI/CD splits its config by `MISE_ENV`.
Each file has one job, and **nothing is duplicated across files** — a tool
pinned twice is a version that can disagree with itself, and the disagreement
surfaces on someone else's machine. Put each tool, setting and env value in the
**lowest layer that needs it**.

| File              | Loaded when         | Holds                                                     |
| ----------------- | ------------------- | --------------------------------------------------------- |
| `mise.toml`       | always (every env)  | shared `[settings]`, runtime `[tools]`, `[tasks.init]`    |
| `mise.dev.toml`   | `MISE_ENV=dev`      | dev-only tooling, shell aliases, local env values         |
| `mise.ci.toml`    | `MISE_ENV=ci`       | CI/production overrides, per-runtime CI workarounds       |
| `mise.test.toml`  | `MISE_ENV=dev,test` | test deltas only, layered on top of dev                   |
| `mise.local.toml` | always, last        | **never committed** — one machine's private overrides     |

mise loads `mise.toml` first, then **deep-merges** the active `MISE_ENV`
variants on top, then the `.local` files last of all. `MISE_ENV` is a comma list
and the last entry wins, which is what makes `mise.test.toml` a delta rather
than a fourth full config.

### Selecting the layer

- **Developers** export `MISE_ENV=dev` in their shell, so the dev toolchain and
  the local env values load automatically.
- **Pipelines** set `MISE_ENV=ci` in the workflow env, so the CI/production
  overrides apply.
- **Tests** run under `MISE_ENV=dev,test` — never `test` alone.
- With `MISE_ENV` **unset**, only `mise.toml` loads — the minimal, portable
  base.

A repo with **no CI/CD and no deploy target** effectively uses only `mise.toml`;
the other files ship empty so the answer to "where does this go" never requires
creating a file first. Guard variant-only behaviour in a task by testing for
membership — `[[ ",${MISE_ENV:-}," == *",dev,"* ]]` — rather than assuming a
variant is loaded.

### What goes where

- **`mise.toml`** — `[tools]` here is the **runtime**, and it arrives with the
  language and package-manager components, not with this one. It also holds
  everything the **pipeline** runs: `MISE_ENV=ci` never loads the dev file, so a
  tool pinned there is a tool CI cannot reach. `[tasks.init]` lives here for the
  same reason — the file-based tasks must be executable under `MISE_ENV=ci` too.
  It is also where the freshness policy lives: `minimum_release_age` defers a
  release younger than ten hours, and `lockfile = true` records what a fuzzy pin
  resolved to.
- **`mise.dev.toml`** — everything a human needs locally that a pipeline does
  not: formatters, linters, scanners, the shell gates, pre-commit. It also holds
  the repo's **shell aliases**, of which three are part of the contract:

  ```toml
  [shell_alias]
  setup     = "mise run setup:all"
  precommit = "mise run code:precommit"
  worktrees = "mise run code:worktrees"
  ```

  plus one `setup-<project-id>` per member project, generated from the same id
  list `setup:all`'s flags and the `p:<id>:*` task group use.
- **`mise.ci.toml`** — `locked = true`, so the pipeline installs from
  `mise.lock` and fails rather than resolving; the deployed runtime's env
  values; and any per-runtime CI workaround (topic 5). **Never a secret.**
- **`mise.test.toml`** — only the keys a test run has to differ on.
- **`mise.local.toml`** — nothing ships one; it is gitignored and written by
  hand, for what is true of one machine and no other.

### The `conf.d/` tier

mise auto-loads `.config/mise/conf.d/*.toml`. That is where a **capability
provider** — a secret manager, say — puts its own `[tools]` pin and `[env]`
defaults, in one file it owns end to end. Swapping providers then deletes one
file and adds one, and `mise.toml` never changes.

### Prerequisites this component names but does not own

The shipped task library reaches for `.config/dprint.json`,
`.config/pre-commit-config.yaml`, `.config/gitleaks.toml` and
`.config/grype.yaml`. Those files belong to the gate components — each task
no-ops with a warning when its config is absent. Name any the repo still needs;
never write one from this side.

## 2. Environment values

**Names are shared across layers; values are split by layer.** Development and
production override the *same* keys rather than each inventing their own, so the
two differ in value and never in vocabulary.

- `mise.toml` `[env]` — only what is identical everywhere (`DISABLE_TELEMETRY`).
- `mise.dev.toml` `[env]` — the **development** values: verbose logging, local
  hosts, emulator endpoints, test credentials.
- `mise.ci.toml` `[env]` — the CI and **production** values for those same keys.
  One variant, two roles: it covers the pipeline and the deployed runtime both.
- `mise.test.toml` `[env]` — only the keys a test run flips.

Never invent project-specific env vars, and never commit a secret to any of
them. If none differ between local and production, leave the override sections
empty.

## 3. The task library contract

Once tasks grow past one-liners, drive everything through **executable task
files** under `.config/mise/tasks/`, where the directory path *is* the task
name: `.config/mise/tasks/code/format` → `mise run code:format`. The contract —
headers, flags, the shared `_scripts/` libraries, the print vocabulary and its
baked-in separators, and the discipline for a slot the repo must fill — is
[references/task-library.md](references/task-library.md). Read it before writing
or editing a task file.

Every task file is **bash** and must pass `shellcheck -x` and
`shfmt -d -i 2 -ci`. The library runs on runners that have no other shell, and
the two gates are what keep it that way.

## 4. The mandatory task set

Every repo ships the same names, because the names are what the rest of the
toolkit invokes: the `code/*` gates and git operations, and the `setup/*`
bootstrap. **A name here is a contract, not a convention** — renaming one breaks
every caller that never read this file. Beside them sits `p:<project-id>:*`,
which is the exact opposite: one project's own commands, named by the repo, and
nothing outside the repo may depend on one.

The full set, the `deps` / `external` split, the `p:` naming rule and the table
of names this contract replaced are in
[references/task-library.md](references/task-library.md).

## 5. Bootstrap & CI parity

The pipeline runs the **identical task names** a developer runs. CI installs
mise, sets `MISE_ENV=ci` in the workflow env, and calls `mise run code:all` —
a gate that passes locally and fails in the pipeline is a gate that ran a
different command.

- **`setup:all`** is what a human runs on clone and to re-sync afterwards.
  **`setup:worktree`** is the lighter sibling for a fresh worktree — members,
  tools, secrets, `setup:deps:install --frozen`, nothing else. **vwf's
  git-workflow probes for `setup:worktree` by name** before falling back to
  `setup:all`, so a repo without it silently takes the slower path.
- **`code:all` needs the dev toolchain.** The formatter and the scanners are
  pinned in `mise.dev.toml`, so the aggregate gate runs under `MISE_ENV=dev` —
  in the pipeline too, wherever the pipeline runs the gate rather than the build.
- **`code:precommit` runs before staging.** The hooks rewrite files, and running
  them against the working tree is what folds those rewrites into the commit
  that caused them instead of a follow-up "fix hooks" commit.
- **Per-runtime CI workarounds live in `mise.ci.toml` alone.** The one that
  ships: for a **Node** project, set `node.gpg_verify = false` there. mise's
  bundled Node release-key gpg import fails on Linux CI runners ("no valid
  OpenPGP data found"); only Node's signature check is disabled, the tarball is
  still SHA256-verified, and the general `gpg_verify = true` in `mise.toml`
  stays intact.
- If a pipeline definition exists, `MISE_ENV=ci` has to be set in it — that is
  the one wiring step outside this component's own files.

## Materializing this into a repo

The five config files and the common task library ship as this component's
`config/` payload and are **copied**, not hand-written. What still takes
judgment after they land:

- **Do not fill a slot by hand.** `code/lint`, `setup/secrets`,
  `setup/deps/*` and `setup/external/*` stay as shipped unless a stack overlay
  overwrote them. A repo that has picked no stack is *supposed* to see the
  placeholder output; writing a tool into it is the guess the slot exists to
  prevent.
- **A linter default is the author's, not the repo's.** Where an overlay's
  `code/lint` runs a personal default, flag it and offer to swap in the linter
  the repo already configures.
- **`p:<id>:*` is authored, not copied.** No pack knows a project's commands, so
  the group arrives as one `_default` placeholder per project. Fill it from what
  the repo actually runs.
- **Name the missing prerequisites** — the gate config files under `.config/` —
  rather than writing them from this side.
- **Leave the `MISE_ENV` guards intact.** They are what keeps local-only side
  effects (containers, emulators) out of CI.
- Beyond the above, do not edit the copied files unless the user asks. They are
  the standard.
