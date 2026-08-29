---
name: design-import-design-system
version: 0.1.0
category: design
description: Read the design system back from Lovable and return it as a vwf design-system payload. Invoked by vwf's design-system import by this fixed name — not a general-purpose skill.
license: MIT
disable-model-invocation: false
model: sonnet
effort: high
---

# design-import-design-system — Lovable

> **Invocation must stay model-invocable.** vwf reaches this skill by
> delegation, at this exact fixed name. A user-only skill is removed from the
> model's context entirely, so the call would not error — it would silently
> return nothing, which is indistinguishable from a design nobody authored.

## import-design-system — Lovable

The project's design tool resolved to `lovable`.

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
5. **Set `source.tool: lovable` and `derived: false`.** `design-system.json` is
   a stored, published artifact, not a reconstruction.

**If the project has no `.lovable/design-system.json`**, the design system was
never published. Say exactly that in an `ERROR:` line — do not infer tokens from
the app's Tailwind config, which would be a *derived* system masquerading as a
published one.

## Rules

- Never invent a token. Undefined values are `null` with a `notes` line.
- Never write to the Lovable project.
