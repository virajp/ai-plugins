---
type: vwf-conventions
title: Conventions
description: Cross-cutting decisions every flow and entity in this product
  follows.
status: draft # draft | reviewed | stable
---

# Conventions

<!-- Maintained by `blueprint`. Mirrors the `cross_cutting` block in
     registry.yaml; foundation anchors exist only for foundations the registry
     accepted. Anchors absent below are absent because this product has no
     surface for them, not because they are pending. -->

## Auth {#auth}

**None.** No project authenticates a user, holds a session, or issues a
credential. The only credential anywhere is an optional API token read from the
environment to raise a third-party rate limit — see [Config](#config) — and it
identifies the machine, never a person.

**Users & operators — one local actor.** The users foundation is *adapted*
rather than accepted: there is exactly one actor, the developer running the
agent on their own machine, and the authorization for every action is owning the
machine it runs on. There is no customer class, no operator class, no role
model, no membership record and no account lifecycle — so document-based RBAC
and account-status claims have nothing to describe. This is what every flow's
Trigger & Actors table already states row by row; it is stated once here so the
flows keep linking rather than restating it.

## Errors {#errors}

**Exit code plus a message that names the next action.** The full contract —
message shape, the exit-code table, and which failures are usage errors — is
[the design system's Terminal UX section](./design-system.md), because for a
terminal product the error contract *is* part of the user interface. It is not
restated here.

The one line worth repeating: **an unknown or retired option is an error that
names itself**, never a silent no-op.

## IDs {#ids}

**Not applicable.** Nothing in this product is stored, so nothing is identified.
The names it does handle — projects, plugins, extension points — are user-chosen
strings that are already unique within their scope.

## Observability {#observability}

**None.** The product emits no telemetry: no traces, no metrics, no logging
pipeline. A run's output is its report, and it goes to the terminal that asked
for it.

This is a deliberate scope decision rather than an omission — the product runs
on a developer's own machine, and a tool that phones home about a local workflow
would be a surprise.

## Config {#config}

**Environment variables only.** No secrets manager, no config service, no
credential file the product writes or reads.

Two categories, and the difference matters:

- **Runtime settings** — the workflow's own configuration, in a committed file
  per repo. See [Runtime settings](#runtime-settings).
- **Credentials** — supplied by the environment, never persisted by this
  product, never written to a file it controls, and never echoed in output.
  Every variable is catalogued by name in [environment.md](./environment.md) —
  names and purposes, never values.

## API conventions {#api}

**Not applicable.** No project publishes an API. Nothing here declares the
`service` platform, so there is no request/response contract, no error envelope
over the wire, and no pagination.

The product *consumes* third-party APIs — see [Integrations](#integrations) —
but consuming an API imposes no conventions on this product's own surface.

## Integrations {#integrations}

**The one place external product names belong.** Every other doc refers to these
by role, so a provider change falsifies one anchor rather than the whole
blueprint.

| Service          | Used for                                                                | Failure posture                                                     |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **GitHub**       | resolving what the toolkit's published line currently holds             | rate-limited anonymously; an optional token raises the limit        |
| **npm registry** | publishing the installer, and reporting its currently published version | a publish that finds its version already present skips, never fails |
| **Context7**     | fetching current library documentation during authoring                 | unreachable → the consuming workflow halts rather than guessing     |

**The rate-limit rule is a contract, not a detail.** The anonymous limit is *per
source IP*, so shared egress exhausts it between unrelated users. A token is
sent whenever the environment supplies one, and the hint to set one appears
**only** for a genuine rate limit — never for a plain authorization failure,
which a read-only token would not fix.

## Runtime settings {#runtime-settings}

**One committed configuration file per repo**, read at the start of a run and
never written mid-run without consent.

- **Committed, not machine-local** — the settings describe the *product* being
  built, so collaborators must see the same ones.
- **Absent means not onboarded**, and that is a distinct state from empty. A run
  that cannot find the file reports the repo as un-onboarded and names the
  command that fixes it, rather than assuming defaults.
- **A stamp is only ever written after the check that justifies it passes**, and
  is reverted if that check later fails within the same run — a stamp asserting
  a state the repo is not in is worse than no stamp.

## Engineering baseline {#baseline}

<!-- Seeded on first touch from the vwf engineering-baseline asset. Only the
     rules with a surface in this product are stated; see the closing note. -->

Enforced by default, never re-elicited. A deviation is recorded here **and** as
an `enforcement.rules` waiver.

1. **`baseline/boundary-validation`** — every input crossing a boundary is
   validated against its contract and **rejected, never coerced**. Here the
   boundary is the invocation surface: an unrecognized option is refused by
   name. This rule is the hard floor — it may be scope-waived for a named unit
   with a reason, never product-wide.
2. **`baseline/business-technical-separation`** — decision logic and plumbing
   never mix in one module. Transport, filesystem access and third-party calls
   live in their own units; the logic that decides *what* to do consumes them
   and is testable without them.
3. **`baseline/tolerant-reader`** — records this product reads but did not
   necessarily write are read tolerantly: unknown fields are ignored, and a
   record whose shape predates the current one is still honoured. This is
   load-bearing rather than theoretical — the product must correctly revert
   state recorded by versions of itself that no longer exist.
4. **`baseline/retry-discipline`** — retries only on idempotent operations,
   bounded, with backoff. A failure that a retry cannot fix is reported
   immediately rather than attempted again.
5. **`baseline/stateless-processes`** — every run is a one-shot process holding
   no state across invocations. Two runs may execute concurrently without
   corrupting each other's work.

**The other eleven baseline rules have no surface in this product** — nothing is
stored (`write-versioning`, `atomic-multi-write`, `server-time`, `soft-delete`,
`expand-contract`), no API is published (`idempotency-keys`, `error-envelope`,
`cursor-pagination`), there is no logging pipeline or long-lived process
(`structured-logs-no-pii`, `graceful-shutdown`), and there is no money
(`integer-money`).

`baseline/expand-contract` is the newest of them and the clearest case: it
governs how a **stored entity's** schema changes shape across releases, and this
product stores no entity. The rule states its own inapplicability on exactly
these terms.

They are recorded as **inapplicable, not waived**, and carry no
`enforcement.rules` entry: a waiver asserts a considered departure from a rule
that *applies*, which would be a false claim about rules this product has no
surface for.

This is the engineering baseline's third state, alongside enforced and waived.
It was added to vwf **because this product needed it** — the bar is a missing
*surface*, not missing work, and when in doubt the rule applies.

## Reliability {#reliability}

<!-- Core foundation, ADAPTED. The default asks for availability and latency
     SLOs per project carrying `service` or `site`; neither project carries
     either, so the targets are restated against what this product actually
     delivers. -->

**What must be available is not a server — it is two delivery surfaces.**
Neither project serves a request, so there is no availability SLO in the
request-success sense and **no latency SLO at all**. What a user depends on is
that the two things they fetch resolve:

| Surface                            | Available means                                                                  | Target                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| The marketplace manifest on `main` | The manifest parses and every per-plugin ref it pins resolves to an existing tag | Always — a push that breaks either is a release-blocking defect, not a budget spend                    |
| A published installer version      | The version on the registry installs and runs on a clean machine                 | Always, for every version ever published — an npm version is immutable and cannot be repaired in place |

**Neither target has an error budget to spend**, and that is the honest reading
rather than a strict one: both surfaces are either correct or broken for
everyone at once, there is no partial degradation to trade against velocity, and
the repair is a new commit or a new version rather than a recovery. So the
error-budget stance is that **a breach is a defect that stops other work**, not
an allowance drawn down. The alert conditions that detect a breach are
[Incidents](#incidents).

**Flow-level load and latency.** Every flow's Guarantees table carries a
`Load & latency` cell, and in this product every cell reads
`default — per conventions#reliability`. That default means: a single local
invocation, at whatever rate one developer invokes it, with no latency budget —
these are judgment-heavy agent runs whose duration is dominated by model calls
and by waiting for the user, and a p95 on that would measure the wrong thing.
The product deliberately accepts meaningful cost and duration per run
([product.md](./product.md) non-goals).

## Disaster recovery {#disaster-recovery}

<!-- Core foundation, ADAPTED. The default asks for RPO/RTO per datastore; this
     product has no datastore. What it has is release artifacts, and the
     question that matters is what stays recoverable if this machine or this
     account is lost. -->

**No datastore, so no RPO/RTO table.** Nothing here stores user data, so there
is no data loss to bound. What must survive is the material a user installs
from:

| Artifact                               | Recoverable from                                                                                                                         | Notes                                                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| The repository and its history         | GitHub, plus every local clone and worktree on any machine that has one                                                                  | Distributed by construction; a full GitHub loss still leaves working copies                                                   |
| The per-plugin `<name>-v<semver>` tags | The same clones — a tag is an ordinary git ref and is pushed, fetched and mirrored with the repo                                         | Losing a tag unpins the marketplace manifest, which is the failure that matters, not losing a file                            |
| Published installer versions           | The npm registry, which is the system of record; a version is **immutable** and can only be unpublished within the registry's own window | Not recoverable by this product — recovery for a bad version is publishing forward, per [Delivery pipeline](#pipeline) rule 7 |

**Backups are the platforms' own**, not something this product schedules: git
distribution and the registry's retention are the mechanism, and adding a
private mirror would duplicate them without adding a recovery path anyone would
reach for. **No restore drill cadence is set** — the restore path for the repo
is `git clone`, exercised continuously by ordinary work, and the one for a bad
published version is a release, which the release ritual already covers.

## Incidents {#incidents}

<!-- Core foundation, ADAPTED. The default assumes a running service, an
     on-call destination and per-project runbooks. This product has no service
     to page anyone about; its incidents are release failures. -->

**An incident here is a release that reached users broken**, not an outage.
There is no on-call rotation and no paging: the destination for every condition
is the maintainer, and the signal is a failing check rather than an alerting
service.

| Condition                                           | Detected by                                                      | Destination                                            | Response                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| CI red on `main`                                    | The per-push validation workflow                                 | The maintainer, via the repository's own notifications | Fix forward on `develop` and merge; `main` is merge-only, so it is never patched in place         |
| The marketplace manifest stops resolving            | The manifest validation on every push, and a failed user install | The maintainer                                         | Re-point the manifest at the last tag that resolves, per [Delivery pipeline](#pipeline) rule 7    |
| A published installer version fails a clean install | The post-release environment check, or a user report             | The maintainer                                         | Publish forward — the version is immutable; never unpublish a version users may already depend on |
| A dependency advisory fails a release run           | `osv-scanner` in the release workflow                            | The maintainer                                         | Update or override the dependency, or record a dated `osv-scanner.toml` ignore                    |

**Runbooks are not a tree.** The default asks for `docs/runbooks/` per deployed
project with health-failure triage and a DR restore; neither exists here because
no project exposes a health endpoint and the restore path is `git clone`. The
Response column above *is* the runbook, and it is short enough to be correct in
place rather than correct in a file nobody opens.

**Postmortems** are kept: an incident that reached users gets a stub — what
happened, the window, contributing causes, action items — and the action items
route through `/vwf:feedback` like any other production signal.

## Delivery pipeline {#pipeline}

<!-- Seeded on first touch from the vwf delivery-pipeline asset. -->

### Environments

| Canonical     | Who it serves               | Built from  | Deployed by                 |
| ------------- | --------------------------- | ----------- | --------------------------- |
| `development` | the developer's own machine | any branch  | never — run locally         |
| `production`  | users of the toolkit        | `main` only | a `installer-v<semver>` tag |

**There is no `staging`.** Neither project has a pre-production destination: one
is served directly from the default branch, and the other publishes to a package
registry that has exactly one. `pipeline/staging-is-not-a-release` is therefore
**inapplicable** rather than waived.

### Rules

1. **`pipeline/mise-built`** — every tool a CI job uses is declared in the
   repo's own tool config and installed from it. No language-setup action, no
   system package install, no global install. **Conforms today.**
2. **`pipeline/tag-triggered-deploys`** — a release is triggered **only by a
   tag**, never by a branch push. **Deviation, waived:** the canonical shape is
   `<project>-<env>-v<semver>`; this product uses **`<project>-v<semver>`**
   (`installer-v6.0.0`). The `<env>` segment is dropped because there is no
   `staging` for it to distinguish `production` from — it would encode a
   distinction this product does not have. The `<project>` segment is **kept**,
   and earns its keep as soon as a second project publishes. Waiver:
   `pipeline/tag-triggered-deploys`.
3. **`pipeline/branch-validated`** — the release workflow validates that the
   tagged commit is reachable from `main` before publishing, and fails
   otherwise. **Conforms today.** The version check that precedes it proves the
   tag and the manifest agree; it has never proved the commit was reviewed,
   which is the separate thing this rule asks for.
4. **`pipeline/staging-is-not-a-release`** — **inapplicable**; see above.
5. **`pipeline/tested-before-release`** — no publish step runs until the tests
   pass **in the same workflow run**; a green status from an earlier run does
   not substitute. **Conforms today.**
6. **`pipeline/load-proven`** — **inapplicable.** The rule triggers on a flow
   whose declared peak rate meets a threshold, proven by a load run on staging.
   Neither condition can be met: nothing here serves requests, every flow is a
   one-shot local invocation whose Load & latency cell defers to
   [Reliability](#reliability), and there is no `staging` to run against — the
   same absence that makes `pipeline/staging-is-not-a-release` inapplicable.
7. **`pipeline/rollback-path`** — every production deploy states a rollback, and
   the release act records its target. **Deviation, waived:** neither release
   path is a deploy with a redeployable predecessor. Rolling a plugin back is
   re-pointing the marketplace manifest at the previous `<name>-v<semver>` tag,
   which is a manifest edit rather than a deployment; an npm version is
   immutable once published, so rolling the installer back means publishing
   forward. Both mechanisms are unambiguous and neither is a *target a release
   record could name*, which is what the rule asks for. Waiver:
   `pipeline/rollback-path`.
8. **`pipeline/dependency-audit`** — every run that can lead to a release runs
   the ecosystem's lockfile vulnerability audit, and a known-critical advisory
   fails the run. **Conforms today:**
   `osv-scanner scan source
   --lockfile=pnpm-lock.yaml` gates both the release
   workflow (before publish) and the dependency-update workflow (before the
   refreshed lockfile can land), exiting non-zero on an advisory. Per-advisory
   waivers age visibly as `osv-scanner.toml` ignores rather than becoming silent
   policy.

**The publish is idempotent.** A run whose version is already published skips
rather than fails, so a re-pointed tag, a dispatch retry and a re-run are all
safe.

## Shared patterns {#patterns}

**Not applicable.** The registry declares no `packages` project, so there is no
shared-code layer whose placement rules would need pinning. The two projects
share no code by design.
