# Temporal — cost shape

No dollar figures: they age badly and are wrong per region anyway. The two
deployment shapes have genuinely different curves.

## Self-hosted: the cost is operating a stateful service

**The engine needs a datastore of its own, and that datastore's durability is
the product's durability.** This is the sentence to weigh before choosing
self-hosted. Losing it loses every in-flight process — every half-finished
order, every pending human approval, every scheduled retry. It is not a cache.

So the real cost is: a datastore sized and backed up to the product's own
durability standard, restore tested rather than assumed, plus the engine's own
compute and the operational knowledge to upgrade it.

## History growth, in both shapes

**History grows with every event.** A workflow that loops indefinitely — polling,
long-running supervision, an unbounded retry loop — grows without bound until it
hits a limit and fails, usually far from where the mistake was made.

**Cap iterations and continue-as-new instead.** That closes the current
execution and starts a fresh one with the carried-over state, resetting history
while preserving continuity. It is the standard answer and it has to be designed
in; retrofitting it into a running workflow is a versioning exercise.

## Managed: billing follows actions

**A chatty workflow with many small activities can cost more than the work it
coordinates.** This is the trap, and it inverts the usual intuition that small
units are cheap. Every activity, every timer, every signal is a billable action;
a workflow that makes twenty tiny calls costs twenty actions regardless of how
trivial each was.

**Batch inside an activity rather than across activities.** One activity that
processes fifty items is one action; fifty activities are fifty. The workflow
should orchestrate meaningful steps, not individual operations — which is good
design independent of billing, and here it is also the bill.

## The costs people forget

- **Workers are always polling**, so they cost compute even when idle. Sizing
  them for peak concurrency and leaving them there is the common shape.
- **Retained history for completed workflows** is a retention setting with a
  storage cost, and the default may be longer than the product needs.
- **Search attributes are indexed**, so indexing high-cardinality business ids
  has a cost — but see [contract satisfaction](contract-satisfaction.md): the
  visibility they buy is usually the point, so this is a trade rather than a
  trap.
