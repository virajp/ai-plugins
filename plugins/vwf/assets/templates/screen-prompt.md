<!-- Template for /vwf:screens prompt — written to
     docs/prompts/screens/<project>/<NNN>-<flow>/<seq>.md.
     A design brief for a claude.ai/design canvas session, NOT a blueprint doc:
     no OKF frontmatter. The user pastes it into the canvas chat themselves —
     /vwf:screens never runs it. Replace every backticked `<placeholder>` with
     plain prose; drop sections marked (if any) when empty. The NAMING CONTRACT
     section is verbatim-mandatory — /vwf:screens import matches pages back to
     flows by these names. Send no design/visual instructions: the canvas picks
     the design system up from its Design System project. -->

# Screens brief — `<flow>`

Design the **`<flow>`** flow of **`<product name>`** as **one interactive page
per platform**.

## Naming contract (required — do not rename)

Build **exactly one page per platform** listed below, at the **project root**,
named `<flow>--<platform>` — the prefix must be exactly `<flow>`, the numbered
flow folder name (e.g. `020-signin--mobile`; it matches this product's flow
folder, and the number keeps the canvas sorted in execution order). **Never**
create per-screen, per-state, per-mode, or folder pages — the flow's screens,
states, and modes all live on the platform page itself (see Interactivity &
tweaks). If a screen you need belongs to another journey, leave it out and note
it — or, for a journey this product does not have yet, use a short kebab-case
flow name as the prefix; it will be reviewed as a proposed new flow.

## Pages to build (one per platform)

<!-- One line per platform derived from the registry project's `type` +
     `platforms:` — keep only the platforms this product declares (and, for
     in-car, only when the flow's Screens contract marks screens available
     in-car). Each line carries the create/update disposition from the canvas
     inventory. -->

- **`<flow>--mobile`** — `<create | update>` — phone-framed portrait page
- **`<flow>--tablet`** — `<create | update>` — tablet layout, only where it
  genuinely differs from mobile
- **`<flow>--desktop`** — `<create | update>` — browser-width / wide desktop
  page
- **`<flow>--carplay`** / **`<flow>--android-auto`** — `<create | update>` — car
  head-unit display in a car frame, platform template idiom (list / grid / map /
  now-playing / …), only the screens marked available in-car

Pages marked **update** already exist in this project: revise them in place
under the **same name**, applying only what this brief changes; keep everything
else as designed — never rebuild an update page from scratch or duplicate it
under a new name.

## Interactivity & tweaks (required)

Each platform page is a **working interactive journey, never a static mockup**:
every screen below composed on the page in step order, controls responding,
forms validating as specified, and **navigation wired between the screens** —
starting from an entry point, anyone can click through the full happy path end
to end. Variations are **tweaks of the page, never extra pages**:

- **Sad flows & conditional states** — one tweak per pinned state (error,
  empty/no-data, and every conditional state this brief names). The page shows
  the happy path by default.
- **Color mode** — per the Color modes section below.
- **Frame** — where the platform uses a device frame (phone, car display), a
  tweak toggles the frame off; **default on**.

Tweaks are independent: mode, frame, and state tweaks coexist on the same page.

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

## Screens (the sections of each page, in step order)

One subsection per screen row in the flow's Screens contract; for a flow with no
Screens section yet, describe the screens the steps imply.

### `<screen name>`

- **Purpose / step served:** `<which step(s) this screen serves>`
- **What changes (if update):**
  `<the contract deltas this revision applies;
  drop this line when the platform pages are create>`
- **Data shown:**
  `<what it reads — the Reads (operationId) column, in plain
  words>`
- **Actions:** `<the actions the contract pins>`
- **Navigates to:** `<the next screen(s) in step order — wire this navigation>`
- **State tweaks — one per pinned state:** **error**, **empty**,
  `<loading / success / partial / conditional states as pinned>`. Error and
  empty are mandatory; the screen defaults to the happy, populated state.
- **Form (if any):** `<fields, validation timing, error placement>`

## Color modes

<!-- From the prompt-mode color-modes answer. Light-only → keep only the first
     sentence; dark + light → keep only the second block. -->

Design every page in **light mode** only.
`<Dark + light is commissioned:
every page renders in **dark mode by default** and carries a **mode tweak**
that flips it to **light mode** — identical layout and content in both; never
separate mode pages.>`

## Out of scope

`<anything adjacent screens/flows already cover, plus parked points the design
must not pre-empt (if any)>`
