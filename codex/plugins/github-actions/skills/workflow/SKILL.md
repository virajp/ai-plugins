---
name: workflow
description: Generate a GitHub Actions workflow that installs every tool through
  the
  jdx/mise-action (mise only) and supports both polyrepo and monorepo layouts.
  Detects the repo, asks what to generate, then writes
  .github/workflows/<name>.yml.
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
- For a **release** workflow: the vwf pipeline contract
  (`docs/blueprint/conventions.md#pipeline`), the registry project names
  (`docs/blueprint/registry.yaml`), how the workspace answers "who depends on
  this package" (`pnpm --filter '<pkg>...'`, `cargo tree`, `go list`, melos,
  turbo/nx), and how far the subprojects' deploy needs actually diverge — that
  last one decides the sub-workflow count.

If there is **no mise config**, stop and tell the user to run `$scaffold`
first (the workflow depends on mise providing the toolchain). Only proceed with
a minimal `mise.toml` if they insist.

## 2. Ask (one batched round — only what you cannot infer)

1. **Which workflow?** CI (lint/test/build), release/deploy, or custom — and its
   **triggers** (events: `push` / `pull_request` / tag / `workflow_dispatch`;
   which branches or tag globs). **Skip the trigger question entirely for a
   release/deploy workflow in a repo carrying the vwf pipeline contract** — it
   pins the trigger, tag scheme, branch validation and test gate (see Release
   workflows below).
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

### Release workflows (the vwf delivery-pipeline contract)

For a **server-side project deployed to cloud or a data center**, releases are
not elicited — they follow a fixed architecture. Check whether the repo carries
the vwf pipeline contract (`docs/blueprint/conventions.md#pipeline`, or a vwf
installation providing `assets/delivery-pipeline.md`). When it does, the
contract **pins the trigger, the tag scheme, the branch validation and the test
gate — do not ask about any of them**; ask only what it leaves open (runner,
secrets/OIDC, the deploy commands inside the release task, job shape).

**The shape: one main workflow, as few sub-workflows as the repo allows.** The
main workflow owns everything common to every subproject — tag parsing, branch
validation, the test gate — and then calls a reusable (`workflow_call`)
sub-workflow that performs the deploy.

**Tags are `<project>-<env>-v<semver>`** — `api-prod-v1.2.3`,
`web-stage-v0.4.0`. `env` is `stage` (→ `staging`, from `develop`) or `prod` (→
`production`, from `main`); `<project>` names the registry project released, so
one tag releases exactly one project. A **polyrepo uses the repo name**
(`myservice-prod-v1.2.3`) so the shape never varies by layout. Parse
**right-to-left** — project names contain hyphens.

```yaml
name: release
on:
  push:
    tags: [
      "*-stage-v*",
      "*-prod-v*",
    ] # the glob is coarse; the job re-validates
env:
  MISE_ENV: ci
concurrency:
  group: release-${{ github.ref_name }}
  cancel-in-progress: false # never interrupt an in-flight deploy
jobs:
  resolve:
    runs-on: ubuntu-latest
    outputs:
      project: ${{ steps.tag.outputs.project }}
      environment: ${{ steps.tag.outputs.environment }}
      version: ${{ steps.tag.outputs.version }}
      test-projects: ${{ steps.deps.outputs.projects }}
    steps:
      - uses: actions/checkout@v7
        with: { fetch-depth: 0 } # branch validation needs full history
      - id: tag
        name: Parse and branch-validate the tag
        run: |
          TAG="${GITHUB_REF_NAME}"
          [[ "$TAG" =~ ^[a-z0-9][a-z0-9-]*-(stage|prod)-v[0-9]+\.[0-9]+\.[0-9]+$ ]] \
            || { echo "::error::malformed tag '$TAG' — want <project>-<stage|prod>-v<semver>"; exit 1; }
          VERSION="${TAG##*-v}" #  1.2.3
          REST="${TAG%-v*}"     #  payment-api-prod
          SHORT="${REST##*-}"   #  prod
          PROJECT="${REST%-*}"  #  payment-api
          case "$SHORT" in
            stage) BRANCH=develop; ENVIRONMENT=staging ;;
            prod)  BRANCH=main;    ENVIRONMENT=production ;;
          esac
          git merge-base --is-ancestor "$GITHUB_SHA" "origin/$BRANCH" \
            || { echo "::error::$TAG is not reachable from $BRANCH"; exit 1; }
          { echo "project=$PROJECT"; echo "environment=$ENVIRONMENT"
            echo "version=$VERSION"; } >>"$GITHUB_OUTPUT"
      - uses: jdx/mise-action@v4
      - id: deps
        name: Resolve the tagged project and its dependents
        run: | # pnpm shown — use the detected workspace's own graph query
          mise exec -- pnpm ls -r --depth -1 --json \
            --filter "${{ steps.tag.outputs.project }}..." \
            | jq -c '[.[].name]' | sed 's/^/projects=/' >>"$GITHUB_OUTPUT"

  test: # the gate — pipeline/tested-before-release
    needs: resolve
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        project: ${{ fromJSON(needs.resolve.outputs.test-projects) }}
    steps:
      - uses: actions/checkout@v7
      - uses: jdx/mise-action@v4
      - run: mise run ${{ matrix.project }}:test

  release:
    needs: [ resolve, test ] # every matrix leg must pass before this runs
    uses: ./.github/workflows/release-service.yml
    with:
      project: ${{ needs.resolve.outputs.project }}
      environment: ${{ needs.resolve.outputs.environment }}
      version: ${{ needs.resolve.outputs.version }}
    secrets: inherit
```

The sub-workflow is the only place a deploy happens:

```yaml
# .github/workflows/release-service.yml
on:
  workflow_call:
    inputs:
      project: { required: true, type: string }
      environment: { required: true, type: string }
      version: { required: true, type: string }
env:
  MISE_ENV: ci
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }} # GitHub env → approvals + scoped secrets
    steps:
      - uses: actions/checkout@v7
      - uses: jdx/mise-action@v4
      - run: mise run ${{ inputs.project }}:release:${{ inputs.environment }}
        env: { VERSION: ${{ inputs.version }} }
```

**Release task naming.** `mise run <project>:release:<environment>` in a
monorepo, `mise run release:<environment>` in a polyrepo — the environment is
the **canonical** name (`staging` / `production`), never the tag's short form.
Tests are `<project>:test` / `test` the same way. Confirm these tasks exist
(`mise tasks`); if the workspace's package identifiers differ from the mise task
prefixes, ask for the mapping rather than guessing it.

**Polyrepo delta.** There is one project and no dependents: drop the `deps` step
and the `test` matrix, run `mise run test` in a single job, and pass no
`project` input. Everything else is identical.

**How many sub-workflows.** Emit **one**, and split only when two subprojects
differ in something GitHub itself must express — a different OIDC provider,
registry login, or environment protection rule. Differences in *build or deploy
commands* are not a reason: those live in the mise task, which already varies
per project. The cost of a split is structural — `jobs.<id>.uses` accepts **no
expressions**, so the sub-workflow path must be a literal. A second sub-workflow
means a second `release-*` job in the main workflow guarded by
`if: needs.resolve.outputs.project == '…'`, and that guard list grows with every
project added. Detect the actual variation across the subprojects first; if they
are uniform, one sub-workflow is the answer and the split never happens.

**Staging is not a release.** A `*-stage-v*` run never publishes packages,
creates GitHub Releases, or updates changelogs — those belong only to the
`*-prod-v*` path, and the release *record* itself belongs to `$verify`, not
CI.

Without the contract, release triggers are elicited as normal (§2) — but offer
this shape as the recommended default.

## 4. Report

State the file written, the layout and strategy chosen, and the prerequisites
the user must satisfy:

- the mise config must declare every tool the steps need under `[tools]` (and a
  `mise.ci.toml` if `MISE_ENV: ci` was set);
- any task names the steps call must exist (`mise tasks`); if no task library
  exists, suggest `$scaffold`;
- any secrets / OIDC / registries the workflow references must be configured in
  the repo settings.
