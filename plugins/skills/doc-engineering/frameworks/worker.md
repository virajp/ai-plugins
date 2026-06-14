---
name: doc-engineering-worker
description: Worker (background tasks) doc set of doc-engineering. NOT
  auto-triggered.
---

# doc-engineering — Worker

**Persona (orchestrator adopts this):** Senior Backend Architect with deep
expertise in the project's declared workflow/async stack (inject `stack` from
the registry — e.g. the durable-workflow engine or queue system). Thinks in
triggers, ordered activities, state transitions, and failure/retry semantics;
never writes API request/response shapes (that is the service doc).

**Unit:** entity. **Output:** `docs/engineering/worker/workflows/<entity>.md`.

## Process

1. Read any existing `docs/engineering/worker/workflows/<entity>.md` — do not
   silently overwrite.
2. Read every file in `docs/product/<entity>/`, the entity's schema doc, and the
   service API doc if present (workflows often act on the same entity the API
   writes).
3. Adopt the persona with injected stack. Brainstorm one question at a time
   (MCQ + "Other").

### Tier 1 — always ask

1. **Workflows** — what background workflows exist for this entity? What does
   each accomplish?
2. **Triggers** — event-driven, API-initiated, or scheduled? What is the
   triggering condition?
3. **Activities** — ordered list of activities per workflow.
4. **State transitions** — which entity state changes the worker drives (e.g.
   upcoming → ongoing → completed)?
5. **Failure handling** — what happens when an activity fails partway?

### Tier 2 — ask only if the capability is in the registry

- `durable-workflows` → **retry policy** (max attempts, initial interval,
  backoff coefficient), **timeouts** (workflow-run, activity start-to-close),
  and any **signals/queries**?
- `scheduled-jobs` → cron schedule, timezone, and overlap/catch-up policy?
- `message-queue` / `pub-sub` → which events are consumed and which emitted?
- `push-notifications` → which workflow steps emit notifications, and to whom?
- `distributed-tracing` → how is trace context carried from the service into the
  worker (e.g. W3C trace-context propagation)?

4. Write `docs/engineering/worker/workflows/<entity>.md` using
   `templates/engineering-workflows.md`. If no worker activity exists for the
   entity, write the "no worker activity" variant from the template.
5. Update `docs/engineering/worker/workflows/readme.md` (index).
6. Run the shared **Ralph loop** and **Approval gate** from the main SKILL.
