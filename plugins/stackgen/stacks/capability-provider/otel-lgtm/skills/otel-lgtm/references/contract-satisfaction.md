# OTel-LGTM — contract satisfaction

Clause by clause against the neutral observability contract
(`assets/contracts/observability.md`). It cites, and does not restate.

## The product emits OTLP, never a vendor SDK

**This is the pack's own rule, not the contract's.** The contract asks only that
leaving the backend never be a rewrite; emitting OTLP is how *this* pack answers
that, and it is the guarantee picking this pack buys. Satisfied by construction
— OTLP is the native protocol here, so there is no temptation to import anything
else, and self-hosting is the configuration where it is easiest to keep: there
is no vendor SDK on offer.

The failure to watch for is a **library** that ships its own vendor exporter.
Its telemetry should be bridged into OTLP, not exported alongside it, or the
product has two telemetry pipelines and only one of them is replaceable.

## OTLP in, through a collector

**Exporters point at a collector, never at the storage backends directly.**

That indirection is what satisfies the contract's replaceability requirement.
Routing, batching, redaction and sampling all become the collector's job, which
means the sink can be changed, split or duplicated without touching a service or
redeploying anything.

Pointing a service directly at storage works, and it welds the product to that
storage. It is the shortcut that costs the property the contract exists to
protect.

## Signal correlation

**Trace id on the span, exemplars on the metric, and the same id on the log
line.** Wire it once, at the exporter, rather than per service — per-service
wiring is how one service ends up as the gap in every investigation.

Correlation is what makes three signals one story: a metric spike leads to an
exemplar trace, the trace leads to its logs. Without it there are three
dashboards and a human doing joins by timestamp, which is what observability was
supposed to replace.

## Degrade, never block

**Bounded queues on every exporter, dropping under back-pressure.**

A telemetry outage that stalls request handling has converted observability into
a dependency — the product now fails when its monitoring fails, which is
precisely backwards. Unbounded queues are the same failure wearing a different
hat: they consume memory until the process dies.

Dropping telemetry is the correct behaviour under pressure. Make sure the drop
is counted, because silent dropping means the gap in the data looks like an
absence of traffic.

## What must be instrumented

The contract names this, and it is not the sink's decision — see the contract
itself. What the sink adds: instrument at the **boundaries** the collector can
enrich, so that attribution work happens once at the collector rather than being
duplicated into every service.
