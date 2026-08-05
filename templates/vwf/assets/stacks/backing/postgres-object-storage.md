---
axis: backing
name: Postgres · S3-compatible storage · OIDC
capabilities:
  [
    relational-datastore,
    object-file-storage,
    third-party-auth,
    message-queue,
    distributed-tracing,
  ]
local_stack: docker-compose
---

# Backing — Postgres · S3-compatible storage · OIDC

A **vendor-free** backing set: every service here has a self-hostable
implementation and an open protocol, so nothing binds the product to one
provider. The counterpart to the Firebase set, and the option to pick when
portability matters more than managed convenience.

## Services

- **Datastore** — PostgreSQL. Rows carry a `version` column; every mutation runs
  in a transaction that checks the expected version and writes `version + 1`
  (the `baseline/write-versioning` realization), failing a stale write with the
  coded conflict response. Multi-row writes share one transaction; timestamps
  are database-generated (`now()` in the transaction), never client clocks.
- **Object storage** — any S3-compatible endpoint (MinIO self-hosted, or a
  managed equivalent). Access via presigned URLs; the application never proxies
  file bytes.
- **Identity** — any OIDC provider. Tokens verified in middleware on every
  authenticated route; the token carries **account status only**, never roles —
  authorization is read per request from the datastore.
- **Queue / async work** — a durable queue (Postgres-backed job table, or a
  broker speaking AMQP). Jobs are idempotent and retried only when the operation
  is safe to repeat, per `baseline/retry-discipline`.
- **Telemetry** — OpenTelemetry to any OTLP-compatible collector.

## The access rule

Each of these is reached **only through the shared package's aggregate services
layer** — no project imports a client SDK directly
(`rules/integrations-via-common`). The interface is what the projects depend on,
which is what makes any single service replaceable.

## Local stack

Docker Compose brings up Postgres, the S3-compatible store, the queue, and an
OTLP collector, with `wait-on` readiness gates in front of every dependent task.
This satisfies the `local_stack` harness capability.

## Secrets

Any secrets manager, or environment injection in development. Nothing is read
from a committed file; `docs/blueprint/environment.md` catalogs the names.
