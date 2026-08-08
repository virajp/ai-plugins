---
axis: backing
name: PostgreSQL
capabilities: [relational-datastore]
local_stack: docker-compose
---

# Backing — PostgreSQL

The datastore that needs no cloud: an open engine with a self-hostable server, a
managed equivalent on every provider, and no lock-in beyond SQL itself. Pick it
when the data model has real relationships, when reporting and ad-hoc queries
matter, or when the product must stay portable.

The trade: no client-direct access. Every read and write goes through the
product's own services, which is the access rule anyway — but it means a UI
cannot subscribe to a row the way a client-direct store allows.

## How it satisfies the contract

- **Versioning** — a `version` column on every mutable table. A mutation runs in
  a transaction that checks the expected version and writes `version + 1`,
  failing a stale write with the coded conflict response.
- **Atomic multi-record writes** — one transaction. This is the engine's
  strongest property; use it rather than compensating in application code.
- **Time** — `now()` inside the transaction. Never a caller's clock.
- **Migrations** — versioned, forward-only, applied by an explicit deploy step
  rather than at process start.

## Connection pooling is the design decision, not a tuning knob

A serverless runtime scales to many instances, each holding its own pool,
against a server with a hard connection limit. Traffic rises, instances
multiply, connections exhaust, and every request fails at once — including the
ones that would have succeeded.

Decide three things up front, and record them:

1. A **small per-instance pool**, sized for the concurrency one instance
   actually handles.
2. An **instance ceiling** on the runtime, sized against the connection limit
   rather than against traffic.
3. Whether a **pooler** sits in front. It changes what the application may use —
   transaction-mode pooling breaks session state, prepared statements and
   `LISTEN`/`NOTIFY` — so it is a contract decision, not an afterthought.

## Cost shape

Postgres bills for **provisioned capacity, not consumption**: the server costs
the same idle. The two consequences that bite are idle non-production instances,
and storage that auto-grows but never shrinks — a one-off data load raises the
floor permanently.

## Local stack

Docker-composed Postgres on the **same major version** as production, behind a
`wait-on` readiness gate. That gate is vwf's one non-negotiable mechanism: the
acceptance verifier needs a deterministic ready signal, and "sleep 5" is not
one.

Run migrations against it as a task, so the local schema is produced the same
way the deployed one is.

## Secrets

The connection credential is injected as an environment variable and catalogued
by name in `docs/blueprint/environment.md`. Nothing is read from a committed
file. Where the host offers identity-based database authentication, prefer it —
the best password is the one that does not exist.
