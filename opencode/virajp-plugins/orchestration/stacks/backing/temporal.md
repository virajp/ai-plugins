---
axis: backing
name: Temporal
capabilities: [durable-workflows, scheduled-jobs]
local_stack: docker-compose
---

# Backing — Temporal

Durable execution that needs no cloud: a workflow is ordinary code whose
progress is persisted, so a process crash, a deploy or a week-long wait resumes
exactly where it stopped. Pick it when a process has **state across steps** —
branches, timers, human waits, compensation — and losing that state halfway is
unacceptable.

Do not pick it for fire-and-forget work. One step, retried until it succeeds, is
a queue's job; this engine is the heaviest option on the menu and its cost is
operational, not per-message.

## How it satisfies the contract

- **At-least-once** — an activity can run more than once. Every activity is
  idempotent, keyed on an id it records. The workflow body is different: it is
  **replayed**, so it must be deterministic.
- **Retry and back-off** — a retry policy per activity, with a maximum attempt
  count. Failures that will never succeed are raised as non-retryable rather
  than retried to the ceiling.
- **Poison path** — a workflow that exhausts its policy stays visible as failed,
  with its full history. That history *is* the dead-letter queue, and it is the
  reason this engine is worth its weight.
- **Visibility** — running, failed and stuck workflows are queryable by type and
  by the search attributes the product sets. Set them deliberately; the default
  set answers nothing product-specific.
- **Trace** — propagate the trace context into the workflow start and out to
  each activity, or every long-running process is a hole in the trace.

## Determinism is the rule that bites

The workflow body is re-executed from history on every resume, so anything
non-deterministic corrupts a replay: no clock reads, no random values, no
network calls, no direct I/O. All of it goes in activities.

The second half of the same rule: **changing a workflow's shape breaks
in-flight executions.** Versioning is a deliberate act, and "deploy it and see"
is how a production incident starts. Decide up front whether long-running
workflows are versioned in place or drained before a change ships.

## Where the boundary sits

Callers start and signal workflows through the shared services layer — never a
direct SDK import. That client connects **lazily**, is idempotent on
already-started (starting the same business process twice is a normal race, not
an error), and **records rather than connects under test**, so the unit suite
needs no server.

## Cost shape

Self-hosted, the cost is operating a stateful service: it needs a datastore of
its own, and that datastore's durability is the product's durability. History
grows with every event, so a workflow that loops indefinitely grows without
bound — cap iterations and continue-as-new instead.

Managed, billing follows **actions**, so a chatty workflow with many small
activities can cost more than the work it coordinates. Batch inside an activity
rather than across activities.

## Local stack

A docker-composed dev server behind a `wait-on` readiness gate — vwf's one
non-negotiable mechanism, because the acceptance verifier needs a deterministic
ready signal.

The engine's own test framework is the other half, and it is the payoff: time is
skippable, so a workflow that waits fourteen days is tested in milliseconds
rather than mocked away.

## Secrets

The server address and any client credential are injected as environment
variables and catalogued by name in `docs/blueprint/environment.md`. Nothing is
read from a committed file. Note that workflow inputs and results are persisted
in history — anything sensitive is either not passed, or encrypted before it is.
