# Console — Reference Stack

`console` is the internal admin panel used by the product's operators. It is a
single Hono application that serves both the operator API and an embedded web
UI, deployed as one private Cloud Run service. The public `service` exposes no
admin routes; `console` is the sole holder of admin capabilities.

## Stack

- **Server**: [Hono](https://hono.dev) + [Effect](https://effect.website) — the
  same patterns as `service` and `worker`. All Firebase access (Firestore, Auth
  admin, FCM) and Temporal signaling go through the common package's layers,
  server-side only. No Firebase Web SDK; the browser never talks to Firebase
  directly except for sign-in.
- **UI**: [React](https://react.dev) + [Refine](https://refine.dev), built with
  [Vite](https://vite.dev) and served as static assets by the same Hono app
  (same origin, no CORS). Refine provides resource-based CRUD — routing, data
  tables, forms, access control — through a single provider model. UI components
  via Ant Design.
- **Data flow**: Refine's `dataProvider` calls `/api/*` on its own origin,
  implemented as Effect services with Effect Schema decoding at both ends — one
  source of truth for types across service, worker, and console. A generic
  registry-driven read router translates Refine filters/sorting into
  cursor-paginated Firestore queries; privileged mutations (custom claims,
  Temporal signals, FCM) are explicit, individually modeled endpoints.
- **Audit**: every mutation is wrapped by `AuditLogService` in the Effect layer
  — structurally impossible to mutate without an audit event. Read-access
  logging is supported since all reads pass through the server.
- **Auth**: Firebase Auth (Google SSO) verified in Hono middleware on every
  request; operator authorization is **document-based** — membership in the
  dedicated `operators` collection, checked per request, with the **compliance
  sub-role** gating retained-data and purge surfaces (custom claims carry
  account status only, never roles — per product-foundations users).
- **Retention surface** (product-foundations): the compliance-only
  retention-management screens (list records past their retention date, trigger
  the purge) live here, audit-recorded like every privileged mutation.
- **Perimeter**:
  [Cloudflare Zero Trust Access](https://www.cloudflare.com/zero-trust/) in
  front of the single console hostname — the admin plane is invisible to
  unauthenticated traffic, independent of application-level auth.
- **Observability**: OpenTelemetry via Effect — traces propagate from the
  browser (`traceparent`) through the console API into Firestore and Temporal
  operations.

## Design principles

- One deployable: API + UI in a single package, Dockerfile, and Cloud Run
  service — no separate frontend/backend projects.
- Admin isolation: privileged capabilities live only in this private app, never
  in the public `service`.
- Defense in depth: network-layer identity (Zero Trust) and application-layer
  authorization (document-based operator RBAC) are independent gates.
- Effect end to end on the server; React stays idiomatic at the surface.
