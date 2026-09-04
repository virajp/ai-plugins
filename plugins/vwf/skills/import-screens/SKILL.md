---
name: import-screens
description: Read a flow's designed screens back from the project's design tool
  (whichever it pins on the design axis) and return them as a vwf screens
  payload. Invoked by /vwf:screens import as its design adapter — not a
  general-purpose skill.
argument-hint: "<flow> <platform>"
disable-model-invocation: false
model: sonnet
effort: high
---

# import-screens — the design adapter

Return one flow's designed screens, for one platform, as a **vwf screens
payload**. You read from whichever design tool the project uses and normalize;
you never diff, never decide what a delta means, and never touch a blueprint
doc.

> **`disable-model-invocation` must stay `false`.** vwf reaches this skill by
> delegation. Flipping it to `true` removes the skill from the model's context
> and blocks programmatic invocation — the call would not error, it would
> silently import nothing.

The payload shape is defined by the vwf adapter contract; read it before
returning anything: `${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`.

## Inputs

`$ARGUMENTS` is `<flow> <platform>` — the flow folder name (`<NNN>-<flow-slug>`)
and one of `mobile` / `tablet` / `desktop` / `auto` / `site` / `webapp`. vwf
also passes the **registry project** the flow belongs to, plus whatever canvas
pins that tool needs — vwf passes the `design:` block's per-project,
per-platform entries through without interpreting them, since which of them
matter is the adapter's business and not vwf's.

## 1. Resolve the project's design tool

**The tool is per project, not per product.** One product may design its website
with one tool and its mobile app with another, so resolve against
the registry project vwf named — never against "the product".

Read `projects.<project>.design` in `.config/vwf.yaml`. That is the only key —
there is no product-wide fallback. A config still carrying the pre-`13`
`design.tool` is drift for `/vwf:setup`'s `12 → 13` migration to copy down;
reading it here would make that migration optional and leave two answers to one
question in the config.

Absent → **halt**, do not guess:

```text
ERROR: no design tool configured for project <project>. Set
projects.<project>.design in .config/vwf.yaml to one of the options the
design-axis stack menu offers.
```

## 2. Invoke the repo's own adapter, at a fixed name

**Do not look for a per-tool reference inside this plugin — there is none, by
design.** vwf names no design tool, and the way it avoids naming one is that
the project's stack materializes the resolved tool's adapter into the repo's
own `.claude/skills/`, under a **fixed** name.

Invoke **`design-import-screens`**, passing the inputs above. That name is fixed and is never
built from the config value — a name assembled from configuration resolves to
nothing silently when it is wrong, which is the failure this whole contract
exists to prevent.

**If no such skill exists in the repo**, the project's `design:` pin has not
been materialized. Halt with the error below rather than improvising against an
API you have no reference for:

```text
ERROR: no design adapter materialized for project <project>. Its design pin is
"<value>". Run the stack materializer for that pin so the repo's own
design-import-screens skill exists, then retry.
```

**An empty result is not an answer.** Never fall back to another tool and never
return an empty payload — an empty result is indistinguishable from a design
that was never made, which is exactly the silent failure this adapter exists to
prevent.
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
