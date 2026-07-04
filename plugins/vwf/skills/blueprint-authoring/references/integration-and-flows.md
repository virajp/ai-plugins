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

**Flows (system doc).** A flow is a process that spans entities **or projects**
— a single-entity journey that crosses projects (app → service → datastore) is a
flow too; the cross-project boundary is what makes it one. For each:

- the trigger and the ordered steps, naming the entity or service each touches
- the **consistency boundary**: which steps are atomic vs eventually consistent
- **failure handling**: compensation or rollback on a mid-flow failure
- the idempotency of the flow as a whole
- **acceptance criteria**: observable Given/When/Then outcomes — what a user or
  system can verify from the outside once the flow ran. At least one **success**
  and one **failure/compensation** criterion per flow. Each must be observable
  (state a user, API caller, or operator can see) and code-independent — name
  the outcome, never the test file, fixture, or tool. These are the contract
  `plan` turns into E2E test steps and `execute`'s **acceptance stage** verifies
  end-to-end.
- a **diagram**: every flow carries a mermaid `sequenceDiagram` of its steps —
  participants are the entities/services the steps name, and the
  failure/compensation path appears as an `alt`/`else` branch. The diagram is a
  *view* of the written steps, never a replacement: it must not add or
  contradict anything the steps say (the steps stay the authoritative,
  link-resolving contract). Code-independent like the rest — participant names
  are entities/services, never classes, queues, or endpoints. Follow the
  markdown plugin's documentation-standards diagram conventions
  (type-by-purpose, quoted labels, renderable on GitHub, no init directives).

**Inter-service contracts (system doc).** When projects integrate:

- **Events** — name, payload contract, producer, consumers, and delivery
  semantics (at-least-once / exactly-once / ordered)
- **Sync calls** — the contract, the timeout/retry policy, and the failure
  behavior as seen by the caller

**Consistency boundaries.** State, system-wide, what is strongly consistent vs
eventually consistent — so `plan` never has to guess the transaction shape.

All of this is code-independent: name *what* integrates and *with what
guarantees*, never the queue, library, or transport.
