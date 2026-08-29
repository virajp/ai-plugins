# OTel-LGTM — local stack

## The mechanism is fixed

**The same OTel-LGTM stack, docker-composed behind a `wait-on` readiness
gate.** The gate is vwf's one non-negotiable harness mechanism — the acceptance
verifier needs a deterministic ready signal, and `sleep 5` is a guess that
passes on a fast machine and fails in CI.

## Its quiet advantage: the same telemetry

This is the reason self-hosting is worth real consideration, and it is
undersold by every comparison that only weighs cost and operations.

**Local telemetry is the same telemetry.** The same collector config, the same
storage, the same query surface. Which means:

- **A dashboard written against a local run is the dashboard production uses.**
  Not an approximation of it — the same one, exportable and committable.
- **A missing span is caught before release**, during ordinary development,
  rather than during an incident when its absence is what stops you.
- **A cardinality mistake shows up as a local series count**, not as a
  production outage. The most expensive failure mode in
  [cardinality](cardinality.md) becomes catchable on a laptop.

A managed backend cannot generally be run locally, so local observability
becomes a different and worse thing — usually console logs — and the gap between
them is where instrumentation bugs live.

## What to compose

The collector plus the storage backends, with the collector configured the same
way production configures it. The temptation is to run a stripped local
collector without the processors; resist it, because the processors — sampling
and redaction — are the parts most worth testing.

Redaction especially: a redaction rule that has never run is a rule you are
trusting on the strength of having written it.

## What it does not prove

It does not prove **capacity**. A laptop stack with a few minutes of data says
nothing about retention, series limits, or what happens under production
volume. Those are verified against the deployed environment by `/vwf:verify`,
not here.
