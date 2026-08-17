# cicd plugin

The `cicd` plugin gives your agent a `/cicd:workflow` skill that writes a repo's
delivery pipeline. **GitHub Actions is one implementation, not the plugin's
identity** — the skill resolves which CI system the repo uses, then reads only
that system's reference. Adding a second CI system is one new reference file and
one config value; there is no second skill and no second plugin.

Whichever system it targets, the generated pipeline installs **every** tool
through [mise](https://mise.jdx.dev) — no per-language setup steps, no shell
installs — and supports both **multi-repo** (a single project) and **monorepo**
(many packages) layouts, detecting which one you have and asking how to handle
it. It is a single user-invoked skill; nothing auto-applies, and nothing
delegates to it.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

```sh
claude plugin install cicd@virajp-plugins
```

Add `--scope project` to either command to scope to one repo instead of every
repo on your machine.

There is no default install set any more, so every plugin here — this one
included — is installed by name; nothing pins it to `--all` or excludes it from
one. Install it when a repo actually wants pipelines generated.

It needs `mise` on your `PATH` — a missing binary is no longer an install-time
failure, it surfaces as a `/vwf:doctor` blocking finding, so run `/vwf:doctor`
after installing. It pairs naturally with the [`devtools`](./devtools.md)
plugin: the pipelines it writes assume mise provides the toolchain, so a repo
with no mise config should run
[`/devtools:scaffold`](./devtools.md#devtoolsscaffold) first.

**It is not a [`vwf`](./vwf.md) dependency**, deliberately. vwf owns the
*contract* a delivery pipeline must satisfy (`assets/delivery-pipeline.md`);
this plugin owns the *mechanism* that satisfies it on a given CI system. Nothing
in vwf delegates to `/cicd:workflow` — every mention of it there is prose
recommending it to you — so vwf has no reason to force its install. Install it
when you want pipelines generated; vwf works without it.

## Resolving the CI system

The skill's first act, before it inspects anything else:

1. the project's `cicd` key in `.config/vwf.yaml` — `projects.<name>.cicd`,
   alongside `design` and the `stack` block since `config_format` 13;
2. asking you, and offering to record the answer there.

There is no third step. **It never detects the CI system from the repo and never
defaults to one** — repo detection was deliberately removed, because
`.github/workflows/` in a repo migrating *off* GitHub Actions is exactly the
signal that would mislead, and a silent default is how a GitLab repo ends up
with `.github/workflows/`. An absent key, and a token this plugin does not
implement yet, are both questions.

| `cicd`           | Status                                                       |
| ---------------- | ------------------------------------------------------------ |
| `github-actions` | implemented — `skills/workflow/references/github-actions.md` |
| anything else    | resolved, then reported as unimplemented                     |

On an unimplemented token the skill stops and says which token it resolved,
rather than improvising that system's syntax.

## The hard rules

Every pipeline the skill writes obeys these on **every** CI system, without
exception:

1. **mise installs everything.** The single tool-setup step installs the repo's
   mise toolchain. The skill never adds a per-language setup step or SDK action,
   or shell installs (`apt-get`, `brew install`, `npm i -g`, `pipx`). Every tool
   a job needs is declared in the repo's mise `[tools]`.
2. **Run through mise.** Steps invoke tooling via `mise run <task>` (when the
   repo has a mise task library) or `mise exec -- <cmd>` — never a binary the
   toolchain step did not put on `PATH`.
3. **Both layouts.** It generates the structure matching a multi-repo or a
   monorepo (with a chosen fan-out strategy).
4. **CI env.** It sets a pipeline-level `MISE_ENV: ci` when the repo defines a
   `mise.ci.toml` variant, matching this marketplace's
   [mise convention](./devtools.md#the-three-file-split).
5. **Every third-party building block is pinned** to an explicit version.

## /cicd:workflow

`/cicd:workflow [workflow-name | ci | release | deploy]` follows a **resolve →
detect → ask → write → report** flow:

1. **Resolve** the CI system (above).
2. **Detect.** It inspects the repo for layout (monorepo signals —
   `pnpm-workspace.yaml`, `package.json` `workspaces`, `melos.yaml`, `nx.json`,
   `turbo.json`, a Cargo `[workspace]`, `go.work`, or manifests in
   sub-directories — else multi-repo), the mise config (and whether a
   `mise.ci.toml` variant and a task library exist), the declared `[tools]`, and
   any existing pipeline files.
3. **Ask** — one batched round, only what it can't infer: which pipeline (CI,
   release/publish, deploy, or custom) and its triggers; which mise tasks (or
   inline commands) map to each phase; for a monorepo, which strategy; and job
   shape (runner, fan-out, concurrency, permissions, secrets/OIDC).
4. **Write** the pipeline files where the resolved system keeps them.
5. **Report** what was written, how the CI system was resolved, and the
   prerequisites you must satisfy (tools under `[tools]`, the task names the
   steps call, any secrets/OIDC).

### Monorepo strategies

When it detects a monorepo, the skill lists the packages it found and asks which
approach to generate. Each maps onto the CI system's own fan-out primitive:

| Strategy                    | What it does                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Change-filtered fan-out** | A filter job emits the affected-package list (shared/root paths folded into every filter) and the build job fans out over it, so only affected packages build. |
| **Static fan-out**          | Every package, every run.                                                                                                                                      |
| **Root aggregator**         | One job running a root fan-out task (`turbo run` / `melos run` / `nx affected`).                                                                               |

A multi-repo is the simple single-job case: checkout → install mise → the phase
steps at the repo root.

### Release pipelines

For a server-side project, releases are **not elicited** — they follow vwf's
delivery-pipeline contract: tag-triggered only on `<project>-<env>-v<semver>`,
branch-validated, and gated on the tagged project's and its dependents' tests
passing in the same run. The skill reads that contract from the repo and pins
the trigger, tag scheme, branch validation and test gate from it, asking only
what the contract leaves open (runner, secrets/OIDC, the deploy commands inside
the release task, job shape). Staging is never a release.

vwf states the requirement; this plugin states the mechanism — which is why the
contract lives in vwf and stays there.

### Shape of a generated job

Illustrated in GitHub Actions, the one system implemented today. The shape — one
toolchain step, then `mise run` for everything else — is what every reference
must express in its own syntax.

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

## Adding a CI system

Write `skills/workflow/references/<tool>.md` and add its row to the skill's
routing table. The reference owns the file location and format, how mise is
installed, the fan-out primitive, and how the delivery-pipeline contract is
expressed in that system's syntax. Nothing else changes.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the delivery-pipeline contract this plugin
  implements.
- [devtools plugin](./devtools.md) — the toolchain the generated pipelines rely
  on.
