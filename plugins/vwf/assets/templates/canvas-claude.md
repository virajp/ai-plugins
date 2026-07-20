<!-- Template for the canvas project conventions file — written by
     /vwf:screens prompt to
     docs/prompts/screens/<project>/<device>/CLAUDE--<platform>.md, ONE per
     pinned design project (per registry UI project + platform; two platforms
     never share a canvas project). The file is a deliverable: the user sets
     it as the canvas project's own CLAUDE.md and keeps it current from here.
     Generated sections are REGENERATED IN PLACE on every prompt run; the
     "Project conventions (canvas-owned)" section is preserved verbatim —
     /vwf:screens import folds canvas-side additions into it. Replace every
     backticked `<placeholder>` with plain prose; in Layout keep only the
     block matching this platform. A canvas brief companion, not a blueprint
     doc: no OKF frontmatter. -->

# `<product>`: `<Platform>` — screen conventions

Scope: this project holds the **`<platform>`** screen flows of `<product>`.
`<the other declared platforms>` live in separate Claude Design projects with
their own conventions.

## Product

`<product>` — `<one-line product description from product.md>`.

## Design system (binding)

- Compose every screen from the bound design system's components — never restyle
  raw HTML to imitate them. Style via its tokens only.
- Use the design system's icon set and fonts; follow its tone.
- When the design system ships templates, use the closest one as the base for a
  screen — build from scratch only when none fits.

## Page naming contract

- One interactive page per flow, at the project root, named
  **`<NNN>-<flow>--<platform>`** — the flow's numbered blueprint folder name
  plus this platform's suffix. The name is the sync key — never rename it.
- Inside a page, each screen frame is named by its pinned blueprint **code**
  (`<NNN><letter>`, e.g. `020a`) — the per-screen sync key. State variations
  ride as **tweaks** on the coded frame, never as extra frames or pages.
- Revise existing pages **in place** under the same name — never duplicate, fork
  per revision, or rebuild from scratch.
- **`index--<platform>`** stitches every flow page's happy path in flow-number
  order, with stub rows for flows not yet designed. Update it every time a flow
  page is added or changed.

## Layout

<!-- Keep only this platform's block; drop the others. -->

- **mobile** — every screen renders at **390×844** (portrait) in a phone frame:
  dark bezel **with the camera notch/cutout** for a true visual, toggleable via
  the `frame` tweak (default on); theme via `darkMode` (default on).
- **tablet** — every screen renders at **834×1194** (portrait) in a tablet frame
  **with the camera cutout**, toggleable via the `frame` tweak (default on);
  theme via `darkMode` (default on).
- **desktop** — every screen renders at a **1440×900** viewport in a
  browser-chrome frame, toggleable via the `frame` tweak (default on); theme via
  `darkMode` (default on).
- **carplay** — every screen renders at **800×480** (landscape, the CarPlay base
  resolution) in the in-car display frame (`frame` default on). Screens are
  **template-constrained by the OS** (list / grid / map / now-playing) and
  glanceable — minimal interaction while driving; the design system reaches only
  as far as the platform allows.
- **android-auto** — every screen renders at **1280×720** (landscape, the common
  head-unit resolution) in the in-car display frame (`frame` default on).
  Screens are **template-constrained by the OS** (list / grid / map / media) and
  glanceable — minimal interaction while driving; the design system reaches only
  as far as the platform allows.

## Behavior conventions

- Every screen is **interactive, like a fake app** — controls respond,
  navigation is wired, the happy path is clickable end to end and stitched into
  the index; never a static wireframe.
- Standing tweak set on every coded frame: `darkMode` (default on), `frame`
  (default on), one tweak per pinned **sad state**, one tweak per pinned
  **conditional product state** (empty data, entity-state variants).
- Out-of-scope flows and screens homed by other flows compose as **stubs** —
  visibly stubbed and labeled with their flow number — never designed here.

## Goal vocabulary

Briefs reference these by name ("This flow serves **`<goal>`**"); design toward
the outcome:

- **`<goal>`** — `<one-line outcome, from product.md's goal>`

## Project conventions (canvas-owned)

<!-- Conventions discovered while designing live here — added on the canvas
     copy, folded back by /vwf:screens import. This section is preserved
     verbatim across regenerations; everything above it is regenerated. -->
