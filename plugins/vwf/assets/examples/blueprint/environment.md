---
type: vwf-environment
title: Environment & Secrets
description: Per-project inventory of the commerce slice's env vars and secrets
  — no values.
status: reviewed
tags: [ config, secrets ]
---

# Environment & Secrets

> The authoritative inventory of every environment variable and secret the
> system needs — names, purpose, issuer, and consumers. **No values**: values
> live only in the secrets manager / deployment env and are injected at runtime.
> The injection mechanism (the decision) is [config](./conventions.md#config).

<!-- Conformance example (blueprint-format 3). A worked, format-valid catalog:
     mandatory frontmatter, rows grouped by consuming project, every row
     classified, the config mechanism linked (not restated), and no values.
     This bundle omits architecture.md for brevity, so project names (api, web,
     ci) are illustrative registry names, not live links. -->

## What belongs here

A row belongs here if it configures a project at runtime or build. Each row is
classified `secret` (leaking it grants access or incurs cost), `non-secret`
(operational config, no access value), or `client-id` (public, restricted).

## Conventions

- **Variable** — the exact env var name injected.
- **Purpose** — what it configures or unlocks.
- **Source / issuer** — where an operator obtains or rotates the value.
- **Used by** — the registry project(s) that read it.
- **Required** — whether the project fails to start without it.
- **Secret** — `secret` · `non-secret` · `client-id`.

## API (`service`)

| Variable               | Purpose                                          | Source / issuer     | Used by   | Required            | Secret     |
| ---------------------- | ------------------------------------------------ | ------------------- | --------- | ------------------- | ---------- |
| `PAYMENTS_API_KEY`     | Server secret for the payment provider (charges) | Payments dashboard  | api       | yes                 | secret     |
| `PAYMENTS_WEBHOOK_KEY` | Verifies inbound payment webhook signatures      | Payments dashboard  | api       | prod (test default) | secret     |
| `SESSION_SIGNING_KEY`  | Signs/verifies bearer session tokens             | Generated, org-held | api       | yes                 | secret     |
| `LOG_LEVEL`            | Log verbosity (`debug`…`error`)                  | Deployment env      | api · web | no (default `info`) | non-secret |

## Web (`site`)

| Variable              | Purpose                                              | Source / issuer | Used by | Required | Secret     |
| --------------------- | ---------------------------------------------------- | --------------- | ------- | -------- | ---------- |
| `PUBLIC_API_BASE_URL` | Base URL the browser calls the API at (SSR + client) | Deployment env  | web     | yes      | non-secret |

## Shared / cross-project

`LOG_LEVEL` is read by both `api` and `web`; it is catalogued once under API
above with both consumers listed in *Used by*.

## CI / CD

| Variable        | Purpose                              | Source / issuer | Type       |
| --------------- | ------------------------------------ | --------------- | ---------- |
| `DEPLOY_TOKEN`  | Authenticates the deploy to the host | Host IAM        | `secret`   |
| `DEPLOY_REGION` | Target region for the deploy         | manual          | `variable` |

## Local development & test

Local runs use a **test** payment key and a fixed non-production
`SESSION_SIGNING_KEY`, with `PUBLIC_API_BASE_URL` pointed at `localhost`. These
are non-production and grant no access to real infrastructure; no production
secret is ever used or committed for local dev.

## Rotation

Secrets are rotated at the issuer and updated in the secrets manager; no code
change is needed (values are env-injected). `PAYMENTS_WEBHOOK_KEY` must be
rotated in lock-step with the provider's webhook endpoint config.

## Adding a variable

1. Obtain/create the value at the issuer.
2. Store it in the secrets manager for each environment (dev/staging/prod).
3. Wire it into the consuming project's config loading (realization — see
   `plan`).
4. Add a row here — name, purpose, issuer, used-by, required, secret — **no
   value**.
5. If it introduces a new integration, reconcile the architecture registry.
