# PostgreSQL — conventions

The relational datastore that needs no cloud: an open engine with a
self-hostable server, a managed equivalent on every provider, and no lock-in
beyond SQL itself.

**Access is services-only.** Every read and write goes through the product's own
services. That is the datastore contract's access rule anyway, but here it is
also a hard limit rather than a policy: there is no client-direct path, so a UI
cannot subscribe to a row the way a client-direct store allows.

**Concurrency is a `version` column plus a transaction.** Mutations check the
expected version and write `version + 1`, failing a stale write with the coded
conflict response.

**Connection pooling is a design decision made up front**, not a tuning knob
found later — a small per-instance pool, an instance ceiling sized against the
server's connection limit, and an explicit ruling on whether a pooler sits in
front. Transaction-mode pooling breaks session state, prepared statements and
`LISTEN`/`NOTIFY`, so it constrains what the application may use.

**Migrations are versioned, forward-only, and applied by an explicit deploy
step** — never at process start, where N instances race the same migration.

**The local stack is Docker-composed Postgres on production's major version**,
behind a `wait-on` readiness gate, with migrations run against it as a task.

Full judgment: the `postgres` skill's references.
