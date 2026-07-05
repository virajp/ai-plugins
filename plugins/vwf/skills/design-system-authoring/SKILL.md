---
name: design-system-authoring
version: 0.1.0
category: design
description: Authoring discipline for a product's design system — the
  code-independent UX/visual contract (semantic tokens, typography, spacing,
  motion, accessibility standard, component behaviors, anti-patterns) that every
  blueprint screen references. Auto-applies when editing
  docs/blueprint/design-system. Read the reference matching the layer you are
  defining.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write
paths:
  - "docs/blueprint/design-system.md"
  - "docs/blueprint/design-system/**/*.md"
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
| [Foundations](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/foundations.md)                                 | **Read first.** What belongs here vs in plan; MASTER + override model |
| [Color tokens](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/color-tokens.md)                               | Semantic, role-based color tokens with light/dark values and contrast |
| [Typography](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/typography.md)                                   | Font pairing and the type scale                                       |
| [Layout & spacing](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/layout-and-spacing.md)                     | Spacing scale, grid, breakpoints, radius, elevation                   |
| [Motion](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/motion.md)                                           | Duration/easing tokens, motion principles, reduced-motion             |
| [Accessibility](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/accessibility.md)                             | The committed accessibility standard (the gate)                       |
| [Components & anti-patterns](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/components-and-anti-patterns.md) | Global component behaviors and what to avoid                          |
| [Checklist](${CLAUDE_PLUGIN_ROOT}/skills/design-system-authoring/references/checklist.md)                                     | Pre-delivery gate for the design-system doc                           |

Authored by `/vwf:design-system`, which elicits these decisions and writes
`docs/blueprint/design-system.md`.
