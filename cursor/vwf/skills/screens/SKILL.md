---
name: screens
description: Two-way screen sync with Claude Design. "prompt <flow>" writes one
  wireframe-level design brief per platform
  (docs/prompts/screens/<project>/<NNN>-<flow>/<platform>.md) —
  always the flow's full screen blueprint, regenerated in place, never a
  change note, transcribing each screen's contract-pinned components and their
  rules — commissioning one interactive page per flow per platform on
  the claude.ai/design canvas under a strict naming contract (pages
  <flow>--<platform>, frames named by the pinned screen codes, happy paths
  stitched into index--<platform>); it also maintains each platform canvas
  project's conventions CLAUDE.md (CLAUDE--<platform>.md — one design project
  per platform, generated sections regenerated, canvas-owned section
  preserved); the files are the deliverable, never run against the canvas;
  "import [flow]" reads the designed pages back as data, diffs them against
  the Screens contracts (components included), folds canvas-discovered
  conventions back into the conventions file, and routes every accepted
  contract delta through /blueprint — this skill never edits a flow doc
  itself.
---

# screens — Design-First Screen Sync (Claude Design ⇄ Blueprint)

Screens are the surface where canvas iteration beats contract prose: Claude
Design nails visual and interaction nuance the blueprint's tables cannot.
`prompt` writes a **wireframe-level** brief that commissions a flow's page for
one platform — structure, navigation, components, and behavior; the visual
design itself is made in the canvas chat — and **the file is the deliverable**:
the user pastes it into the canvas chat themselves; this skill never runs a
brief against the Claude Design MCP. A brief is **always the flow's full screen
blueprint**, regenerated in place — never a delta note; the canvas reconciles
its existing pages against the latest brief (revise-in-place). `import` brings
the designed pages back and folds what they decided into the contract —
**through `/blueprint`, one confirmed delta at a time**. The blueprint stays
the contract of record; the canvas is where screens get good.

**The naming contract is the join key.** Three levels:

- **Pages** — the canvas unit is **one interactive page per flow per platform**,
  at the project root, named `<flow>--<platform>` (`020-signin--mobile`,
  `100-home--auto`, …) — `<flow>` is exactly the numbered folder name under
  `docs/blueprint/flows/<project>/` for the registry project this canvas is
  pinned to, so the canvas sorts in execution order like the blueprint tree. The
  platform suffix (`mobile`, `tablet`, `desktop`, `web`, `auto`) is read
  **straight off the flow's platform files** — since format 15 a flow folder
  holds one `<platform>.md` per implemented platform, so the set of pages a flow
  gets *is* the set of files it has. No device→platform mapping and no
  narrowing: the vocabulary is the same everywhere (`auto` covers CarPlay and
  Android Auto together).
- **Frames** — inside a page, each screen frame is named by its pinned
  Screens-contract **Code** (`020a`, `020b`, …) — the per-screen sync key; state
  variations hang off the coded frame as tweaks, never as extra frames.
- **Index** — each platform's canvas project carries its one
  **`index--<platform>`** page: the stitched whole-product mockup, chaining
  every flow page's happy path in NNN execution order, so the complete happy
  flow for a platform is walkable from its index alone.

**One design project per platform.** Every registry UI project pins a separate
design project per platform (`design.projects.<registry-project>.<platform>`;
two platforms never share one), because the conventions differ per platform:
each carries its own conventions doc. How those pins are resolved on the tool
side is the **adapter's** business, not vwf's.

Import matches by these names, and the same names make the canvas humanly
reconcilable against the flows tree.

## Doc Paths

| Doc           | Path                                                                                                                                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flow contract | `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md` (platform-agnostic; the Platforms table names the files)                                                                                                                                                                               |
| Flow platform | `docs/blueprint/flows/<project>/<NNN>-<flow>/<platform>.md` (the `## Screens` section — rows carry the frame Codes, shared across platforms)                                                                                                                                                  |
| Prompts       | `docs/prompts/screens/<project>/<NNN>-<flow>/<platform>.md` — grouped by prompt type → registry project → flow; **one brief per flow per platform** (`mobile.md`, `tablet.md`, `desktop.md`, `web.md`, `auto.md`), regenerated in place — the tree mirrors the flows tree exactly (format 15) |
| Prompt templ. | `%%AI_PLUGINS_ROOT%%/assets/templates/screen-prompt.md`                                                                                                                                                                                                                                     |
| Conventions   | `docs/prompts/screens/<project>/CLAUDE--<platform>.md` — the platform canvas project's CLAUDE.md source, one per pinned design project; generated sections regenerated in place, the canvas-owned section preserved                                                                           |
| Conv. templ.  | the configured adapter plugin's conventions template (e.g. `claude-design`'s `assets/canvas-claude.md`)                                                                                                                                                                                       |
| Design system | `docs/blueprint/design-system.md` (or folder form)                                                                                                                                                                                                                                            |
| Registry      | `docs/blueprint/registry.yaml`                                                                                                                                                                                                                                                                |
| Config        | `.config/vwf.yaml` — the `design:` block, per `%%AI_PLUGINS_ROOT%%/assets/vwf-config.md`                                                                                                                                                                                                    |

Adapter contract: `%%AI_PLUGINS_ROOT%%/assets/design-adapter.md` — the payload
`import` consumes, the delegation names, and the preflight. vwf never speaks a
design tool's API: `import` delegates to `/<tool>:<tool>-import-screens` and
diffs the payload it returns. `prompt` needs no adapter at all — the briefs are
files. Doctrine: the blueprint-authoring skill's `ui-ux-contract` reference
(what a Screens contract pins — error and empty states are mandatory pins,
conditional product states pinned where the screen has them).

## Halt Conditions

- No design system (either form) → "Screens reference the design system; run
  `/design-system` first." Stop.
- `prompt` without a flow name, or naming a flow with no folder under
  `docs/blueprint/flows/` → say so, list the flows, stop (a brand-new journey is
  blueprinted first — even a draft flow doc — so the brief has steps to
  describe).
- The registry has no UI-surface project → no screens to design; stop.

**Format check.** Run `%%AI_PLUGINS_ROOT%%/assets/format-check.md`; nudge
`/setup` on drift.

## Modes

Two modes, read on demand — a run is one or the other, never both.

| Mode              | Reference                                    | What it covers                                                                                          |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `prompt <flow>`   | [prompt mode](references/prompt-mode.md)     | The canvas-conventions doctrine plus the six steps that write the per-platform briefs. Never touches the canvas |
| `import [flow]`   | [import mode](references/import-mode.md)     | The eight steps that read the designed pages back, diff them at screen/journey/index level, fold conventions, and route accepted deltas |

Read the one the invocation names, and follow it. Neither mode ever edits a flow
doc: `import` routes every accepted delta through `/blueprint`.
