---
role: fullstack
name: TypeScript · Hono + Effect · React + Refine
languages: [ typescript ]
optional_languages: []
frameworks: [ hono, effect, react, refine ]
dependencies: [ ant-design, vite ]
---

# Fullstack — TypeScript · Hono + Effect · React + Refine

One Hono application exposing both its own API and an embedded web UI, as a
single deployable. Its most common use is an **operator back-office**: declaring
the `operator-rbac` capability is what makes a project the **sole holder of
admin capabilities**, after which the public `service` exposes no admin routes.
The template fits any fullstack project that publishes an API contract alongside
a UI.

This doc covers the **project axis** only. Backing services and deploy target
are their own axes — including whether the app sits behind a private perimeter.

## Stack

- **Server**: [Hono](https://hono.dev) + [Effect](https://effect.website) — the
  same patterns as `service` and `worker`. All datastore, auth-admin, push and
  workflow access goes through the common package's layers, server-side only. No
  vendor Web SDK in the browser except for sign-in.
- **UI**: [React](https://react.dev) + [Refine](https://refine.dev), built with
  [Vite](https://vite.dev) and served as static assets by the same Hono app
  (same origin, no CORS). Refine provides resource-based CRUD — routing, data
  tables, forms, access control — through a single provider model. UI components
  via Ant Design.
- **Data flow**: Refine's `dataProvider` calls `/api/*` on its own origin,
  implemented as Effect services with Effect Schema decoding at both ends — one
  source of truth for types across every project. A generic registry-driven read
  router translates Refine filters/sorting into cursor-paginated datastore
  queries; privileged mutations (claim changes, workflow signals, push) are
  explicit, individually modeled endpoints.
- **Audit**: every mutation is wrapped by an audit service in the Effect layer —
  structurally impossible to mutate without an audit event. Read-access logging
  is supported since all reads pass through the server.
- **Auth**: the identity provider's tokens verified in Hono middleware on every
  request; operator authorization is **data-driven** — membership in a dedicated
  operators collection, checked per request, with a **compliance sub-role**
  gating retained-data and purge surfaces. Identity claims carry account status
  only, never roles (per product-foundations users).
- **Retention surface** (product-foundations): the compliance-only
  retention-management screens (list records past their retention date, trigger
  the purge) live here, audit-recorded like every privileged mutation.
- **API contract**: because this role publishes an API, it owns
  `docs/blueprint/apis/<project>.openapi.yaml` and a health endpoint — the same
  released-contract rules apply to it as to a `service`.
- **Observability**: OpenTelemetry via Effect — traces propagate from the
  browser (`traceparent`) through the API into datastore and workflow
  operations.

## Testing

Vitest + `@effect/vitest` for the server; Vitest with a **jsdom** environment +
Testing Library for the React side. E2E suites gate on the `local_stack` harness
capability the backing axis provides.

## Design principles

- One deployable: API + UI in a single package and image — no separate
  frontend/backend projects.
- Admin isolation: privileged capabilities live only in the project declaring
  `operator-rbac`, never in the public `service`.
- Defense in depth: the network perimeter (a deploy-axis concern) and
  application-layer authorization are independent gates.
