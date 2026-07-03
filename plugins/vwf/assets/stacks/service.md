# Service — Reference Stack

`service` is the public API: a [Hono](https://hono.dev) +
[Effect](https://effect.website) REST server, deployed as one Cloud Run service.
It holds no admin routes (those live only in `console`).

## Stack

- **Server**: Hono on `@hono/node-server`, routes built through typed route
  factories (authenticated and unauthenticated variants) with security headers,
  body limits, compression, and timeouts applied centrally.
- **Effect end to end**: feature services are `Effect.Service` classes; a routes
  aggregator merges every service layer + the telemetry layer + the common
  package's aggregate services layer into one `ManagedRuntime`, and each request
  runs `runtime.runPromise(program)`. A minimal bootstrap telemetry runtime
  exists before the full layer is ready so even startup errors are traced.
- **Layout**: `src/modules/<entity>/` — one directory per entity with
  `<entity>.routes.ts` / `<entity>.service.ts` / `<entity>.api.ts` /
  `<entity>.test.ts`; HTTP plumbing under `_server/` (auth / error / header
  middleware); config and cross-cutting services under `_shared/`.
- **Auth**: the product's auth (e.g. Firebase Auth ID tokens) verified in
  middleware on every authenticated route.
- **Firebase & third parties**: only via the common package's aggregate services
  layer — never a direct SDK import. Every datastore call passes a caller string
  for observability.
- **Background work**: a Temporal client service (`@temporalio/client` behind an
  `Effect.Service`) starts and signals workflows on the `worker` — lazily
  connected, idempotent on already-started, recording instead of connecting
  under test.
- **Schemas**: every request/response/domain schema is an Effect Schema from the
  common package's `schemas/*` subpaths, decoded at the boundary.
- **Config**: env vars via Effect `Config` + `Schema` validation (fail-fast on
  invalid); secrets injected by Doppler.
- **Observability**: OpenTelemetry via Effect; `withSpan` on every public
  handler/service method.

## Testing

- Vitest + `@effect/vitest`, v8 coverage with a **100% threshold on
  `src/modules/**`**.
- Two modes: **internal** (in-process app injection) and **external** (live HTTP
  server), plus e2e suites — all gated on the local emulator stack (Firebase
  emulators + Temporal + OTel) with `wait-on`.

## Deployment

The shared monorepo Dockerfile (`APP_NAME=service`) → Artifact Registry → Cloud
Run. See the monorepo stack doc for the pipeline.
