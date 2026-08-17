# orchestration plugin

The `orchestration` plugin is a **capability plugin** for vwf, covering work
that happens later. A capability plugin holds the neutral contract — what *any*
provider must be able to do to serve a vwf product — and the concrete provider
lives with whoever owns it. That is the same shape as vwf's stack-adapter
contract, one level down: **the capability states the requirement, the provider
states the mechanism.**

So this plugin ships two things and no more: the async-work contract, and the
self-hosted engine that belongs to no cloud — **Temporal**. Cloud Workflows,
Pub/Sub, managed task queues and every other flavour come from the project's own
cloud plugin, and vwf renders the union of both menus.

It realizes the `durable-workflows`, `message-queue`, `pub-sub` and
`scheduled-jobs` capability tokens. Blueprint prose calls these **the queue**,
**the event bus** or **the worker** (named by registry project) — never a
product name.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

```sh
claude plugin install orchestration@virajp-plugins
```

Add `--scope project` to scope it to one repo instead of every repo on your
machine. There is no default install set — every plugin here, `orchestration`
included, is installed by name.

## The contract

### Pick the smallest thing that holds

These are four different problems, and conflating them is the usual mistake:

| Need                                                     | Reach for         |
| -------------------------------------------------------- | ----------------- |
| One step, later, retried until it succeeds               | a queue           |
| Many independent consumers of the same fact              | an event bus      |
| A step at a time or on a calendar                        | a scheduler       |
| A multi-step process with state, timers and compensation | a workflow engine |

A workflow engine is the heaviest of the four and the only one that carries
state across steps. Do not buy it for a job table's worth of work; do not
simulate it with retries and a status column when the process genuinely has
branches, waits and compensation.

The contract also records the case where **no service is needed at all**: a job
table in the product's own datastore is a legitimate answer — one less service,
transactional with the write that enqueued it. That is not a template, and the
menu deliberately does not invent one for it; vwf's `template: custom` fallback
records it.

### What a backend must be able to do

| Requirement                   | Why it is in the contract                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deliver at least once         | Every one of these does, and the ones that claim otherwise mean it within a window. So **every consumer is idempotent**, keyed on an id it records. |
| Retry with back-off, and stop | Bounded and exponential. Unbounded retry against a failing dependency is a denial of service the product performs on itself.                        |
| Have a poison path            | Work that will never succeed goes somewhere a human sees it. No dead-letter destination means silent drops or infinite retries.                     |
| Make work in flight visible   | Depth, age of the oldest item, failure rate. "Is it stuck?" must be answerable without reading code.                                                |
| Preserve the trace            | A job joined to the trace that enqueued it is debuggable; one that is not is invisible exactly when it is slow.                                     |

**Retry only what is safe to repeat.** Retry is not a universal wrapper — an
operation is retried only when repeating it is safe, either naturally idempotent
or made so by a key the receiver records. A payment, an email and an external
mutation are the three that catch everyone.

The access rule follows the other capability plugins: a project reaches the
backend only through the shared services layer, and no project imports a client
SDK directly. A client that connects lazily, is idempotent on already-started,
and *records rather than connects* under test is what keeps the unit suite free
of a running broker.

Out of scope by design: which engine (the user's pick), which processes are
asynchronous (a blueprint contract, authored per product per flow), and the
client library (the project's language plugin).

## Self-hosted provider

One backing template, `temporal` — *Temporal*.

Durable execution that needs no cloud: a workflow is ordinary code whose
progress is persisted, so a process crash, a deploy or a week-long wait resumes
exactly where it stopped. Pick it when a process has **state across steps** —
branches, timers, human waits, compensation — and losing that state halfway is
unacceptable. Do not pick it for fire-and-forget work; that is a queue's job,
and this engine is the heaviest option on the menu.

What the template pins down:

- **How it satisfies the contract** — activities can run more than once, so each
  is idempotent on a recorded id; a retry policy per activity with a maximum
  attempt count, and failures that will never succeed raised as non-retryable; a
  failed workflow that stays visible with its full history, which *is* the
  dead-letter queue; visibility by type and by the search attributes the product
  sets deliberately; and trace context propagated into the workflow start and
  out to each activity.
- **Determinism is the rule that bites.** The workflow body is re-executed from
  history on every resume, so no clock reads, no random values, no network
  calls, no direct I/O — all of it goes in activities. The second half of the
  same rule: **changing a workflow's shape breaks in-flight executions.**
  Versioning is a deliberate act, decided up front — versioned in place, or
  drained before a change ships.
- **Where the boundary sits.** Callers start and signal workflows through the
  shared services layer, never a direct SDK import. Starting the same business
  process twice is a normal race, not an error.
- **Cost shape.** Self-hosted, it is a stateful service with a datastore of its
  own, and that datastore's durability is the product's durability; history
  grows with every event, so a looping workflow grows without bound unless
  iterations are capped with continue-as-new. Managed, billing follows
  **actions**, so a chatty workflow with many small activities can cost more
  than the work it coordinates — batch inside an activity rather than across
  activities.
- **Local stack.** A docker-composed dev server behind a `wait-on` readiness
  gate — vwf's one non-negotiable mechanism, because the acceptance verifier
  needs a deterministic ready signal. The engine's own test framework is the
  other half and the payoff: time is skippable, so a workflow that waits
  fourteen days is tested in milliseconds rather than mocked away.
- **Secrets.** The server address and any client credential are injected as
  environment variables and catalogued by name in
  `docs/blueprint/environment.md`. Workflow inputs and results are persisted in
  history, so anything sensitive is either not passed or encrypted before it is.

## Cloud flavours

A managed queue, bus or scheduler is **not** here, by design. The project's
cloud plugin supplies it and vwf asks that plugin separately:

| Plugin                        | Flavours                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [gcp](./gcp.md)               | `message-queue` via the `cloud-sql` backing template                                                                 |
| [cloudflare](./cloudflare.md) | none today — that plugin is parked at Zero Trust Access, and its Queues surface arrives under its own dedicated plan |

The menu skill never lists another plugin's template, and never fills a gap from
general queueing knowledge: if an engine is not in the list, this plugin does
not offer it. Since `config_format` 14 there is no `template: custom` fallback —
vwf halts and names the two ways forward: install a plugin that ships it, or
write one. (The contract's *no service at all* answer — a job table in the
product's own datastore — is unaffected: the project simply carries no
orchestration slug in its `backing_template` list.)

The cross-project rule lives in vwf's `capability-vocabulary.md` rather than
here: **consumers follow the publisher.** If project A publishes a capability
backed by one cloud and project B consumes it, B uses A's flavour even when B's
own cloud differs — a queue with two implementations is two queues.

## Skills

Two skills, both the vwf **stack adapter**. Neither auto-applies; both are
invoked by `/vwf:architecture` and `/vwf:setup` when `orchestration` is listed
in the product's `stacks:`.

| Skill                          | What it returns                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orchestration-stack-menu`     | The template above as a vwf menu payload — slug, axis, name, one-line summary — plus a `note` on every answer saying managed queues, buses and schedulers come from the cloud plugin |
| `orchestration-stack-template` | One template as a vwf template payload: axis fields, the capability tokens it realizes, per-capability harness mechanisms, and the conventions `plan` and `execute` read             |

Both stay model-invocable, and that is load-bearing rather than stylistic: a
skill marked `disable-model-invocation: true` is removed from the model's
context entirely and **cannot be invoked by vwf**. The failure is silent — vwf
does not get an error, it gets an empty menu.

An unknown slug is an **error**, not a guess: the template skill names the slugs
that do exist and adds that managed queues, buses and schedulers come from the
cloud plugin.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that asks for a stack menu, and the
  stack-adapter contract this plugin implements.
- [gcp plugin](./gcp.md) — where the managed queue and scheduler flavours come
  from.
- [datastore](./datastore.md) — a job table there is the legitimate answer when
  no broker is needed.
- [observability](./observability.md) — a job that loses its parent trace is
  invisible exactly when it is slow.
- [identity](./identity.md), [object-storage](./object-storage.md) — the other
  capability plugins, same shape.
