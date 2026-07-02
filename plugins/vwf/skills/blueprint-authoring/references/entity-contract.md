# Entity Contract

One entity, documented as **either** a single file `docs/blueprint/<entity>.md`
**or** a folder `docs/blueprint/<entity>/` (`index.md` + `data.md` / `api.md` /
`jobs.md` / `screens.md`) when it's too large for one file. Both are equally
valid; the sections below are the same either way. Fill every applicable section
to the **no-two-reasonable-answers** bar. Spend the precision budget on Data
Model and API Surface.

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

## Doc units

The commands route each registry project onto a **doc unit** — `entity`
(default), `page`, or `module` — the unit its slice of the blueprint is written
in. All three use the **same sections, structure, and completeness bars** above;
only *what* a doc pins down differs:

- **entity** — one business entity (`docs/blueprint/<entity>.md`, or the folder
  form). The default; everything above reads entity-first.
- **page** — a page or user journey, typically a `site` project. The unit is a
  screen/journey rather than a data entity.
- **module** — a module boundary, typically a `packages` project: its public
  contract, invariants, and consumers.

Pick the unit from the project `type`: `site` → page, `packages` → module,
otherwise entity. A surface a unit genuinely lacks (Data Model for a static
page, Screens for a library) is written `N/A — <reason>`, never silently omitted
— a bare `N/A` with no reason is a gap.
