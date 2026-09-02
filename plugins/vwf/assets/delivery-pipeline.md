# Delivery Pipeline & Environments

The canonical environment vocabulary and the CI/CD contract every product
follows — **enforced, not elicited** (the engineering-baseline mechanism).
`/vwf:blueprint` seeds it into `conventions.md#pipeline` on first touch; the CI
system pinned on the project's `cicd` axis conforms to it when writing
pipelines; `/vwf:verify` resolves environments by it. Exceptions are the
doc-note + `enforcement.rules` waiver pair (`pipeline/<rule>[/<unit>]`).

**This file states what a pipeline must guarantee, never how one is spelled.**
The trigger grammar, the branch mapping, the reachability check and the workflow
syntax that express these rules belong to the CI system the project pins — which
is why the rules below name a requirement and its recommended default rather
than a mechanism.

## Environments (canonical names)

Three environments, exact names. Like the standard flow slugs, synonyms are
recognized but normalized — a config or doc using a synonym is drift.

| Canonical     | Who it serves               | Built from                                   | Deployed by                       |
| ------------- | --------------------------- | -------------------------------------------- | --------------------------------- |
| `development` | the developer's own machine | any branch                                   | never — run locally via mise      |
| `staging`     | testers only, controlled    | one designated branch (`develop` by default) | a deliberate release act (rule 2) |
| `production`  | customers                   | one designated branch (`main` by default)    | a deliberate release act (rule 2) |

**Each deployed environment releases from exactly one branch** — that much is
the contract, because rule 3 has nothing to validate against otherwise. *Which*
branch is the product's to choose; `develop` and `main` are the recommended
default, and a product that names others records them in
`conventions.md#pipeline` so the pipeline and the reviewers read the same pair.

Synonyms: `dev`, `develop`, `local` → `development`; `test`, `stage` →
`staging`; `prod` → `production`. The `environments:` keys in `.config/vwf.yaml`
use the canonical names (`production_env` keeps its default meaning — the env
literally named `production`).

## The pipeline rules

1. **`pipeline/mise-built`** — CI environments are built by **mise only**: every
   tool a job uses is declared in the repo's mise config and installed from it —
   never a language-setup action, a system package install, or a global install.
   Two sources of truth for a toolchain always drift, and the drift surfaces as
   "works on my machine" against the one thing a pinned toolchain exists to
   prevent. *How* the CI system installs mise itself, and how it selects a CI
   environment variant, is that system's business and is not pinned here.
2. **`pipeline/tag-triggered-deploys`** — a deploy is **deliberate**: an
   explicit, recorded act that names what ships and where, never a side effect
   of a branch push. Merging is not releasing, and `development` is never
   deployed at all. Whatever expresses that act must identify **one project and
   one environment per release** (so a multi-repo and a monorepo release the
   same way) and must be re-validated by the pipeline rather than trusted from
   its trigger.

   The **recommended default is a git tag** shaped `<project>-<env>-v<semver>`
   — `api-prod-v1.2.3`, `web-stage-v0.4.0`. A product may choose another
   mechanism provided it still satisfies the paragraph above; the grammar, the
   trigger globs and the parsing belong to the CI system's own doctrine, not to
   this file. (The rule id keeps its original spelling so existing waivers
   naming it keep resolving.)
3. **`pipeline/branch-validated`** — the deploy **proves the commit it is about
   to ship is reachable from the branch that environment releases from**, and
   fails otherwise. Nothing about a release act's existence proves the commit it
   names was reviewed or merged — a release pointed at a feature branch would
   otherwise ship unreviewed code under an official version. How the pipeline
   proves reachability is the CI system's business.
4. **`pipeline/staging-is-not-a-release`** — a staging deploy is a test
   artifact, never a production release: nothing about it is announced,
   changelogged as released, or frozen. A production release is recorded only by
   `/vwf:verify`'s clean run against `production` (the `apis/released/`
   snapshot + changelog per the release foundation).
5. **`pipeline/tested-before-release`** — no deploy step runs until the released
   project's tests **and its dependents'** tests pass in the same pipeline run.
   A green commit status from an earlier run does not substitute: the release
   run proves it. Dependents are included because a release changes what they
   build against.
6. **`pipeline/load-proven`** — before the **first production release** of a
   flow whose declared peak rate (its Guarantees table's Load & latency cell)
   meets a threshold (default `~10/s`), a load run on staging demonstrates the
   stated SLO holds at the declared peak; evidence linked in the release
   record. Mechanism and tooling (the load-test tool, how the run is triggered
   and scored) belong to the CI system pinned on the project's `cicd` axis;
   waivable via the standard `pipeline/…` doc-note + `enforcement.rules` waiver
   pair, like any other pipeline rule.

## How the surfaces apply it

- **`/vwf:blueprint`** seeds `#pipeline` into `conventions.md` on first touch
  (beside `#baseline`) and normalizes environment synonyms it encounters in docs
  as drift to fix, never silently. Where the product designates branches other
  than the default pair, they are recorded there too.
- **`/vwf:verify`** resolves its target environment by canonical name (a synonym
  in `environments:` is flagged as drift); its release offer stays
  production-only — rule 4 is why.
- **The CI system pinned on the project's `cicd` axis** generates pipelines
  conforming to rules 1–3, 5, and 6 when the repo carries this contract, and
  asks its own questions for everything the contract does not pin (runner,
  secrets, deploy commands, job shape, the load-test tool). It owns the
  mechanism these rules deliberately leave open — including the recommended
  tag grammar itself. vwf never names that system: the pin is a config key,
  and the doctrine behind it ships with whichever plugin claims the axis.
- **`/vwf:plan`** injects a `test:load` harness-capability preflight step (per
  its delta-checks) when a chain element's declared peak rate meets rule 6's
  threshold, so the load run exists before the release it gates.
- **The execute reviewers** treat a pipeline file that violates the seeded
  `#pipeline` lines (a branch-push deploy, a per-language toolchain install, a
  missing branch validation) as a finding like any conventions violation.
