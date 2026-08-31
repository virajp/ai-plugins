# Local dev — Cloud SQL

**There is no emulator for this service.** The local stack is **Docker-composed
Postgres on production's major version**, behind a readiness gate, with
migrations run against it as a task.

`assets/contracts/local-stack.md` is the harness contract and applies here in
full — this file states only what is specific to this service. The provider's
emulator map, for the services that do have one, is the `gcp` skill's
local-development reference.

## Why the real engine rather than a fake

The engine is open and runs in a container, so there is no reason to test against
anything else. A fake in-memory store would diverge exactly where it matters —
transaction semantics, constraint enforcement, the query planner's answer to
"does this index get used" — and those are the properties this datastore was
chosen for.

**Pin the major version to production's.** A local stack a version ahead accepts
syntax production rejects, and one behind rejects syntax production accepts;
either way the failure lands on a deploy rather than in a test.

## The readiness gate

Two layers, per the contract, and both are needed:

1. The compose runtime's healthcheck barrier, honouring the container's own
   healthcheck.
2. A gate on the **application-level** signal — for this service, that the
   migrations have run. A server accepting connections is not a migrated schema,
   and a test suite that starts between the two fails in a way that looks like a
   product bug.

**A fixed sleep in place of either is a finding, not a variant.** It is long
enough on a laptop and short enough on a loaded CI runner, which makes it the
most common cause of a suite that fails only in CI.

## Migrations and seed data

Run migrations against the local stack **as a task**, the same task the release
uses. That is what keeps a migration tested before it is applied to anything
that matters.

Seed **through the interface the product uses**, so the seed exercises the write
path rather than bypassing it — a seed written in raw SQL will happily create
rows the application could never have produced, and the tests that pass against
them prove nothing.

**Reset state between runs**, not between assertions. Data is disposable; a test
that only passes on the second run depends on leftovers.

## What does not reproduce locally

- **The connection limit and the connector.** Locally there is no IAM and no
  ceiling, so the connection trap is invisible until the compute service scales.
  Its prevention is a design decision, not something a test catches.
- **Provisioned performance.** A container on a laptop tells you nothing about
  whether an index is fast enough on production data volume.
- **IAM**, as everywhere on this provider — every permission error is a
  production-only error.
