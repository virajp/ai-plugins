<!-- Template for /vwf:screens prompt — written to
     docs/prompts/screens/<project>/<NNN>-<flow>/<seq>.md.
     A wireframe-level design brief for a claude.ai/design canvas session, NOT
     a blueprint doc: no OKF frontmatter. The user pastes it into the canvas
     chat themselves — /vwf:screens never runs it. Replace every backticked
     `<placeholder>` with plain prose; drop sections marked (if any) when
     empty. The NAMING CONTRACT section is verbatim-mandatory — /vwf:screens
     import matches pages back to flows by these names. Send nothing beyond
     wireframe-level structure: no design/visual instructions, no content,
     data, action, state, or color-mode decisions — the canvas picks the
     design system up from its Design System project, and the canvas chat is
     where the design is made. -->

# Screens brief — `<flow>`

Design the **`<flow>`** flow of **`<product name>`** as **one interactive page
per platform**.

## Naming contract (required — do not rename)

Build **exactly one page per platform** listed below, at the **project root**,
named `<flow>--<platform>` — the prefix must be exactly `<flow>`, the numbered
flow folder name (e.g. `020-signin--mobile`; it matches this product's flow
folder, and the number keeps the canvas sorted in execution order).

## Pages to build (one per platform)

<!-- One line per platform derived from the registry project's `type` +
     `platforms:` — keep only the platforms this product declares (and, for
     in-car, only when the flow's Screens contract marks screens available
     in-car). -->

- **`<flow>--mobile`** — phone-framed portrait page
- **`<flow>--tablet`** — tablet layout, only where it genuinely differs from
  mobile
- **`<flow>--desktop`** — browser-width / wide desktop page
- **`<flow>--carplay`** / **`<flow>--android-auto`** — car head-unit display in
  a car frame, platform template idiom (list / grid / map / now-playing / …),
  only the screens marked available in-car

If a page with one of these names already exists in this project, **revise it in
place under the same name**, applying only what this brief changes — never
rebuild it from scratch or duplicate it under a new name.

## Interactivity (required)

Each platform page is a **working interactive journey, never a static
wireframe**: controls responding, forms validating as specified, and
**navigation wired between the screens** — starting from an entry point, anyone
can click through the full happy path end to end. Where the platform uses a
device frame (phone, car display), the page renders inside it by default. Any
variation added to a page — in this session or a later one — rides as a **tweak
of the page, never a separate page**.

## Product context

`<one paragraph from product.md: the problem, the users, the goal this flow
serves>`

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

`<anything adjacent screens/flows already cover, plus parked points the design
must not pre-empt (if any)>`
