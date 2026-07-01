---
type: vwf-design-system
title: Design System
description: Minimal product-wide UX/visual contract the Order screens
  reference.
status: reviewed
---

# Design System

<!-- Conformance example (blueprint-format 2). A minimal, code-independent visual
     contract: semantic token VALUES and scales, never a component library, CSS
     framework, or design file. Every blueprint Screens section references this. -->

## Brand & Mood

Calm, trustworthy commerce. Keywords: clear, unhurried, dependable. The UI
recedes so the customer's items and totals lead.

## Color Tokens

| Token (role) | Light     | Dark      | Usage              | Contrast pairing     |
| ------------ | --------- | --------- | ------------------ | -------------------- |
| `surface`    | `#FFFFFF` | `#0E1116` | Page/background    | pairs with `text`    |
| `text`       | `#0E1116` | `#F2F4F7` | Primary text       | ≥ 7:1 on `surface`   |
| `accent`     | `#2563EB` | `#60A5FA` | Primary actions    | ≥ 4.5:1 on `surface` |
| `danger`     | `#DC2626` | `#F87171` | Destructive/cancel | ≥ 4.5:1 on `surface` |

## Typography

Families: heading `Inter`-class humanist sans / body same / mono for ids.

| Step | Size / Line height | Weight | Use            |
| ---- | ------------------ | ------ | -------------- |
| `lg` | 24 / 32            | 600    | Screen titles  |
| `md` | 16 / 24            | 400    | Body           |
| `sm` | 13 / 20            | 400    | Meta, captions |

## Spacing & Layout

- Spacing scale: `4, 8, 12, 16, 24, 32` (px, 4-based).
- Grid / container: single centered column, max width `720`.
- Breakpoints: `< 640` compact (stacked) · `≥ 640` comfortable (two-column
  meta).
- Radius scale: `4, 8, 12`.
- Elevation scale: `0` flat · `1` card · `2` overlay.

## Motion

- Duration tokens: `fast 120ms`, `base 200ms`.
- Easing tokens: `standard cubic-bezier(0.2, 0, 0, 1)`.
- Principles: motion confirms a state change; never decorative.
- Reduced-motion: honor `prefers-reduced-motion` — cross-fade, no translation.

## Accessibility Standard

- Conformance target: WCAG 2.2 AA.
- Contrast ≥ 4.5:1 body / 3:1 large; visible keyboard focus on every control;
  targets ≥ 44px; semantic roles for status and dialogs.

## Component Behaviors

- Buttons: primary uses `accent`; destructive (Cancel order) uses `danger` and
  requires a confirmation overlay.
- Feedback: transient success via toast; errors inline near the trigger.
- Empty/loading/error: skeletons for loading; empty states name the next action.

## Anti-Patterns

- No color as the only signal for state.
- No blocking spinners over the whole screen for a scoped action.

## Open Questions

- [ ] High-contrast theme beyond AA — deferred. (2026-07-01)
