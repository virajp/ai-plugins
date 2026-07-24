# Cost Guardrails

A **budget with alerts and per-service resource caps** so a bug, an abuse wave,
or a runaway job surfaces as a notification — never as a surprise invoice.
Distilled from the Well-Architected cost pillar, sized for a solo/small-team
product: guardrails, not FinOps. Cross-cutting token: `cost: budget-caps`.

## Default contract

- **One monthly budget** for the product with **alerts at 50% / 90% / 100%**
  routed to the operator (through the notifications foundation's channels when
  accepted; the platform's billing alerts otherwise).
- **Per-service resource caps**: every deployed `service`/`worker` states its
  scaling ceiling (max instances, max concurrency) — the cap that bounds the
  worst-case bill, chosen deliberately rather than left at the platform default.
  Rate limiting (its own foundation) bounds abuse-driven cost at the request
  layer; the caps bound it at the infrastructure layer.
- **Expensive operations are metered**: operations the product knows are costly
  (media processing, LLM calls, fan-out jobs) get a per-operation usage metric
  from day one, so a cost spike is attributable within the observability stack —
  never reconstructed from the bill.
- **Cost anomalies are operational events**: a 100% budget alert has a stated
  response (default: the operator investigates the metered operations and may
  tighten runtime-settings limits) — not a shrug.

## Elicit per product

- The monthly budget number and where alerts land.
- The scaling ceiling per deployed service/worker (offer the platform's
  sensible-minimum as the default).
- Which operations count as expensive and get metered.

## Blueprint expansion

- `conventions.md#cost` holds the budget, alert thresholds and routing, the
  per-service caps table, and the metered-operations list. A flow that
  introduces a new expensive operation adds it to that list as part of its pass.
  Realization (billing budgets, scaling config): the stack docs and the hosting
  setup.
