---
description: Generate a GitHub Actions workflow that installs every tool through
  the jdx/mise-action (mise only) and supports both polyrepo and monorepo
  layouts. Detects the repo, asks what to generate, then writes
  .github/workflows/<name>.yml.
argument-hint: "[workflow-name | ci | release | deploy]"
model: sonnet
effort: high
---

# github-actions:workflow — Generate a mise-based GitHub Actions workflow

Create a workflow under `.github/workflows/` that uses **`jdx/mise-action`** as
the **only** tool-installation mechanism and works for both **polyrepo** (a
single project) and **monorepo** (many packages) layouts. Default the workflow
name from `$ARGUMENTS` (e.g. `ci`, `release`, `deploy`) or ask.

## Hard rules (never violate)

1. **mise installs everything.** The only tool-setup step is
   `uses: jdx/mise-action@v4`. NEVER add `actions/setup-node`, `setup-python`,
   `setup-java`, `setup-go`, any language-SDK action, `apt-get`/`brew install`,
   `npm i -g`, `pipx`, etc. Every tool a job needs must be declared in the
   repo's mise config (`[tools]`) and installed by the action.
2. **Run through mise.** Steps invoke tooling via `mise run <task>` (when the
   repo has a mise task library) or `mise exec -- <cmd>` — never call a binary
   the action did not put on `PATH` via mise.
3. **Support both layouts.** Detect monorepo vs polyrepo and generate the
   matching structure (below); ask which monorepo strategy to use.
4. **CI env.** Set workflow-level `env: MISE_ENV: ci` when the repo defines a
   `mise.ci.toml` variant (the project convention — loads CI-only tools/env).
   Omit it when the repo has only a flat `mise.toml`.
5. Pin actions to the versions this repo already uses: `actions/checkout@v7`,
   `jdx/mise-action@v4`.

## 1. Detect

Inspect the target repo before writing — do not assume:

- **Layout (mono vs poly).** Monorepo signals: `pnpm-workspace.yaml`,
  `package.json` `workspaces`, `melos.yaml`, `lerna.json`, `nx.json`,
  `turbo.json`, a Cargo `[workspace]`, `go.work`, or multiple package manifests
  (`package.json` / `pubspec.yaml` / `pyproject.toml` / `Cargo.toml`) in
  sub-directories. None of those → polyrepo. **List the packages you find.**
- **mise config.** `mise.toml` / `.config/mise.toml`, and whether a
  `mise.ci.toml` variant exists (→ set `MISE_ENV: ci`). Whether a **task
  library** exists (`.config/mise/tasks/**` or `[tasks.*]`) and which tasks are
  available (`mise tasks`) — these become the step commands.
- **Runtime/tools** declared under `[tools]`, so you know what mise provides.
- Existing `.github/workflows/` — don't clobber; pick a non-colliding filename.

If there is **no mise config**, stop and tell the user to run `/mise:scaffold`
first (the workflow depends on mise providing the toolchain). Only proceed with
a minimal `mise.toml` if they insist.

## 2. Ask (one batched round — only what you cannot infer)

1. **Which workflow?** CI (lint/test/build), release/publish, deploy, or custom
   — and its **triggers** (events: `push` / `pull_request` / tag /
   `workflow_dispatch`; which branches or tag globs).
2. **Steps source.** If a mise task library exists, confirm which tasks map to
   the workflow's phases (e.g. `code:lint`, `test`, `build`, `i:release`). If
   none exists, fall back to inline `mise exec -- <cmd>` and confirm the
   commands.
3. **If monorepo, which strategy:**
   - **path-filtered dynamic matrix** — build only packages that changed;
   - **static matrix** — every package, every run;
   - **root aggregator** — one job running a root fan-out task (turbo / melos /
     nx). Show the detected package list so the user can confirm/trim it.
4. **Job shape:** runner OS (default `ubuntu-latest`), any OS/version matrix,
   `concurrency` group, `permissions`, dependency caching beyond what
   mise-action already caches, and — for release/deploy — the secrets / OIDC /
   registries needed.

Don't invent triggers, task names, secrets, or package paths — ask.

## 3. Write

Write `.github/workflows/<name>.yml`. Every job begins the same way; the
mise-action step is the **only** tool setup:

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: jdx/mise-action@v4 # installs ALL tools from mise — the only setup step
  - run: mise run <task> # or: mise exec -- <cmd>
```

Workflow-level, when a ci variant exists:

```yaml
env:
  MISE_ENV: ci
```

### Polyrepo (single project)

One job: checkout → mise-action → the phase steps, run at the repo root.

### Monorepo — root aggregator

One job whose steps call the root fan-out task, e.g. `mise run build` wrapping
`turbo run build` / `melos run test` / `nx affected -t build`.

### Monorepo — static matrix

```yaml
strategy:
  matrix:
    package: [ packages/a, packages/b, apps/web ] # the detected packages
steps:
  - uses: actions/checkout@v7
  - uses: jdx/mise-action@v4
  - run: mise run test
    working-directory: ${{ matrix.package }}
```

### Monorepo — path-filtered dynamic matrix

A `changes` job emits the affected-package list; the build job fans out over it.
Use `dorny/paths-filter@v4` (a CI action, not a tool install — allowed): name
each filter after its package dir and match on that dir's paths, then its
`changes` output is already the JSON array of affected package dirs.

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v7
      - id: filter
        uses: dorny/paths-filter@v4
        with:
          # one filter per detected package, named by its dir
          filters: |
            packages/a: packages/a/**
            packages/b: packages/b/**
            apps/web: apps/web/**
  build:
    needs: changes
    if: needs.changes.outputs.packages != '[]'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: ${{ fromJSON(needs.changes.outputs.packages) }}
    steps:
      - uses: actions/checkout@v7
      - uses: jdx/mise-action@v4
      - run: mise run test
        working-directory: ${{ matrix.package }}
```

Include the shared/root paths (the mise config, lockfiles, shared libs) in
**every** package's filter so a toolchain edit re-tests the whole repo —
generate those globs from what you detected and confirm the mapping with the
user.

Keep the YAML minimal — only the jobs/steps the chosen workflow needs.

## 4. Report

State the file written, the layout and strategy chosen, and the prerequisites
the user must satisfy:

- the mise config must declare every tool the steps need under `[tools]` (and a
  `mise.ci.toml` if `MISE_ENV: ci` was set);
- any task names the steps call must exist (`mise tasks`); if no task library
  exists, suggest `/mise:scaffold`;
- any secrets / OIDC / registries the workflow references must be configured in
  the repo settings.
