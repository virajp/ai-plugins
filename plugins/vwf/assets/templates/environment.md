---
type: vwf-environment
title: Environment & Secrets
description: Per-project inventory of environment variables and secrets —
  names, purpose, issuer, consumers. No values.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Environment & Secrets

> **The authoritative inventory of every environment variable and secret the
> system needs** — names, purpose, issuer, and which projects consume them. It
> holds **no values**: values live only in the deployment env / secrets manager
> and are injected at runtime or build; nothing sensitive is committed. This
> catalog is **tool-agnostic** — it documents *what* variables exist and *where
> they come from*, not the injection tool (which is a decision recorded in
> [config](./conventions.md#config)).

<!-- Maintained by `blueprint`; bootstrapped and kept current by `setup`. One row
     per variable, grouped by the consuming project (names from the architecture
     registry). Record what a variable IS and where it comes from — never how the
     code reads it (which file/parser/loader consumes it is realization → plan).
     No values, ever. See the blueprint-authoring skill (environment-catalog). -->

## What belongs here

<!-- A row belongs here if it configures a project at runtime/build. Classify each:
     - **secret** — leaking its value grants access, allows impersonation, or
       incurs cost (API keys, signing keys, service-account credentials, webhook
       secrets, store-publishing creds). Never write the value.
     - **non-secret** — operational config with no access value (ports, log
       level, timeouts, emulator hosts, public base URLs). Cataloged for
       completeness; safe to see.
     - **client-id** — public, platform-restricted identifiers (e.g. a mobile
       app's config keys, OAuth client ids). Not access-granting; restriction,
       not secrecy, protects them. Listed under Client identifiers below. -->

## Conventions

- **Variable** — the exact env var name / artifact injected.
- **Purpose** — what it configures or unlocks.
- **Source / issuer** — where an operator obtains or rotates the value.
- **Used by** — the registry project(s) that read it.
- **Required** — whether the project fails to start / build without it (note any
  non-production default that exists for local/test only).
- **Secret** — `secret` · `non-secret` · `client-id` (per *What belongs here*).

## <Project Name> (`<type>`)

<!-- One section per consuming project, named as in the architecture registry.
     A variable shared by several projects: document it once under its primary
     owner and list every consumer in "Used by", or under Shared below. -->

| Variable | Purpose | Source / issuer | Used by | Required | Secret |
| -------- | ------- | --------------- | ------- | -------- | ------ |
|          |         |                 |         |          |        |

## Shared / cross-project

<!-- Variables read by more than one project; document once here rather than
     repeating per project. Omit this section if none. -->

## Client identifiers (public, restricted — not access-granting)

<!-- Public identifiers that are safe in client artifacts because a platform
     restriction (package + signing binding, bundle id, HTTP referrer, etc.),
     not secrecy, protects them. Name where they live and how they are rotated.
     Omit this section if the product ships no client. -->

## CI / CD

<!-- Secrets and variables the CI/CD pipeline needs (deploy credentials, region,
     registry URLs). Mark each as secret or variable. Omit if there is no CI. -->

| Variable | Purpose | Source / issuer | Type (`secret` \| `variable`) |
| -------- | ------- | --------------- | ----------------------------- |
|          |         |                 |                               |

## Local development & test

<!-- How local runs get their config without production secrets: emulators,
     placeholder ids, and test-only credentials. State plainly that these are
     non-production and grant no access to real infrastructure, and that no
     production secret is ever committed. -->

## Rotation

<!-- Secrets are rotated at the issuer and updated in the deployment env / secrets
     manager; no code change is needed (values are env-injected at runtime/build).
     Note any variable with a rotation cadence or coordination requirement. -->

## Adding a variable

1. Obtain or create the value at the issuer (console / dashboard).
2. Store it in the deployment env / secrets manager for each environment (dev /
   staging / prod) — never in the repo.
3. Wire it into the consuming project's config loading (this is realization —
   see `plan`, not the blueprint).
4. Add a row to this catalog — name, purpose, issuer, used-by, required, secret
   — **no value**.
5. If it introduces a new integration or capability, reconcile
   [architecture.md](./architecture.md).
