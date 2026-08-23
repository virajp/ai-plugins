---
type: vwf-environment
title: Environment & Secrets
description: Per-project inventory of environment variables and secrets —
  names, purpose, issuer, consumers. No values.
status: draft # draft | reviewed | stable
---

# Environment & Secrets

> **The authoritative inventory of every environment variable and secret the
> system needs** — names, purpose, issuer, and which projects consume them. It
> holds **no values**: values live only in the deployment env / secrets manager
> and are injected at runtime or build; nothing sensitive is committed. This
> catalog is **tool-agnostic** — it documents *what* variables exist and *where
> they come from*, not the injection tool (which is a decision recorded in
> `conventions.md#config`, once `/vwf:blueprint` has written it).

## Conventions

- **Variable** — the exact env var name / artifact injected.
- **Purpose** — what it configures or unlocks.
- **Source / issuer** — where an operator obtains or rotates the value.
- **Used by** — the registry project(s) that read it.
- **Required** — whether the project fails to start / build without it.
- **Secret** — `secret` · `non-secret` · `client-id`.

## installer (`frontend` / `cli`)

| Variable           | Purpose                                                                                            | Source / issuer                                                                                | Used by     | Required                                                         | Secret |
| ------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------- | ------ |
| `GITHUB_API_TOKEN` | Raises GitHub's anonymous rate limit, which is per source IP and so is shared across an egress NAT | GitHub → Settings → Developer settings → personal access token (read-only scope is sufficient) | `installer` | No — every call works unauthenticated until the limit is reached | secret |

The token is **attached when set and never requested**: a run without one is a
supported path, not a degraded one. Only a real rate limit — `429`, or `403`
with `x-ratelimit-remaining: 0` — surfaces the hint to set it, because a plain
`403` is an authorization failure a read-only token would not fix.

The npm registry call this project also makes is deliberately **tokenless**: it
reads public package metadata, and sending a GitHub token to a non-GitHub host
would be a credential leak.

## plugins (`system` / `plugin`)

No environment variables. The plugins are markdown, skills and hooks read by
Claude Code from the marketplace; nothing in the tree reads process environment
at runtime.

## Shared / cross-project

None.

## CI / CD

| Variable       | Purpose                                                                                           | Source / issuer                    | Type (`secret` \| `variable`) |
| -------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------- |
| `GITHUB_TOKEN` | The built-in job token — used by `deps-update.yml` to push the refresh and dispatch `release.yml` | Supplied per-job by GitHub Actions | secret                        |
| `GH_TOKEN`     | The same token, under the name the `gh` CLI reads                                                 | Bound from `secrets.GITHUB_TOKEN`  | secret                        |
| `MISE_ENV`     | Selects the `.config/mise.<env>.toml` variant; the workflows set `ci`                             | Set literally in the workflow      | variable                      |

**Publishing to npm uses OIDC trusted publishing and therefore has no stored
token at all** — no `NPM_TOKEN` exists or should be added. The trust is a
one-time configuration on npmjs.com binding this repo plus `release.yml` as the
package's single Trusted Publisher; a mismatch surfaces only at publish time as
`ENEEDAUTH`.

## Local development & test

Nothing here needs a production credential. The test suites run fully offline —
GitHub and registry calls are stubbed rather than issued — so a contributor with
no `GITHUB_API_TOKEN` and no npm account can run every gate. Secrets for
development, where a future project needs them, are injected by Doppler per the
`devtools:doppler` doctrine and never read from a committed file.

## Rotation

`GITHUB_API_TOKEN` is rotated at GitHub and re-exported in the developer's own
shell; nothing in this repo stores or caches it, so no code change follows a
rotation. The CI tokens are minted per job and expire with it, so they are never
rotated by hand.

## Adding a variable

1. Obtain or create the value at the issuer.
2. Store it in the deployment env / secrets manager for each environment — never
   in the repo.
3. Wire it into the consuming project's config loading (realization — see
   `plan`, not the blueprint).
4. Add a row to this catalog — name, purpose, issuer, used-by, required, secret
   — **no value**.
5. If it introduces a new integration or capability, reconcile
   `architecture.md`.
