---
name: otel-lgtm
version: 0.1.0
category: development
description: OpenTelemetry with a self-hosted Grafana OTel-LGTM stack as this
  product's telemetry sink — when self-hosting is the right answer, how it
  satisfies the observability contract, cardinality as the constraint that
  reshapes design, the collector and credentials, cost shape, and the local
  stack. Auto-applies when editing instrumentation or collector config.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/telemetry/**"
  - "**/otel*"
  - "**/collector*"
---

# OpenTelemetry · Grafana OTel-LGTM

The telemetry sink that needs no cloud. This skill carries the judgment; the
SDK and collector API surface belong to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this sink | [Pick & trade](references/pick-and-trade.md) |
| Wiring exporters, correlation, back-pressure | [Contract satisfaction](references/contract-satisfaction.md) |
| Adding metrics, labels, attributes | [Cardinality](references/cardinality.md) |
| Configuring the collector, endpoints, credentials | [Integration & access shape](references/access-shape.md) |
| Sizing storage, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Standing it up locally or in CI | [Local stack](references/local-stack.md) |

**The rule that does not wait for a reference:** the product emits OTLP and
never a vendor SDK. The sink is a destination, not an import.
