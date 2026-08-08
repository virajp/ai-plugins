---
axis: deploy
name: Cloudflare Zero Trust Access
artifact: n/a
private_plane: cloudflare-zero-trust
---

# Deploy — Cloudflare Zero Trust Access

A **private plane** in front of a project that must not be publicly reachable —
an operator back-office, an internal tool, a staging surface. The project sits
behind an identity-aware proxy on its own hostname, so the admin plane is
invisible to the public internet rather than merely authenticated.

This composes with a hosting template rather than replacing one: it produces no
artifact and runs no code. The project still ships however its own deploy
template says; this decides who can reach it once it has.

## When a project belongs behind it, and when it does not

**Behind it:** anything whose user population is the team, an operator group, or
a named customer. Anything whose exposure has no upside — an internal API, an
admin surface, a metrics UI.

**Not behind it:** the product's public surface. An identity-aware proxy in
front of a consumer app is a sign-in wall the product already has, plus a second
identity system to keep in step with the first.

The decision is per project and belongs in the registry, because it changes what
the acceptance suite can reach.

## The policy shape

Least privilege means the policy allows a **named group**, not a domain. Two
rules that hold generally:

1. **Allow by group membership**, sourced from the identity provider the
   organisation already uses. An email-domain rule is not authorization — every
   new hire and every departed one is silently in scope.
2. **Deny by default, and keep exactly one bypass path**: a service credential,
   for automation. Two bypasses become three, and the third is the one nobody
   remembers.

The application's own authorization is unchanged and still runs. The proxy
decides who reaches the door; the product still decides what they may do.

## What the fronted project must expose

- Its **origin must not be reachable except through the proxy.** A hostname that
  answers directly is a private plane in name only — this is the failure that
  makes the whole arrangement decorative, and it is invisible from the outside.
- The proxy passes an **identity assertion**; the project verifies it rather
  than trusting a header. An unverified header is a forgeable one.
- The readiness endpoint the `health` harness capability requires — see below,
  because a probe that cannot get past the proxy is not a health check.

## Health and pre-production, the two the proxy changes

- **`health`** — an uptime probe reaching the proxy measures the proxy. Either
  the readiness path is excluded from the policy, or the probe presents the
  service credential. Decide which, and record it; the silent version of this is
  a green dashboard in front of a dead service.
- **`e2e_staging`** — a pre-production environment behind the proxy needs a
  service credential the test run can present, injected like any other secret
  and catalogued by name in `docs/blueprint/environment.md`. Without it the
  staging suite fails at the login page and reports it as an application error.

## Local development

The private plane does not exist locally, and should not be simulated. Local
runs reach the project directly, and the identity assertion the project verifies
in production is injected as a fake. The seam that makes that possible is the
same one the identity contract already requires.

## Cost shape

Billing follows **seats**, not traffic — the population allowed through, not the
requests they make. That makes it cheap for an operator plane and the wrong
shape for anything customer-facing, which is the same conclusion the scoping
rule above reaches from the other direction.

## What this template stays silent on

**Where the fronted project actually runs.** Zero Trust Access fronts a service;
it does not host one. Pairing this with a hosting template is vwf's job, and any
cloud's deploy template composes with it.
