# Component Behaviors & Anti-Patterns

Define **global component behaviors** once, so screens reference them instead of
re-deciding:

- **Buttons** — variants (primary / secondary / ghost / destructive), states
  (hover / active / disabled / loading), and when each variant is used.
- **Inputs & forms** — label position, error display, required/optional marking,
  disabled/readonly behavior.
- **Overlays** — modal vs drawer vs popover usage; focus-trap and Esc-to-close.
- **Feedback** — toast vs banner vs inline; success/error/loading conventions.
- **Empty / loading / error states** — the global pattern for each (skeleton vs
  spinner; empty-state structure; error + recovery).
- **Navigation** — primary nav pattern, active state, breadcrumb usage.

**Anti-patterns (what to avoid):** emoji as functional icons; color as the only
signal; harsh neon on dark; motion that ignores reduced-motion;
placeholder-as-label; spacing or type off the scale; clichéd generic-AI
aesthetics.

These are behavioral contracts — name the behavior, not the widget library.
