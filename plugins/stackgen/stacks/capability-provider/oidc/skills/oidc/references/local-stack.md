# OIDC issuer — local stack

## The mechanism is fixed

**A docker-composed OIDC issuer behind a `wait-on` readiness gate**, seeded with
the test principals the acceptance suite needs. The gate is vwf's one
non-negotiable harness mechanism, because the acceptance verifier needs a
deterministic ready signal — `sleep 5` is a guess that passes locally and fails
in CI.

An issuer is slower to become ready than most services: it usually has its own
datastore to migrate and keys to generate on first boot. Waiting for the
container is definitely not enough here; wait for the discovery document to be
served.

## Seed real principals, including the unhappy ones

The acceptance suite needs more than one working user. Seed the principals the
blueprint's flows actually require:

- an ordinary end user,
- an operator, on whichever plane the operator design chose,
- a **banned** or otherwise status-blocked user, because the coded response for
  that path is a contract requirement and is otherwise never exercised,
- where multi-issuer is in the design, principals from **both** issuers, since
  the `(iss, sub)` key is exactly the thing that breaks when it is untested.

## The fake, and the honesty it requires

Where running a real issuer locally is not worth it, keep verification behind a
seam and inject a verified-principal fake.

**Say so, explicitly, in the blueprint.** A product whose tests never verify a
real token has never tested `aud` — which is the most common real hole in an
OIDC integration, and the one a fake is guaranteed not to catch, because the
fake has no audience to get wrong.

The honest middle path is worth knowing: run the real issuer in CI and the fake
locally, so the check exists somewhere on the way to production even if it is
not in the fast inner loop.

## What the local stack does not prove

It does not prove anything about the **production** issuer's configuration —
its token lifetimes, its rotation schedule, its actual audience values. Those
are deployment configuration, and the place they get verified is
`/vwf:verify`'s environment mode, not here.
