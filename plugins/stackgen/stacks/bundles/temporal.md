---
name: Temporal
axis: backing
kind: capability-provider
components:
- capability-provider/temporal@0.1.0
---

# Backing — Temporal

Durable execution that needs no cloud: a workflow is ordinary code whose
progress is persisted, so a crash, a deploy or a week-long wait resumes where it
stopped.

**The composition is the neutral orchestration contract plus this one engine.**
The contract (`assets/contracts/orchestration.md`) asks for the **smallest thing
that holds** — and this is the heaviest option on its ladder, justified only when
a process has state across steps and losing it halfway is unacceptable. One step
retried until it succeeds is a queue's job.

The constraint the product is built around is **determinism**: the workflow body
is replayed, so anything non-deterministic in it corrupts a resume, and changing
a workflow's shape breaks in-flight executions.

Full judgment: the component's own skill and its references. The contract it
cites is `assets/contracts/orchestration.md`.
