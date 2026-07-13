<!-- Template for /vwf:screens prompt — written to docs/prompts/NNN-screens-<flow>.md.
     A design brief for a claude.ai/design canvas session, NOT a blueprint doc:
     no OKF frontmatter. Replace every backticked `<placeholder>` with plain
     prose; drop sections marked (if any) when empty. The NAMING CONTRACT
     section is verbatim-mandatory — /vwf:screens import matches pages back to
     flows by these names. -->

# Screens brief — `<flow>`

Design the screens for the **`<flow>`** flow of **`<product name>`**.

## Naming contract (required — do not rename)

Name every screen page `<flow>/<screen-slug>` — the first path segment must be
exactly `<flow>` (it matches this product's flow folder). One page per screen;
state variants as `<flow>/<screen-slug>--<state>`. The **stitch pages** (see
below) live at the **project root**, named exactly `<flow>` — or
`<flow>--<entry-slug>` when the flow has several entry points. If a screen you
need does not belong to this flow, name it `<other-flow>/<screen-slug>` using
that flow's exact name — or, for a journey this product does not have yet, pick
a short kebab-case name and use it as the first segment; it will be reviewed as
a proposed new flow.

## Product context

`<one paragraph from product.md: the problem, the users, the goal this flow
serves>`

## The flow

`<the flow's Trigger & Actors and ordered Steps, summarized — what the user is
doing and what the system does at each step>`

## Screens to design

One subsection per screen row in the flow's Screens contract; for a flow with no
Screens section yet, describe the screens the steps imply.

### `<screen name>` (`<flow>/<screen-slug>`)

- **Purpose / step served:** `<which step(s) this screen serves>`
- **Data shown:**
  `<what it reads — the Reads (operationId) column, in plain
  words>`
- **Actions:** `<the actions the contract pins>`
- **States — design every one:** default (populated), **error**, **empty**,
  `<loading / success / partial as pinned>`. Error and empty are mandatory.
- **Form (if any):** `<fields, validation timing, error placement>`
- **Recorded deviations (if any):**
  `<deviations from the design system this
  screen already records>`

## Stitch pages (project root — required)

The flow's screens are parts; the journey is the product. For **each entry
point** below, build one page at the **project root** (not inside the `<flow>/`
folder) that **stitches the whole flow together**: the screens above composed in
their step order, happy path end to end, with the transitions/navigation between
them indicated. Name it exactly `<flow>` for a single entry point, or
`<flow>--<entry-slug>` per entry point when there are several. Cover the edge
cases — the error, empty, and other pinned states — as **tweaks (variations) of
the stitch page**, never as extra root pages.

`<the flow's entry points, from its Trigger & Actors — one line each: who
enters, from where (app launch, deep link, notification, …), and which screen
the journey starts on>`

## Design system

Use the bound design system
(`<design system name — or "this project's
default">`). Stay inside its tokens,
type scale, spacing, and component behaviors; do not invent new visual language.
Where a screen genuinely needs to deviate, make the deviation obvious so it can
be discussed.

## Screen format

<!-- Derive from the registry UI project's `type` + `platforms:` and keep ONLY
     the matching directive(s) below — this tells Claude Design what kind of
     page to build; never leave it generic. -->

- **Mobile app** (`frontend`, ios/android): design every page at a **phone
  viewport** (390×844 logical px portrait, or the viewport the design system
  states) **inside a phone frame** — status bar, safe areas, touch-sized
  controls per the design system; no browser chrome. A tablet/desktop target
  declared under `platforms:` gets its own variant only where the layout
  genuinely differs — name it `<flow>/<screen-slug>--<platform>`.
- **Web app** (`site`): full **browser-width** pages at the design system's
  primary breakpoint — no device frame; add a responsive variant only where this
  brief pins breakpoint behavior.
- **Admin console** (`console`): **desktop-first** at a wide breakpoint (≥1280
  px), data-dense layout, no device frame.

## Out of scope

`<anything adjacent screens/flows already cover, plus parked points the design
must not pre-empt (if any)>`
