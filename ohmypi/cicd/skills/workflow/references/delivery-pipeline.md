# The vwf delivery-pipeline contract

Read this whenever the pipeline being generated is a **release or deploy**
pipeline. A CI-only pipeline (lint/test/build) never needs it. The skill's own
rules — mise installs everything, run through mise, both layouts — still apply
and are not repeated here.

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
  /skill:verify, not CI.

Without the contract, release triggers are elicited as normal (the skill's §4)
— but offer this shape as the recommended default.
