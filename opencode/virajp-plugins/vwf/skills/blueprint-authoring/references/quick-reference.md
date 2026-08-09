# Blueprint Quick Reference

**The sort (every decision):** put it in the blueprint only if it has **>1
reasonable answer** AND is **true regardless of how the code is written**. Else
→ `plan` (realization) or `execute` (mechanical). Genuinely open → Open
Questions.

**Per-surface completeness bar (the reviewer gate):**

## Flow (the primary unit)

- **Serves** — every flow's Purpose links ≥1 `product.md` goal anchor.
- **Trigger & Actors** — who/what may start it, with authorization + audit-
  recorded per actor.
- **Steps** — ordered, each links the entity/service it touches; API steps name
  an `operationId`; a state-changing step matches an entity lifecycle
  transition.
- **Consistency / Failure / Idempotency** — boundary, compensation, and retry
  semantics stated.
- **Diagram** — a `sequenceDiagram` (incl. the failure branch), a view of the
  steps.
- **Screens** — per screen: code (`<NNN><letter>`, the canvas sync key), route,
  reads (operationId), all states, actions, form UX; defined in exactly one home
  flow; visual language referenced from the design system, not re-decided.
- **Background Jobs** — per job: trigger, timer/retry, activities, on-failure;
  sync/async + worker-vs-service placement decided here.
- **Acceptance** — ≥1 success + ≥1 failure GWT, observable, code-independent.

## Entity + schema (supporting data contract)

- **Used by** — Purpose links ≥1 flow (transitive goal traceability).
- **Data Model** — a link to `./schema.yaml` + short notes only; never a second
  field table.
- **schema.yaml** — every property typed + described; enums fully enumerated;
  `required:` present; `additionalProperties` stated; FK descriptions name the
  target entity; logical types only.
- **Lifecycle** — each transition has trigger (naming the actor), guard, side
  effect; ≥3 states or branching → a `stateDiagram-v2`; agrees with flow steps.
- **Invariants** — testable business rules.
- **Relationships** — cardinality, ownership, cascade, required — per relation,
  each a resolving link to the sibling entity.
- **Concurrency** — concurrent-write resolution + idempotency of mutating
  actions.

## API contract (per service)

- **openapi.yaml** — unique operationIds; explicit `security` (roles →
  `conventions.md#auth`); error cases via `components.responses` (envelope in
  `conventions.md#errors`); idempotency documented; entity shapes `$ref`'d; no
  `servers:`/framework detail; `info.version` semver + `info.x-vwf.status`.
- **Released snapshots** — once `apis/released/` holds a frozen version, changes
  are additive-only per the rest-api-design skill (reference 8), or a major
  bump.

## Catalog docs

- **`flows/index.md`** (`vwf-integration`) — the flow catalog + Events /
  Synchronous-calls contracts + system-wide Consistency Boundaries.
- **`entities/index.md`** (`vwf-entities`) — the entity catalog + ONE product-
  wide `erDiagram`, a view of the union of every entity's Relationships table
  (kept in sync — the coherence reviewer checks).

## Cross-cutting

- **Diagrams** — views of the tables/steps, never the contract itself: must not
  add or contradict; entity/service/state names only (code-independent).
- **Environment & secrets** — (`environment.md`, once integrations/secrets
  exist) every env var/secret catalogued per consuming project, classified
  (secret/non-secret/client-id), **no values**; injection mechanism linked from
  `conventions.md#config`.
- **No realization leaked** — no file/class/library names, no pixels.
- **Minimalism** — every surface traces to a stated goal or a safety guardrail.
- **Frontmatter (OKF profile)** — mandatory `type` (valid vocabulary) / `title`
  / `description` / `status` on every markdown doc, plus `implementation:` on
  flow/entity `index.md` (pipeline-written); YAML artifacts carry no frontmatter
  (typed by path). Optional `timestamp`/`owner`/`resource`/`tags`.
- **Links resolve** — Serves/Used-by/Steps/Relationships/References use markdown
  links to target docs, and every edge resolves to an existing doc/anchor.
