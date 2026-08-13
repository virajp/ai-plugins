# Doc Layout & Flow Placement

Read this when placing or naming a **new** flow or entity, when the surveyor
returns `SYNONYM CANDIDATES:`, or whenever the folder shape of a doc unit is in
question. A pass that only edits an existing doc in place does not need it.

## The doc units

- **Flow** — `docs/blueprint/flows/<project>/<NNN>-<flow>/`, one uniform depth
  for screen-platform and screenless projects alike. The folder holds **`index.md`** — the
  platform-agnostic contract (purpose, trigger, steps, diagram, jobs,
  acceptance; **no screens**) — plus **one `<platform>.md` per implemented
  platform** (`mobile` | `tablet` | `desktop` | `web` | `auto`) carrying only
  that platform's Screens + Components. A non-UI flow is `index.md` alone — and
  so is a flow of a `cli` project, since a terminal surface has no screens.
  Flows are **grouped by their primary registry project** — the project that
  owns the journey (the screen-platform project of its Screens; for a screenless flow, the
  service/worker whose trigger starts it; ambiguous → ask, never guess). Since
  format 15 the platform lives in the **filename**, so there is no `device:` key
  and **one number line per project**. `<NNN>` is **designated** per
  `%%AI_PLUGINS_ROOT%%/assets/standard-flows.md`: `010` splash, `020` signin,
  `030` recover-account, `040` onboarding, **`100` home** (the anchor, every UI
  project), `110`–`890` product flows (gap-numbered by 10), `910` profile, `920`
  settings, `930` notifications, `940` delete-account. The folder name
  (`<NNN>-<flow>`) is the join key. `flows/index.md` is the thin catalog — one
  section per project, rows in numeric order with a Platforms column — plus the
  cross-flow contracts.
- **Entity** — `docs/blueprint/entities/<entity>/`: always exactly `index.md`
  (lifecycle, relationships, invariants, concurrency) + `schema.yaml` (the
  authoritative data model). `entities/index.md` is the catalog plus the
  product-wide ER diagram.
- **API contract** — `docs/blueprint/apis/<project>.openapi.yaml`, one per
  **API-publishing** project — one declaring the `service` platform. A project
  declaring `[service, webapp]` publishes its own API alongside its UI, which is
  what the retired `fullstack` role meant; a project declaring only `site` or
  `webapp` publishes none. `apis/released/` holds the frozen production
  snapshots `/skill:vwf-verify` writes for projects whose **only**
  API consumer is not their own UI — a `service` without a co-declared screen
  platform.
- The `docs/blueprint/` **root holds only the system docs** (product,
  architecture, conventions, design-system, environment). A root
  `integration.md` or a flat/root entity folder is pre-format-9 drift;
  `/skill:vwf-setup` migrates it.

## Synonym candidates (from the surveyor)

Handle the surveyor's `SYNONYM CANDIDATES:` before working the worklist: each is
an existing flow whose journey may match a missing standard slug (per the
standard-flows asset). One MCQ per candidate — **rename** to the standard slug
(a §7 rename reconcile in that flow's pass: inbound links, catalogs, and canvas
join keys move together), **keep** (it is genuinely a different journey; the
standard flow stays on the worklist as missing), or **waive** (record
`standard-flows/<project>/<slug>` under `enforcement.rules` with the user's
reason — never re-asked). A missing mandatory standard flow with no synonym is
worked like any other worklist hole: elicited (§3) — including where its number
slots in the project's number line — then authored (§4). A standard flow takes
its **designated number** (standard-flows asset); only a product flow is placed
by elicitation, inside the `110`–`890` band.
