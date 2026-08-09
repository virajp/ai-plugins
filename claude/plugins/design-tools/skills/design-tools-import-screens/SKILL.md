---
name: design-tools-import-screens
description: Read a flow's designed screens back from the project's design tool
  (Claude Design, Lovable or Google Stitch) and return them as a vwf screens
  payload. Invoked by /vwf:screens import as its design adapter — not a
  general-purpose skill.
argument-hint: "<flow> <platform>"
disable-model-invocation: false
model: sonnet
effort: high
---

# import-screens — the vwf design adapter

Return one flow's designed screens, for one platform, as a **vwf screens
payload**. You read from whichever design tool the project uses and normalize;
you never diff, never decide what a delta means, and never touch a blueprint
doc.

> **`invocation` must stay `both`.** vwf reaches this skill by delegation.
> Flipping it to `user` removes the skill from the model's context and blocks
> programmatic invocation — the call would not error, it would silently import
> nothing.

The payload shape is defined by the vwf adapter contract; read it before
returning anything: `${CLAUDE_PLUGIN_ROOT}/../vwf/assets/design-adapter.md` (or
the installed vwf plugin's `assets/design-adapter.md`).

## Inputs

`$ARGUMENTS` is `<flow> <platform>` — the flow folder name (`<NNN>-<flow-slug>`)
and one of `mobile` / `tablet` / `desktop` / `web` / `auto`. vwf also passes the
**registry project** the flow belongs to, plus whatever pins that tool needs
(for Claude Design, `design.projects.<project>.<platform>`).

## 1. Resolve the project's design tool

**The tool is per project, not per product.** One product may design its website
in Lovable and its mobile app on the Claude Design canvas, so resolve against
the registry project vwf named — never against "the product".

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

| Tool            | Read                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `claude-design` | [claude-design](${CLAUDE_PLUGIN_ROOT}/skills/design-tools-import-screens/references/claude-design.md) |
| `lovable`       | [lovable](${CLAUDE_PLUGIN_ROOT}/skills/design-tools-import-screens/references/lovable.md)             |
| `stitch`        | [stitch](${CLAUDE_PLUGIN_ROOT}/skills/design-tools-import-screens/references/stitch.md)               |

**An unrecognised value halts.** Never fall back to a default tool and never
return an empty payload — an empty result is indistinguishable from a design
that was never made, which is exactly the silent failure this adapter exists to
prevent:

```text
ERROR: design tool "<value>" is not supported. Supported: claude-design,
lovable, stitch. Fix projects.<project>.design in .config/vwf.yaml, or write an
adapter reference for this tool.
```

## Rules that hold for every tool

- **Never invent a screen code.** A screen whose name carries no recoverable
  code is returned with `code: null` plus a `notes` line. vwf can diff around a
  missing code; it cannot recover from a wrong one, because the code is the join
  key and a fabricated one silently maps a design onto the wrong contract row.
- **Report, don't interpret.** A component the design shows but the contract
  does not mention is still reported — deciding whether it is an addition or a
  mistake is `/vwf:screens import`'s job, and then `/vwf:blueprint`'s.
- **Never write to the design tool, and never to `docs/blueprint/`.** Import is
  a read.

## Return contract

Output **only** the screens payload as YAML, with nothing before or after it.
vwf parses your entire reply.

On failure, output only:

```text
ERROR: <what could not be reached or read, in one line>
```
