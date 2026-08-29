---
name: PostgreSQL
axis: backing
kind: database
components:
- datastore/postgres@0.1.0
---

# Backing — PostgreSQL

The relational datastore that needs no cloud: an open engine, a managed
equivalent on every provider, and no lock-in beyond SQL itself.

**The composition is the neutral datastore contract plus this one instance.** The
contract (`assets/contracts/datastore.md`) states what any datastore must do —
record versioning, atomic multi-record writes, server-generated time,
forward-only migrations. The `postgres` component states how Postgres does each,
**citing the contract rather than restating it**, which is what lets a second
datastore be judged against the same clauses.

Access is services-only, and here that is a hard limit rather than a policy:
there is no client-direct path, so a flow whose blueprint assumes a client
subscription needs a different design.

Full judgment: the component's own skill and its references. The contract it
cites is `assets/contracts/datastore.md`.
