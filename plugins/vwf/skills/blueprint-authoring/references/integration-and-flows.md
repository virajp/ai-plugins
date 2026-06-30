# Integration & Flows

Cross-entity contracts split by locality: **relationships** live on the entity;
**flows and inter-service contracts** live in the system doc
`docs/blueprint/integration.md` (promote to `docs/blueprint/flows/` when it
grows past a handful of flows).

**Relationships (per entity, in the entity doc).** For each relation, pin:

- the other entity and **cardinality** (1–1, 1–N, N–M)
- **ownership**: composition (child cannot exist without the parent) vs
  reference
- **cascade** on delete (cascade / restrict / nullify)
- whether the relation is required

**Flows (system doc).** A flow is a process that spans entities or services. For
each:

- the trigger and the ordered steps, naming the entity or service each touches
- the **consistency boundary**: which steps are atomic vs eventually consistent
- **failure handling**: compensation or rollback on a mid-flow failure
- the idempotency of the flow as a whole

**Inter-service contracts (system doc).** When projects integrate:

- **Events** — name, payload contract, producer, consumers, and delivery
  semantics (at-least-once / exactly-once / ordered)
- **Sync calls** — the contract, the timeout/retry policy, and the failure
  behavior as seen by the caller

**Consistency boundaries.** State, system-wide, what is strongly consistent vs
eventually consistent — so `plan` never has to guess the transaction shape.

All of this is code-independent: name *what* integrates and *with what
guarantees*, never the queue, library, or transport.
