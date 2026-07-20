# UI / UX Contract (per screen)

Per-screen interaction decisions live in the **flow's** Screens section — the
flow that owns the journey a screen belongs to (see the
[flow-contract](./flow-contract.md)). Every screen is defined in exactly one
flow, its **home** journey; another flow that touches the screen links the home
flow's row rather than redefining it. The product-wide visual and interaction
*language* — tokens, typography, spacing, motion, accessibility standard, global
component behaviors — lives in the **design system**
(`docs/blueprint/design-system.md`, authored by `/vwf:design-system`). Reference
it; never re-decide visual language per screen.

Pin per screen / surface (each has more than one reasonable answer):

- **Navigation & IA** — the screen, its route, entry points, and how the user
  moves to and from it.
- **Interaction pattern per action** — modal vs inline vs full-page; single vs
  multi-step; optimistic vs pessimistic feedback; confirmation and undo for
  destructive actions.
- **State UX** — loading, empty (first-run vs no-results), error (placement +
  how the user recovers), success, partial/pending. **Error and empty are
  mandatory pins for every screen** (or an explicit `n/a — <why>`): the sad
  paths are contract, not optional variants — they are what the blueprint flow
  pass renders for visual review and `/vwf:mockups` draws. Pin equally the
  **conditional product states** the screen genuinely has — not sad paths but
  states of the product (empty data, an entity lifecycle-state variant): on the
  canvas each pinned sad and conditional state becomes a tweak on its screen.
  Use the design system's global state patterns; record only deviations.
- **Form UX** — field order, validation timing (on-blur vs on-submit), inline
  error placement, required indicators, autosave vs explicit save.
- **Feedback & realtime** — toast/banner/progress choice; whether data updates
  live or on refresh (the UX expectation, not the transport).
- **Content** — error messages, empty-state copy, and CTA labels where the
  wording is a product decision.
- **In-car screens** (screens of a `carplay` / `android-auto` **subset flow** —
  in-car journeys are their own flows in the in-car device subgroup, never
  variants on the phone flow's rows; see the
  [flow-contract](./flow-contract.md)) — per in-car screen: the platform
  **template** it maps to (list / grid / map / now-playing / …), the glanceable
  content subset vs the parent phone screen, and interaction limits while
  driving. In-car UIs are template-constrained by the OS — custom layout and
  visual language do not apply; the design system reaches only as far as the
  platform allows (icons, accent color).

Out (realization): the component library, CSS, exact pixels — and anything
already fixed by the design system. If a screen must break the design system,
record the deviation and why **here**, in the flow's Screens section — do not
fork the design system.
