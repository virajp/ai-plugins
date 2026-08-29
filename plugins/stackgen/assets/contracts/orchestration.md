# Async orchestration — the capability contract

What **any** backend for work that happens later has to satisfy, stated without
naming one. The provider packs under `stacks/capability-provider/` say how a particular
engine satisfies it; a cloud plugin's managed flavour says the same for its own.

Capability tokens realized here: `durable-workflows`, `message-queue`,
`pub-sub`, `scheduled-jobs`. Blueprint prose calls these **the queue**, **the
event bus**, or **the worker** (named by registry project) — never the product
name.

## Pick the smallest thing that holds

These are four different problems, and conflating them is the usual mistake:

| Need                                                        | Reach for            |
| ----------------------------------------------------------- | -------------------- |
| One step, later, retried until it succeeds                  | a queue              |
| Many independent consumers of the same fact                 | an event bus         |
| A step at a time or on a calendar                           | a scheduler          |
| A multi-step process with state, timers and compensation    | a workflow engine    |

A workflow engine is the heaviest of the four and the only one that carries
**state across steps**. Do not buy it for a job table's worth of work; do not
simulate it with retries and a status column when the process genuinely has
branches, waits and compensation.

Where the product needs only the first, a job table **in the datastore** is a
legitimate answer — one less service, transactional with the write that
enqueued it. Say so in the template rather than treating a broker as mandatory.

## What a backend must be able to do

1. **Deliver at least once.** Every one of these delivers at least once, and the
   ones that claim otherwise mean it within a window. So **every consumer is
   idempotent**, keyed on an id it records — not on "probably won't happen
   twice".
2. **Retry with back-off, and stop.** Retries are bounded and exponential.
   Unbounded retry against a failing dependency is a denial of service the
   product performs on itself.
3. **Have a poison path.** Work that will never succeed goes somewhere a human
   sees it. A backend with no dead-letter destination silently drops or
   infinitely retries, and both are worse than failing loudly.
4. **Make work in flight visible.** Depth, age of the oldest item, and failure
   rate. "Is it stuck?" must be answerable without reading code.
5. **Preserve the trace.** A job joined to the trace that enqueued it is
   debuggable; one that is not is invisible exactly when it is slow.

## Retry only what is safe to repeat

Retry is not a universal wrapper. An operation is retried only when repeating it
is safe — either naturally idempotent, or made so by a key the receiver records.
A payment, an email and an external mutation are the three that catch everyone:
each needs an idempotency key that survives the retry, or a bounded
"already done?" check before acting.

## The access rule

A project reaches the backend **only through the shared services layer** — no
project imports a client SDK directly. A client that connects lazily, is
idempotent on already-started, and *records rather than connects* under test is
what keeps the unit suite free of a running broker.

## What this contract does not decide

- **Which engine.** That is the user's pick from the menu — this contract's own
  self-hosted engine, or a managed flavour from the project's cloud plugin.
- **Which processes are asynchronous.** That is a blueprint contract, authored
  per product per flow.
- **The client library.** That belongs to the project's language plugin.
