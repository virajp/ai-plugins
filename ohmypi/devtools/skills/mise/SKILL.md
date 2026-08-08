---
name: mise
description: Opinionated mise configuration — the .config/ three-file split
  (mise.toml / mise.dev.toml / mise.ci.toml) selected by MISE_ENV, the shared
  settings block, runtime-vs-dev-vs-ci tool placement, the env-value split,
  the CI node-gpg workaround, and the mandatory file-based task library
  (init,_scripts/_helpers, code/*, setup/*). Auto-applies when editing any
  mise config or task file.
globs:
  - "**/mise.toml"
  - "**/mise.dev.toml"
  - "**/mise.ci.toml"
  - "**/.config/mise.toml"
  - "**/.config/mise.dev.toml"
  - "**/.config/mise.ci.toml"
  - "**/.config/mise/tasks/**"
alwaysApply: false
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

**Writing or editing one of the three files?** Its annotated skeleton is in
[references/config-files.md](references/config-files.md) — read that before
authoring the file. The placement rules below decide *which* file each tool,
setting and env value goes in, and apply either way.

## `mise.toml` — the common base

`[tools]` in the base is the **runtime**, nothing else. Formatters, linters,
security scanners, and AI tooling are dev concerns — they belong in
`mise.dev.toml`, so a fresh checkout or a CI build doesn't pull them. The one
exception is `[tasks.init]`: it lives here because file-based tasks (below) must
be executable under `MISE_ENV=ci` too, not just on a developer laptop.

## `mise.dev.toml` — the developer laptop

Everything a human needs locally but a pipeline does not: formatters, linters,
secret scanners, pre-commit, secret managers, plus shell aliases.

Put the **development values** of runtime env vars here (verbose logging, local
hosts, emulator endpoints, test credentials). The variable names should match
what `mise.ci.toml` overrides, so dev and prod differ only in value.

## `mise.ci.toml` — CI builds & deployed runtime

This variant covers both the CI/CD pipeline and the deployed (production)
environment. It carries the **production overrides** for the same env vars dev
sets locally, plus any CI-only settings.

**Node gpg rule:** for any Node project, `mise.ci.toml` must set
`node.gpg_verify = false`. Keep the general `gpg_verify = true` in `mise.toml`
intact — only Node's release-key check is disabled, and only in CI/prod.

## Mandatory tasks

Once tasks grow past one-liners, drive everything through **executable task
files** under `.config/mise/tasks/`. mise turns nested directories into
colon-separated names: `.config/mise/tasks/code/format` →
`mise run code:format`. Every repo ships the same mandatory set — the
`code/{format,lint,sec,all,precommit,git-config}` quality gates and the
`setup/{all,mise,precommit,…}` bootstrap — sharing one **contract** (helpers,
headers, flags) while the commands *inside* `code/*` and `setup/*` change with
the stack. They ship as ready-made templates under `assets/tasks/` (a shared
`common/` set plus a `node/`, `flutter/`, or `python/` overlay);
**`/skill:scaffold` copies them in** — author from those, not from scratch.

Read the reference for the full spec before writing or editing a task file:

| Topic                                      | When to read                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [Task library](references/task-library.md) | Task-file anatomy, the `_scripts/_helpers` shared library, and the per-stack `code/*` + `setup/*` task sets |
