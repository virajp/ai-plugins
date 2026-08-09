# Design System Foundations

A vwf design system is the product's **UX/visual contract**, not its
implementation. It sits beside `architecture.md` as a foundation and is
**required once the registry has a frontend/app project**.

**Contract vs realization (for design):**

| In the design system (contract)                          | In plan / execute (realization)  |
| -------------------------------------------------------- | -------------------------------- |
| semantic token values (`color.action` = #2563eb)         | the theme/Tailwind config file   |
| type scale (h1 = 32/40, 700)                             | the CSS classes, the font loader |
| spacing scale (4-point), breakpoints (375/768/1024/1440) | media queries, grid framework    |
| "modals trap focus and close on Esc"                     | which Dialog component           |
| accessibility standard (WCAG 2.2 AA)                     | the a11y lint setup              |

Tokens are **semantic / role-based**, never literal: `color.text.muted`, not
`gray-500`. A screen references the role; `plan` maps the role to code.

**MASTER + overrides.** `design-system.md` is the MASTER. A screen that must
deviate records the deviation (and why) in its entity's Screens section — it
does not fork the design system.

Keep it minimal: define the tokens, scales, and behaviors the product actually
uses. Do not enumerate a catalog of styles "just in case."
