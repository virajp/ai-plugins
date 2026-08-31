# Service doctrine — Firestore

This component realizes the `document-datastore` capability, so what it owes is
the neutral datastore contract (`assets/contracts/datastore.md`), clause by
clause. The contract states what **any** datastore must do; this file states how
this one does each, **citing rather than restating**.

## Contract satisfaction

**Optimistic concurrency on every mutable record.** A `version` field on the
document. Every mutation runs in a transaction that reads the document, checks
the expected version, and writes `version + 1`; a stale version fails with the
coded conflict response. Nothing here enforces it for you, so it is a convention
the services layer applies uniformly rather than a per-call choice.

**Atomic multi-record writes.** A transaction, or a batched write where no read
is involved. Both carry a limit on how many documents may participate — which is
a real design constraint rather than a footnote: an invariant that must hold
across more documents than one write can carry is an invariant this store cannot
enforce, and the model needs to change so that it can.

**Server-generated time.** The server timestamp sentinel, **never a client
clock**. Here that matters more than on a store with no client-direct path,
because a client genuinely can write — and a client's clock is not merely
unsynchronized, it is attacker-controlled.

**Forward-only migrations.** There is no schema, which does not mean there are
no migrations — it means they are backfills, run as an explicit deploy step,
with the read path tolerating both shapes until the backfill completes. Write
the new shape first, backfill, then stop reading the old one: three deploys, not
one, and skipping the middle is what produces documents nobody can parse.

The contract's **access rule** is satisfied with one deliberate exception, below.

## The data model is designed against the screens

This is the decision that determines whether this store is cheap or expensive
for the product, and it is the opposite habit from relational modelling.

**Denormalize what a screen displays into the document that screen loads.** A
list screen showing ten fields per row should read one document per row at
most — ideally one document for the page. Copying a field into three documents
so three screens each read one is correct here, not a smell.

The cost of that is fan-out on write: a denormalized field has to be updated
everywhere it was copied, atomically where it matters. That is the trade this
store asks you to take, and taking it knowingly is the whole skill. **An
unbounded collection query in a hot path is a defect**, not a slow spot.

## The two access rules

1. **Server code reaches this only through the product's own services layer.** No
   project imports the vendor SDK directly. That is what keeps the store
   swappable — projects depend on an interface, not on Firestore — and it is
   what makes the version-and-transaction convention above enforceable in one
   place.
2. **Client-direct access is the deliberate exception**, and it is governed by
   **security rules**, not IAM. Where a screen reads directly, the rules are the
   entire access-control layer for that path. See
   [Identity shape](identity-shape.md), which is where that seam is stated in
   full.

## Indexes are declared, committed, and deployed first

Single-field indexes exist automatically; anything else is declared. Commit the
index definitions alongside the code and **deploy them ahead of the code that
needs them** — the emulator will happily answer a query production cannot, which
is the fidelity gap [Local dev](local-dev.md) covers.
