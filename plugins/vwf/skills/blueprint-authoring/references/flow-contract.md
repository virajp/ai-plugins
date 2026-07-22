# Flow Contract

Flows are the **primary blueprint unit**. One flow per folder —
`docs/blueprint/flows/<project>/<NNN>-<flow>/index.md`, one uniform depth for UI
and non-UI projects alike (type `vwf-flow`, always `index.md` only — a flow too
big for one file is several flows). A **UI** project's flow additionally
declares its device in the `device:` frontmatter key: the journey's primary
surface (`mobile` for `frontend`, `web` for `site`/`console`) or one of the
project's declared in-car platforms (`carplay` / `android-auto`). Numbering runs
per device, so one project folder may hold two flows sharing an `<NNN>`. The
goal-traceability spine runs product goal → flow (`Serves:`) → the
entities/APIs/screens the flow touches. A flow is a process that spans entities
**or projects** — a single-entity journey that crosses projects (app → service →
datastore) is a flow too; the cross- project boundary is what makes it one.

**In-car flows are subset flows.** A `carplay` / `android-auto` journey is
always a limited subset of a phone journey — different screens, fewer features —
authored as its **own flow** carrying the in-car `device:` value, never as
per-platform variants on the phone flow's Screens rows. Its Purpose carries a
mandatory **`Subset of:`** line linking the parent phone flow (an OKF edge the
reviewer verifies) alongside `Serves:`.

Fill every applicable section to the **no-two-reasonable-answers** bar. Omit
Screens if the registry has no UI project; omit Background Jobs if it has no
worker.

## Per-flow sections

- **Purpose** — one paragraph: the observable outcome this flow delivers and why
  it exists, plus a mandatory `Serves:` line linking at least one `product.md`
  goal anchor (`[<goal>](../../../product.md#goal-<slug>)` — one depth for every
  flow, UI or not). This is the OKF edge the blueprint-reviewer verifies; a flow
  no goal justifies is scope drift. An in-car flow adds the mandatory
  `Subset of:` parent link (above).
- **Trigger & Actors** — a table of who/what can start the flow, with
  **Authorization** and **Audit-recorded** columns. This absorbs the
  authorization contract formerly on the entity's Actors & Actions surface;
  per-operation auth also lives in the OpenAPI contract's `security`. Mark
  operator and destructive triggers audit-recorded (the product-foundations
  baseline).
- **Steps** — ordered, each naming its actor, the action, and the entity/service
  touched as a **resolving markdown link**. An API-backed step names the
  operation as an `operationId` defined in
  `docs/blueprint/apis/<project>.openapi.yaml` (link the contract once under
  References). A step that changes an entity's state must match a transition in
  that entity's Lifecycle table — the coherence reviewer checks the two agree.
- **Consistency boundary** — which step groups are atomic vs eventually
  consistent.
- **Failure handling** — compensation or rollback per failure point.
- **Idempotency** — of the flow as a whole and of retried steps.
- **Diagram** — the mandatory `sequenceDiagram` (below).
- **Screens** — the UI journey this flow traverses (below).
- **Background Jobs** — the jobs this flow requires (below).
- **Acceptance** — observable Given/When/Then outcomes (below).
- **References** — markdown links (OKF edges), each resolving: the API contract
  for the operationIds the steps name, the `conventions.md` anchors the flow
  relies on, `design-system.md` for any flow with Screens.
- **Open Questions** — genuinely-open items, dated; never silent assumptions.

## Screens live on the flow (the home rule)

Screens moved from the entity to the flow: process orientation puts a UI journey
on the process that owns it, not scattered across the data entities it reads.
Pin per screen — its **Code** (`<NNN><letter>`: the flow's number plus `a`, `b`,
`c`, … in step order — the per-screen sync key canvas frames are named by and
`/vwf:screens import` matches on; stable once assigned, an inserted screen takes
the next free letter, never a re-letter), route, the operations it reads
(`operationId`), its states (loading/error/empty), actions, and form validation
— plus, one **Components block** per row (format 12), headed by its code: the
elements the screen displays (text, info, error surfaces, buttons, inputs,
lists, media), each with its rules — visibility/enable conditions, what
activating it does, and contract-pinned content (see the
[UI/UX contract](./ui-ux-contract.md)).

**Home rule.** Every screen is defined in exactly **one** flow — its home
journey. Another flow that touches the same screen **links the home flow's row**
rather than redefining it, so a screen has one authoritative contract. The
coherence reviewer flags a screen defined twice.

Visual and interaction *language* — tokens, typography, spacing, motion,
component behavior — comes from `docs/blueprint/design-system.md`; reference it
and record only deviations, never re-decide it per screen (see the
[UI/UX contract](./ui-ux-contract.md)). An optional screen-navigation mermaid
`flowchart` is allowed only when a flow has **3+ screens with branching
navigation** — a judgement, not a bar.

## Background Jobs live on the flow

Jobs moved from the entity to the flow for the same reason: a background job
exists to advance a process. Pin per job — trigger, timer/retry, activities, and
on-failure behavior. The **sync/async classification** and the
**worker-vs-service placement** (product-foundations) are decided **here**, on
the flow that needs the job.

## The sequence diagram

Every flow carries a mermaid `sequenceDiagram` of its steps — participants are
the entities/services the steps name, and the failure/compensation path appears
as an `alt`/`else` branch. The diagram is a *view* of the written steps, never a
replacement: it must not add or contradict anything the steps say (the steps
stay the authoritative, link-resolving contract). Code-independent like the rest
— participant names are entities/services, never classes, queues, or endpoints.
Follow the markdown plugin's documentation-standards diagram conventions
(type-by-purpose, quoted labels, renderable on GitHub, no init directives).

## Acceptance

Observable Given/When/Then outcomes — what a user or system can verify from the
outside once the flow ran. At least one **success** and one
**failure/compensation** criterion per flow. Each must be observable (state a
user, API caller, or operator can see) and code-independent — name the outcome,
never the test file, fixture, or tool. These are the contract `plan` turns into
E2E test steps and `execute`'s **acceptance stage** verifies end-to-end (and
`/vwf:verify` re-runs against deployed environments).

## What `flows/index.md` holds

`docs/blueprint/flows/index.md` (type `vwf-integration`) is deliberately thin —
the catalog plus the contracts that are cross-flow by nature, the survivors of
the dissolved root `integration.md`:

- **Flow catalog** — one row per flow (link, served goal, entities touched,
  status).
- **Inter-service contracts** — **Events** (name, payload contract, producer,
  consumers, delivery semantics: at-least-once / exactly-once / ordered) and
  **Synchronous calls** (contract, timeout/retry, caller-visible failure
  behavior) — the contracts no single flow owns.
- **Consistency Boundaries** — what is strongly consistent vs eventually
  consistent, system-wide, so `plan` never has to guess the transaction shape.

Per-flow content never leaks back into this file. All of it is code-independent:
name *what* integrates and *with what guarantees*, never the queue, library, or
transport.
