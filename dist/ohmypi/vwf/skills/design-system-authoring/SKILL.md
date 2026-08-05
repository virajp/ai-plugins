---
name: design-system-authoring
description: Authoring discipline for a product's design system — the
  code-independent UX/visual contract (semantic tokens, typography, spacing,
  motion, accessibility standard, component behaviors, anti-patterns) that every
  blueprint screen references. Auto-applies when editing
  docs/blueprint/design-system. Read the reference matching the layer you are
  defining.
globs:
  - "docs/blueprint/design-system.md"
  - "docs/blueprint/design-system/**/*.md"
alwaysApply: false
---

# Design System

The product-wide **UX and visual language, as a contract**. It is a vwf
foundation — a peer of `architecture.md` — and is **mandatory once the product
has a UI surface** (a frontend/app project in the registry). Every blueprint
Screens section references it instead of re-deciding color, type, spacing, or
component behavior.

A design system records decisions that are **true regardless of framework**:
semantic token *values*, type and spacing *scales*, motion *principles*, and the
*accessibility standard* the product commits to. It never names the component
library, CSS framework, or design file — that mapping is realization (`plan`).

| Topic                                                                                                                         | When to read                                                          |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Foundations](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/foundations.md)                                 | **Read first.** What belongs here vs in plan; MASTER + override model |
| [Color tokens](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/color-tokens.md)                               | Semantic, role-based color tokens with light/dark values and contrast |
| [Typography](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/typography.md)                                   | Font pairing and the type scale                                       |
| [Layout & spacing](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/layout-and-spacing.md)                     | Spacing scale, grid, breakpoints, radius, elevation                   |
| [Motion](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/motion.md)                                           | Duration/easing tokens, motion principles, reduced-motion             |
| [Accessibility](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/accessibility.md)                             | The committed accessibility standard (the gate)                       |
| [Components & anti-patterns](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/components-and-anti-patterns.md) | Global component behaviors and what to avoid                          |
| [Terminal UX](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/terminal-ux.md)                                 | CLI/TUI conventions — required when a project declares platform `cli` |
| [Checklist](%%AI_PLUGINS_ROOT%%/skills/design-system-authoring/references/checklist.md)                                     | Pre-delivery gate for the design-system doc                           |

Authored by `/skill:design-system`, which elicits these decisions and writes
`docs/blueprint/design-system.md`.
