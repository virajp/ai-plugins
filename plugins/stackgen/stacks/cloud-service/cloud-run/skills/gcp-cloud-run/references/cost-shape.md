# Cost shape — Cloud Run

The provider-wide principle, the six day-one guardrails and the four-question
cost review are the `gcp` skill's cost-doctrine reference. This file states only
what is this service's own. No dollar figures — the billing model and its trap
are what stay true.

## The meter

Billed per **vCPU-second and memory-second while a request is being handled**,
plus a per-request charge. Between requests, a service that has scaled to zero
costs nothing.

That "while a request is being handled" clause is the whole model, and the three
traps are all ways of breaking it.

## The three traps

**A warm-instance floor.** It is the only way to be billed while idle on this
service, and it is a permanent charge multiplied by services and by regions.
Applied as a default across a whole product it converts a consumption bill into
a provisioned one without anybody deciding to.

**Low concurrency.** Instance count is traffic divided by concurrency, and the
bill follows instance-seconds. Doubling concurrency roughly halves the compute
line for the same traffic, which makes it the largest single lever on this
service — and it is a configuration change, not a rewrite.

**Always-allocated CPU.** It bills between requests. Correct for in-process
background work, and an unexamined default is a service paying for CPU it is not
using.

## What is not on this meter but lands on the bill

- **An external load balancer** is a standing charge. The built-in URL is free,
  so take the balancer only for a custom domain, a WAF, or multi-backend
  routing.
- **Egress** leaving the region, including chatter with your own services in
  another region.
- **Whatever the service calls.** The datastore reads on the hot path are
  usually a larger line than the compute serving them, which is the first
  question of the provider's cost review for a reason.

## Sizing

Size memory against measured peak with headroom, not against the largest
plausible request — an over-sized service pays the difference on every
instance-second. Revisit after the first week of real traffic, which is the
first point at which concurrency and memory can be set against evidence instead
of a guess.
