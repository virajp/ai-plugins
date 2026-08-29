# Postgres — cost shape

The billing model and the traps that turn a small change into a large bill.
No dollar figures: they age badly and are wrong per region anyway.

## It bills for provisioned capacity, not consumption

**The server costs the same idle.** This is the single most important fact about
Postgres economics, and it is the opposite of the consumption model people carry
in from serverless stores. There is no scale-to-zero: an instance that served no
requests all month costs what an instance that served millions of them costs, at
the same size.

Two consequences bite, and both are avoidable.

## Trap 1 — idle non-production instances

A staging database and a handful of per-developer instances cost full price
around the clock while being used during working hours at best. This is
routinely a larger line item than production, because nobody is watching it and
there are more of them.

The answers are ordinary: size non-production instances far smaller than
production (they hold less data and serve one tester), stop what can be stopped
outside working hours, and prefer a local Docker stack
([local stack](local-stack.md)) over a hosted instance per developer.

## Trap 2 — storage grows and does not shrink

Allocated storage auto-grows under pressure and **does not come back** when the
data is deleted. A one-off bulk load — a migration test, an import someone
reverted, a runaway log table — raises the floor permanently for the life of
that instance. Reclaiming it generally means dumping and restoring into a new
instance, which is an outage, which means it does not happen.

So the guard is upstream: bulk loads go somewhere disposable, retention rules
from the blueprint are actually implemented, and a table that only grows is
noticed while it is small.

## What else moves the number

- **Indexes are storage**, on the same one-way ratchet. An index added
  speculatively is paid for indefinitely. See
  [data model constraints](data-model.md).
- **Backups and their retention window** are usually billed separately from the
  instance, and a long window on a large database is not cheap.
- **Cross-zone or cross-region replication** multiplies both the instance and
  the traffic between them. High availability is a real cost, chosen
  deliberately against a stated reliability target.
- **Egress**, where the reader is outside the provider's network. Analytics
  pulling the whole table nightly is the usual culprit.
