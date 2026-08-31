# Service doctrine — Cloud Run

This component realizes no blueprint capability — it is where the product runs,
not something the product uses — so there is no capability contract to satisfy
clause by clause. What it owes instead is the deploy-side half of vwf's
delivery-pipeline contract, which [Pipeline](pipeline.md) covers, and the rules
below.

## The three settings that decide cost and behaviour

All three are design decisions taken up front, not tuning knobs found later.

**A warm-instance floor defeats scale-to-zero.** One instance kept warm is a
permanent charge, per service, per region. Set it for latency-critical services
only — never as a blanket default across every service, which is how a
scale-to-zero platform quietly acquires a fixed monthly cost proportional to how
many services the product has.

**Concurrency is the largest lever available.** Raising it serves the same
traffic from fewer instances, and the default is conservative for most web
workloads. Raise it against a measurement, not a guess: the ceiling is whatever
the process can actually handle in parallel, which for most services is bounded
by its datastore pool rather than by CPU.

**A maximum-instance ceiling goes on every service.** It is the guardrail that
converts a runaway loop or a traffic spike into a bounded failure. In front of a
connection-limited datastore it is load-bearing rather than prudent — see the
connection trap below.

CPU is throttled between requests unless the service is configured for
always-allocated CPU. Take that only for genuine in-process background work, and
know that it bills continuously — which is to say, it opts the service out of
the meter that made this platform attractive.

## The connection trap

This is the failure that catches every serverless product in front of a
connection-limited relational datastore, and it fails everything at once rather
than degrading.

The mechanism: the service scales to many instances, each holds its own
connection pool, and the datastore has a hard connection limit. Traffic rises,
instances multiply, connections exhaust, and every request fails — including the
ones that would have succeeded.

Three things prevent it, and all three are decided up front:

1. A **small per-instance pool.** An instance handling limited concurrency does
   not need a large one.
2. A **maximum-instance ceiling sized against the connection limit**, not
   against traffic. This is the setting above, doing its actual job.
3. The datastore's **IAM-authenticating connector** rather than a raw address
   and password — see `gcp-cloud-sql`, which owns that half.

## Configuration and secrets

Environment variables and mounted secret versions, injected by the platform at
deploy time. **Nothing environment-specific is baked into the image**, which is
the precondition for promoting one digest across environments rather than
rebuilding per environment.

A secret reaches the process as an environment variable or a mounted file, never
from a committed file and never from a key baked into a layer.

## Egress and the private plane

A service that must not be publicly reachable takes internal ingress, or an
identity-aware proxy in front of it. A service that needs to reach a private
backend takes the serverless egress path to the network. Both mechanisms, and
the reasoning for preferring unreachable over merely authenticated, are the
provider's: see the `gcp` skill's networking reference.
