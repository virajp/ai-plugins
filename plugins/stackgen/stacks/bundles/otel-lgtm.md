---
name: OpenTelemetry · Grafana OTel-LGTM
axis: backing
kind: capability-provider
components:
- capability-provider/otel-lgtm@0.1.0
---

# Backing — OpenTelemetry · Grafana OTel-LGTM

The telemetry sink that needs no cloud: the product exports **OTLP** and an
OTel-LGTM stack terminates it, run wherever the product runs.

**The composition is the neutral observability contract plus this one sink.** The
contract (`assets/contracts/observability.md`) requires only that leaving the
backend never be a rewrite; it names no protocol. What this bundle adds is the
answer — the product emits OTLP and never a vendor SDK, which makes the sink a
destination rather than an import, and makes the bundle replaceable by a managed
backend without touching a service. That guarantee is what picking it buys, not
a law every product is held to.

The constraint the product is built around is **cardinality**. Self-hosted it is
not a billing surprise but an outage: one metric label carrying a user id can
take the stack down before anyone reads a dashboard.

Full judgment: the component's own skill and its references. The contract it
cites is `assets/contracts/observability.md`.
