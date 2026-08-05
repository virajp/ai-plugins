# Reliability Targets

Explicit, per-service **SLOs** — availability and latency a user can rely on —
plus the **error-budget stance** that decides what happens when a target is
missed. Distilled from the Well-Architected reliability pillar; without targets,
"reliable" is vibes and every incident debate starts from zero. Cross-cutting
token: `reliability: slo`.

## Default contract

- **One availability SLO and one latency SLO per deployed project carrying
  `service` or `site`** (e.g. `99.9% of requests succeed over 30 days`,
  `p95 < 400ms on API reads`), stated per project, not product-wide — an
  operator back-office may run laxer targets than the public API. A `worker`
  states a **freshness/completion SLO** instead (e.g.
  `95% of jobs done within 5m of trigger`).
- **Measured from existing telemetry** — the SLIs come from the observability
  foundation's traces/metrics (request success ratio, latency histograms, queue
  lag), never from a separate measurement stack.
- **An error-budget stance, one line**: what changes when the budget is burned
  (e.g. "feature work pauses; only reliability fixes ship until the window
  recovers"). The stance is a product decision — the point is that it is
  *written down before* the first incident.
- **Targets are contract, alerting is realization**: the SLO values live in
  `conventions.md`; alert thresholds, burn-rate windows, and dashboards belong
  to the stack docs and the ops setup.

## Elicit per product

- The availability and latency numbers per deployed project (offer the defaults
  above as starting points; a pre-launch product may consciously pick loose
  targets — that is a valid, recorded choice).
- The error-budget stance.
- Which flows are **critical-path** (their acceptance criteria are the ones the
  SLO protects) — usually the standard flows `signin` and `home` plus the
  product's revenue path.

## Blueprint expansion

- `conventions.md#reliability` holds the per-service SLO table, the SLI sources,
  and the error-budget stance. Flow docs never restate targets; a flow with a
  stricter need than its service's SLO records **that delta** on the flow.
- `/vwf-verify`'s health pass reads the table when present: a health check that
  passes but breaches a stated latency target is reported as a warning, not a
  pass. Realization (alert rules, dashboards): the stack docs' observability
  sections.
