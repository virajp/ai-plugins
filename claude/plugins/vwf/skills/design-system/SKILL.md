---
name: design-system
description: Import the product's design system from the configured design tool
  into
  docs/blueprint/design-system.md — the product-wide UX/visual contract
  (semantic tokens, typography, spacing, motion, accessibility standard,
  component behaviors) every blueprint screen references — and pin
  design.design_system_id in .config/vwf.yaml. A vwf foundation, mandatory
  once the product has a UI surface. Design systems are authored and iterated
  in your design tool; this skill imports via its adapter plugin, and never
  authors visual language itself.
argument-hint: "[design-system id — omit to let the adapter resolve it]"
model: sonnet
effort: high
disable-model-invocation: false
---

# design-system — Import the Product's Design System

**The design tool owns design-system authoring.** You pick or build the design
system there — vwf imports it through the design adapter and never authors
visual language. Which tool answers (`claude-design`,
`lovable`, `stitch`, …) is the product's choice; vwf knows only the payload
shape, per `${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`. The canvas is where
visual language is judged. This skill does one job: resolve the design system,
**import** it into `docs/blueprint/design-system.md`, and **pin**
`design.design_system_id` in `.config/vwf.yaml`.

The repo doc still matters — it is the **offline contract**: the design-system
reviewer bar, the execute ux gate, and the coder consume it without network or
claude.ai auth, and it is git-versioned and graphify-ingestable. The doc records
the *decisions* — semantic token values, type and spacing scales, motion
principles, the accessibility standard, global component behaviors — never the
component library, CSS framework, or design-file mechanics (that is `plan`).

**Drift is one-way.** The canvas is the source; the doc is its distillation.
Hand-edits to the doc are drift — resolved by changing the design system on the
canvas and re-running this skill, never by publishing the doc back.

## Doc Paths

| Doc           | Path                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ |
| Registry      | `docs/blueprint/registry.yaml`                                                             |
| Design system | `docs/blueprint/design-system.md`                                                          |
| Template      | `${CLAUDE_PLUGIN_ROOT}/assets/templates/design-system.md`                                  |
| Config        | `.config/vwf.yaml` — the `design:` block, per `${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md` |

Doctrine: the **design-system-authoring** skill (foundations, color-tokens,
typography, layout-and-spacing, motion, accessibility,
components-and-anti-patterns, terminal-ux, checklist).

---

## Pipeline

### 1. Read the registry

Read `docs/blueprint/registry.yaml`. **Halt if it does not exist:** "No registry
found. Run `/vwf:architecture` first." If the registry has **no** UI-surface
project (no project whose `role` is `site`, `fullstack` or `frontend`), tell the
user a design system may not be needed and ask whether to (a) **add the UI
project to the registry first** via `/vwf:architecture` (then return here), or
(b) proceed anyway.

**Format check.** Run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/vwf:setup` (proceed unless a needed artifact
is missing).

**Terminal surfaces.** Read `platforms:` in `docs/blueprint/registry.yaml`: any
project declaring `cli` makes the doc's **Terminal UX** section required
(design-system-authoring's terminal-ux reference) — always elicited in text
(§5); the canvas neither designs nor imports it.

### 2. Recall (mempalace)

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall prior design decisions and
rationale (room `decisions`), plus parked visual/UX points (room `gaps`, tag
`parked`). Skip silently if mempalace is unavailable.

### 3. Preflight the design adapter — or halt

vwf does not talk to any design tool. Per
`${CLAUDE_PLUGIN_ROOT}/assets/design-adapter.md`, the tool is a **per-project**
key — `projects.<name>.design` in `.config/vwf.yaml` — resolved inside the
adapter, not here. **Name the project you are importing for**: read the `design`
value of every UI project (`role` `site`, `fullstack` or `frontend`); when they
all agree, use that project and say which. When they disagree, ask which
project's tool authors the product's one design system — that is a product
decision, not something to pick silently. Then **verify the `design-tools`
plugin is installed** (`claude plugin list`) before delegating. Three distinct
halts — never collapsed into one, since each needs a different fix:

- **No `design` on any UI project** → "No design tool configured. Set
  `projects.<name>.design` in `.config/vwf.yaml` to one of `claude-design`,
  `lovable`, `stitch`." A config still carrying a product-wide `design.tool` is
  `config_format` 12 drift — nudge `/vwf:setup` rather than reading it.
- **Plugin not installed** → "the `design-tools` plugin isn't installed. Install
  it via `/plugin`, then re-run."
- **Adapter returns nothing usable** → "`<tool>` returned no usable payload",
  with the parse error.

The preflight exists because the failure is **silent**: an adapter skill set to
`disable-model-invocation: true` cannot be invoked programmatically and does not
error, so attempting the call and inspecting the result cannot distinguish
"missing adapter" from "empty design system". This skill still has no offline
authoring mode.

### 4. Delegate the import

Invoke `/<tool>:<tool>-import-design-system` and parse its reply as a
**design-system payload** per the adapter contract. Everything downstream is
vwf's job: you write `docs/blueprint/design-system.md` from the payload, gated
by the `design-system-reviewer` — the adapter never touches a blueprint doc.

**Record `source.derived`.** When the adapter reports `derived: true`, it
reconstructed the tokens from generated code rather than reading a stored design
system. Note that in the doc: a stored system is authoritative until someone
changes it, a derived one is a snapshot of one generation and can drift the next
time a screen is regenerated.

If the payload carries a tool-side identifier, pin it under `design:` for the
next run (per the vwf-config asset — the pin is adapter-scoped, since every tool
identifies its design system differently).

### 5. Distill into the doc

Map the payload onto the template's sections: semantic token values, type &
spacing scales, motion, accessibility, component behaviors, anti-patterns.
**Contract vs realization** holds — values and scales, never the component
library or CSS framework the payload may mention.

**Nothing invented.** A field the adapter returned as `null`, or a section no
tool decided (commonly the accessibility conformance target, anti-patterns, or
the Terminal UX section when a `cli` platform requires it) is **elicited now**,
per `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`. The import fills the doc;
elicitation fills only the import's holes. Never fill a `null` by inference —
the adapter reported it as unknown precisely so it would not be guessed.

### 6. Write the doc

Two equal forms — **single file** `docs/blueprint/design-system.md` (default),
or the **folder** `docs/blueprint/design-system/` (`index.md` +
`foundations.md` + `motion.md` + `components.md`) once it outgrows one sitting;
an existing folder stays a folder. Author from the template with its **OKF
frontmatter** (`type: vwf-design-system`, `title`, `description`, `status` —
`draft` until §7 passes, then `reviewed`); every split file carries its own
frontmatter.

### 7. Reviewer loop (fresh subagent)

Self-review against the design-system-authoring checklist first. Then loop:
dispatch a **fresh** `design-system-reviewer` (stateless) with only the written
doc (all files of the folder form; tell it whether a `cli` platform exists).
**Gaps** → a decision hole is elicited and fixed in the doc; a *visual* gap is
tool-side rework — the user iterates in their design tool, then re-import the
affected sections. **`NO GAPS`** → `status: reviewed`. Convergence guard: pause
and ask if the gap count does not strictly decrease.

### 8. Reconcile & persist

**Impact analysis (re-import).** When the import **renamed or removed** a token
or component behavior, grep `docs/blueprint/` — the flow docs' Screens sections
and References — for the old name and report every orphan; offer to fix them via
`/vwf:blueprint`. Never edit a flow doc from here.

**Cross-cutting conventions.** A theming/dark-mode strategy or an i18n/RTL
decision graduates to `conventions.md`; pure token/scale/behavior values never
do.

**Architecture reconcile.** A product-shape change surfaced here (e.g. a new UI
project) routes through `/vwf:architecture` — never a by-hand registry edit.

**Persist.** Store durable decisions and rationale to mempalace room `decisions`
(skip what the doc captures verbatim; skip silently if down).

### 9. Approval gate, pin & commit

Summarize what was imported/changed and wait for explicit approval. Then pin
`design.design_system_id` in `.config/vwf.yaml` (confirmed, never silently) and
hand **all** git actions to `/vwf:git-workflow` — the pin rides the same commit.
Use a `blueprint(design-system):` or `docs(design-system):` message.
