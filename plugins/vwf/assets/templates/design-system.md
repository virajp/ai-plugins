---
type: vwf-design-system
title: Design System
description: Product-wide UX/visual contract every blueprint screen references.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Design System

<!-- The product-wide UX/visual contract. A vwf foundation, peer of
     architecture.md; mandatory once the registry has a frontend/app project.
     Authored by /vwf:design-system; see the design-system-authoring skill. Record
     semantic token VALUES and scales (code-independent); never name the
     component library, CSS framework, or design file (that is plan). Every
     blueprint Screens section references this doc. -->

## Brand & Mood

One paragraph + keywords: the style direction and the feeling the product should
evoke.

## Color Tokens

| Token (role) | Light | Dark | Usage | Contrast pairing |
| ------------ | ----- | ---- | ----- | ---------------- |

## Typography

Families: heading / body / mono — named, with intent.

| Step | Size / Line height | Weight | Use |
| ---- | ------------------ | ------ | --- |

## Spacing & Layout

- Spacing scale:
- Grid / container:
- Breakpoints (width → behavioral intent):
- Radius scale:
- Elevation scale:

## Motion

- Duration tokens:
- Easing tokens:
- Principles:
- Reduced-motion behavior:

## Accessibility Standard

- Conformance target:
- Contrast / keyboard / focus / targets / semantics:

## Component Behaviors

Global patterns: buttons, inputs/forms, overlays, feedback, empty/loading/error,
navigation.

## Terminal UX

<!-- Required when any registry project declares platform `cli` in
     .config/vwf.yaml; delete this section otherwise. See the
     design-system-authoring skill's terminal-ux reference. -->

- Output formatting (human / machine / quiet-verbose, stdout vs stderr):
- Color semantics (roles → token names; NO_COLOR / non-TTY rule):
- Progress conventions:
- Errors & exit codes:
- Help & naming conventions:

## Anti-Patterns

- What to avoid.

## Open Questions

- [ ] item + date
