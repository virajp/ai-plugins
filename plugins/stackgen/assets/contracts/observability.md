# Observability — the capability contract

What **any** telemetry backend has to satisfy to serve a vwf product, stated
without naming one. The provider packs under `stacks/capability-provider/` say how a
particular sink satisfies it; a cloud plugin's managed flavour says the same for
its own.

Capability tokens realized here: `distributed-tracing`, and the transport half
of `audit-log`. Blueprint prose calls all of this **telemetry** — never the
product name.

## The requirement that outranks every other

**Leaving the backend must not be a rewrite.**

Instrumentation is spread across every service, so this is the one decision that
cannot be undone cheaply. Whatever the product instruments against, the cost of
changing sink has to stay proportional to the change — configuration, not a pass
over every handler in the codebase.

**A vendor-neutral telemetry standard satisfies this by construction, which is
why it is the recommended answer rather than the only permitted one.** Emit a
neutral wire format and the backend is a destination, not an import: the
exporter becomes a URL to change. That guarantee is **what choosing such a
provider pack buys** — the argument for it belongs to the pack, not to this
contract; `otel-lgtm`'s *pick & trade* reference is where it is made.

A product may instead instrument against a backend's own SDK. Nothing here
forbids it, and this contract does not pretend the trade is free: that product
has spent the replaceability this requirement exists to protect, and the
`observability:` selection is where it says so.

## What a backend must be able to do

1. **Accept all three signals** — traces, metrics and logs — in the wire format
   the product emits, over the transport the runtime can actually reach. An
   egress-restricted environment is a design constraint, not a networking
   detail.
2. **Correlate the three signals.** A trace id present on the span, the metric
   exemplar and the log line is what turns three dashboards into one
   investigation. A backend that cannot join them is a backend that answers
   "something is slow" and stops.
3. **Retain long enough to answer the question that matters.** Incident review
   reaches back further than debugging does; state the window per signal.
4. **Survive its own failure.** The collector going down must degrade the
   product's telemetry, never the product. Exporters are asynchronous, bounded,
   and drop rather than block.

## Cardinality is a design decision

Every label multiplies. A metric labelled by user id or request id is not a
metric — it is a bill, and eventually a backend outage. Decide, and record:

- Which attributes are **span** attributes (high cardinality, sampled) versus
  **metric** labels (low cardinality, always on).
- The **sampling** shape. Head sampling is cheap and blind; tail sampling keeps
  the interesting traces and costs a collector that buffers. Errors are always
  kept, whichever is chosen.

## What must be instrumented, whatever the backend

- Every inbound request and every outbound call the product makes.
- Every datastore call, carrying the caller string the datastore contract
  requires — that is what gives a hot read an owner.
- Every background job and workflow activity, joined to the trace that started
  it. A job that loses its parent trace is invisible exactly when it is slow.

## What this contract does not decide

- **Which backend.** That is the user's pick from the menu — the self-hosted
  `otel-lgtm` sink, or a managed flavour from the project's cloud plugin.
- **What is worth alerting on.** Reliability targets are a product decision,
  elicited by the workflow's foundations pass.
- **The instrumentation library, or the wire format it speaks.** Both belong to
  the project's language plugin and the sink it is pointed at; this contract
  only insists that changing sink stays a configuration change.
