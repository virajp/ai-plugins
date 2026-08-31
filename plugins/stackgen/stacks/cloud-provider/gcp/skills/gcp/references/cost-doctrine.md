# Cost doctrine — Google Cloud

**No dollar figures live here.** Prices change, regions differ, and a stale
number is worse than none — a reader who trusts one makes a wrong decision
confidently. What does not change is the **billing model** (what you are charged
*per*) and the **trap** (the design choice that multiplies it). Both are stable
for years, and both are what an SDK reference never tells you.

For current prices, use the pricing calculator or the billing console. For how
the meter runs, read on.

## The one principle

**Google Cloud bills per operation far more often than per capacity.** The
instinct from running servers — it is provisioned, so use it freely — inverts
here. A loop that reads one record at a time is not slow-but-fine; it is the
bill. Most cost surprises on this provider are a single N+1 pattern somewhere in
a hot path.

The corollary is the part that matters for a blueprint: **cost is a design
property, not an ops property.** It is decided in the data model and the access
pattern, and it is nearly unfixable by tuning afterwards.

**One service inverts the principle**, and it is worth knowing which: a managed
relational instance bills for provisioned capacity, so it costs the same idle.
Every other service in a typical stack bills for what happened.

## Where the meter runs, by shape

Each service component in this bundle carries its own cost shape and cites this
file. What follows is the provider-wide picture — the categories a design gets
wrong before any one service is chosen.

| Shape | Billed per | The trap |
| --- | --- | --- |
| Document store | record read/write/delete, stored bytes, egress | Reads dominate every other line. A screen that fetches a hundred records to display ten fields bills a hundred reads. |
| Managed relational instance | instance-hour + storage + egress | Provisioned, not consumed. Idle non-production instances are the most common waste, and storage auto-grows but **never shrinks**. |
| Managed cache | instance-hour by capacity tier | Provisioned like the above. Sizing for peak means paying for peak permanently. |
| Wide-column store | node-hour + storage | Nodes are the unit and the minimum is real. Not economical below sustained high throughput. |
| Analytics warehouse | bytes **scanned** per query | `SELECT *` on a wide table scans every column; an unpartitioned table scans all history on every query. Partition and cluster before the first real query, not after the first bill. |
| Request-scoped compute | vCPU-second + memory-second while handling a request, plus per request | A warm-instance floor defeats scale-to-zero, and concurrency is the largest lever available. |
| Pod-scheduled compute | pod CPU/memory **requests**, plus a per-cluster fee | You pay what you requested, not what you used. Over-requesting is invisible, and it is the default outcome of copied manifests. |
| Message queue / pub-sub | message volume + retained bytes | A subscription nobody drains retains messages and bills for them. Dead-letter topics need draining too. |
| Object storage | stored bytes by class + operations + egress | Class transitions and early deletion carry minimums — moving data to a colder class then deleting it soon after can cost *more* than leaving it. |
| Load balancing | forwarding-rule-hour + data processed | An external load balancer is a permanent charge. A request-scoped service's built-in URL is free — take the balancer only for a custom domain, a WAF, or multi-backend routing. |
| CDN | cache egress + fill | A low hit ratio means paying fill *and* egress. Measure the ratio before assuming it saves money. |
| Model inference | tokens, input and output metered separately | Output is typically the more expensive side. Retry loops multiply cost silently, and prompts that resend unchanged context pay for it every turn. |
| **Egress** | bytes leaving, by destination | The line item nobody models. Cross-region chatter between your *own* services is billable; same-region is not. |

**Egress deserves its own sentence** because it is the only one that is a
topology decision rather than a service decision: co-locate services that talk
to each other, and put the datastore in the region of the service that reads it
most.

## The six guardrails that go in on day one

Each is cheap now and nearly impossible to retrofit calmly during an incident.

1. **A billing budget with alerts** at several thresholds, on every project.
   This is the single highest-value setting on the provider.
2. **One project per environment.** Shared projects make attribution impossible,
   so nobody can answer which change moved the bill.
3. **Labels on every resource**, so the billing export can group by service and
   by team.
4. **Lifecycle rules on every bucket**, set at bucket creation.
5. **Partitioning on every analytics table**, set at table creation.
6. **A ceiling on every autoscaling service** — the setting that turns a runaway
   loop or a traffic spike into an outage instead of an invoice, and, in front
   of a connection-limited datastore, into a bounded failure instead of a total
   one.

## Reviewing a design for cost

Four questions, in this order:

1. **What runs per request?** Count datastore reads on the hottest path. This
   finds the N+1 that dominates most bills.
2. **What runs when nothing happens?** Provisioned instances, warm-instance
   floors, idle clusters, undrained subscriptions. Idle cost is what makes
   non-production environments expensive.
3. **What crosses a region or leaves the network?** That is egress.
4. **What grows without bound?** Logs, stored objects, table history — anything
   with no retention policy is a cost that only rises.

A design that answers these four well is usually within a small factor of
optimal, and no amount of later tuning rescues one that answers them badly.

## What this file does not decide

Retention periods, tier choices and instance sizes are the product's, recorded
in the blueprint's conventions rather than here. This file states how the meter
runs; what the product is willing to spend is a product decision.
