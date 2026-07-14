<!-- Template for /vwf:screens prompt — written to
     docs/prompts/screens/<project>/<NNN>-<flow>/<seq>.md.
     A design brief for a claude.ai/design canvas session, NOT a blueprint doc:
     no OKF frontmatter. Replace every backticked `<placeholder>` with plain
     prose; drop sections marked (if any) when empty. The NAMING CONTRACT
     section is verbatim-mandatory — /vwf:screens import matches pages back to
     flows by these names. -->

# Screens brief — `<flow>`

Design the screens for the **`<flow>`** flow of **`<product name>`**.

## Naming contract (required — do not rename)

Name every screen page `<flow>/<screen-slug>` — the first path segment must be
exactly `<flow>`, the numbered flow folder name (e.g. `020-signin`; it matches
this product's flow folder, and the number keeps the canvas sorted in execution
order). **One page per screen — nothing else.** Conditional states, color modes,
frames, and platform variants all live **on the screen's page** (as tweaks or
on-page designs — see Interactivity & tweaks below); never create `--<state>`,
`--dark`, or per-platform pages. Every flow folder also carries
**`<flow>/index`** — the folder's navigator (see below) — so never name a screen
`index`. The **journey pages** (see below) live at the **project root**, named
exactly `<flow>` — or `<flow>--<entry-slug>` when the flow has several entry
points. If a screen you need does not belong to this flow, name it
`<other-flow>/<screen-slug>` using that flow's exact name — or, for a journey
this product does not have yet, pick a short kebab-case name and use it as the
first segment; it will be reviewed as a proposed new flow.

## Existing pages (update in place — never rebuild)

Every item below is marked **create** (no page exists yet — build it) or
**update** (the page already exists in this project — revise it in place under
the **same name**, applying only what this brief changes; keep everything else
as designed). Never duplicate an existing page under a new name, and never
rebuild an *update* page from scratch — earlier design work on it stands.

## Interactivity & tweaks (required)

Every page is a **working interactive screen, never a static mockup**: controls
respond, forms validate as specified, components behave as the design system
defines. Two rules carry the whole flow:

1. **Navigation is wired.** Each screen links to the next screen(s) in the
   flow's step order (each screen's **Links to** line below names them), so the
   full happy path can be clicked through end to end starting from a journey
   page at the project root.
2. **Variations are tweaks of the page, never extra pages.** Every page carries:
   - **Sad flows & conditional states** — one tweak per pinned state (error,
     empty/no-data, and every conditional state this brief names). The page
     itself shows the happy, populated default.
   - **Color mode** — per the Color modes section below.
   - **Frame** — where the screen format uses a device frame, a tweak toggles
     the frame off; **default on**.

   Tweaks are independent: mode, frame, and state tweaks coexist on the same
   page.

## Product context

`<one paragraph from product.md: the problem, the users, the goal this flow
serves>`

## The flow

`<the flow's Trigger & Actors and ordered Steps, summarized — what the user is
doing and what the system does at each step>`

## Screens to design

One subsection per screen row in the flow's Screens contract; for a flow with no
Screens section yet, describe the screens the steps imply.

### `<screen name>` (`<flow>/<screen-slug>`) — `<create | update>`

- **Purpose / step served:** `<which step(s) this screen serves>`
- **If update — what changes:**
  `<the contract deltas this revision applies;
  drop this line for create>`
- **Data shown:**
  `<what it reads — the Reads (operationId) column, in plain
  words>`
- **Actions:** `<the actions the contract pins>`
- **Links to:** `<the next screen(s) in step order — wire this navigation>`
- **State tweaks — one per pinned state:** **error**, **empty**,
  `<loading / success / partial / conditional states as pinned>`. Error and
  empty are mandatory; the page defaults to the happy, populated state.
- **Form (if any):** `<fields, validation timing, error placement>`
- **Recorded deviations (if any):**
  `<deviations from the design system this
  screen already records>`

## Flow index (`<flow>/index` — required — `<create | update>`)

Inside the flow folder, build **`<flow>/index`**: a navigator page linking (and
thumbnailing, where practical) **every** page in the folder, in step order, so a
flow with many screens can be walked and validated page by page. It is a table
of contents, not a composition — the journey lives in the root journey pages
below. Keep it current as pages are added, renamed, or removed.

## Journey pages (project root — required)

The flow's screens are parts; the journey is the product. For **each entry
point** below, build one **interactive journey page** at the **project root**
(not inside the `<flow>/` folder): it opens the journey at that entry point's
first screen and lets a reviewer **navigate the full happy path end to end** —
every screen in step order, transitions working — using the screens' wired
navigation. Name it exactly `<flow>` for a single entry point, or
`<flow>--<entry-slug>` per entry point when there are several. Sad paths and
edge cases are explored on each screen's own state tweaks — never as extra root
pages.

`<the flow's entry points, from its Trigger & Actors — one line each: who
enters, from where (app launch, deep link, notification, …), which screen the
journey starts on, and whether its journey page is create or update>`

## Design system

Use the bound design system
(`<design system name — or "this project's
default">`). **Before building each
screen, look up the design system project's templates** and build from the one
that matches — reuse its layout, components, and patterns rather than inventing
new visual language; stay inside the system's tokens, type scale, spacing, and
component behaviors.
`<the template pages found in the design-system
project, listed by name — drop when none were listed>`
Where a screen genuinely needs to deviate, make the deviation obvious so it can
be discussed.

## Color modes

<!-- From the prompt-mode color-modes answer. Light-only → keep only the first
     sentence; dark + light → keep only the second block. -->

Design every page in **light mode** — the design system's Light token values —
as the page itself.
`<Dark + light is commissioned: every page renders in
**dark mode by default** — the design system's Dark token values — and carries a
**mode tweak** that flips it to **light mode** (the Light values) — identical
layout and content in both; never separate mode pages or "--dark"/"--light"
names.>`

## Screen format

<!-- Derive from the registry UI project's `type` + `platforms:` and keep ONLY
     the matching directive(s) below — this tells Claude Design what kind of
     page to build; never leave it generic. -->

- **Mobile app** (`frontend`, ios/android): design every page at a **phone
  viewport** (390×844 logical px portrait, or the viewport the design system
  states) **inside a phone frame** — status bar, safe areas, touch-sized
  controls per the design system; no browser chrome. The frame is toggleable via
  the page's frame tweak (default on). A tablet/desktop target declared under
  `platforms:` appears **on the same page** as its own interactive design where
  the layout genuinely differs — never as a separate page.
- **Web app** (`site`): full **browser-width** pages at the design system's
  primary breakpoint — no device frame; add a responsive design on the same page
  only where this brief pins breakpoint behavior.
- **Admin console** (`console`): **desktop-first** at a wide breakpoint (≥1280
  px), data-dense layout, no device frame.
- **In-car** (`carplay` / `android-auto` under `platforms:` — only for the
  screens this brief marks as available in-car): add the in-car design **on the
  screen's page** at a **car head-unit display** (~800×480 landscape unless the
  design system states one) **inside a car-display frame** (toggleable via the
  frame tweak, default on), using the platform's **template idiom** (list / grid
  / map / now-playing / …) — large touch targets, glanceable text,
  driver-distraction-safe; the product design system applies only where the
  platform allows (icons, accent color).

## Out of scope

`<anything adjacent screens/flows already cover, plus parked points the design
must not pre-empt (if any)>`
