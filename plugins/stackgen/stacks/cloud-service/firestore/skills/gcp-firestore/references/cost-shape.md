# Cost shape — Firestore

The provider-wide principle, the six day-one guardrails and the four-question
cost review are the `gcp` skill's cost-doctrine reference. This file states only
what is this service's own. No dollar figures — the billing model and its trap
are what stay true.

## The meter

Billed per **document read**, per **document write**, per **document delete**,
plus **stored bytes** and **egress**.

**Reads dominate everything else**, by a margin wide enough that the other terms
are rounding on most products. This is the purest example of the provider's
per-operation principle, and it is why cost here is a data-model property rather
than an ops property.

## The trap: a read is a document, not a field

A screen that fetches a hundred documents to display ten fields bills **a
hundred reads**, not ten fields' worth of anything. The store does not charge
less for reading part of a document, and it cannot: the document is the unit.

Three shapes that produce this without anyone noticing:

- **The N+1.** A list is read, then one lookup per row to resolve a name. The
  list costs N, the lookups cost N, and the screen looks fine in development
  where N is three.
- **The unbounded collection query.** Cost scales with the result set, and the
  result set scales with the product's success. A query with no limit in a hot
  path is a defect.
- **The listener.** A subscription **re-reads on every change**. A listener on a
  collection that changes often, held open by many clients, multiplies reads by
  clients times changes — which is a number nobody estimates before it appears
  on a bill.

## What to do about it

**Denormalize what a screen displays into the document that screen loads.** One
document per row, ideally one per page. The cost is fan-out on write, which is
cheaper because writes are rarer than reads on nearly every product — and where
they are not, that is itself a signal this store is the wrong pick.

Beyond that: bound every query, prefer a listener on a small document over one
on a large collection, and cache aggressively on the client where the data
tolerates it. Aggregate counts belong in a maintained counter document, not in
a query that reads what it counts.

## The other terms

- **Stored bytes** are usually minor, but denormalization multiplies them by
  design — that is the trade, and it is the right one.
- **Deletes are billed as operations**, so a cleanup job over a large collection
  is a cost event. Where volume is high, a time-to-live policy is cheaper than a
  job that reads and deletes.
- **Egress** applies as everywhere on this provider, and client-direct access
  means egress goes to clients rather than to your own services — which is
  usually the cheaper direction, since it removes a hop, not just a tier.
