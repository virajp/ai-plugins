---
name: gcp-cost
description: How Google Cloud services actually bill, and the traps that turn a
  cheap architecture expensive — per-service cost models, the design decisions
  that move the bill, and the guardrails to put in first. Use when choosing
  between GCP services, reviewing a design for cost, or diagnosing a bill.
invocation: both
model: opus
effort: high
---

# Google Cloud cost

**No dollar figures live here.** Prices change, regions differ, and a stale
number is worse than none — a reader who trusts it makes a wrong decision
confidently. What does not change is the **billing model** (what you are charged
*per*) and the **trap** (the design choice that multiplies it). Both are stable
for years, and both are what an SDK reference never tells you.

For current prices, use the pricing calculator or the billing console. For how
the meter runs, read on.

## The one principle

**GCP bills per operation far more often than per capacity.** The instinct from
running servers — "it's provisioned, use it freely" — inverts here. A loop that
reads one document at a time is not slow-but-fine; it is the bill. Most GCP cost
surprises are a single N+1 pattern somewhere in a hot path.

Corollary: cost is a *design* property, not an *ops* property. It is decided in
the data model and the access pattern, and it is nearly unfixable by tuning
afterwards.

## Per-service models and traps

### Datastores

| Service     | Billed per                                       | The trap                                                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Firestore   | document read/write/delete, stored bytes, egress | **Reads dominate everything.** A list screen that fetches 100 documents to display 10 fields bills 100 reads. Denormalize what a screen displays into the document the screen loads. Also: a listener re-reads on every change, and an unbounded collection query re-reads the whole result set. |
| Cloud SQL   | instance-hour + storage + egress                 | The instance runs whether or not you use it — **cost is provisioned, not consumed**, which is the opposite instinct from the rest of this list. Idle dev/staging instances are the most common waste. Storage auto-grows and **never shrinks**.                                                  |
| AlloyDB     | instance-hour, higher floor                      | The floor is the decision. It is rarely the right answer for a product that has not already outgrown Cloud SQL.                                                                                                                                                                                  |
| Memorystore | instance-hour by capacity tier                   | Provisioned like Cloud SQL. Sizing for peak means paying for peak permanently.                                                                                                                                                                                                                   |
| Bigtable    | node-hour + storage                              | Nodes are the unit and the minimum is real. Not economical below sustained high throughput.                                                                                                                                                                                                      |
| BigQuery    | bytes **scanned** per query (on-demand)          | `SELECT *` on a wide table scans every column. Unpartitioned tables scan all history on every query. **Partition and cluster before the first real query**, not after the first bill. Streaming inserts bill separately from storage.                                                            |

### Compute

| Service             | Billed per                                                       | The trap                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud Run           | vCPU-second + memory-second while handling requests, per request | **`min-instances` defeats scale-to-zero.** One warm instance is a permanent charge per service per region — set it for latency-critical services only, never as a default across every service. **Concurrency is the biggest lever you have**: raising it means fewer instances serving the same traffic. `cpu-always-allocated` bills between requests; use it only for background work in-process. |
| Cloud Run functions | same as Cloud Run                                                | Same meter. Choosing "functions" over "service" does not make it cheaper.                                                                                                                                                                                                                                                                                                                            |
| GKE Autopilot       | pod CPU/memory requests                                          | You pay **requests, not usage** — over-requesting is invisible waste, and it is the default failure mode of copied manifests. Plus the per-cluster management fee, which makes a small cluster far worse than Cloud Run.                                                                                                                                                                             |

### Messaging, storage, edge

| Service        | Billed per                                  | The trap                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pub/Sub        | message volume + retained bytes             | A subscription nobody drains retains messages and bills for them. Dead-letter topics need draining too.                                                                                                                             |
| Cloud Tasks    | operation                                   | Cheap; the cost lands in whatever it invokes.                                                                                                                                                                                       |
| Cloud Storage  | stored bytes by class + operations + egress | **Class transitions and early deletion carry minimums** — moving data to a colder class then deleting it soon after can cost more than leaving it. Lifecycle rules are the control; set them at bucket creation.                    |
| Load Balancing | forwarding rule-hour + data processed       | An external ALB is a permanent charge. Cloud Run's built-in URL is free — only take the LB when you need the custom domain, Cloud Armor, or multi-backend routing.                                                                  |
| Cloud CDN      | cache egress + fill                         | A low hit ratio means you pay fill *and* egress. Measure the ratio before assuming it saves money.                                                                                                                                  |
| **Egress**     | bytes leaving, by destination               | The line item nobody models. Cross-region chatter between your own services is billable; same-region is not. **Co-locate services that talk to each other**, and put the datastore in the region of the service that reads it most. |

### AI

Vertex AI and Gemini bill per token, input and output separately, with output
typically the more expensive side. The traps: retry loops on failure multiply
cost silently, prompts that resend unchanged context every turn pay for it every
turn, and model choice moves the bill by an order of magnitude. Cache what is
stable, and set a hard spend alert before the first production call.

## Guardrails to put in first

These are cheap to add on day one and nearly impossible to retrofit calmly
during an incident:

1. **A billing budget with alerts** at several thresholds, on every project.
   This is the single highest-value setting in this document.
2. **Separate projects per environment.** Shared projects make attribution
   impossible, so nobody can answer which change moved the bill.
3. **Labels on every resource**, so the billing export can group by service and
   team.
4. **Lifecycle rules on every bucket** at creation.
5. **Partitioning on every BigQuery table** at creation.
6. **A default `max-instances`** on every Cloud Run service — the ceiling that
   turns a runaway loop or traffic spike into an outage instead of an invoice.

## Reviewing a design for cost

Ask, in this order:

1. **What runs per request?** Count datastore reads on the hottest path. This
   finds the N+1 that dominates most bills.
2. **What runs when nothing happens?** Provisioned instances, `min-instances`,
   idle clusters, undrained subscriptions. Idle cost is what makes staging
   environments expensive.
3. **What crosses a region or leaves the network?** That is egress.
4. **What grows without bound?** Logs, stored objects, table history — anything
   with no retention policy is a cost that only rises.

A design that answers these four well is usually within a small factor of
optimal, and no amount of later tuning rescues one that answers them badly.
