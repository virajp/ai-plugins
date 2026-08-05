---
name: claude-design-import-design-system
description: Read the product's design system back from claude.ai/design and
  return it as a vwf design-system payload. Invoked by /vwf:design-system as
  its configured design adapter — not a general-purpose skill.
disable-model-invocation: false
model: sonnet
effort: medium
---

# import-design-system — Claude Design adapter

Return the product's design system as a **vwf design-system payload**. You read
from Claude Design and normalize; you never write a blueprint doc, and you never
decide what the design system *should* be.

> **`disable-model-invocation` must stay `false`.** vwf reaches this skill by
> delegation. Flipping it to `true` removes the skill from Claude's context and
> blocks programmatic invocation — the call would not error, it would silently
> import nothing.

The payload shape is defined by the vwf adapter contract; read it before
returning anything: `${CLAUDE_PLUGIN_ROOT}/../vwf/assets/design-adapter.md` (or
the installed vwf plugin's `assets/design-adapter.md`).

## Inputs

vwf passes the pinned design-system id from `.config/vwf.yaml`
(`design.design_system_id`) when one exists. With no pin, list what the account
can reach and ask the user to choose — never guess.

## What to do

1. **Resolve the design system.** `list_design_systems` to find it; the pinned
   id wins when present. If the canvas surface is unreachable, stop and say so —
   do not return a half payload.
2. **Read it.** `read_design_skill` for the system's own documentation, plus
   `read_file` / `list_files` on its project for token definitions, component
   docs and any conventions file.
3. **Normalize into the payload.** Map what you found onto the contract's
   fields:
   - Semantic color **roles**, never raw swatch lists. A palette entry with no
     stated role is reported in `notes`, not invented into one.
   - Typography, spacing, radius and motion as scales with roles.
   - Components with their variants, behaviors and anti-patterns.
   - The accessibility standard the system declares.
4. **Set `derived: false`.** Claude Design stores design systems as first-class
   objects, so this is a read of an authoritative source rather than a
   reconstruction.

## Rules

- **Never invent a value.** A token the system does not define is `null` with a
  line in `notes`. vwf would otherwise write an authoritative-looking
  `design-system.md` from a guess.
- **Never edit anything on the canvas.** This skill reads.
- **Never write to `docs/blueprint/`.** vwf owns that write, gated by its
  `design-system-reviewer`.

## Return contract

Output **only** the design-system payload as YAML, with nothing before or after
it — no preamble, no summary. vwf parses your entire reply.

On failure, output only:

```text
ERROR: <what could not be reached or read, in one line>
```
