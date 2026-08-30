# OpenTelemetry · Grafana OTel-LGTM — conventions

The product exports **OTLP**; an OTel-LGTM stack terminates it — logs, traces
and metrics behind one query surface, run wherever the product runs. The trade
against a managed backend is that you operate it: retention is disk you
provision, and an unbounded label is your outage rather than your invoice.

**The product emits OTLP and never a vendor SDK.** This is what picking this
pack buys — the observability contract requires only that leaving the backend
not be a rewrite, and a neutral wire format is how this pack delivers it. It is
what makes the sink replaceable.

**Exporters point at a collector, never at storage directly.** That indirection
is the whole design: routing, batching, redaction and sampling are the
collector's job, so the sink can change without touching a service.

**The collector is a real component with a real budget**, not a sidecar
afterthought. Tail sampling and PII redaction both live there, and both are
impossible anywhere else.

**Telemetry degrades, never blocks.** Bounded queues on every exporter, dropping
under back-pressure. A telemetry outage that stalls request handling has
converted observability into a dependency.

**Cardinality is a design decision.** High-cardinality attributes go on spans,
never on metric labels; a series limit is set and alerted on before an incident
finds it.

Full judgment: the `otel-lgtm` skill's references.
