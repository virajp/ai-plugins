# UI / UX Contract (per screen)

Per-screen interaction decisions live in the entity's **Screens** section. The
product-wide visual and interaction *language* — tokens, typography, spacing,
motion, accessibility standard, global component behaviors — lives in the
**design system** (`docs/blueprint/design-system.md`, authored by
`/vwf:design-system`). Reference it; never re-decide visual language per screen.

Pin per screen / surface (each has more than one reasonable answer):

- **Navigation & IA** — the screen, its route, entry points, and how the user
  moves to and from it.
- **Interaction pattern per action** — modal vs inline vs full-page; single vs
  multi-step; optimistic vs pessimistic feedback; confirmation and undo for
  destructive actions.
- **State UX** — loading, empty (first-run vs no-results), error (placement +
  how the user recovers), success, partial/pending. Use the design system's
  global state patterns; record only deviations.
- **Form UX** — field order, validation timing (on-blur vs on-submit), inline
  error placement, required indicators, autosave vs explicit save.
- **Feedback & realtime** — toast/banner/progress choice; whether data updates
  live or on refresh (the UX expectation, not the transport).
- **Content** — error messages, empty-state copy, and CTA labels where the
  wording is a product decision.

Out (realization): the component library, CSS, exact pixels — and anything
already fixed by the design system. If a screen must break the design system,
record the deviation and why **here**, in the entity doc — do not fork the
design system.
