# Cloud SQL for PostgreSQL — conventions

Relational Postgres on managed infrastructure. Pick it when the data model has
real relationships, when reporting and ad-hoc queries matter, or when the
product must stay **portable off this provider** — Postgres has an equivalent
everywhere, which a proprietary document store does not.

**Access is services-only.** Every read and write goes through the product's own
services. That is the datastore contract's access rule
(`assets/contracts/datastore.md`), and here it is also a hard limit rather than
a policy: there is no client-direct path, so a flow whose blueprint assumes a
client subscription needs a different design.

**Concurrency is a version column plus a transaction.** Mutations read the
record, check the expected version, and write `version + 1` in the same atomic
unit; a stale version fails with the coded conflict response.

**Migrations are versioned, forward-only, and applied by an explicit deploy
step** — never at process start, where several instances race the same
migration.

**Connection pooling is decided up front**, not tuned later: a small
per-instance pool, an instance ceiling sized against the server's connection
limit, and an explicit ruling on whether a pooler sits in front. Against a
scale-to-zero compute target this is the difference between a bounded failure
and every request failing at once.

**There is no database password.** Connections go through the provider's
IAM-authenticating connector, so the credential is a short-lived token rather
than a secret to store, rotate and leak.

**Cost is provisioned, not consumed** — the one service on this provider that
inverts its own principle. The instance costs the same idle, so idle
non-production instances are the most common waste, and storage auto-grows but
**never shrinks**.

**The local stack is Docker-composed Postgres** on production's major version,
behind a readiness gate, with migrations run against it as a task. There is no
emulator for this service, so `assets/contracts/local-stack.md` applies in full.

Full judgment: the `gcp-cloud-sql` skill's references. The provider-wide half —
cost doctrine, IAM, the emulator map, the private plane — is the `gcp` skill's.
