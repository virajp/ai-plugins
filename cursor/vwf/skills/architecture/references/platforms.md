# Platforms & Terminal Surfaces

Read this at step 3b when settling a project's `platforms:` — which since format
22 is **every** project, not only UI ones. A project carries one `role` (the
coarse domain grouping) and **one or more platforms** from that role's closed
list, and the platforms are what everything downstream keys on.

## The vocabulary

Record each project's implemented surfaces under its `platforms:` in
**`registry.yaml`** — the single source since format 19; the key no longer
appears in `.config/vwf.yaml`. The closed per-role lists live in
`%%AI_PLUGINS_ROOT%%/assets/templates/registry.yaml`, and the screen-platform
semantics in `%%AI_PLUGINS_ROOT%%/assets/standard-flows.md`:

| Role       | Offer                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| `backend`  | `packages`, `service`, `worker`                                              |
| `frontend` | `packages`, `site`, `webapp`, `desktop`, `mobile`, `tablet`, `auto`, `cli`   |
| `data`     | `packages`, `data-lake`, `analytics`, `ingestion`, `ml-platform`             |
| `system`   | `packages`, `iac`, `plugin`, `misc`, `cicd`                                  |

**A project may declare several.** One Flutter codebase shipping phone, tablet,
desktop and web is **one** project with `platforms: [mobile, tablet, desktop,
webapp]` — not four projects. Flows are keyed on project name, so splitting it
would triplicate every flow doc. Likewise a server that publishes an API and
serves its own UI is `platforms: [service, webapp]`, which is what the retired
`fullstack` role meant.

Ask once per project whether the app must run in-car, and offer **`auto`**
(CarPlay and Android Auto together) only where it makes sense. A native client
that talks to *another* project's API is its own project, not a platform of that
one — the test is whether it is a separate codebase, not whether it is a
separate surface.

The vocabulary names form factors, not vendors — `mobile` already hides
iOS/Android, so `auto` hides CarPlay/Android Auto the same way.

## What the platforms decide

Everything that used to key on `role` now keys on these:

| Platform(s) | Obliges |
| --- | --- |
| `site` `webapp` `desktop` `mobile` `tablet` `auto` | **screen platforms** — design system mandatory, standard flows mandated, one `<platform>.md` per flow, `/screens` briefs, canvas pins, mockups |
| `service` | `apis/<project>.openapi.yaml` and a health endpoint |
| `iac` | registered, exempt from blueprint coverage, **always its own repo** |
| every `data` and `system` platform | exempt from blueprint coverage |
| everything else | a flow is `index.md` alone |

**`site` vs `webapp`.** `site` is a browser-delivered **content** surface — a
marketing, docs or landing site. `webapp` is the browser-delivered
**application**. A product with both declares both; they are separate surfaces
with separate screens and often separate design projects, which a single `web`
token could not express.

## Terminal surfaces

While walking the projects, ask (once) whether any exposes a **CLI/TUI** — a
shipped command-line tool, not internal dev scripts. For each that does, offer
`cli` among its platforms. A terminal surface has no screens, so `cli`
never admits a `cli.md` platform file and never triggers Screens, mockups, or
the canvas; what it does require is the design system's **Terminal UX** section.
A CLI-only tool is `role: frontend` with `platforms: [ cli ]` — and is exempt
from the standard-flows mandates, since `splash` and `home` are screen journeys
it does not have. A project mixing `cli` with a screen platform is **not**
exempt: the screen platform brings the mandates with it.
