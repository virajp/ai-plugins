<!-- Template for /vwf:screens prompt — written to
     docs/prompts/screens/<project>/<NNN>-<flow>/<seq>.md.
     A compact wireframe-level design brief for a claude.ai/design canvas
     session, NOT a blueprint doc: no OKF frontmatter. The user pastes it into
     the canvas chat themselves — /vwf:screens never runs it. Replace every
     backticked `<placeholder>` with plain prose; drop sections marked (if any)
     when empty. The standing conventions — the naming contract,
     revise-in-place, the interactive-journey mandate, variations-as-tweaks,
     stub treatment, device frames — live in the canvas project's own
     CLAUDE.md (see the skill's Canvas conventions note) and are never
     restated here; the brief carries only the per-flow payload. The Pages to
     build names are the sync key — /vwf:screens import matches pages back to
     flows by them; never rename them. Send nothing beyond wireframe-level
     structure: no design/visual instructions, no content, data, action,
     state, or color-mode decisions — the canvas picks the design system up
     from its Design System project, and the canvas chat is where the design
     is made. -->

# Screens brief — `<flow>`

Design the **`<flow>`** flow of **`<product name>`** as **one interactive page
per platform**, under this project's standing conventions (CLAUDE.md).

## Pages to build (exact names — the sync key)

<!-- One line per platform derived from the registry project's `type` +
     `platforms:` — keep only the platforms this product declares (and, for
     in-car, only when the flow's Screens contract marks screens available
     in-car). The name prefix must be exactly the numbered flow folder name
     (e.g. `020-signin--mobile`). -->

- **`<flow>--mobile`**
- **`<flow>--tablet`** — only where it genuinely differs from mobile
- **`<flow>--desktop`**
- **`<flow>--carplay`** / **`<flow>--android-auto`** — only the screens marked
  available in-car

## Goal

This flow serves **`<goal>`**: `<one clause on why this journey matters>`.

## The flow

`<the flow's Trigger & Actors and ordered Steps, summarized — what the user is
doing and what the system does at each step>`

**Entry points:**
`<from Trigger & Actors — one line each: who enters, from
where (app launch, deep link, notification, …), and which screen the journey
starts on; the page covers every entry point>`

## Screens (wireframe level)

One subsection per screen row in the flow's Screens contract; for a flow with no
Screens section yet, describe the screens the steps imply. Structure and
navigation only — visual treatment, content, and state design are the canvas's
to decide.

### `<screen name>`

- **Purpose / step served:** `<which step(s) this screen serves>`
- **Navigates to:** `<the next screen(s) in step order — wire this navigation>`
- **What changes (if update):**
  `<the deltas this revision applies to an
  existing page; drop this line for a first session>`
- **Form (if any):**
  `<fields and validation timing — structure and behavior
  only, no visual treatment>`

## Out of scope

`<screens/journeys adjacent flows own — composed as stubs per the project
conventions — plus parked points the design must not pre-empt (if any)>`
