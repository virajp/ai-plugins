---
name: mockups
description: Render the blueprint's screens as self-contained static HTML
  mockups — one page per screen plus the state variants the Screens contract
  pins, styled from design-system tokens — into the repo's gitignored
  docs/scratchpad/ tree for local browser review. Mockups are realizations,
  never contract; never pushed to Claude Design, never committed.
---

# mockups — Render Screen Mockups Locally

Turn the blueprint's **Screens contracts** into reviewable visuals: one
self-contained HTML page per screen (plus each pinned state variant), styled
from `design-system.md` tokens, written into the repo's **gitignored
`docs/scratchpad/` tree** and reviewed in the user's own browser. Mockups are
**never pushed to Claude Design** — the scratchpad is the only render surface.
Since blueprint flow passes render and review each flow's screens **in-pass**
(blueprint §6a), this command is the **batch / regeneration tool**: re-render
everything after a design-system change, refresh a legacy repo, or redo one flow
post-hoc. It requires reviewed Screens contracts and a design system, and is
**never a gate for `plan`**.

**Mockups are realizations, not contract.** They are *views* of the blueprint,
regenerated at will — each flow's folder is **overwritten in place** on
re-render, so paths stay stable and the tree always shows the latest render of
every flow. A review remark that changes what a screen should *be* routes
through `blueprint <flow>` or `design-system` — then re-run this
command (regenerate-over-edit). Nothing here ever writes into `docs/blueprint/`,
and nothing under `docs/scratchpad/` is ever committed.

## Doc Paths

| Doc           | Path                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Registry      | `docs/blueprint/registry.yaml`                                                                                                          |
| Design system | `docs/blueprint/design-system.md`, or the folder form `docs/blueprint/design-system/` (read every split file)                           |
| Flow screens  | the `## Screens` section of `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md` (home rule: a screen is defined in exactly one flow) |
| Render target | `docs/scratchpad/<project>/<NNN>-<flow>/<platform>/` (gitignored; overwritten in place per platform)                                    |
| Config        | `.config/vwf.yaml` — the `design:` block, per `%%AI_PLUGINS_ROOT%%/assets/vwf-config.md`                                              |

Doctrine: the **blueprint-authoring** skill's `ui-ux-contract` reference (what a
Screens contract pins) and the **design-system-authoring** skill (token
semantics). No template — this command authors no repo doc.

## Halt Conditions

- No flow folders under `docs/blueprint/flows/` → "No blueprint found. Run
  `blueprint` first." Stop.
- No design system (neither file nor folder form) → "Screens reference the
  design system; run `design-system` first." Stop.
- The registry has **no UI-surface project** (no project whose `role` is `site`,
  `fullstack` or `frontend`) → no flow can have a Screens surface; say so and
  stop.
- `$ARGUMENTS` names a flow that does not exist **or** has no Screens section →
  say so, list the flows that *do* have Screens, and stop.

## Format Check

Run the preflight in `%%AI_PLUGINS_ROOT%%/assets/format-check.md`; nudge
`/vwf-setup` on drift (proceed unless the Screens/design-system artifacts this
command consumes are missing — then tell the user to run `/vwf-setup` and stop).

## Pipeline

### 1. Ensure the scratchpad is ignored

Before any write, verify `docs/scratchpad/` is gitignored:
`git check-ignore -q docs/scratchpad`. If it is not, append `docs/scratchpad/`
to the repo's `.gitignore` and commit that one line via `git-workflow`
(`chore(vwf): gitignore docs/scratchpad`), then proceed. Rendered mockups must
never become committable.

### 2. Resolve scope

Read the registry and confirm a UI project exists. Enumerate the flow folders
under `docs/blueprint/flows/`. For each, read the `## Screens` section of
`index.md`; parse the Screens table plus any recorded deviations beneath it (per
the ui-ux-contract reference — the home rule means each screen appears under
exactly one flow, so a sweep renders every screen once). Read the design system
fully (either form). Build the worklist: flow → screens → the **default
populated view always, plus only the states the row pins**
(`%%AI_PLUGINS_ROOT%%/assets/minimalism.md` — no speculative variant catalog).
Flows without a Screens section are skipped silently in sweep mode; `$ARGUMENTS`
present → the scope is that one flow (every platform file it has). The unit of
work is a **flow platform**: each `<platform>.md`'s Screens render into
`docs/scratchpad/<project>/<NNN>-<flow>/<platform>/`.

### 3. Recall (mempalace)

Per `%%AI_PLUGINS_ROOT%%/assets/memory.md`, recall rooms `decisions` (design
rationale beyond the docs) and `gaps` (tag `parked` — parked UX points a mockup
must not over-promise). Skip silently if mempalace is unavailable.

### 4. Generate (delegated, per flow)

For each in-scope **flow platform**, dispatch a **fresh `mockup-generator`
subagent** (stateless and independent, so dispatch them all in a single message
to run concurrently) with: that platform file's Screens table + Components +
deviations, the design-system doc(s), its **absolute render-target dir**, and
the flow + platform names. The generator owns the file spec (filenames,
self-containment rules), overwrites the dir's contents in place, and returns
**only a manifest** (one line per file: `path | screen | state`) — the HTML
never enters this conversation's context.

### 5. Prune stale files

Within each rendered platform's dir, delete files absent from its manifest
(screens or states the blueprint no longer pins). A **sweep** additionally
removes scratchpad dirs whose flow or platform file no longer exists; a
flow-scoped run never touches another flow's dirs. Deletes never reach outside
`docs/scratchpad/`.

### 6. Report, stamp, persist

Report per flow, grouped by platform: the screens and state variants rendered,
and the **absolute file paths** to open in a browser (the entry point per
platform is its first screen's default view). Include the standing reminder that
mockup remarks never flow back as files — contract changes route through
`blueprint <flow>` or `design-system`, then re-render.

**Stamp `flows_rendered`.** Record each rendered flow platform in the config's
`design.flows_rendered` list as `<project>/<NNN>-<flow>/<platform>` — a sweep
sets it to exactly what was rendered; a flow-scoped run adds its flow's
platforms. This is the render-currency state `plan`'s soft advisory reads
(and `blueprint` drops when a flow's Screens change unrendered).

**Persist.** Store the run outcome to mempalace room `decisions` per
`%%AI_PLUGINS_ROOT%%/assets/memory.md`. Skip silently if mempalace is
unavailable.

**Git.** This command writes no repo docs — docs-sync does not fire, and the
scratchpad tree is gitignored. The single exception is a changed
`.config/vwf.yaml` (the `flows_rendered` stamp, or the one-time `.gitignore`
line from §1): hand that to `git-workflow` with a
`chore(vwf): stamp rendered flows` message. When nothing in the config changed,
touch no git state at all.
