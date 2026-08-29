# OTel-LGTM — cardinality, the constraint that bites

The one property that reshapes how the product is instrumented. Self-hosted,
cardinality is not a billing surprise — it is an outage.

## The mechanism

The metric store fans out **one series per unique label combination**. Labels
multiply: three labels with ten values each is a thousand series; add a fourth
carrying a user id and it is unbounded.

A single label carrying a user id, request id, session id, full URL path or raw
error message can multiply series by orders of magnitude and take the stack down
**before anyone reads a dashboard**. The failure arrives during the incident
that made you look.

## Guardrail 1 — high-cardinality attributes belong on spans

This is the rule, and it is not a compromise: spans are *designed* to carry
unbounded attributes. A user id, a request id, a full path, an error message —
all of them belong on the span, where they cost one attribute on one record and
are exactly what you want when you drill in.

The instinct to put them on metric labels comes from wanting to filter a
dashboard by them. The answer to that instinct is an exemplar: the metric points
at a representative trace, and the trace carries the detail.

## Guardrail 2 — a series limit, alerted on before it is reached

**Set a limit and alert on approaching it**, rather than discovering it during
an incident. This is the difference between "a deploy introduced a bad label and
we caught it in an hour" and "the observability stack is down and we cannot see
why the product is down".

The limit is a real capacity decision, tied to the storage the stack was
provisioned with — see [cost shape](cost-shape.md).

## The bounded-label test

Before adding a metric label, ask: **what is the complete set of values this can
ever take, and is it small?** If the answer is not a short list you can write
down, it is a span attribute.

Values that are bounded and fine: environment, service name, region, HTTP
method, status class, a closed enum from the blueprint's entity lifecycle.

Values that are not, however tempting: user id, tenant id in a
many-tenant product, request path with ids in it, error message text, version
string in a continuously-deployed service.

## Log volume is the other half

Retention is a **per-signal decision** — traces, metrics and logs do not need
the same window, and treating them as one is how the storage bill or the disk
gets consumed by the least valuable signal.

**A debug level left on in production is the most common cause of a storage
problem nobody budgeted for.** Log level is deployment configuration, and it
should be verifiable per environment rather than assumed.
