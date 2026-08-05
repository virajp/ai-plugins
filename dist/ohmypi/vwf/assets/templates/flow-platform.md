---
type: vwf-flow-platform
title: <Flow name> — <platform>
description: <one-line — this platform's take on the journey>
status: draft # draft | reviewed | stable
platform: mobile # mobile | tablet | desktop | web | auto — MUST match the filename
implementation: none # none | partial | complete — written by the pipeline only
# optional, standardized: timestamp: <ISO 8601>  owner: [<project from registry>]  resource: <url|path>  tags: [<...>]
---

# <Flow name> — <platform>

Flow contract: [<Flow name>](./index.md)

<!-- ONE platform file per platform that implements this journey, named for the
     platform (mobile.md | tablet.md | desktop.md | web.md | auto.md) and
     sitting beside index.md in the flow folder. `auto` covers CarPlay and
     Android Auto together — their template differences are recorded as
     deviations here, never as separate files.

     THIS FILE HOLDS ONLY SCREENS. Purpose, Serves:, trigger, steps, diagram,
     jobs, and acceptance live once in index.md and are never restated here —
     the journey is the same on every platform; only its rendering differs.
     The link above is mandatory (an OKF edge the reviewer verifies), and this
     file must be listed in index.md's Platforms table.

     Screens live here because a screen only exists on a platform: a mobile
     home screen and an auto home screen are the same CONCEPT (same code),
     rendered differently. -->

## Screens → <UI project, from registry>

| Code | Screen | Route | Reads (operationId) | States (loading/error/empty) | Actions | Form validation |
| ---- | ------ | ----- | ------------------- | ---------------------------- | ------- | --------------- |

<!-- Code = <NNN><letter> where NNN is the flow's number (100a, 100b, … in step
     order) — the per-screen sync key: canvas frames are named by it and
     /screens import matches on it.

     CODES ARE SHARED ACROSS PLATFORM FILES: 100a is the same screen concept
     everywhere it appears. A platform that does not have a screen simply omits
     its row; a screen unique to this platform takes the next letter free
     across the WHOLE flow (so codes never collide between platform files).
     Stable once assigned: an inserted screen takes the next free letter, never
     a re-letter.

     STANDARD SCREEN NAMES: a standard flow's primary screen takes the flow's
     slug — the `home` flow's main screen is named `home`, never "Dashboard" or
     "Main Feed" (same for signin, profile, settings, notifications). Secondary
     screens in the flow are free-named (`profile-edit`).

     HOME RULE: every screen is defined in exactly one flow (its home journey);
     another flow that touches it links the home flow's row instead of
     redefining it.

     Error and empty are MANDATORY pins per screen (or an explicit
     "n/a — <why>") — sad paths are contract; so are the CONDITIONAL product
     states the screen genuinely has (empty data, an entity-state variant). The
     blueprint pass renders every pinned state for visual review.

     Visual language (tokens, type, spacing, motion, component behavior) comes
     from docs/blueprint/design-system.md — reference it; record only
     deviations. An optional screen-navigation mermaid flowchart is allowed
     only when this platform has 3+ screens with branching navigation. -->

### `<code>` — `<Screen>` components

| Component | Rules |
| --------- | ----- |

<!-- One Components block per Screens row, headed by the row's Code. Component
     = each element the screen displays — text, info, error surfaces, buttons,
     inputs, lists, media — named with its kind. Rules = the behavior contract
     where more than one reasonable answer exists: when the component is
     visible or enabled (e.g. a button clickable only once the form validates),
     what activating it does (naming the operationId it calls or the coded
     screen it navigates to), and its content where the wording is a product
     decision (error messages, empty-state copy, CTA labels). Every entry in
     the row's Actions cell appears as a component; rules must agree with the
     row's States and index.md's steps.

     Components are largely SHARED across platforms (same rules, same content)
     — what differs is placement and density. State the platform's difference
     here rather than re-deriving the component set. Code-independent: kinds
     and behavior only — never component-library names, CSS, or pixels. -->

## Platform deviations

<!-- Only what genuinely differs on this platform: navigation/input idiom,
     density, omitted screens or actions and why, and (for `auto`) the OS
     template each screen maps to (list / grid / map / now-playing) plus the
     driver-distraction constraints, noting any CarPlay-vs-Android-Auto
     difference. Omit the section when nothing deviates. -->

- <deviation> — <why>

## Open Questions

- [ ] item + date
