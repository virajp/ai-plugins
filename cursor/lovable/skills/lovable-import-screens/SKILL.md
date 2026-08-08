---
name: lovable-import-screens
description: Read a flow's screens back from a Lovable project and return them
  as a vwf screens payload. Invoked by /screens import as its configured
  design adapter — not a general-purpose skill.
---

# import-screens — Lovable adapter

Return one flow's screens, for one platform, as a **vwf screens payload**. You
read and normalize; you never diff and never touch a blueprint doc.

> **`disable-model-invocation` must stay `false`.** A `true` value blocks
> delegation *silently* — vwf would import nothing and see no error.

Payload shape: the installed vwf plugin's `assets/design-adapter.md`.

## The honest caveat

Lovable produces a **running application**, not named design frames. There is no
frame whose title carries a pinned screen code, so recovering screens means
**reading the generated source** — routes and components — and matching them to
the flow's screens by name and purpose.

That makes this adapter's output **less certain** than one reading a canvas with
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
5. **Normalize into the payload**, with `source.reference` set to the project id
   plus the commit sha you read, so a later diff can cite exactly what was seen.

## Rules

- Report what the code actually renders, not what it seems intended to.
  Interpreting a delta is `/screens import`'s job.
- A conditional branch you cannot statically resolve is a `notes` line, not an
  assumed state.
- Never write to the Lovable project, and never to `docs/blueprint/`.

## Return contract

Output **only** the screens payload as YAML — nothing before or after.

On failure, output only:

```text
ERROR: <what could not be reached or read, in one line>
```
