---
axis: project
role: worker
name: TypeScript · Temporal · Effect
languages: [ typescript ]
optional_languages: []
frameworks: [ effect, temporal ]
dependencies: [ opentelemetry, vitest ]
---

# Worker — TypeScript · Temporal · Effect

`worker` is the durable background processor: a [Temporal](https://temporal.io)
worker with [Effect](https://effect.website) inside activities. The `service`
(and any `fullstack` project) start and signal its workflows; nothing else runs
long-lived work.

This doc covers the **project axis** only. What the worker talks to is the
**backing** axis; where it ships is the **deploy** axis.

## Stack

- **Temporal worker**: `Worker.create` with a flat `activities` registry and a
  `workflowsPath` bundle entry; cron schedules ensured at startup; SIGINT/
  SIGTERM handlers drain gracefully.
- **Workflows are deterministic**: plain async functions in the Temporal isolate
  — only `@temporalio/workflow` (+ type-only imports) may reach them; they
  orchestrate via `proxyActivities`, `sleep`, and `defineSignal`. The workflow
  function name is the `workflowType` the service starts; signal names match its
  `defineSignal`s — that pairing is the service↔worker contract.
- **Activities run Effect**: each activity builds an Effect program and runs it
  with `Effect.runPromiseExit`, so the typed coded error is extracted from the
  `Cause` and domain failures rethrow as
  `ApplicationFailure.nonRetryable(message, code)`. Activities provide the
  common package's aggregate services layer for every external service.
- **Layout**: `src/modules/<domain>/` with paired `*.workflow.ts` +
  `*.activity.ts` + tests; `workflows.ts` / `activities.ts` as the two flat
  registries; worker runtime plumbing under `_worker/`, config under `_shared/`.
- **Third parties**: only via the common package's layers
  (`rules/integrations-via-common`), caller string on every datastore call.
- **Schemas**: from the common package's `schemas/*` subpaths; a local schema is
  allowed only for workflow↔activity-internal types.
- **Config**: Effect `Config` + `Schema`, fail-fast; secrets injected by
  whatever the backing axis names; Temporal address/namespace/task-queue/TLS
  from env.
- **Observability**: OpenTelemetry via Effect; `withSpan` on activities.
- **Retention & deletion** (product-foundations): the durable account-deletion
  workflow and retention-purge activities live here — the deletion workflow's
  deliberate preservations are rows in the retention table, purged later by the
  compliance operator, never silently.

## Testing

- Vitest + `@effect/vitest`, v8 coverage **100% on `src/modules/**`** —
  excluding `*.workflow.ts` (the Temporal isolate can't be v8-instrumented;
  workflows are verified by deterministic replay tests via
  `@temporalio/testing`) and type-only `*.schema.ts`.
- Gated on the `local_stack` harness capability the backing axis provides,
  behind its `wait-on` readiness gates.
