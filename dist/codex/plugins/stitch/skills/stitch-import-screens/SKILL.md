---
name: stitch-import-screens
description: Read a flow's generated screens back from Google Stitch and return
  them as a vwf screens payload. Invoked by $screens import as its
  configured design adapter — not a general-purpose skill.
---

# import-screens — Google Stitch adapter

Return one flow's screens, for one platform, as a **vwf screens payload**. You
read and normalize; you never diff and never touch a blueprint doc.

> **`disable-model-invocation` must stay `false`.** A `true` value blocks
> delegation *silently* — vwf would import nothing and see no error.

Payload shape: the installed vwf plugin's `assets/design-adapter.md`.

## Prerequisites

`STITCH_API_KEY` in the environment, and the `@google/stitch-sdk` package
reachable (`pnpm dlx` / `bunx`). Stitch's MCP server may be used instead where
it is connected; the SDK is the first-party surface and the one this skill
assumes.

## Why this adapter fits vwf well

Stitch returns **HTML per screen**, and vwf already reasons about screens as
self-contained HTML (that is what `$mockups` renders). Structure is
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
5. **Normalize into the payload**, with `source.reference` set to the project
   and screen ids.

## Rules

- Report what the markup contains, not what it appears intended to convey.
  Interpreting a delta is `$screens import`'s job.
- Never regenerate a screen while importing. Import is a **read**; generating
  would silently replace the design under review.
- Never write to `docs/blueprint/`.

## Return contract

Output **only** the screens payload as YAML — nothing before or after.

On failure, output only:

```text
ERROR: <what could not be reached or read, in one line>
```
