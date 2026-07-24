# Delivery Pipeline & Environments

The canonical environment vocabulary and the CI/CD contract every product
follows — **enforced, not elicited** (the engineering-baseline mechanism).
`/vwf:blueprint` seeds it into `conventions.md#pipeline` on first touch; the
**github-actions** plugin's workflow generator conforms to it when writing
pipelines; `/vwf:verify` resolves environments by it. Exceptions are the
doc-note + `enforcement.rules` waiver pair (`pipeline/<rule>[/<unit>]`).

## Environments (canonical names)

Three environments, exact names. Like the standard flow slugs, synonyms are
recognized but normalized — a config or doc using a synonym is drift.

| Canonical     | Who it serves               | Built from     | Deployed by                  |
| ------------- | --------------------------- | -------------- | ---------------------------- |
| `development` | the developer's own machine | any branch     | never — run locally via mise |
| `staging`     | testers only, controlled    | `develop` only | a `stage-*` tag              |
| `production`  | customers                   | `main` only    | a `prod-*` tag               |

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
   tags**: `stage-*` deploys to `staging`, `prod-*` to `production`. A branch
   push never deploys anything; `development` is never deployed at all.
3. **`pipeline/branch-validated`** — the deploy workflow **validates the tagged
   commit's branch** before deploying and fails otherwise: a `stage-*` tag must
   be reachable from `develop`, a `prod-*` tag from `main`
   (`git merge-base --is-ancestor <tag-commit> origin/<branch>`). A prod tag on
   a feature branch can never deploy.
4. **`pipeline/staging-is-not-a-release`** — a staging deploy is a test
   artifact, never a production release: nothing about it is announced,
   changelogged as released, or frozen. A production release is recorded only by
   `/vwf:verify`'s clean run against `production` (the `apis/released/`
   snapshot + changelog per the release foundation).

## How the surfaces apply it

- **`/vwf:blueprint`** seeds `#pipeline` into `conventions.md` on first touch
  (beside `#baseline`) and normalizes environment synonyms it encounters in docs
  as drift to fix, never silently.
- **`/vwf:verify`** resolves its target environment by canonical name (a synonym
  in `environments:` is flagged as drift); its release offer stays
  production-only — rule 4 is why.
- **The github-actions plugin** (`/github-actions:workflow`) generates deploy
  workflows conforming to rules 1–3 when the repo carries this contract, and
  still asks its normal questions for everything the contract does not pin
  (runner, secrets, job shape).
- **The execute reviewers** treat a workflow file that violates the seeded
  `#pipeline` lines (a branch-push deploy, a setup-node step, a missing branch
  validation) as a finding like any conventions violation.
