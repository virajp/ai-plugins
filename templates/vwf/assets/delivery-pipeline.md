# Delivery Pipeline & Environments

The canonical environment vocabulary and the CI/CD contract every product
follows — **enforced, not elicited** (the engineering-baseline mechanism).
`<%= it.cmd("vwf:blueprint") %>` seeds it into `conventions.md#pipeline` on first touch; the
**cicd** plugin's workflow generator conforms to it when writing
pipelines; `<%= it.cmd("vwf:verify") %>` resolves environments by it. Exceptions are the
doc-note + `enforcement.rules` waiver pair (`pipeline/<rule>[/<unit>]`).

## Environments (canonical names)

Three environments, exact names. Like the standard flow slugs, synonyms are
recognized but normalized — a config or doc using a synonym is drift.

| Canonical     | Who it serves               | Built from     | Deployed by                      |
| ------------- | --------------------------- | -------------- | -------------------------------- |
| `development` | the developer's own machine | any branch     | never — run locally via mise     |
| `staging`     | testers only, controlled    | `develop` only | a `<project>-stage-v<x.y.z>` tag |
| `production`  | customers                   | `main` only    | a `<project>-prod-v<x.y.z>` tag  |

Synonyms: `dev`, `develop`, `local` → `development`; `test`, `stage` →
`staging`; `prod` → `production`. The `environments:` keys in `.config/vwf.yaml`
use the canonical names (`production_env` keeps its default meaning — the env
literally named `production`).

## The pipeline rules

1. **`pipeline/mise-built`** — CI environments are built by **mise only**
   (`jdx/mise-action`; `MISE_ENV: ci` when the repo has a ci variant): every
   tool a job uses is declared in the repo's mise config and installed by the
   action — never a language-setup action, `apt-get`, or a global install.
2. **`pipeline/tag-triggered-deploys`** — deploys are triggered **only by
   tags**, shaped `<project>-<env>-v<semver>` where `env` is `stage` (deploys to
   `staging`) or `prod` (deploys to `production`) — `api-prod-v1.2.3`,
   `web-stage-v0.4.0`. The `<project>` segment names the registry project being
   released, so one tag releases exactly one project; a **multi-repo member uses the repo
   name**, keeping one shape across layouts. Trigger globs are `*-stage-v*` and
   `*-prod-v*`; the workflow re-validates the full shape rather than trusting
   the glob. A branch push never deploys anything; `development` is never
   deployed at all.
3. **`pipeline/branch-validated`** — the deploy workflow **validates the tagged
   commit's branch** before deploying and fails otherwise: a `*-stage-v*` tag
   must be reachable from `develop`, a `*-prod-v*` tag from `main`
   (`git merge-base --is-ancestor <tag-commit> origin/<branch>`). A prod tag on
   a feature branch can never deploy.
4. **`pipeline/staging-is-not-a-release`** — a staging deploy is a test
   artifact, never a production release: nothing about it is announced,
   changelogged as released, or frozen. A production release is recorded only by
   `<%= it.cmd("vwf:verify") %>`'s clean run against `production` (the `apis/released/`
   snapshot + changelog per the release foundation).
5. **`pipeline/tested-before-release`** — no deploy step runs until the tagged
   project's tests **and its dependents'** tests pass in the same workflow run.
   A green commit status from an earlier run does not substitute: the release
   run proves it. Dependents are included because a release changes what they
   build against.

## How the surfaces apply it

- **`<%= it.cmd("vwf:blueprint") %>`** seeds `#pipeline` into `conventions.md` on first touch
  (beside `#baseline`) and normalizes environment synonyms it encounters in docs
  as drift to fix, never silently.
- **`<%= it.cmd("vwf:verify") %>`** resolves its target environment by canonical name (a synonym
  in `environments:` is flagged as drift); its release offer stays
  production-only — rule 4 is why.
- **The cicd plugin** (`<%= it.cmd("cicd:workflow") %>`) generates release
  workflows conforming to rules 1–3 and 5 when the repo carries this contract —
  one main workflow owning tag parsing, branch validation and the test gate,
  calling as few reusable sub-workflows as the repo's variation allows — and
  still asks its normal questions for everything the contract does not pin
  (runner, secrets, deploy commands, job shape).
- **The execute reviewers** treat a workflow file that violates the seeded
  `#pipeline` lines (a branch-push deploy, a setup-node step, a missing branch
  validation) as a finding like any conventions violation.
