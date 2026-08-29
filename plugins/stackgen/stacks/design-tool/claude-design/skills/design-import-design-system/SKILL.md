---
name: design-import-design-system
version: 0.1.0
category: design
description: Read the design system back from Claude Design and return it as a vwf design-system payload. Invoked by vwf's design-system import by this fixed name — not a general-purpose skill.
license: MIT
disable-model-invocation: false
model: sonnet
effort: high
---

# design-import-design-system — Claude Design

> **Invocation must stay model-invocable.** vwf reaches this skill by
> delegation, at this exact fixed name. A user-only skill is removed from the
> model's context entirely, so the call would not error — it would silently
> return nothing, which is indistinguishable from a design nobody authored.

## import-design-system — Claude Design

The project's design tool resolved to `claude-design`. Claude Design stores
design systems as **first-class objects**, so this is a read of an authoritative
source rather than a reconstruction.

## What to do

1. **Resolve the design system.** `list_design_systems` to find it; the pinned
   `design.design_system_id` wins when present. If the canvas surface is
   unreachable, stop and say so — do not return a half payload.
2. **Read it.** `read_design_skill` for the system's own documentation, plus
   `read_file` / `list_files` on its project for token definitions, component
   docs and any conventions file.
3. **Normalize into the payload.** Map what you found onto the contract's
   fields:
   - Semantic color **roles**, never raw swatch lists.
   - Typography, spacing, radius and motion as scales with roles.
   - Components with their variants, behaviors and anti-patterns.
   - The accessibility standard the system declares.
4. **Set `source.tool: claude-design` and `derived: false`.**

## Rules

- Never edit anything on the canvas. Import is a read.
- A token the system does not define is `null` with a line in `notes`.
