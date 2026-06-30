# Entity Contract

One file per entity (`docs/blueprint/<entity>.md`). Fill every applicable
section to the **no-two-reasonable-answers** bar. Spend the precision budget on
Data Model and API Surface.

- **Data Model** — every field: type, optional/nullable, default,
  validation/format. Enumerate **every** enum member; no open-ended types. State
  id and format conventions, or link `conventions.md#ids`.
- **Actors & Actions** — every action has an actor, a precondition, an
  **explicit authorization** entry, and an observable outcome.
- **Lifecycle** — every state transition has a trigger, a guard, and a side
  effect. No implied-but-unlisted transitions.
- **Invariants** — business rules that must never be violated, stated so they
  can be turned into a test.
- **Concurrency & consistency** — how concurrent writes resolve (optimistic
  version / last-write-wins / merge / conflict error), uniqueness guarantees
  under races, any ordering guarantee, and the idempotency of each mutating
  action. This is a contract decision, not an implementation detail — pin it.
- **Limits & NFRs (where they constrain behavior)** — max sizes, default and
  maximum page size, rate limits, retention / soft-delete. Only those that
  change observable behavior; generic ones live in `conventions.md`.
- **API Surface** — use the **rest-api-design** skill for contract depth. Name
  error *cases* only; the envelope shape lives in `conventions.md#errors`.

Reference `conventions.md` anchors instead of repeating cross-cutting decisions.
If a section's project `type` is absent from the registry, omit the section.
