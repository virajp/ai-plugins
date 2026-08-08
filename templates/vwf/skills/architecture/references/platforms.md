# Platforms & Terminal Surfaces

Read this at step 3b when the project being walked is a **UI** project (`site`,
`fullstack`, `frontend`), or when asking the once-per-run CLI/TUI question.
Non-UI projects take no `platforms:` key and never need this file.

## Platforms

Record each UI project's implemented surfaces under its `platforms:` in
**`registry.yaml`** — the single source since format 19; the key no longer
appears in `.config/vwf.yaml`. The one vocabulary is in
`<%= it.root %>/assets/standard-flows.md`, and the project's `role`
bounds what you offer:

| Role                 | Offer                                                    |
| -------------------- | -------------------------------------------------------- |
| `site` / `fullstack` | **`web`** — browser-delivered, the only option           |
| `frontend`           | **`mobile`**, **`tablet`**, **`desktop`**, `auto`, `cli` |
| everything else      | none — platforms are a UI-role field                     |

Ask once per `frontend` project whether the app must run in-car, and offer
**`auto`** (CarPlay and Android Auto together) **only** for those; `cli` is a
terminal surface — see below. A native client that talks to a `fullstack`
project's API is its own `frontend` project, not a platform of the fullstack
one. The vocabulary names form factors, not vendors — `mobile` already hides
iOS/Android, so `auto` hides CarPlay/Android Auto the same way. These platforms
decide which `<platform>.md` files a flow may carry, and the `<%= it.cmd("vwf:screens") %>`
design briefs.

## Terminal surfaces

While walking the projects, ask (once) whether any project exposes a **CLI/TUI**
— a shipped command-line tool, not internal dev scripts. For each that does,
offer `cli` among its platforms. A terminal surface has no screens, so `cli`
never admits a `cli.md` platform file and never triggers Screens, mockups, or
the canvas; what it does require is the design system's **Terminal UX** section.
A CLI-only tool is `role: frontend` with `platforms: [ cli ]` — and is exempt
from the standard-flows mandates, since `splash` and `home` are screen journeys
it does not have.
