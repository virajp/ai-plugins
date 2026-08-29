# Temporal — contract satisfaction

Clause by clause against the neutral orchestration contract
(`assets/contracts/orchestration.md`). It cites, and does not restate.

## At-least-once, and the idempotency it forces

**An activity can run more than once.** A retry after a timeout may re-run work
that actually succeeded — the engine could not tell. So **every activity is
idempotent, keyed on an id it records**, which is the contract's central demand
and the one most often satisfied only in the easy cases.

The workflow body is a different thing entirely: it is **replayed**, not
retried, and must be deterministic. Conflating the two rules is the most common
source of confusion here — see [determinism & versioning](determinism.md).

## Bounded retry

**A retry policy per activity, with a maximum attempt count.** Not unbounded:
the contract requires a bound because an unbounded retry against a permanently
broken dependency is an outage amplifier.

**Failures that will never succeed are raised as non-retryable** rather than
retried to the ceiling. A validation error, a 4xx, a malformed payload — these
do not become correct on the fifth attempt, and retrying them wastes the budget
that a genuinely transient failure needed.

## The poison path

**A workflow that exhausts its policy stays visible as failed, with its full
history.** That history *is* the dead-letter queue, and it is the reason this
engine is worth its weight — the contract asks for a poison path that a human
can inspect and act on, and this is the strongest form of it available.

What it asks in return: somebody has to look. A failed workflow that nobody is
alerted to is a dead letter in a queue nobody drains.

## Work-in-flight visibility

**Running, failed and stuck workflows are queryable by type and by the search
attributes the product sets.**

**Set them deliberately.** The default set answers nothing product-specific — it
can tell you a hundred workflows are running, not which customer's order is
stuck. The attributes worth indexing come from the blueprint's flows: the
business identifiers an operator would search by.

## Trace propagation

**Propagate the trace context into the workflow start and out to each
activity**, or every long-running process is a hole in the trace: the request
that started it ends, and the work that matters happens somewhere unlinked.

This is cheap to wire once at the client and effectively impossible to
retrofit into an investigation.
