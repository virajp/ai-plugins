# Observability

The default: **OpenTelemetry, all three signals, exported to Grafana Cloud** —
one shared telemetry layer instrumenting every server-side project identically.
Cross-cutting token: `observability: opentelemetry-grafana`.

## Default contract

- **One shared telemetry layer** in the common package — projects initialise it
  at startup and never hand-roll exporters or loggers. Resource attributes:
  `service.name`, `service.version`, `deployment.environment.name`.
- **Three signals** (traces, metrics, logs), OTLP over HTTP to Grafana Cloud.
  Export cadence ~1s local/test, ~10s production; the API key may be null
  locally (export disabled), UI projects enable telemetry only when the endpoint
  is configured.
- **Trace-correlated structured logging**: every log entry carries the active
  trace/span id; leveled log helpers are the only operational log path — no
  unstructured console output. Errors are typed/coded and logged through the
  same path (no separate error-reporting service server-side; mobile apps use
  the platform crash reporter, e.g. Crashlytics).
- **Sampling keeps what matters**: error spans, HTTP 4xx/5xx, slow requests (>
  2s), plus a base rate (default 10%).
- **Spans wrap every public handler/service method** via a shared `withSpan`
  helper carrying file/function attributes; context propagates cross-service
  (standard OTel propagation, browser → API included).
- **Request metrics** on API projects: total/success/failed counters at minimum.
- **Health endpoints**: every cloud project serves `GET /health` (the harness
  contract's `health` capability — `/vwf:verify` consumes it).
- **Config via environment**: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_EXPORTER_API_KEY`, protocol — catalogued in `environment.md` per
  consuming project, never valued in docs.
- **No PII in spans, logs, or metric labels** — the data-retention reference's
  discipline applies to telemetry first.

## Elicit per product

- The environment names (`deployment.environment.name` values) and which
  projects export from local/dev.
- Any product-specific metrics beyond the request counters. Business counters
  are usually a combination of **flow outcomes** (a flow completed, failed, or
  compensated — name them in the owning flow doc, beside its Acceptance block)
  and **entity states** (counts by lifecycle state — name them in the owning
  entity doc, beside its Lifecycle table).
- Alerting/dashboards: Grafana-side by default (not in-repo); elicit only if the
  product wants dashboards-as-code.

## Blueprint expansion

- `conventions.md#observability` holds the mechanism, per-project initialisation
  table, and the rules/invariants; `environment.md` the OTel variables per
  project. Realization: the shared telemetry layer pattern in the `packages` /
  `service` / `worker` reference-stack docs.
