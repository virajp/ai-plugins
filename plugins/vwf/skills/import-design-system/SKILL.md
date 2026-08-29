---
name: import-design-system
description: Read the design system back from the project's design tool (Claude
  Design, Lovable or Google Stitch) and return it as a vwf design-system
  payload. Invoked by /vwf:design-system as its design adapter — not a
  general-purpose skill.
disable-model-invocation: false
model: sonnet
effort: high
---

# import-design-system — the design adapter

Return the product's design system as a **vwf design-system payload**. You read
from whichever design tool the project uses and normalize; you never write a
blueprint doc, and you never decide what the design system *should* be.

> **`invocation` must stay `both`.** vwf reaches this skill by delegation.
> Flipping it to `user` removes the skill from the model's context and blocks
> programmatic invocation — the call would not error, it would silently import
> nothing.

The payload shape is defined by the vwf adapter contract; read it before
returning anything: `${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`.

## Inputs

vwf names the **registry project** whose design system is being imported, and
passes the pinned design-system id from `.config/vwf.yaml`
(`design.design_system_id`) when one exists. With no pin, list what the tool can
reach and ask the user to choose — never guess.

## 1. Resolve the project's design tool

**The tool is per project, not per product.** A product may author its website's
visual language in Lovable and its app's on the Claude Design canvas, so resolve
against the registry project vwf named — never against "the product".

Read `projects.<project>.design` in `.config/vwf.yaml`. That is the only key —
there is no product-wide fallback. A config still carrying the pre-`13`
`design.tool` is drift for `/vwf:setup`'s `12 → 13` migration to copy down;
reading it here would make that migration optional and leave two answers to one
question in the config.

Absent → **halt**, do not guess:

```text
ERROR: no design tool configured for project <project>. Set
projects.<project>.design in .config/vwf.yaml to one of: claude-design,
lovable, stitch.
```

## 2. Dispatch to that tool's reference

Read **only** the one file matching the resolved tool, then follow it. The other
two are irrelevant to this run, and loading them costs context for nothing.

Read `${CLAUDE_PLUGIN_ROOT}/assets/design-tools/<tool>.md`, where `<tool>` is
that value verbatim. **The path is constructed from configuration; this skill
names no tool.** If no such file exists the tool is unsupported — halt with the
error below rather than improvising against an API you have no reference for.

**An unrecognised value halts.** Never fall back to a default tool and never
return an empty payload — an empty result is indistinguishable from a design
system that was never authored, which is exactly the silent failure this adapter
exists to prevent:

```text
ERROR: design tool "<value>" is not supported. Supported: claude-design,
lovable, stitch. Fix projects.<project>.design in .config/vwf.yaml, or write an
adapter reference for this tool.
```

## Rules that hold for every tool

- **Never invent a value.** A token the system does not define is `null` with a
  line in `notes`. vwf would otherwise write an authoritative-looking
  `design-system.md` from a guess.
- **Semantic color roles, never raw swatch lists.** A palette entry with no
  stated role is reported in `notes`, not invented into one.
- **Set `derived:` honestly.** `false` when you read a stored design system,
  `true` when you reconstructed one from generated output. vwf records it,
  because a derived system can drift silently on the next generation while a
  stored one is authoritative until someone changes it.
- **Never write to the design tool, and never to `docs/blueprint/`.** vwf owns
  that write, gated by its `design-system-reviewer`.

## Return contract

Output **only** the design-system payload as YAML, with nothing before or after
it — no preamble, no summary. vwf parses your entire reply.

On failure, output only:

```text
ERROR: <what could not be reached or read, in one line>
```
