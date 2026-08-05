# Background Processes

Every server-side action is classified **sync or async**, and every async action
gets an explicit **placement**: the `worker` project or the `service` project.
Cross-cutting token: `background: durable-worker-ephemeral-service`.

## Default contract

- **Classification is per action.** During blueprint elicitation, each mutating
  step in a flow's Steps states whether its server work completes in-request
  (sync) or continues after the response (async).
- **The placement rule** (the 95octane-derived default):
  - **worker** — anything **durable**: multi-step, retryable, compensating,
    scheduled/cron, long-running, or survives a process restart (the durable
    workflow engine lives here; the service starts/signals workflows through a
    client, idempotent on already-started).
  - **service** — small **ephemeral** same-request side effects forked off the
    request path (a notification send, a metrics write, a timing-equalizing
    token write) — fire-and-forget, acceptable to lose on crash.
- **Ask only on ambiguity.** Apply the rule; when **both placements are
  genuinely defensible** for an action (e.g. a single retryable side effect that
  could be forked or made a one-activity workflow), ask the user via MCQ —
  consistent with the decisions-vs-mechanics filter. Never silently choose in
  the ambiguous zone, and never ask when the rule decides.
- **The placement is recorded**: async actions land as rows in the owning flow's
  **Background Jobs** section (worker placement: job, trigger, timer/retry,
  activities, on-failure) or as an explicit fire-and-forget note on the step's
  outcome (service placement). Cron work is a scheduled workflow on the worker,
  never an in-process timer in the service.
- Durable jobs are **idempotent and signalable** where the contract needs it;
  the workflow/signal names are the service↔worker contract (see the worker
  reference-stack doc).

## Elicit per product

- Whether a `worker` project exists at all — a product with no durable work yet
  may defer it; the first durable-classified action then triggers the registry
  addition (architecture reconcile), not a silent in-service compromise.
- The ambiguous-zone calls, one MCQ each, as they surface during blueprint
  passes.

## Blueprint expansion

- `conventions.md#background` (or the existing `#integrations` workflow note)
  records the placement rule once; each flow's Background Jobs carries the
  worker-placed jobs; fire-and-forget effects are visible on the flow steps.
  Realization: Temporal client/worker patterns in the `service` and `worker`
  reference-stack docs.
