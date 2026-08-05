---
name: claude-design-import-screens
description: Read a flow's designed pages back from claude.ai/design and return
  them as a vwf screens payload. Invoked by screens import as its
  configured design adapter — not a general-purpose skill.
---

# import-screens — Claude Design adapter

Return one flow's designed screens, for one platform, as a **vwf screens
payload**. You read from the canvas and normalize; you never diff, never decide
what a delta means, and never touch a blueprint doc.

> **`disable-model-invocation` must stay `false`.** vwf reaches this skill by
> delegation. Flipping it to `true` removes the skill from Claude's context and
> blocks programmatic invocation — the call would not error, it would silently
> import nothing.

The payload shape is defined by the vwf adapter contract; read it before
returning anything: the installed vwf plugin's `assets/design-adapter.md`.

## Inputs

`$ARGUMENTS` is `<flow> <platform>` — the flow folder name (`<NNN>-<flow-slug>`)
and one of `mobile` / `tablet` / `desktop` / `web` / `auto`. vwf also passes the
registry project and the pinned canvas project id for that project+platform
(`design.projects.<project>.<platform>`).

## What to do

1. **Resolve the canvas project** from the pin. Per
   `%%AI_PLUGINS_ROOT%%/assets/canvas-push.md`, each platform has its **own**
   design project — never read a different platform's canvas to fill a gap.
2. **Find the page** named `<flow>--<platform>` under the naming contract. A
   missing page means the flow was never designed for this platform: return an
   empty `screens: []` and say so in `notes`. That is a real answer, not a
   failure.
3. **Read the frames.** Each frame's name carries the pinned **screen code**
   (`<NNN><letter>`) — that code is the join key vwf diffs on. Use `list_files`
   / `read_file`, and `render_preview` when a frame's structure is only legible
   rendered.
4. **Extract per screen**: the code, name, purpose, the components it is built
   from (with each component's role and the states it shows), and the
   screen-level states present on the canvas.
5. **Normalize into the payload** exactly as the contract specifies.

## Rules

- **Never invent a screen code.** A frame whose name carries no recoverable code
  is returned with `code: null` plus a `notes` line. vwf can diff around a
  missing code; it cannot recover from a wrong one, because the code is the join
  key and a fabricated one silently maps a design onto the wrong contract row.
- **Report, don't interpret.** A component the canvas shows but the contract
  does not mention is still reported — deciding whether it is an addition or a
  mistake is `screens import`'s job, and then `blueprint`'s.
- **Never edit the canvas, and never write to `docs/blueprint/`.**

## Return contract

Output **only** the screens payload as YAML, with nothing before or after it.
vwf parses your entire reply.

On failure, output only:

```text
ERROR: <what could not be reached or read, in one line>
```
