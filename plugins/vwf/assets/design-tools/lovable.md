# Lovable — the design adapter reference

How vwf's three design-import skills talk to this tool. Loaded **only** when a
project's `design:` key names it — a product using one tool never loads the
others.

## Screens import

### import-screens — Lovable

The project's design tool resolved to `lovable`. Lovable's **MCP server** must
be connected (OAuth, workspace-scoped); every tool call is scoped to the token's
workspace. If it is not connected, stop with an `ERROR:` line — do not fall back
to scraping the editor UI.

### The honest caveat

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

### What to do

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

### Rules

- Report what the code actually renders, not what it seems intended to.
- A conditional branch you cannot statically resolve is a `notes` line, not an
  assumed state.
- Never write to the Lovable project.

## Design-system import

### import-design-system — Lovable

The project's design tool resolved to `lovable`.

### Prerequisites

Lovable's **MCP server** must be connected (OAuth, workspace-scoped). Every tool
call is scoped to the token's workspace. If it is not connected, stop with an
`ERROR:` line — do not fall back to scraping the editor UI.

### What to do

1. **Locate the project.** `list_workspaces` → `list_projects`, filtered to the
   project vwf names (or the one the user picks when ambiguous).
2. **Get the commit ref.** `get_project` returns `latest_commit_sha`.
   `read_file` **requires** a git ref, so fetch this first.
3. **Read the published design system.** Lovable writes it under `.lovable/`:
   - **`design-system.json`** — the machine-readable schema, and the documented
     **source of truth**: tokens, component catalog (variants, props, examples),
     and stack constraints. Read this first and prefer it over everything else.
   - `rules/design-tokens.md` and `rules/components.md` are *rendered from* that
     schema — use them only to fill a gap or clarify intent, never to override
     the JSON.
   - `system.md` carries design philosophy and is preserved across publishes;
     mine it for the accessibility standard and component behaviors.
4. **Normalize into the payload** — semantic color roles, typography, spacing,
   radius, motion; components with variants, behaviors, anti-patterns.
5. **Set `source.tool: lovable` and `derived: false`.** `design-system.json` is
   a stored, published artifact, not a reconstruction.

**If the project has no `.lovable/design-system.json`**, the design system was
never published. Say exactly that in an `ERROR:` line — do not infer tokens from
the app's Tailwind config, which would be a *derived* system masquerading as a
published one.

### Rules

- Never invent a token. Undefined values are `null` with a `notes` line.
- Never write to the Lovable project.

## Conversations import

### import-conversations — Lovable

The project's design tool resolved to `lovable`. **Lovable exposes no review
conversation**, so this path returns `n/a` rather than a payload.

### Why, precisely

Lovable produces a **running application** from a chat that builds it. Its MCP
surface exposes the workspace, the projects, the generated source and
`list_edits` — the record of what *changed*. There is no transcript of design
review: no per-screen comment thread, no annotation surface, nothing that holds
what the user said *about* a design as distinct from what they asked to be
built.

### What to do

Return exactly:

```yaml
harvested: n/a
reason: Lovable exposes no design review conversation — its MCP surface offers
  generated source and an edit history, neither of which is a transcript of
  review remarks.
source:
  tool: lovable
```

That is the whole run. Do not call the Lovable MCP server: there is nothing to
reach, and a call that succeeds at listing projects would still not have found a
conversation.

### Why `list_edits` is not substituted

It is the closest thing Lovable has, and it is still the wrong thing. An edit
record says a component changed; it does not say why, and vwf's pipeline routes
on the *why* — a remark is classified as a bug, a blueprint hole, a UX complaint
or an idea, and an edit's diff supports none of those readings on its own.
Feeding it in would produce a stream of confident-looking items whose
classification was invented here rather than read.

`/vwf:feedback` does hold that an edit request is itself a signal — but that
holds where the request was **said**, in a conversation, alongside the reasoning
that makes it routable. A bare commit is not that.

If this changes — Lovable adding a comment or review surface — this file is
where it lands, and `harvested: ok` becomes reachable for it without vwf
changing at all. That is the point of the adapter.
