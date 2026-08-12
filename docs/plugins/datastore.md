# datastore plugin

The `datastore` plugin is a **capability plugin** for vwf. A capability plugin
holds the neutral contract — what *any* provider must be able to do to serve a
vwf product — and the concrete provider lives with whoever owns it. That is the
same shape as vwf's stack-adapter contract, one level down: **the capability
states the requirement, the provider states the mechanism.**

So this plugin ships two things and no more: the datastore contract, and the one
provider that needs no cloud — **PostgreSQL**. Firestore, Cloud SQL and every
other managed flavour come from the project's own cloud plugin, and vwf renders
the union of both menus.

It realizes the `document-datastore` and `relational-datastore` capability
tokens. Blueprint prose calls both of them **the datastore** — never a product
name.

## Install

```sh
pnpx @askviraj/ai-plugins --user datastore
```

The plugin is opt-in, so it is excluded from `--all` and installed by name.
Install it when a project in your product actually stores something.

## The contract

`assets/contract.md` states five requirements without naming a provider:

| Requirement                 | Why it is in the contract                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Optimistic concurrency      | A record carries a version; a stale write fails with a coded conflict rather than silently winning. Without it, loss is invisible. |
| Atomic multi-record writes  | Anything that must be true together is written together. A provider that cannot constrains the data model — a blueprint fact.      |
| Server-generated time       | Timestamps come from the store. Client clocks are wrong, adversarial and mutually unordered.                                       |
| A deterministic local stack | Tests run against the real engine behind a ready signal a task can wait on. A hosted-only store forces a seam plus a fake.         |
| A migration story           | Forward-only, versioned, applied by an explicit step — never at process start, where two instances race.                           |

Alongside them is **the access rule**: a project reaches the datastore only
through the shared services layer, and no project imports a client SDK directly.
That indirection is the entire reason a provider can be swapped at all. Every
call carries a caller string, so a hot read has an owner in the telemetry. The
one deliberate exception is a client-direct provider — a store whose security
model is rules evaluated at the edge — and where a cloud plugin offers that, its
template says so explicitly and says what re-authorizes on the server.

The contract also draws the lines it does **not** cross: which provider (the
user's pick), the data model (a blueprint contract), and the client library or
ORM (the project's language plugin).

## Self-hosted provider

One backing template, `postgres` — *PostgreSQL*.

An open engine with a self-hostable server, a managed equivalent on every
provider, and no lock-in beyond SQL itself. Pick it when the data model has real
relationships, when reporting and ad-hoc queries matter, or when the product
must stay portable. The trade is stated rather than glossed: no client-direct
access, so a UI cannot subscribe to a row.

The template is written as judgment rather than API surface, because vwf's
callers have Context7 for the second kind. What it pins down:

- **How it satisfies the contract** — a `version` column checked and incremented
  inside the mutating transaction; one transaction for atomicity; `now()` inside
  it for time; versioned forward-only migrations applied by a deploy step.
- **Connection pooling as a design decision, not a tuning knob.** A serverless
  runtime scales to many instances, each holding a pool, against a server with a
  hard connection limit — so traffic rises, connections exhaust, and every
  request fails at once. Three things get decided up front: a small per-instance
  pool, an instance ceiling sized against the connection limit, and whether a
  pooler sits in front (transaction-mode pooling breaks session state, prepared
  statements and `LISTEN`/`NOTIFY`, so it is a contract decision).
- **Cost shape.** Provisioned capacity, not consumption — the server costs the
  same idle, and storage auto-grows but never shrinks, so a one-off data load
  raises the floor permanently.
- **Local stack.** Docker-composed Postgres on the same major version as
  production, behind a `wait-on` readiness gate. That gate is vwf's one
  non-negotiable mechanism: the acceptance verifier needs a deterministic ready
  signal, and `sleep 5` is not one.
- **Secrets.** The connection credential is injected as an environment variable
  and catalogued by name in `docs/blueprint/environment.md`; identity-based
  database authentication is preferred where the host offers it.

## Cloud flavours

A managed datastore is **not** here, by design. The project's cloud plugin
supplies it and vwf asks that plugin separately:

| Plugin                        | Flavours                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| [gcp](./gcp.md)               | Firestore via the `firebase` template; managed Postgres via the `cloud-sql` template |
| [cloudflare](./cloudflare.md) | none today — that plugin is parked at Zero Trust Access                              |

The menu skill never lists another plugin's template, and never fills a gap from
general database knowledge: if a provider is not in the list, this plugin does
not offer it. Since `config_format` 14 there is no `template: custom` fallback —
vwf halts and names the two ways forward: install a plugin that ships it, or
write one.

One rule decides the cross-project case, and it lives in vwf's
`capability-vocabulary.md` rather than here: **consumers follow the publisher.**
If project A publishes a capability backed by one cloud and project B consumes
it, B uses A's flavour even when B's own cloud differs — a consumer that "uses
its own cloud's" is not consuming the same capability, it is standing up a
second one.

## Skills

Two skills, both the vwf **stack adapter**. Neither auto-applies; both are
invoked by `/vwf:architecture` and `/vwf:setup` when `datastore` is listed in
the product's `stacks:`.

| Skill                      | What it returns                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `datastore-stack-menu`     | The templates above as a vwf menu payload — slug, axis, name, one-line summary — plus a `note` on every answer saying managed flavours come from the cloud plugin        |
| `datastore-stack-template` | One template as a vwf template payload: axis fields, the capability tokens it realizes, per-capability harness mechanisms, and the conventions `plan` and `execute` read |

Both are `invocation: both`, and that is load-bearing rather than stylistic: a
`user` skill is removed from the model's context entirely and **cannot be
invoked by vwf**. The failure is silent — vwf does not get an error, it gets an
empty menu.

An unknown slug is an **error**, not a guess: the template skill names the slugs
that do exist and adds that a managed datastore comes from the cloud plugin. A
template this plugin has not written is a template it does not offer.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that asks for a stack menu, and the
  stack-adapter contract this plugin implements.
- [gcp plugin](./gcp.md) — where the managed datastore flavours come from.
- [identity](./identity.md), [observability](./observability.md),
  [orchestration](./orchestration.md), [object-storage](./object-storage.md) —
  the other capability plugins, same shape.
