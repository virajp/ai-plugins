# Temporal — pick & trade

## When it is the answer

**When a process has state across steps and losing it halfway is
unacceptable.** Branches, timers, human waits, compensation on failure — a
process that must remember where it got to. This is the whole case for durable
execution, and where it applies nothing else comes close: a crash, a deploy or a
week-long wait resumes exactly where it stopped, without the product writing a
state machine and its persistence by hand.

**When the alternative is a hand-rolled state machine in the datastore.** That
is the honest comparison, and it is the one that justifies the weight. A
status column, a poller, retry counters, a timeout sweeper and compensation
logic is a workflow engine — an undocumented, untested, single-purpose one that
somebody now owns.

**When the failed run's history is the thing you need.** A workflow that
exhausts its retries stays visible as failed, with its complete history: every
input, every attempt, every error. That history *is* the dead-letter queue, and
being able to see exactly where a process died is usually worth more than any
other single property.

**When a wait is measured in days.** Timers that survive deploys and restarts
are extremely hard to build correctly and trivial here.

## When it stops being the answer

**Fire-and-forget work.** One step, retried until it succeeds, is a **queue's**
job. Reaching for this engine there means operating a stateful service to do
what a queue does, and the orchestration contract's "pick the smallest thing
that holds" rule says not to.

**When there is no state across steps.** If each unit of work is independent and
self-contained, the durability has nothing to protect.

**When nobody will operate a stateful service.** Self-hosted, the engine needs a
datastore of its own, and **that datastore's durability is the product's
durability** — losing it loses every in-flight process. That is a serious
commitment, and the managed option exists precisely for teams that should not
make it.

**When the workflows will change constantly.** Changing a workflow's shape
breaks in-flight executions, so a process under heavy iteration pays a
versioning tax on every change. See [determinism & versioning](determinism.md);
short-lived workflows make this cheap, long-lived ones make it a standing cost.

## The ladder, from the contract

The orchestration contract asks for the smallest thing that holds, and the
ladder is worth stating: a **scheduler** for "do this later, once"; a **queue**
for "do this reliably, one step"; a **bus** for "tell whoever cares"; a
**workflow engine** for "run this multi-step process to completion, whatever
happens". Only the last one justifies this pack.
