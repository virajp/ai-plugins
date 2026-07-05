# github-actions plugin

The `github-actions` plugin gives Claude Code a `/github-actions:workflow` skill
that generates a GitHub Actions workflow whose **only** tool-installation step
is the [`jdx/mise-action`](https://github.com/jdx/mise-action) — every tool the
jobs need comes from the repo's mise config, installed by the action. The
generated workflow supports both **polyrepo** (a single project) and
**monorepo** (many packages) layouts, and it detects which one you have and asks
how to handle it. It is a single user-invoked skill — nothing auto-applies.

## Install

```bash
pnpx @askviraj/ai-plugins --user github-actions
```

It pairs naturally with the [`mise`](./mise.md) plugin: the workflows it writes
assume mise provides the toolchain, so a repo with no mise config should run
[`/mise:scaffold`](./mise.md#misescaffold) first.

## The hard rules

Every workflow the command writes obeys these, without exception:

1. **mise installs everything.** The single tool-setup step is
   `uses: jdx/mise-action@v4`. The command never adds `actions/setup-node`,
   `setup-python`, `setup-java`, `setup-go`, any language-SDK action, or shell
   installs (`apt-get`, `brew install`, `npm i -g`, `pipx`). Every tool a job
   needs is declared in the repo's mise `[tools]` and installed by the action.
2. **Run through mise.** Steps invoke tooling via `mise run <task>` (when the
   repo has a mise task library) or `mise exec -- <cmd>` — never a binary the
   action did not put on `PATH`.
3. **Both layouts.** It generates the structure matching a polyrepo or a
   monorepo (with a chosen fan-out strategy).
4. **CI env.** It sets workflow-level `env: MISE_ENV: ci` when the repo defines
   a `mise.ci.toml` variant, matching this marketplace's
   [mise convention](./mise.md#the-three-file-split).
5. Actions are pinned to the versions this repo already uses —
   `actions/checkout@v7`, `jdx/mise-action@v4`.

## /github-actions:workflow

`/github-actions:workflow [workflow-name | ci | release | deploy]` follows a
**detect → ask → write → report** flow:

1. **Detect.** It inspects the repo for layout (monorepo signals —
   `pnpm-workspace.yaml`, `package.json` `workspaces`, `melos.yaml`, `nx.json`,
   `turbo.json`, a Cargo `[workspace]`, `go.work`, or manifests in
   sub-directories — else polyrepo), the mise config (and whether a
   `mise.ci.toml` variant and a task library exist), the declared `[tools]`, and
   any existing workflows.
2. **Ask** — one batched round, only what it can't infer: which workflow (CI,
   release/publish, deploy, or custom) and its triggers; which mise tasks (or
   inline commands) map to each phase; for a monorepo, which strategy; and job
   shape (runner, matrix, concurrency, permissions, secrets/OIDC).
3. **Write** `.github/workflows/<name>.yml`.
4. **Report** the file written and the prerequisites you must satisfy (tools
   under `[tools]`, the task names the steps call, any secrets/OIDC).

### Monorepo strategies

When it detects a monorepo, the command lists the packages it found and asks
which approach to generate:

| Strategy                         | What it does                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path-filtered dynamic matrix** | A `changes` job runs `dorny/paths-filter@v4` with one filter per package dir (shared/root paths folded into every filter); its `changes` output is the matrix the build job fans out over, so only affected packages build. |
| **Static matrix**                | A matrix job over every package, every run.                                                                                                                                                                                 |
| **Root aggregator**              | One job running a root fan-out task (`turbo run` / `melos run` / `nx affected`).                                                                                                                                            |

A polyrepo is the simple single-job case: checkout → `jdx/mise-action` → the
phase steps at the repo root.

### Shape of a generated job

```yaml
env:
  MISE_ENV: ci # only when a mise.ci.toml variant exists
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: jdx/mise-action@v4 # installs ALL tools from mise — the only setup step
      - run: mise run code:lint
      - run: mise run test
```

## See also

- [../readme.md](../readme.md)
- [mise plugin](./mise.md) — the toolchain the generated workflows rely on.
