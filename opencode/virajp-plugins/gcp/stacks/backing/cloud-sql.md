---
axis: backing
name: Cloud SQL · Cloud Storage · Identity Platform
capabilities:
  [
    relational-datastore,
    object-file-storage,
    cache-layer,
    third-party-auth,
    custom-claims-rbac,
    message-queue,
    distributed-tracing,
  ]
local_stack: docker-compose
---

# Backing — Cloud SQL · Cloud Storage · Identity Platform

Relational Postgres on managed infrastructure. Pick it when the data model has
real relationships, when reporting and ad-hoc queries matter, or when the
product must stay **portable off GCP** — Postgres, object storage and OIDC all
have equivalents everywhere, which Firestore does not.

The trade against `firebase`: no client-direct access, and no emulator suite —
local development runs Docker.

## Services

- **Datastore** — Cloud SQL for PostgreSQL. Migrations are versioned, forward-
  only, and applied by a deploy step rather than at process start, so two
  instances starting at once cannot race.
- **Object storage** — Cloud Storage, with lifecycle rules set **at bucket
  creation**; retention is a bucket policy, not application code.
- **Identity** — Identity Platform (Firebase Auth's GCP-scale sibling). Tokens
  verified in middleware; roles live in the database, not in token claims.
- **Cache** — Memorystore, when a measured read pattern justifies it.
  Provisioned capacity, so it costs whether or not it is hit.
- **Queue** — Pub/Sub for fan-out, Cloud Tasks for per-task control and
  scheduled retries. Both deliver **at least once**: every consumer is
  idempotent, keyed on a message id it records.
- **Telemetry** — OpenTelemetry over **OTLP**, terminating in Cloud
  Trace/Monitoring/Logging. Never a vendor observability SDK.

## The connection trap

This is the failure that catches every serverless Postgres product. Cloud Run
scales to many instances; each holds its own pool; Cloud SQL has a hard
connection limit. Traffic rises, instances multiply, connections exhaust, and
every request fails at once — including the ones that would have succeeded.

Three things prevent it, and all three are design decisions rather than tuning:

1. A **small per-instance pool** — a serverless instance handling limited
   concurrency does not need a large one.
2. A **`max-instances` ceiling** on the service, sized against the connection
   limit rather than against traffic.
3. The **Cloud SQL connector / Auth Proxy** rather than raw IP + password: it
   authenticates with IAM, so there is no database password to leak.

## Cost shape

Unlike everything else in this plugin, Cloud SQL bills for **provisioned
capacity, not consumption** — the instance costs the same idle. The two
consequences: idle dev and staging instances are the most common waste in a GCP
bill, and storage auto-grows but **never shrinks**, so a one-off data load
raises the floor permanently. See `gcp-cost`.

## Local stack

**Docker-composed Postgres** on the same major version, behind a `wait-on`
readiness gate — vwf's one non-negotiable mechanism, because the acceptance
verifier needs a deterministic ready signal. Add Redis/Valkey when Memorystore
is in play, and the Pub/Sub emulator when it is.

Identity Platform has no emulator; keep token verification behind a seam and
inject a verified-principal fake in tests.

## Secrets

Secret Manager, injected as environment variables. The database password should
not exist at all — use IAM database authentication via the connector.
