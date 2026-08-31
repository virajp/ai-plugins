# Pick & trade — Firestore

## When this is the answer

- **The data model is document-shaped.** Entities are read and written whole,
  the relationships are containment rather than arbitrary joins, and the queries
  are known in advance.
- **The product benefits from client-direct access.** A client that reads and
  subscribes without a service in the path removes a whole tier for the screens
  where that is safe — and "safe" here means expressible as a security rule.
- **Local development must work offline for everyone.** Every service in this
  half of the provider has a first-class emulator, so tests run with no billing
  account and no contention over a shared environment. That is a real and
  frequently decisive advantage over the relational option.

## When it stops being the answer

- **The relationships are real.** No joins, no referential integrity, no
  constraints enforced by the store. Every one of those becomes application code
  that must be right in every caller.
- **Questions nobody anticipated need answering.** Queries are served from
  indexes declared in advance; an ad-hoc analytical question is not something
  this store answers, and modelling for it means another denormalized copy.
- **Portability matters.** This is the least portable choice in the bundle.
  Leaving it is a data migration *and* a rewrite of every access path, which is
  the trade the relational option exists to avoid.
- **The read pattern is wide.** See [Cost shape](cost-shape.md) — a workload
  that reads many documents to answer one question is one this store prices
  badly, and no amount of tuning changes that.

## The realtime question

Firestore listeners cover most realtime needs. The provider's other realtime
database is the answer where **presence and low-latency fan-out** matter more
than query power — a cursor position, an online indicator, a live counter. Both
in one product is a legitimate answer; picking the wrong one for the whole
product is the expensive mistake, because a listener re-reads on every change
and that is the bill.

## The decision that follows immediately

If this is picked, the data model is designed **against the screens**, not
against the entities. That is the opposite habit from relational modelling, and
it is the single decision that determines whether this store is cheap or
expensive for this product. [Service doctrine](service-doctrine.md) states what
that means in practice.
