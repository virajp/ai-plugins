# OTel-LGTM — cost shape

Self-hosted, the cost is **storage plus the cardinality that consumes it**, and
the operational commitment to keep it healthy. No dollar figures: they age badly
and are wrong per region anyway.

## The curve is different from managed, and that is the point

A managed backend typically bills **per ingested gigabyte**, which means the
marginal cost of detail is money, and it lands during incidents — exactly when
someone raises the log level. Self-hosted, the marginal gigabyte is disk:
cheaper, more predictable, and provisioned in advance rather than billed in
arrears.

The trade is that the ceiling is hard. A managed backend absorbs an unexpected
flood as a surprising invoice. Self-hosted absorbs it by filling the disk, which
is an outage of the thing you use to diagnose outages.

## What actually consumes the storage

**Cardinality, first and by a wide margin.** One bad metric label can produce
more series than the rest of the product combined. See
[cardinality](cardinality.md) — this is the same fact viewed as a bill instead
of as an outage.

**Log volume, second.** Retention is a per-signal decision, and logs are usually
the cheapest signal per line and the most numerous by orders of magnitude. A
debug level left on in production is the most common cause of storage nobody
budgeted for.

**Trace sampling rate, third.** Tail sampling at the collector is what keeps
this proportionate: retain every error and slow trace, sample the ordinary ones.
Retaining everything is rarely worth what it costs, and retaining a flat random
sample throws away the interesting cases.

## The costs people forget

- **Retention is disk you provision**, and it does not shrink when you shorten
  the window — reclaiming space is an operation, not a setting change.
- **Redundancy multiplies everything.** An observability stack that must survive
  a node failure costs roughly what its replica factor says.
- **Backups of telemetry**, where they are required at all, are a real line
  item. Frequently they are not required — telemetry is often acceptably lost —
  and stating that explicitly saves provisioning for a need nobody has.
- **The operator's time**, which is the cost that does not appear anywhere and
  is usually the largest.

## Setting the limit before it sets itself

The series limit and the retention windows are **capacity decisions taken up
front** against provisioned storage. Taken up front they are a budget; taken
during an incident they are a scramble.
