# Observability

The default: **one vendor-neutral telemetry standard, all three signals,
exported to a single sink** — one shared telemetry layer instrumenting every
server-side project identically. Which standard and which sink the
project's stack answers, recorded as the cross-cutting `observability:` token.

## Default contract

- **One shared telemetry layer** in the common package — projects initialise it
  at startup and never hand-roll exporters or loggers. Resource attributes:
  `service.name`, `service.version`, `deployment.environment.name`.
- **Three signals** (traces, metrics, logs) over one wire protocol to one sink.
  Export cadence ~1s local/test, ~10s production; credentials may be null
  locally (export disabled), and UI projects enable telemetry only when the
  endpoint is configured.
- **Trace-correlated structured logging**: every log entry carries the active
  trace/span id; leveled log helpers are the only operational log path — no
  unstructured console output. Errors are typed/coded and logged through the
  same path (no separate error-reporting service server-side; mobile apps use
  the platform's own crash reporter).
- **Sampling keeps what matters**: error spans, HTTP 4xx/5xx, slow requests (>
  2s), plus a base rate (default 10%).
- **Spans wrap every public handler/service method** via a shared `withSpan`
  helper carrying file/function attributes; context propagates cross-service
  by the telemetry standard's own propagation format, browser → API included.
- **Request metrics** on API projects: total/success/failed counters at minimum.
- **Health endpoints**: every cloud project serves `GET /health` (the harness
  contract's `health` capability — `/vwf:verify` consumes it).
- **Config via environment**: the sink endpoint, its credential, and the wire
  protocol — whatever variable names the chosen telemetry standard defines,
  catalogued in `environment.md` per consuming project, never valued in docs.
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
- Alerting/dashboards: driven from the observability backing service by default,
  not from the application (so nothing in-repo); elicit only if the product
  wants dashboards-as-code.

## Blueprint expansion

- `conventions.md#observability` holds the mechanism, per-project initialisation
  table, and the rules/invariants; `environment.md` the telemetry variables per
  project. Realization: the shared telemetry layer pattern in the `packages` /
  `service` / `worker` reference-stack docs.
