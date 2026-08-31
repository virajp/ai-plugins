# Cost shape — Cloud SQL

The provider-wide principle, the six day-one guardrails and the four-question
cost review are the `gcp` skill's cost-doctrine reference. This file states only
what is this service's own. No dollar figures — the billing model and its trap
are what stay true.

## The meter, and the inversion

Billed per **instance-hour**, plus **storage**, plus **egress**.

That first term is the whole point of this file. **This is the one service in
the bundle that bills for provisioned capacity rather than for what happened** —
the instance costs the same idle as it does saturated. Every instinct built on
the provider's per-operation principle is wrong here, and the two traps below
are both consequences of that inversion.

## Trap one: idle instances

An idle instance is a full-price instance, which makes **non-production
environments the most common waste on a bill**. A development instance nobody
has touched in a month costs what a used one costs.

The controls are unglamorous and effective: size non-production instances to the
smallest that runs the test suite, and stop or delete them on a schedule where
the workflow tolerates it. An instance per developer is a decision to price
before taking, not after.

## Trap two: storage auto-grows and never shrinks

Storage expands to accommodate what you write and **does not contract when the
data is deleted**. So a one-off backfill, an accidental loop, or a log table
nobody pruned raises the floor **permanently** — the only way back down is a
migration to a new instance.

Two consequences worth acting on before the first load: put a retention policy
on anything that grows monotonically, and treat a large import as a sizing
decision rather than a data operation.

## What else lands on the bill

- **Backups and point-in-time recovery**, priced on retained volume — a
  retention window is a cost decision, and the default is not necessarily the
  one the product wants.
- **High availability** roughly doubles the instance cost. Take it against a
  stated reliability target, not by default.
- **Read replicas**, each a full instance. A replica added to relieve reporting
  load is often cheaper than a larger primary; a replica added speculatively is
  a second idle instance.
- **Egress**, including a service in another region reading from here — which is
  a topology decision, covered in the provider's cost doctrine.

## Sizing

Size against measured working set and connection count, not against peak
plausible load: the instance can be resized, and unlike storage that resize goes
both ways. Revisit after the first week of real traffic, which is the first
point at which there is evidence rather than a guess.
