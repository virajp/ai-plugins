---
name: design-import-screens
version: 0.1.0
category: design
description: Read a flow's designed screens back from Google Stitch and return them as a vwf screens payload. Invoked by vwf's screens-import surface by this fixed name — not a general-purpose skill.
license: MIT
disable-model-invocation: false
model: sonnet
effort: high
---

# design-import-screens — Google Stitch

> **Invocation must stay model-invocable.** vwf reaches this skill by
> delegation, at this exact fixed name. A user-only skill is removed from the
> model's context entirely, so the call would not error — it would silently
> return nothing, which is indistinguishable from a design nobody authored.

## import-screens — Google Stitch

The project's design tool resolved to `stitch`.

## Prerequisites

`STITCH_API_KEY` in the environment, and the `@google/stitch-sdk` package
reachable (`pnpm dlx` / `bunx`). Stitch's MCP server may be used instead where
it is connected; the SDK is the first-party surface and the one this path
assumes.

## Why this tool fits vwf well

Stitch returns **HTML per screen**, and vwf already reasons about screens as
self-contained HTML (that is what `/vwf:mockups` renders). Structure is
therefore directly legible — no code archaeology needed. Stitch's `generate`
also takes a **platform** argument, which maps onto vwf's platform axis.

## What to do

1. **Resolve the project.** `stitch.projects()` to list, or
   `stitch.project(<id>)` with the id vwf passes.
2. **List the screens** — `project.screens()`.
3. **Select this flow's screens.** Stitch screens are flat within a project, so
   match on the naming the design brief requested (`<flow>--<platform>`, frames
   by pinned screen code). A screen whose name carries no recoverable code gets
   `code: null` plus a `notes` line — **never a guessed code**, since the code
   is vwf's join key and a wrong one maps a design onto the wrong contract row.
4. **Read each screen** — `screen.getHtml()` for structure, `screen.getImage()`
   for the rendered reference. Extract the components the markup is built from
   (name + role), and the states it shows.
5. **Normalize into the payload**, with `source.tool: stitch` and
   `source.reference` set to the project and screen ids.

## Rules

- Report what the markup contains, not what it appears intended to convey.
- Never regenerate a screen while importing. Import is a **read**; generating
  would silently replace the design under review.
