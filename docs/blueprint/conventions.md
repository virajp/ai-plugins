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

**The other ten baseline rules have no surface in this product** — nothing is
stored (`write-versioning`, `atomic-multi-write`, `server-time`, `soft-delete`),
no API is published (`idempotency-keys`, `error-envelope`, `cursor-pagination`),
there is no logging pipeline or long-lived process (`structured-logs-no-pii`,
`graceful-shutdown`), and there is no money (`integer-money`).

They are recorded as **inapplicable, not waived**, and the distinction is
deliberate: a waiver asserts a considered departure from a rule that applies,
which would be a false claim about rules this product has no surface for. See
[the format-fit gap](../memory/gaps/2026-08-27-plugin-flow-granularity.md); vwf
has no vocabulary for this state yet, and probably should.

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
   otherwise. **Not met today** — no such check exists, so a tag on any branch
   would publish. Stated as the contract; the delta is a planning item.
4. **`pipeline/staging-is-not-a-release`** — **inapplicable**; see above.
5. **`pipeline/tested-before-release`** — no publish step runs until the tests
   pass **in the same workflow run**; a green status from an earlier run does
   not substitute. **Conforms today.**

**The publish is idempotent.** A run whose version is already published skips
rather than fails, so a re-pointed tag, a dispatch retry and a re-run are all
safe.

## Shared patterns {#patterns}

**Not applicable.** The registry declares no `packages` project, so there is no
shared-code layer whose placement rules would need pinning. The two projects
share no code by design.
