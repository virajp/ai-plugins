<!-- Template for /vwf:screens prompt — written to
     docs/prompts/screens/<project>/<device>/<NNN>-<flow>/<platform>.md.
     ONE brief per flow per device type (mobile.md, tablet.md, desktop.md,
     carplay.md, android-auto.md), each commissioning exactly ONE interactive
     page. A compact wireframe-level design brief for a claude.ai/design
     canvas session, NOT a blueprint doc: no OKF frontmatter. The user pastes
     it into the canvas chat themselves — /vwf:screens never runs it. The
     brief is ALWAYS the flow's full screen blueprint — on a revision,
     regenerate the whole file in place (git keeps history); never write a
     change note. Replace every backticked `<placeholder>` with plain prose;
     drop sections marked (if any) when empty. The standing conventions — the
     naming contract (pages, frame codes, the index--<platform> stitch),
     revise-in-place, the interactive-journey mandate, the standing tweak set
     (darkMode on, device frame on with the mobile/tablet camera cutout, a
     tweak per pinned sad and conditional state), stub treatment — live in
     the canvas project's own CLAUDE.md (see the skill's Canvas conventions
     note) and are never restated here; the brief carries only the per-flow
     payload. The page name and frame codes are the sync keys — /vwf:screens
     import matches by them; never rename them. Send nothing beyond
     wireframe-level structure: no design/visual instructions, no content,
     data, or action decisions — the canvas picks the design system up from
     its Design System project, and the canvas chat is where the design is
     made. -->

# Screens brief — `<flow>` (`<platform>`)

Design the **`<flow>`** flow of **`<product name>`** for **`<platform>`** as
**one interactive page**, under this project's standing conventions (CLAUDE.md).

## Page to build (exact name — the sync key)

- **`<flow>--<platform>`** — revise in place if it exists; stitch its happy path
  into **`index--<platform>`** in flow-number order.

## Goal

This flow serves **`<goal>`**: `<one clause on why this journey matters>`.

`<for an in-car flow: one line naming the parent phone flow this journey is a
subset of — the page covers only the in-car subset, glanceable and
template-constrained>`

## The flow

`<the flow's Trigger & Actors and ordered Steps, summarized — what the user is
doing and what the system does at each step>`

**Entry points:**
`<from Trigger & Actors — one line each: who enters, from
where (app launch, deep link, notification, …), and which screen the journey
starts on; the page covers every entry point>`

## Screens (wireframe level)

One subsection per screen row in the flow's Screens contract, headed by its
pinned **code** — the frame name on the canvas; for a flow with no Screens
section yet, describe the screens the steps imply with provisional codes in step
order. Structure, navigation, and states only — visual treatment and content are
the canvas's to decide.

### `<code>` — `<screen name>`

- **Purpose / step served:** `<which step(s) this screen serves>`
- **Navigates to:**
  `<the next coded screen(s) in step order — wire this
  navigation>`
- **Sad states:**
  `<every pinned error/failure state — one tweak each on this
  frame>`
- **Conditional states (if any):**
  `<the pinned non-sad product states —
  empty data, entity-state variants — one tweak each>`
- **Form (if any):**
  `<fields and validation timing — structure and behavior
  only, no visual treatment>`

## Out of scope

`<screens/journeys adjacent flows own — composed as stubs per the project
conventions — plus parked points the design must not pre-empt (if any)>`
