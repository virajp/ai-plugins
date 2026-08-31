# Service doctrine — Cloud SQL

This component realizes the `relational-datastore` capability, so what it owes
is the neutral datastore contract (`assets/contracts/datastore.md`), clause by
clause. The contract states what **any** datastore must do; this file states how
this one does each, **citing rather than restating**, which is what lets a second
datastore be judged against the same clauses.

## Contract satisfaction

**Optimistic concurrency on every mutable record.** A `version` column on the
row. A mutation reads it, checks the expected value, and writes `version + 1`
inside the same transaction; a mismatch fails with the coded conflict response
rather than silently winning. The store gives this to you cheaply — the check
and the write are one statement's `WHERE` clause — so there is no reason for any
mutable table to lack it.

**Atomic multi-record writes.** A transaction, which is this store's native
strength and the main reason to be here. Anything that must be true together
goes in one; there is no per-record or per-collection limit to design around.

**Server-generated time.** The database's own clock, via a default or an
explicit call in the statement. **Never a timestamp sent by the client**, and
never one taken by the application server either — several instances mean
several clocks, and an ordering derived from them is wrong in ways that surface
as impossible sequences much later.

**Forward-only migrations, applied by an explicit deploy step.** Versioned,
committed alongside the code, applied by the release task — **never at process
start**, where N instances race the same migration and the loser's failure mode
depends on which statement it reached. Forward-only means a mistake is corrected
by a new migration, not by editing an applied one.

The contract's **access rule** — every read and write through the product's own
services — is not merely satisfied here, it is enforced by the shape: there is no
client-direct path.

## The connection trap

This is the failure that catches every product putting a scale-to-zero compute
target in front of a connection-limited datastore, and it fails everything at
once rather than degrading.

The mechanism: compute scales to many instances, each holds its own pool, the
server has a hard connection limit. Traffic rises, instances multiply,
connections exhaust, and every request fails — including the ones that would
have succeeded.

Three things prevent it, and all three are decided up front rather than tuned:

1. **A small per-instance pool.** An instance handling limited concurrency does
   not need a large one.
2. **A maximum-instance ceiling on the compute service, sized against the
   connection limit** rather than against traffic. See `gcp-cloud-run`, which
   owns that half.
3. **An explicit ruling on whether a pooler sits in front.** Transaction-mode
   pooling multiplies the connections you can serve, and it breaks session
   state, prepared statements and listen/notify — so it constrains what the
   application may use, and that constraint has to be a decision rather than a
   discovery.

## Schema discipline

Constraints in the database, not only in the application: a nullable column that
the code guarantees non-null is a column that will eventually be null. Indexes
are designed alongside the queries that need them and reviewed when those
queries change — an index added during an incident is a lock nobody scheduled.

Adding an index or a constraint to a large live table takes locks; use the
concurrent forms and treat the migration as a deploy event, not a footnote.
