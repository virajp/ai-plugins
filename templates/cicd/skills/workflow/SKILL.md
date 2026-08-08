---
name: workflow
description: Generate this repo's delivery pipeline for whichever CI system it
  uses. Resolves the CI tool from the project's config key (asking when it is
  absent), then reads that tool's reference and writes the pipeline files.
  Every tool is installed through mise.
argumentHint: "[workflow-name | ci | release | deploy]"
model: sonnet
effort: high
invocation: user
---

# cicd:workflow — Generate a delivery pipeline

Write this repo's CI/CD pipeline. **This skill owns what is true of every CI
system**; the per-tool reference owns the file format, the syntax, and the
vendor's own primitives. Adding a CI system is one new reference file and one
config value — never a new skill.

Default the pipeline's name from `$ARGUMENTS` (e.g. `ci`, `release`, `deploy`)
or ask.

## 1. Resolve the CI tool — before anything else

Read, in order, and stop at the first answer:

1. **The project's `cicd` in `.config/vwf.yaml`** — `projects.<name>.cicd`, a
   per-project key alongside `design` and the `stack` block, since
   `config_format` 13. When the repo holds more than one registry project,
   resolve the one this pipeline is for; if that is ambiguous, ask which
   project.
2. **Ask the user.** An absent key, or a token with no reference below, is a
   question — never a guess. Offer to record the answer at
   `projects.<name>.cicd` so the next run does not ask again.

**Never detect the CI system from the repo, and never default to one.** Both are
ways of answering a question nobody asked: `.github/workflows/` in a repo
migrating *off* GitHub Actions is exactly the signal that would mislead, and a
silent default is how a GitLab repo ends up with `.github/workflows/`. The
config key is the answer; asking is the fallback. If the resolved token has no
reference file, stop and say which token you resolved and that this plugin does
not implement it yet — do not improvise the syntax.

### Routing table

| `cicd`           | Reference                                      |
| ---------------- | ---------------------------------------------- |
| `github-actions` | [github-actions](references/github-actions.md) |

Read **only** the resolved tool's reference. Everything below is tool-agnostic
and applies whichever one it is.

## 2. Hard rules (never violate, on any CI system)

1. **mise installs everything.** The pipeline's only tool-setup step is the one
   that installs the repo's mise toolchain. NEVER add a per-language setup step
   or SDK action, `apt-get` / `brew install`, `npm i -g`, `pipx`, or any other
   installer. Every tool a job needs must be declared in the repo's mise config
   (`[tools]`). *How* mise itself is installed is the reference's business.
2. **Run through mise.** Steps invoke tooling via `mise run <task>` (when the
   repo has a mise task library) or `mise exec -- <cmd>` — never a binary the
   toolchain step did not put on `PATH`.
3. **Support both layouts.** Detect monorepo vs polyrepo and generate the
   matching structure; ask which monorepo strategy to use (§4).
4. **CI env.** Set a pipeline-level `MISE_ENV: ci` when the repo defines a
   `mise.ci.toml` variant (the project convention — loads CI-only tools/env).
   Omit it when the repo has only a flat `mise.toml`.
5. **Pin every third-party building block** to an explicit version. The
   reference names the versions this marketplace already uses.

## 3. Detect

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
- **The CI system's existing pipeline files** (the reference names where they
  live) — don't clobber; pick a non-colliding name.
- For a **release** pipeline: the vwf pipeline contract
  (`docs/blueprint/conventions.md#pipeline`), the registry project names
  (`docs/blueprint/registry.yaml`), how the workspace answers "who depends on
  this package" (`pnpm --filter '<pkg>...'`, `cargo tree`, `go list`, melos,
  turbo/nx), and how far the subprojects' deploy needs actually diverge — that
  last one decides how far the pipeline is split.

If there is **no mise config**, stop and tell the user to run
<%= it.cmd("devtools:scaffold") %> first (the pipeline depends on mise providing the
toolchain). Only proceed with a minimal `mise.toml` if they insist.

## 4. Ask (one batched round — only what you cannot infer)

1. **Which pipeline?** CI (lint/test/build), release/deploy, or custom — and its
   **triggers** (pushes, pull/merge requests, tags, manual runs; which branches
   or tag globs). **Skip the trigger question entirely for a release/deploy
   pipeline in a repo carrying the vwf pipeline contract** — it pins the
   trigger, tag scheme, branch validation and test gate (§5).
2. **Steps source.** If a mise task library exists, confirm which tasks map to
   the pipeline's phases (e.g. `code:lint`, `test`, `build`, `i:release`). If
   none exists, fall back to inline `mise exec -- <cmd>` and confirm the
   commands.
3. **If monorepo, which strategy:**
   - **change-filtered fan-out** — build only the packages that changed;
   - **static fan-out** — every package, every run;
   - **root aggregator** — one job running a root fan-out task (turbo / melos /
     nx). Show the detected package list so the user can confirm/trim it.

   Each maps onto the CI system's own fan-out primitive; the reference gives the
   spelling.
4. **Job shape:** runner/image (the reference gives the default), any OS/version
   fan-out, concurrency control, permissions, dependency caching beyond what the
   mise step already caches, and — for release/deploy — the secrets / OIDC /
   registries needed.

Don't invent triggers, task names, secrets, or package paths — ask.

## 5. The vwf delivery-pipeline contract

For a **server-side project deployed to cloud or a data center**, releases are
not elicited — they follow a fixed architecture, and **vwf owns it**. Check
whether the repo carries the contract
(`docs/blueprint/conventions.md#pipeline`, or a vwf installation providing
`assets/delivery-pipeline.md`). **Read that file — it is the source of truth,
and this skill does not restate it.** When the repo carries it, the contract
pins the trigger, the tag scheme, the branch validation and the test gate — **do
not ask about any of them**; ask only what it leaves open (runner, secrets/OIDC,
the deploy commands inside the release task, job shape).

What the contract requires the generated pipeline to express, on any CI system:

- **Tag-triggered only**, on `<project>-<env>-v<semver>` — `api-prod-v1.2.3`,
  `web-stage-v0.4.0`. `env` is `stage` (→ `staging`, from `develop`) or `prod`
  (→ `production`, from `main`); `<project>` names the registry project
  released, so one tag releases exactly one project. A **polyrepo uses the repo
  name** (`myservice-prod-v1.2.3`) so the shape never varies by layout. Parse
  **right-to-left** — project names contain hyphens.
- **Branch validation.** The tagged commit must be reachable from the branch its
  environment maps to, or the run fails. A prod tag on a feature branch can
  never deploy.
- **Tested before released.** The tagged project *and its dependents* are tested
  in the same run, and no deploy step starts until every one of them passes.
- **One deploy path, split as little as the repo allows.** Everything common to
  every subproject — tag parsing, branch validation, the test gate — is written
  once; only the deploy itself is factored per project. Split it further only
  when two subprojects differ in something the CI system itself must express (a
  different OIDC provider, registry login, or environment approval rule).
  Differences in *build or deploy commands* are not a reason: those live in the
  mise task, which already varies per project.
- **Release task naming.** `mise run <project>:release:<environment>` in a
  monorepo, `mise run release:<environment>` in a polyrepo — the environment is
  the **canonical** name (`staging` / `production`), never the tag's short form.
  Tests are `<project>:test` / `test` the same way. Confirm these tasks exist
  (`mise tasks`); if the workspace's package identifiers differ from the mise
  task prefixes, ask for the mapping rather than guessing it.
- **Staging is not a release.** A `*-stage-v*` run never publishes packages,
  creates release records, or updates changelogs — those belong only to the
  `*-prod-v*` path, and the release *record* itself belongs to
  <%= it.cmd("vwf:verify") %>, not CI.

Without the contract, release triggers are elicited as normal (§4) — but offer
this shape as the recommended default.

## 6. Write

Follow the resolved tool's reference for file locations, syntax, and the
per-layout structures. Keep the output minimal — only the jobs and steps the
chosen pipeline needs.

## 7. Report

State the files written, the CI tool you resolved **and how you resolved it**
(the config key, or the user's answer), the layout and strategy
chosen, and the prerequisites the user must satisfy:

- the mise config must declare every tool the steps need under `[tools]` (and a
  `mise.ci.toml` if `MISE_ENV: ci` was set);
- any task names the steps call must exist (`mise tasks`); if no task library
  exists, suggest <%= it.cmd("devtools:scaffold") %>;
- any secrets / OIDC / registries the pipeline references must be configured in
  the CI system's own settings.

## Adding a CI system

Write `references/<tool>.md` and add its row to the routing table above. The
reference owns the file location and format, how mise is installed, the fan-out
primitive, and how §5's contract is expressed in that system's syntax. Nothing
else in this skill changes, and no new plugin is created.
