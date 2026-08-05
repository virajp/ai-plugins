---
role: service
name: TypeScript · Hono · Effect
languages: [ typescript ]
optional_languages: []
frameworks: [ effect, hono ]
dependencies: [ opentelemetry, vitest ]
---

# Service — TypeScript · Hono · Effect

`service` is the public API: a [Hono](https://hono.dev) +
[Effect](https://effect.website) REST server. It holds no admin routes — those
live only in the project declaring `operator-rbac`.

This doc covers the **project axis** only: language, framework, layout, testing.
What the service talks to is the **backing** axis; where it ships is the
**deploy** axis.

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
- **Auth**: the identity provider's tokens verified in middleware on every
  authenticated route. Which provider is the backing axis's choice.
- **Users & RBAC** (product-foundations): authorization is data-driven, read per
  request — resource owner, membership role, subscription tier; operators are
  membership in a dedicated operators collection. Identity claims carry account
  status only, never roles.
- **Rate limiting** (product-foundations): a per-class limiter middleware
  (auth-sensitive / expensive / default) centrally in `_server/`, uniform
  `429` + `Retry-After` in the coded envelope.
- **Runtime settings** (product-foundations): a cached, schema-typed accessor
  over the single settings document from the common package — TTL-cached, never
  a per-request datastore read.
- **Third parties**: only via the common package's aggregate services layer —
  never a direct SDK import (`rules/integrations-via-common`).
- **Background work**: a workflow-engine client behind an `Effect.Service`
  starts and signals work on the `worker` — lazily connected, idempotent on
  already-started, recording instead of connecting under test.
- **Schemas**: every request/response/domain schema is an Effect Schema from the
  common package's `schemas/*` subpaths, decoded at the boundary — the
  `baseline/boundary-validation` realization: decode failures reject, never
  coerce.
- **Concurrency baselines**: `baseline/write-versioning`,
  `baseline/atomic-multi-write` and `baseline/server-time` are realized by the
  datastore the backing axis selects; this project's job is to route every
  mutation through the common package so those guarantees hold in one place.
- **Config**: env vars via Effect `Config` + `Schema` validation (fail-fast on
  invalid); secrets injected by whatever the backing axis names.
- **Observability**: OpenTelemetry via Effect; `withSpan` on every public
  handler/service method.

## Testing

- Vitest + `@effect/vitest`, v8 coverage with a **100% threshold on
  `src/modules/**`**.
- Two modes: **internal** (in-process app injection) and **external** (live HTTP
  server), plus e2e suites — all gated on the `local_stack` harness capability
  the backing axis provides, behind its `wait-on` readiness gates.
