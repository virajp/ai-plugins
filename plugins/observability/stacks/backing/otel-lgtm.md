---
axis: backing
name: OpenTelemetry · Grafana OTel-LGTM
capabilities: [distributed-tracing]
local_stack: docker-compose
---

# Backing — OpenTelemetry · Grafana OTel-LGTM

The telemetry sink that needs no cloud: the product exports **OTLP**, and an
OTel-LGTM stack terminates it — logs, traces and metrics behind one query
surface, run wherever the product runs. Pick it when telemetry must not leave
the product's own infrastructure, when the same stack should run locally and in
production, or when a per-ingested-gigabyte bill is the wrong cost curve.

The trade against a cloud's managed backend: you operate it. Retention is disk
you provision, and an unbounded label is your outage rather than your invoice.

## How it satisfies the contract

- **OTLP in** — the product's exporters point at a **collector**, never at the
  storage backends directly. That indirection is what lets the sink change
  without touching a service: routing, batching, redaction and sampling are the
  collector's job.
- **Correlation** — trace id on the span, exemplars on the metric, and the same
  id on the log line. Wire this once, at the exporter, rather than per service.
- **Degrade, never block** — bounded queues on every exporter, dropping under
  back-pressure. A telemetry outage that stalls request handling has converted
  observability into a dependency.

## The collector is the design decision

Run one as a real component with a real budget, not as a sidecar afterthought:

- **Tail sampling lives here**, and it is the reason to have one. Keeping every
  errored and slow trace while sampling the rest requires buffering a whole
  trace, which no service can do alone.
- **Redaction lives here too.** PII that reaches storage is a retention problem
  forever; a processor that drops it at the collector is the only place it is
  cheap.
- Its own failure is the failure everyone forgets to test. Give it health,
  capacity and an alert of its own.

## Cost and cardinality

Self-hosted, cost is storage plus the cardinality that consumes it. The metric
store fans out one series **per unique label combination**, so a single label
carrying a user or request id can multiply series by orders of magnitude and
take the stack down before anyone reads a dashboard.

Two guardrails, both design decisions:

1. High-cardinality attributes belong on **spans**, not on metric labels.
2. Set a **series limit** and alert on approaching it, rather than discovering
   it during an incident.

Log volume is the other half: retention is a per-signal decision, and a debug
level left on in production is the most common cause of a storage bill nobody
budgeted.

## Local stack

The same OTel-LGTM stack, docker-composed behind a `wait-on` readiness gate.
This is its quiet advantage: local telemetry is *the same telemetry*, so a
dashboard written against a local run is the dashboard production uses, and a
missing span is caught before release rather than during an incident.

The readiness gate is vwf's one non-negotiable mechanism — the acceptance
verifier needs a deterministic ready signal.

## Secrets

The collector endpoint and any ingest credential are injected as environment
variables and catalogued by name in `docs/blueprint/environment.md`. Nothing is
read from a committed file. On a private network the endpoint may need no
credential at all — say so explicitly rather than leaving it ambiguous.
