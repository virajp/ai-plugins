---
name: gcp-cloud-sql
version: 0.1.0
category: development
description: Cloud SQL for PostgreSQL as this product's relational datastore —
  when managed Postgres is the right answer, how it satisfies the datastore
  contract, the connection trap in front of scale-to-zero compute, why cost is
  provisioned rather than consumed, keyless database access, and the Docker
  local stack. Use when designing the data layer, writing migrations, or wiring
  connections.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Cloud SQL for PostgreSQL

Managed relational Postgres on Google Cloud. This skill carries what is this
service's alone; the provider-wide judgment it sits on — cost doctrine, IAM, the
emulator map, the private plane — is the `gcp` skill's, cited and never
restated. Postgres' own SQL surface belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this datastore | [Pick & trade](references/pick-and-trade.md) |
| Designing entities, writing mutations and migrations | [Service doctrine](references/service-doctrine.md) |
| Sizing the instance, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Wiring connections, pools, credentials | [Identity shape](references/identity-shape.md) |
| Standing it up locally or in CI | [Local dev](references/local-dev.md) |

**The two rules that do not wait for a reference:** every read and write goes
through the product's own services — there is no client-direct path to design
around. And there should be no database password at all: connections
authenticate as an identity, not with a stored secret.
