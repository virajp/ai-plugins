---
name: lovable-import-design-system
description: Read a Lovable project's published design system and return it as a
  vwf design-system payload. Invoked by design-system as its configured
  design adapter — not a general-purpose skill.
---

# import-design-system — Lovable adapter

Return the product's design system as a **vwf design-system payload**, read from
Lovable. You normalize; you never write a blueprint doc.

> **`disable-model-invocation` must stay `false`.** vwf reaches this skill by
> delegation, and a `true` value blocks programmatic invocation *silently* — the
> import would appear to run and bring back nothing.

Payload shape: the installed vwf plugin's `assets/design-adapter.md`.

## Prerequisites

Lovable's **MCP server** must be connected (OAuth, workspace-scoped). Every tool
call is scoped to the token's workspace. If it is not connected, stop with an
`ERROR:` line — do not fall back to scraping the editor UI.

## What to do

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
5. **Set `derived: false`.** `design-system.json` is a stored, published
   artifact, not a reconstruction.

**If the project has no `.lovable/design-system.json`**, the design system was
never published. Say exactly that in an `ERROR:` line — do not infer tokens from
the app's Tailwind config, which would be a *derived* system masquerading as a
published one.

## Rules

- Never invent a token. Undefined values are `null` with a `notes` line.
- Never write to the Lovable project, and never to `docs/blueprint/`.

## Return contract

Output **only** the design-system payload as YAML — nothing before or after.

On failure, output only:

```text
ERROR: <what could not be reached or read, in one line>
```
