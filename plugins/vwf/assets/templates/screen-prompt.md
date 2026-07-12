<!-- Template for /vwf:screens prompt — written to docs/prompts/NNN-screens-<flow>.md.
     A design brief for a claude.ai/design canvas session, NOT a blueprint doc:
     no OKF frontmatter. Replace every backticked `<placeholder>` with plain
     prose; drop sections marked (if any) when empty. The NAMING CONTRACT
     section is verbatim-mandatory — /vwf:screens import matches pages back to
     flows by these names. -->

# Screens brief — `<flow>`

Design the screens for the **`<flow>`** flow of **`<product name>`**.

## Naming contract (required — do not rename)

Name every page `<flow>/<screen-slug>` — the first path segment must be exactly
`<flow>` (it matches this product's flow folder). One page per screen; state
variants as `<flow>/<screen-slug>--<state>`. If a screen you need does not
belong to this flow, name it `<other-flow>/<screen-slug>` using that flow's
exact name — or, for a journey this product does not have yet, pick a short
kebab-case name and use it as the first segment; it will be reviewed as a
proposed new flow.

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

## Design system

Use the bound design system
(`<design system name — or "this project's
default">`). Stay inside its tokens,
type scale, spacing, and component behaviors; do not invent new visual language.
Where a screen genuinely needs to deviate, make the deviation obvious so it can
be discussed.

## Platform & viewport

`<the UI project's type and platforms — e.g. web at the design system's
primary breakpoint; mobile at device viewport>`

## Out of scope

`<anything adjacent screens/flows already cover, plus parked points the design
must not pre-empt (if any)>`
