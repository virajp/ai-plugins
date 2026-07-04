# Worker — Reference Stack

`worker` is the durable background processor: a [Temporal](https://temporal.io)
worker with [Effect](https://effect.website) inside activities, deployed as one
Cloud Run service. The `service` (and `console`) start and signal its workflows;
nothing else runs long-lived work.

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
  common package's aggregate services layer for Firebase et al.
- **Layout**: `src/modules/<domain>/` with paired `*.workflow.ts` +
  `*.activity.ts` + tests; `workflows.ts` / `activities.ts` as the two flat
  registries; worker runtime plumbing under `_worker/`, config under `_shared/`.
- **Firebase & third parties**: only via the common package's layers, caller
  string on every datastore call.
- **Schemas**: from the common package's `schemas/*` subpaths; a local schema is
  allowed only for workflow↔activity-internal types.
- **Config**: Effect `Config` + `Schema`, fail-fast; Doppler-injected secrets;
  Temporal address/namespace/task-queue/TLS from env.
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
- Gated on the local emulator stack (Firebase emulators + Temporal dev server)
  with `wait-on`.

## Deployment

The shared monorepo Dockerfile (`APP_NAME=worker`) → Artifact Registry → Cloud
Run. See the monorepo stack doc for the pipeline.
