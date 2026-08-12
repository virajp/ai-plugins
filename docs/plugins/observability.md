# observability plugin

The `observability` plugin is a **capability plugin** for vwf. A capability
plugin holds the neutral contract — what *any* provider must be able to do to
serve a vwf product — and the concrete provider lives with whoever owns it. That
is the same shape as vwf's stack-adapter contract, one level down: **the
capability states the requirement, the provider states the mechanism.**

So this plugin ships two things and no more: the telemetry contract, and the
self-hosted sink that needs no cloud — **OpenTelemetry into a Grafana OTel-LGTM
stack**. Cloud Monitoring and every other managed backend come from the
project's own cloud plugin, and appear there **only as OTLP destinations**.

It realizes the `distributed-tracing` token and the transport half of
`audit-log`. Blueprint prose calls all of it **telemetry** — never a product
name.

## Install

```sh
pnpx @askviraj/ai-plugins --user observability
```

The plugin is opt-in, so it is excluded from `--all` and installed by name.

## The contract

### The rule that outranks every other

**The product emits OTLP. It never instruments against a vendor SDK.**

This is what makes the backend replaceable, and it is the one decision that
cannot be undone cheaply: instrumentation is spread across every service, so a
vendor SDK is a rewrite to leave, while an OTLP exporter is a URL to change. A
managed backend therefore appears in a vwf product **as a destination, never as
an import**.

### What a backend must be able to do

| Requirement                 | Why it is in the contract                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Accept OTLP                 | Traces, metrics and logs, over the transport the runtime can actually reach — an egress-restricted environment is a design constraint. |
| Correlate the three signals | A trace id on the span, the metric exemplar and the log line is what turns three dashboards into one investigation.                    |
| Retain long enough          | Incident review reaches back further than debugging does; the window is stated per signal.                                             |
| Survive its own failure     | The collector going down degrades telemetry, never the product. Exporters are asynchronous, bounded, and drop rather than block.       |

### Cardinality is a design decision

Every label multiplies. A metric labelled by user id or request id is not a
metric — it is a bill, and eventually a backend outage. Two things get decided
and recorded: which attributes are **span** attributes (high cardinality,
sampled) versus **metric** labels (low cardinality, always on), and the
**sampling** shape. Head sampling is cheap and blind; tail sampling keeps the
interesting traces and costs a collector that buffers. Errors are always kept,
whichever is chosen.

### What must be instrumented, whatever the backend

Every inbound request and outbound call; every datastore call, carrying the
caller string the [datastore contract](./datastore.md) requires; and every
background job and workflow activity, joined to the trace that started it — a
job that loses its parent trace is invisible exactly when it is slow.

Out of scope by design: which backend (the user's pick), what is worth alerting
on (a product decision, elicited by the workflow's foundations pass), and the
instrumentation library (the project's language plugin — the contract only
insists the wire format is OTLP).

## Self-hosted provider

One backing template, `otel-lgtm` — *OpenTelemetry · Grafana OTel-LGTM*.

The telemetry sink that needs no cloud: the product exports OTLP and an
OTel-LGTM stack terminates it — logs, traces and metrics behind one query
surface, run wherever the product runs. Pick it when telemetry must not leave
the product's own infrastructure, when the same stack should run locally and in
production, or when a per-ingested-gigabyte bill is the wrong cost curve. The
trade: you operate it. Retention is disk you provision, and an unbounded label
is your outage rather than your invoice.

What the template pins down:

- **The collector is the design decision.** Exporters point at a collector,
  never at the storage backends directly, and that indirection is what lets the
  sink change without touching a service. **Tail sampling lives there** and is
  the reason to have one — keeping every errored and slow trace while sampling
  the rest requires buffering a whole trace, which no service can do alone.
  **Redaction lives there too**: PII that reaches storage is a retention problem
  forever, and a collector processor is the only place dropping it is cheap. Its
  own failure is the one everyone forgets to test, so it gets health, capacity
  and an alert of its own.
- **Cost and cardinality.** The metric store fans out one series per unique
  label combination, so a single label carrying a user or request id can
  multiply series by orders of magnitude and take the stack down before anyone
  reads a dashboard. Two guardrails, both design decisions: high-cardinality
  attributes belong on spans, and a series limit is set with an alert on
  approaching it rather than discovered during an incident. Log volume is the
  other half — a debug level left on in production is the most common cause of a
  storage bill nobody budgeted.
- **Local stack.** The same OTel-LGTM stack, docker-composed behind a `wait-on`
  readiness gate. That is its quiet advantage: local telemetry is *the same
  telemetry*, so a dashboard written against a local run is the one production
  uses, and a missing span is caught before release rather than during an
  incident. The readiness gate is vwf's one non-negotiable mechanism — the
  acceptance verifier needs a deterministic ready signal.
- **Secrets.** The collector endpoint and any ingest credential are injected as
  environment variables and catalogued by name in
  `docs/blueprint/environment.md`. On a private network the endpoint may need no
  credential at all — the template asks you to say so explicitly rather than
  leaving it ambiguous.

## Cloud flavours

A managed backend is **not** here, by design. The project's cloud plugin
supplies it and vwf asks that plugin separately:

| Plugin                        | Flavours                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| [gcp](./gcp.md)               | `distributed-tracing` on both its backing templates — **OTLP only**; GCP services are sinks, never SDKs |
| [cloudflare](./cloudflare.md) | none today — that plugin is parked at Zero Trust Access                                                 |

The menu skill never lists another plugin's template, and never fills a gap from
general telemetry knowledge. It also never lets a template payload quietly
permit a vendor SDK: a payload that does has traded away the one property that
makes the sink replaceable.

The cross-project rule lives in vwf's `capability-vocabulary.md` rather than
here: **consumers follow the publisher.** If project A publishes a capability
backed by one cloud and project B consumes it, B uses A's flavour even when B's
own cloud differs — which for telemetry is what keeps one product's traces
joinable across its projects.

## Skills

Two skills, both the vwf **stack adapter**. Neither auto-applies; both are
invoked by `/vwf:architecture` and `/vwf:setup` when `observability` is listed
in the product's `stacks:`.

| Skill                          | What it returns                                                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `observability-stack-menu`     | The template above as a vwf menu payload — slug, axis, name, one-line summary — plus a `note` on every answer saying a managed backend comes from the cloud plugin and terminates the same OTLP |
| `observability-stack-template` | One template as a vwf template payload: axis fields, the capability tokens it realizes, per-capability harness mechanisms, and the conventions `plan` and `execute` read                        |

Both are `invocation: both`, and that is load-bearing rather than stylistic: a
`user` skill is removed from the model's context entirely and **cannot be
invoked by vwf**. The failure is silent — vwf does not get an error, it gets an
empty menu.

An unknown slug is an **error**, not a guess: the template skill names the slugs
that do exist and adds that a managed backend comes from the cloud plugin.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that asks for a stack menu, and the
  stack-adapter contract this plugin implements.
- [gcp plugin](./gcp.md) — where a managed OTLP destination comes from.
- [datastore](./datastore.md) — the caller string every datastore call carries
  is what gives a hot read an owner here.
- [identity](./identity.md), [orchestration](./orchestration.md),
  [object-storage](./object-storage.md) — the other capability plugins, same
  shape.
