---
name: scaffold
description: Scaffold the mise three-file split (mise.toml / mise.dev.toml /
  mise.ci.toml)
  plus the mandatory task library (init, _scripts/_helpers, code/*, setup/*)
  into a repo's .config/, detecting the language runtime.
argument-hint: "[target-dir]"
model: sonnet
effort: high
disable-model-invocation: true
---

# mise:scaffold — Scaffold the mise config & task library

Create the `MISE_ENV`-selected mise config under **`.config/`** for the target
repo, following the `mise` skill's standard. Default the target to the current
repo root; if `$ARGUMENTS` names a directory, scaffold into `<dir>/.config/`.

## 1. Detect, then confirm

Inspect the target for the language runtime and tooling before writing:

- **Node** — `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- **Python** — `pyproject.toml`, `uv.lock`, `requirements.txt`
- **Flutter/Dart** — `pubspec.yaml`
- Existing `dprint.json`, `.pre-commit-config.yaml`, `taplo.toml`,
  `gitleaks.toml` → those tools belong in `mise.dev.toml`

Then ask the user, in one batched round, only what you cannot infer:

1. **Will this repo be built/deployed through CI/CD?** If no, scaffold
   `mise.toml` alone and stop — variants are added when a pipeline appears.
2. **Which runtime env vars differ between local and production?** (e.g.
   `LOG_LEVEL`, `RUNTIME_ENV`, service endpoints) — so the dev/ci values split.
3. Confirm the detected runtime and dev tooling.

Do not invent project-specific env vars. If the user names none, leave the
`[env]` override sections with just the common keys.

## 2. Write the files

Follow the `mise` skill exactly. Key rules:

- `mise.toml` — shared `[settings]`, **runtime `[tools]` only**, common `[env]`
  (`DISABLE_TELEMETRY`), and **`[tasks.init]`** (the task-chmod bootstrap lives
  in the base so tasks run under CI too). Include `npm.package_manager = "pnpm"`
  and Node/Python settings only for the matching runtime.
- `mise.dev.toml` — dev tooling (formatters/linters/security/pre-commit), shell
  aliases, and the **local values** of the runtime env vars.
- `mise.ci.toml` — the **production values** of those same env vars, plus
  CI-only settings. For a **Node** project, set `node.gpg_verify = false` here.

Never duplicate a tool or setting across files — each goes in the lowest layer
that needs it.

## 3. Copy the mandatory task library

Don't hand-write task files — **copy the shipped templates** from this plugin's
`assets/tasks/`. They lay down `_scripts/_helpers`,
`code/{format,lint,sec,all,
precommit,git-config}`, and
`setup/{all,mise,precommit,…}` already wired to the `#MISE`/`#USAGE` +
`_helpers` contract. The layout is **common + one stack overlay**: `common/` is
identical everywhere (`_helpers`, the `code/*` quality gates, `setup/mise`,
`setup/precommit`); `node/`, `flutter/`, `python/` hold the stack-divergent
`code/format`, `code/lint`, the install sub-tasks, **and `setup/all`** — the
entrypoint that names those install tasks directly.

Set `STACK` to the runtime detected in step 1 (`node` | `flutter` | `python`),
then:

```bash
DEST="<target>/.config/mise/tasks"      # <target> = repo root or $ARGUMENTS
TASKS="${CLAUDE_PLUGIN_ROOT}/assets/tasks"

mkdir -p "$DEST"
cp -R "$TASKS/common/." "$DEST/"        # shared tasks (every repo)
cp -R "$TASKS/$STACK/." "$DEST/"        # stack overlay (merges into code/ & setup/)
chmod -R 755 "$DEST"                    # or: mise run init
```

Then adapt only what the detection in step 1 found:

- **TS monorepo** — uncomment the `code:check` line in `common/code/all` so the
  aggregator runs a typecheck (e.g. `turbo check`) before format/lint/sec.
- **Node linter** — the shipped `node/code/lint` and `node/setup/all` run
  `pnpm dlx @askviraj/linter`, the author's personal default. Flag this to the
  user and offer to swap in the repo's own linter (e.g. `eslint`, `biome`) if
  one is already configured.
- **Prerequisite configs** — the tasks expect `dprint.json`,
  `.config/pre-commit-config.yaml`, and (optionally) `.config/grype.yaml` /
  `.config/gitleaks.toml` at the repo root. `code:sec` already no-ops the
  `--config` flag when those files are absent; note any the repo still needs.
- Leave the `[ "$MISE_ENV" != "dev" ]` guards intact — they keep local-only side
  effects (emulators, docker) out of CI.

Do not edit the copied files beyond the above unless the user asks — they are
the standard.

## 4. Report

Summarize what was written and remind the user of the `MISE_ENV` contract:
developers export `MISE_ENV=dev`; CI/CD and deployed runtimes set `MISE_ENV=ci`;
unset loads only `mise.toml`. If a `.github/`/`.gitlab-ci.yml` pipeline exists,
point out where `MISE_ENV=ci` needs to be set.
