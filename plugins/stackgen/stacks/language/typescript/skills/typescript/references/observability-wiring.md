# TypeScript — observability wiring

The observability capability owns the pipeline contract. This topic is only the
**language's idiomatic emission hook** — how a TypeScript service produces
telemetry, not where it goes.

## OTLP, never a vendor SDK

The product emits OpenTelemetry over OTLP and imports no vendor's own SDK. This
is the observability contract's rule that outranks the rest, and in TypeScript
it is easy to break by accident: most managed backends publish a friendly Node
package, and adding it takes one line.

That one line welds the product to that backend. Where a library ships its own
vendor exporter, bridge it into OTLP rather than exporting alongside it — two
pipelines means only one of them is replaceable.

## Initialise before anything else is imported

Auto-instrumentation works by patching modules as they load, so it must be
started **before** the modules it patches are imported. Initialise telemetry in
its own entry module, loaded first — not partway down the main file, after the
HTTP framework has already been pulled in.

This is the single most common wiring bug in Node telemetry: everything is
configured correctly and no spans appear, because the framework was imported
first.

## Let auto-instrumentation do the boundaries; add spans for meaning

Auto-instrumentation covers the incoming request, the outbound call, the
datastore query. It does not know what the product's *operations* are. Manual
spans are worth adding where a blueprint flow's step is a meaningful unit — the
thing you would want to see took too long.

Do not wrap every function. A trace with hundreds of trivial spans is harder to
read than one with the six that matter, and it costs at the sink — see
`cardinality` in the `otel-lgtm` pack.

## Attributes go on spans, never as metric labels

Request ids, user ids, entity ids: all belong on the span, which is designed for
unbounded values. Putting them on a metric label multiplies series without
bound, which is an outage at a self-hosted sink and a bill at a managed one.

## Context propagation across async boundaries

Trace context follows the async execution context, which works for ordinary
`await` chains and **breaks where work is detached** — a queued job, a
`setTimeout`, an event emitter, work handed to another process.

Those are exactly the places a trace is most valuable. Propagate the context
explicitly across them, or every asynchronous process is a hole in the trace.

## Logs carry the trace id

Correlation is what makes three signals one story. Wire the trace id into the
logger once, at setup, so every line carries it — per-call wiring is how one
module becomes the gap in every investigation.

## Shut down cleanly

Telemetry is batched. A process that exits without flushing loses the spans for
the request that most likely caused the exit. Flush on shutdown, with a bounded
timeout — and bounded matters, because a shutdown that hangs waiting on an
unreachable collector turns a clean restart into a stuck one.
