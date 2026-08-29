---
name: design-import-screens
version: 0.1.0
category: design
description: Read a flow's designed screens back from Lovable and return them as a vwf screens payload. Invoked by vwf's screens-import surface by this fixed name — not a general-purpose skill.
license: MIT
disable-model-invocation: false
model: sonnet
effort: high
---

# design-import-screens — Lovable

> **Invocation must stay model-invocable.** vwf reaches this skill by
> delegation, at this exact fixed name. A user-only skill is removed from the
> model's context entirely, so the call would not error — it would silently
> return nothing, which is indistinguishable from a design nobody authored.

## import-screens — Lovable

The project's design tool resolved to `lovable`. Lovable's **MCP server** must
be connected (OAuth, workspace-scoped); every tool call is scoped to the token's
workspace. If it is not connected, stop with an `ERROR:` line — do not fall back
to scraping the editor UI.

## The honest caveat

Lovable produces a **running application**, not named design frames. There is no
frame whose title carries a pinned screen code, so recovering screens means
**reading the generated source** — routes and components — and matching them to
the flow's screens by name and purpose.

That makes this path's output **less certain** than one reading a canvas with
named frames. Reflect that honestly:

- Set `code: null` for any screen you cannot match to a pinned code with
  confidence, and explain the ambiguity in `notes`.
- **Never guess a code to make the payload look complete.** The code is vwf's
  join key; a wrong one silently maps a design onto the wrong contract row,
  which is worse than an admitted gap.

## What to do

1. **Locate the project** — `list_workspaces` → `list_projects`.
2. **Get `latest_commit_sha`** from `get_project`; `read_file` needs a ref.
   `get_project` also returns a preview URL and a screenshot — useful context
   for judging what a route renders.
3. **Find the routes for this flow.** Read the router (commonly `src/App.tsx` or
   a routes module) and identify the routes belonging to the named flow.
   `list_edits` can help when a recent change is what you are importing.
4. **Read each route's component tree** — the page component and the components
   it composes. Extract: the screen's purpose, its components (name + role), the
   states it renders (empty / loading / error / success, wherever branches make
   them visible).
5. **Normalize into the payload**, with `source.tool: lovable` and
   `source.reference` set to the project id plus the commit sha you read, so a
   later diff can cite exactly what was seen.

## Rules

- Report what the code actually renders, not what it seems intended to.
- A conditional branch you cannot statically resolve is a `notes` line, not an
  assumed state.
- Never write to the Lovable project.
