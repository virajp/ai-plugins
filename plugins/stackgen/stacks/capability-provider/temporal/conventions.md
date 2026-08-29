# Temporal — conventions

Durable execution: a workflow is ordinary code whose progress is persisted, so a
process crash, a deploy or a week-long wait resumes exactly where it stopped.
Pick it when a process has **state across steps** — branches, timers, human
waits, compensation — and losing that state halfway is unacceptable.

**Not for fire-and-forget work.** One step retried until it succeeds is a
queue's job; this engine is the heaviest option on the menu.

**The workflow body is replayed, so it must be deterministic** — no clock reads,
no random values, no network calls, no direct I/O. All of that goes in
activities.

**Every activity is idempotent, keyed on an id it records**, because at-least-once
means an activity can run more than once.

**Changing a workflow's shape breaks in-flight executions.** Versioning is a
deliberate act decided up front — versioned in place, or drained before the
change ships.

**Callers start and signal through the shared services layer**, never a direct
SDK import. That client connects lazily, is idempotent on already-started, and
records rather than connects under test.

**Workflow inputs and results are persisted in history** — anything sensitive is
either not passed, or encrypted before it is.

Full judgment: the `temporal` skill's references.
