---
name: postgres
version: 0.1.0
category: development
description: PostgreSQL as this product's relational datastore — when it is the
  right answer, what it forces on the data model, how it satisfies the datastore
  contract, connection pooling as a design decision, cost shape, and the local
  stack. Auto-applies when editing the data-access layer or a migration.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/migrations/**"
  - "**/*.sql"
---

# PostgreSQL

The relational datastore that needs no cloud. This skill carries the judgment a
reader cannot look up; the API surface belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this datastore | [Pick & trade](references/pick-and-trade.md) |
| Designing entities, tables, indexes | [Data model constraints](references/data-model.md) |
| Writing mutations, migrations, time handling | [Contract satisfaction](references/contract-satisfaction.md) |
| Wiring connections, pools, credentials | [Access shape](references/access-shape.md) |
| Sizing, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Standing it up locally or in CI | [Local stack](references/local-stack.md) |

**The one rule that does not wait for a reference:** every read and write goes
through the product's own services. There is no client-direct path to design
around.
