# Postgres — pick & trade

## When it is the answer

**When the data has real relationships.** Postgres is the default for a reason:
joins, foreign keys and transactions across several tables are the operations it
is built around, and they are the operations most products actually need. A
model with entities that reference each other costs nothing extra here and costs
a great deal in a store that has to denormalize.

**When reporting and ad-hoc queries matter.** SQL is a query language people
already know, against a schema a tool can introspect. A question nobody
anticipated is answerable without a migration, a new index-only view, or an
export into something else. Stores that make writes cheap frequently make this
expensive.

**When portability matters.** The engine is open, self-hostable, and has a
managed equivalent on every major provider. Leaving one host for another is an
operational exercise rather than a rewrite, and the lock-in is to SQL — which is
not a vendor.

**When correctness is worth more than write throughput.** Transactions across
several records are the engine's strongest property. If the product's invariants
span rows, the alternative is compensating logic in application code, which is
where the bugs live.

## When it stops being the answer

**When the client must subscribe to the data.** There is no client-direct path
and no built-in change feed to a browser or device. A UI that must react to a
row changing needs a channel the product builds and operates — which is real
work, and is the trade to weigh before picking.

**When write volume is genuinely enormous and unrelational.** Event firehoses,
metrics, and append-only telemetry are not a relational workload. They can be
made to fit and then the fit is the problem: partitioning, retention and vacuum
pressure become a standing operational cost.

**When the shape truly is a document.** Deeply nested, schema-varying documents
read and written whole are a document store's workload. Postgres has `jsonb` and
it is good — but reaching for it for *every* entity is a signal the wrong store
was picked.

**When nobody will operate it.** A managed instance still needs version
upgrades, connection budgeting and backup verification. The engine's openness is
not the same as it being maintenance-free.

## What the choice is often confused with

Picking Postgres is not the same as picking a **server** shape. A managed
instance, a serverless-billing flavour, and a self-hosted container are the same
engine with very different cost and connection behaviour — see
[cost shape](cost-shape.md) and [access shape](access-shape.md). Record which one
the product is on; the contract satisfaction is identical, the operations are
not.
