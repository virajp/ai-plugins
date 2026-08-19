# Idempotency

## Definition

An operation is idempotent when performing it once and performing it N times
leave the system in the same state. In any distributed or retried context
this is not an optimization but a **correctness requirement**: networks
duplicate, clients retry, queues deliver at-least-once — so every effectful
operation will eventually run twice, and the design decides whether that is
harmless or a double charge.

Three baseline rules are this principle enforced at the API surface:
idempotency keys on mutating operations, retries only on idempotent
operations, and tolerant-reader event contracts — see the
[engineering baseline](../engineering-baseline.md). This entry is the
judgment for designing the operations themselves.

## Smells

- Relative mutations as the primary write: increment, append, toggle —
  each replay compounds.
- Consumers of at-least-once delivery processing messages with no
  deduplication story.
- "Exactly-once" assumed from infrastructure rather than designed into the
  operation.
- A retry wrapper around a non-idempotent call — the
  [baseline](../engineering-baseline.md)'s retry-discipline rule names this
  the blind retry.
- Idempotency bolted on only at the HTTP layer while the underlying handler
  still double-writes when invoked twice (a crash between effect and
  key-record, a second consumer path).
- Cleanup/teardown that fails when the resource is already gone — absence
  was the goal.

## How a reviewer verifies it

- For every effectful operation in the diff, ask the **replay question**:
  what happens if this exact invocation runs twice — crash-then-retry,
  duplicate message, double click? "Can't happen" is not an answer;
  at-least-once is the environment.
- Check the deduplication mechanism is atomic with the effect: a key
  checked, an effect applied, and the key recorded must not have a crash
  window between them that a replay slips through.
- Verify the idempotent *scope*: keyed by what, stored for how long, and
  does a replay return the **original outcome** (same response, same
  version) rather than an error the client can't distinguish from failure?
- Confirm tests exercise the duplicate path — a replayed message, a
  repeated request — not just the happy single delivery.

## Application patterns

- Prefer **absolute over relative** state changes: set-to-value,
  upsert-with-version, create-with-caller-supplied-identity — shapes that
  are idempotent by construction and need no key bookkeeping.
- Where the operation is genuinely non-idempotent (charge, send, enqueue),
  make the caller name the attempt (an idempotency key / unique attempt id)
  and record outcome atomically with effect, returning the recorded outcome
  on replay.
- Use the [baseline](../engineering-baseline.md)'s write-versioning: a
  version-checked write makes the stale replay fail loudly instead of
  last-writing.
- Design compensations, not just forwards: an idempotent cancel/undo makes
  the whole saga replayable.

## When not to apply it

- **Some operations are counters on purpose** — metering, quotas, append
  logs. There, idempotency moves up a level: the *attempt* gets an identity
  and duplicates are dropped at ingestion, while the aggregate legitimately
  accumulates.
- Within a single local transaction boundary, replay cannot occur by
  construction; adding key bookkeeping inside it is ceremony —
  [KISS](kiss.md) applies.
- Reads need no design effort here (they are idempotent by nature) — spend
  the attention on their **caching** semantics instead, which is a different
  contract.
- When deduplication state itself becomes a scaling or retention problem,
  bounded-window dedup plus a documented residual risk can be the honest
  engineering trade — stated, never silent.
