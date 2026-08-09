# GitHub Actions

The `github-actions` implementation of `/cicd-workflow`. Read
this only when the resolved `cicd` value is `github-actions`; the skill's own
rules (mise installs everything, run through mise, both layouts, the vwf
delivery-pipeline contract) still apply and are not repeated here.

## Where it lives

`.github/workflows/<name>.yml`, one file per workflow. Reusable sub-workflows
live beside them and are referenced by literal path.

## Pinned versions

- `actions/checkout@v7`
- `jdx/mise-action@v4` — **the toolchain step**
- `dorny/paths-filter@v4` — only for the change-filtered fan-out

## The shape of every job

The mise-action step is the **only** tool setup:

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: jdx/mise-action@v4 # installs ALL tools from mise — the only setup step
  - run: mise run <task> # or: mise exec -- <cmd>
```

Workflow-level, when a `mise.ci.toml` variant exists:

```yaml
env:
  MISE_ENV: ci
```

## Layouts

### Polyrepo (single project)

One job: checkout → mise-action → the phase steps, run at the repo root.

### Monorepo — root aggregator

One job whose steps call the root fan-out task, e.g. `mise run build` wrapping
`turbo run build` / `melos run test` / `nx affected -t build`.

### Monorepo — static fan-out

A `strategy.matrix` over every detected package:

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

### Monorepo — change-filtered fan-out

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

## Release workflows — the contract in Actions

**One main workflow, as few sub-workflows as the repo allows.** The main
workflow owns everything common to every subproject — tag parsing, branch
validation, the test gate — and then calls a reusable (`workflow_call`)
sub-workflow that performs the deploy.

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

**Polyrepo delta.** There is one project and no dependents: drop the `deps` step
and the `test` matrix, run `mise run test` in a single job, and pass no
`project` input. Everything else is identical.

**How many sub-workflows.** Emit **one**. The cost of a split is structural —
`jobs.<id>.uses` accepts **no expressions**, so the sub-workflow path must be a
literal. A second sub-workflow means a second `release-*` job in the main
workflow guarded by `if: needs.resolve.outputs.project == '…'`, and that guard
list grows with every project added. Detect the actual variation across the
subprojects first; if they are uniform, one sub-workflow is the answer and the
split never happens.
