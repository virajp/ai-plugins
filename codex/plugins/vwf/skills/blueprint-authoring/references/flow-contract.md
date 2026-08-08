# Flow Contract

Flows are the **primary blueprint unit**. One flow per folder —
`docs/blueprint/flows/<project>/<NNN>-<flow>/`, one uniform depth for UI and
non-UI projects alike. Since **format 15** the folder holds two kinds of file:

- **`index.md`** (type `vwf-flow`) — the **platform-agnostic contract**: what
  the journey is, who triggers it, its steps, diagram, jobs, and acceptance.
  **No screens.**
- **`<platform>.md`** (type `vwf-flow-platform`) — one per platform that
  implements the journey (`mobile` | `tablet` | `desktop` | `web` | `auto`),
  holding **only** that platform's Screens + Components + deviations.

A non-UI flow is `index.md` alone — as is a flow of a project whose platform is
`cli`, a terminal surface with no screens. The goal-traceability spine runs
product goal → flow (`Serves:`) → the entities/APIs/screens the flow touches. A
flow is a process that spans entities **or projects** — a single-entity journey
that crosses projects (app → service → datastore) is a flow too.

**Slugs and numbers are exact.** A journey matching the standard-flows
vocabulary (`%%AI_PLUGINS_ROOT%%/assets/standard-flows.md`) takes that exact
slug **and its designated number** — `home` is always `100`, `signin` always
`020`; never a synonym (`login`, `dashboard`, …) and never another number. That
asset also sets which flows are mandatory per project type and which numbers
each band holds — coverage conditions the sweep enforces, waivable only under
`enforcement.rules`. One number line per project, since a flow folder covers
every platform.

**Platforms are files, not flows.** An in-car take on a journey is
`<flow>/auto.md`, not a separate flow — the pre-format-15 "in-car subset flow"
with its `Subset of:` parent link is retired, and `auto` covers CarPlay and
Android Auto together. Which platforms implement a flow is elicited and recorded
in `index.md`'s **Platforms** table; steps and acceptance are **never forked**
per platform (a platform that cannot perform a step omits its screens and says
so in its note).

Fill every applicable section to the **no-two-reasonable-answers** bar. Omit
Background Jobs if the registry has no worker.

## Per-flow sections

- **Purpose** — one paragraph: the observable outcome this flow delivers and why
  it exists, plus a mandatory `Serves:` line linking at least one `product.md`
  goal anchor (`[<goal>](../../../product.md#goal-<slug>)` — one depth for every
  flow, UI or not). This is the OKF edge the blueprint-reviewer verifies; a flow
  no goal justifies is scope drift.
- **Platforms** — the table of platform files this flow has, each linking its
  file, with a one-line note on how that platform's take differs. Its rows must
  be a subset of the registry project's declared `platforms:`, and must match
  the `<platform>.md` files actually on disk. Omitted for a non-UI flow.
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
- **Guarantees** — one table, one row per step group whose guarantees differ
  (`all` when the whole journey shares them): consistency (atomic | eventual),
  what happens on failure (the compensation or rollback, or
  `none — <why safe>`), and the key a retry is idempotent under (or `n/a`).
  Format 16 merged the former Consistency boundary / Failure handling /
  Idempotency sections: three one-bullet sections that grew into essays and then
  cross-referenced each other, so one decision ended up split across three
  places.
- **Diagram** — the mandatory `sequenceDiagram` (below).
- **Background Jobs** — the jobs this flow requires (below).
- **Acceptance** — observable Given/When/Then outcomes (below).
- **References** — markdown links (OKF edges), each resolving: the API contract
  for the operationIds the steps name, the `conventions.md` anchors the flow
  relies on, `design-system.md` for any flow with platform files.
- **Open Questions** — genuinely-open items, dated; never silent assumptions.

## Screens live on the flow's platform files (the home rule)

Screens moved from the entity to the flow: process orientation puts a UI journey
on the process that owns it, not scattered across the data entities it reads.
Since format 15 they sit one level further in — on the flow's **platform file**
— because a screen only exists on a platform: a mobile home screen and an auto
home screen are the same *concept* (one shared code), rendered differently.

**Codes are shared across platform files.** `100a` is one screen concept
wherever it appears; a platform that lacks it omits the row, and a platform-only
screen takes the next letter free across the whole flow. **A standard flow's
primary screen takes the flow's slug** — the `home` flow's main screen is named
`home`, never "Dashboard". Pin per screen — its **Code** (`<NNN><letter>`: the
flow's number plus `a`, `b`, `c`, … in step order — the per-screen sync key
canvas frames are named by and `$screens import` matches on; stable once
assigned, an inserted screen takes the next free letter, never a re-letter),
route, the operations it reads (`operationId`), its states
(loading/error/empty), actions, and form validation — plus, one **Components
block** per row (format 12), headed by its code: the elements the screen
displays (text, info, error surfaces, buttons, inputs, lists, media), each with
its rules — visibility/enable conditions, what activating it does, and
contract-pinned content (see the [UI/UX contract](./ui-ux-contract.md)).

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
`$verify` re-runs against deployed environments).

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
