---
name: import-design-system
description: Read the design system back from the project's design tool (whichever it
  pins on the design axis) and return it as a vwf design-system
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

> **`disable-model-invocation` must stay `false`.** vwf reaches this skill by
> delegation. Flipping it to `true` removes the skill from the model's context
> and blocks programmatic invocation — the call would not error, it would
> silently import nothing.

The payload shape is defined by the vwf adapter contract; read it before
returning anything: `${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`.

## Inputs

vwf names the **registry project** whose design system is being imported, and
passes the pinned design-system id from `.config/vwf.yaml`
(`design.design_system_id`) when one exists. With no pin, list what the tool can
reach and ask the user to choose — never guess.

## 1. Resolve the project's design tool

**The tool is per project, not per product.** A product may author its website's
visual language with one tool and its app's with another, so resolve
against the registry project vwf named — never against "the product".

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

Invoke **`design-import-design-system`**, passing the inputs above. That name is fixed and is never
built from the config value — a name assembled from configuration resolves to
nothing silently when it is wrong, which is the failure this whole contract
exists to prevent.

**If no such skill exists in the repo**, the project's `design:` pin has not
been materialized. Halt with the error below rather than improvising against an
API you have no reference for:

```text
ERROR: no design adapter materialized for project <project>. Its design pin is
"<value>". Run the stack materializer for that pin so the repo's own
design-import-design-system skill exists, then retry.
```

**An empty result is not an answer.** Never fall back to another tool and never
return an empty payload — an empty result is indistinguishable from a design
that was never made, which is exactly the silent failure this adapter exists to
prevent.
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
