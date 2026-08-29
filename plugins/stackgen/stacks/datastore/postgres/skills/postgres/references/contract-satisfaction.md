# Postgres — contract satisfaction

Clause by clause against the neutral datastore contract
(`assets/contracts/datastore.md`). The contract states what any datastore must
do; this states how Postgres does it. It cites, and does not restate.

## Record versioning / optimistic concurrency

**A `version` column on every mutable table.** A mutation runs inside a
transaction that checks the expected version and writes `version + 1`. A stale
write — the row's version no longer matches what the caller read — fails with
the contract's coded conflict response, not a generic error.

This is the clause that most often gets half-implemented: the column is added,
and then some write path updates the row without checking. One unchecked path is
enough to lose the guarantee, because the guarantee is about what *cannot*
happen.

## Atomic multi-record writes

**One transaction.** This is the engine's strongest property and the main reason
to pick it, so use it rather than compensating in application code. If two
records must change together or not at all, they change in one transaction, and
the services layer exposes that as one operation.

Compensating logic — write A, write B, undo A if B fails — is what you write
when the store cannot do this. Here it is a defect, because the store can.

## Server-generated time

**`now()` inside the transaction.** Never a caller's clock, and never the
application server's clock either: those disagree with each other, drift, and
make ordering unreliable across instances. The database's clock is the one
authority every writer shares.

Note that `now()` returns the transaction's start time, which is the property you
want — every row written in one transaction carries the same timestamp.

## Forward-only migrations

**Versioned, forward-only, applied by an explicit deploy step.** Never at
process start: N instances starting together race the same migration, and the
loser's behaviour is not something to rely on.

Forward-only means a mistake is fixed by a new migration, not by editing the
applied one — an applied migration is history, and history that changes is not a
record. A schema change that is not backward-compatible with the currently
running code needs the two-step: expand, deploy, then contract.

## Where the contract asks for something Postgres does not give

**Client-direct access is not offered**, and the contract permits a store to say
so. Every read and write goes through the product's services. This is the access
rule the contract states anyway, so nothing is lost — but a flow whose blueprint
assumes a client subscription needs a different design, not a workaround. See
[pick & trade](pick-and-trade.md).
