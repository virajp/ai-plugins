---
description: Create or update docs/blueprint/design-system.md — the
  product-wide
  UX/visual contract (semantic tokens, typography, spacing, motion, accessibility
  standard, component behaviors) that every blueprint screen references. A vwf
  foundation, mandatory once the product has a UI surface.
argument-hint: ""
model: sonnet
effort: xhigh
---

# design-system — Product-Wide UX/Visual Contract

Maintain `docs/blueprint/design-system.md`: the product's design system as a
**code-independent contract**. It is a vwf foundation alongside
`architecture.md`, and `blueprint` requires it once the registry has a
UI-surface project (type `site`, `frontend`, or `console`). Author the
*decisions* — semantic token values, type and spacing scales, motion principles,
the accessibility standard, and global component behaviors. Never name the
component library, CSS framework, or design file — that is `plan`.

You own the user conversation. Elicitation is **interactive and stays with
you**. Apply the **design-system** skill doctrine throughout.

## Doc Paths

| Doc           | Path                                                      |
| ------------- | --------------------------------------------------------- |
| Registry      | `docs/blueprint/architecture.md`                          |
| Design system | `docs/blueprint/design-system.md`                         |
| Template      | `${CLAUDE_PLUGIN_ROOT}/assets/templates/design-system.md` |

Doctrine: the **design-system** skill (foundations, color-tokens, typography,
layout-and-spacing, motion, accessibility, components-and-anti-patterns,
checklist).

---

## Pipeline

### 1. Read the registry

Read `docs/blueprint/architecture.md`. **Halt if it does not exist:** "No
registry found. Run `/vwf:architecture` first." If the registry has **no**
UI-surface project (no `site`, `frontend`, or `console` type), tell the user a
design system may not be needed and ask whether to (a) **add the UI project to
the registry first** via `/vwf:architecture` (then return here), or (b) proceed
anyway. Do not elicit a design system for a registry with no UI surface without
one of these.

**Format check.** Run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md`; if the repo's blueprint format
is behind what vwf ships, nudge `/vwf:setup` (proceed unless a needed artifact
is missing).

### 2. Recall (mempalace)

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall prior design decisions and
rationale (room `decisions`) before eliciting — build on them, don't re-ask
resolved questions. Skip silently if mempalace is unavailable.

### 3. Interactive elicitation (orchestrator)

Adopt a **Product Designer & Design-Systems** persona and elicit following the
**elicitation protocol** in `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`,
layered with the design-system skill: brand/mood → color tokens → typography →
spacing & layout → motion → accessibility standard → component behaviors →
anti-patterns.

- **Contract vs realization:** capture token *values* and *scales*; never the
  component library, CSS framework, or design file.
- **Minimalism** (`${CLAUDE_PLUGIN_ROOT}/assets/minimalism.md`): define only the
  tokens, scales, and behaviors the product actually uses — no speculative
  catalog.
- Surface genuinely open items as **Open Questions**; never assume silently.

### 4. Write the doc

Write the design system in **one of two equal forms** — same sections, same
content, only the file boundary differs. Set `status: draft` until the reviewer
loop (§5) returns `NO GAPS`, then `reviewed`.

- **Single file** — `docs/blueprint/design-system.md`. The default; use it while
  the doc reads comfortably in one sitting.
- **Folder** — `docs/blueprint/design-system/`, the sections split across
  `index.md` (Brand & Mood, principles, Accessibility Standard) +
  `foundations.md` (Color Tokens, Typography, Spacing & Layout) + `motion.md` +
  `components.md` (Component Behaviors + Anti-Patterns). Promote to this form
  once the doc grows too large to read in one sitting — a judgement call, not a
  forced migration.

Neither form is a downgrade; either is a valid design system at rest. An
existing design system already in the folder form stays a folder — never
collapse it into a single file. Author from the template — including its **OKF
frontmatter** (`type: vwf-design-system`, `title`, `description`, `status`;
optional `timestamp`/`owner`/`resource`/`tags`), per the blueprint-authoring
frontmatter-and-links reference; in the folder form, every split file carries
its own frontmatter.

### 5. Reviewer loop (fresh subagent)

**Self-review first.** Before dispatching, skim the doc against the
design-system skill's pre-delivery checklist and fix any obvious placeholder or
empty section — don't burn a review round on gaps you can see yourself.

Then loop until the doc passes:

1. Dispatch a **fresh** `design-system-reviewer` subagent (stateless) with
   **only** the written doc — the single file, or **all files** of the folder
   form (`index.md` + each split file) — and no conversation context. It checks
   the doc against the completeness checklist in its own instructions and
   returns `NO GAPS` or a numbered gap list.
2. **Gaps** → present them, re-elicit the specific open decisions with the user
   (one at a time), update the doc, return to step 1.
3. **`NO GAPS`** → set `status: reviewed` and exit.

**Convergence guard:** before another round, compare to the prior round. Pause
and ask the user if the gap count did not strictly decrease, or a resolved gap
resurfaced. No fixed round cap.

### 6. Reconcile & persist

**Impact analysis (update mode).** When this pass **renamed or removed** a token
or a component behavior, grep `docs/blueprint/` — the entity docs' **Screens**
and **References** sections — for uses of the old name and report every orphan.
Offer to fix them via `/vwf:blueprint` (the entity docs are its surface);
**never silently edit an entity doc from here.**

**Cross-cutting conventions.** A design decision graduates to
`docs/blueprint/conventions.md` when it becomes a system-wide engineering rule.
Two concrete triggers:

- A **theming / dark-mode strategy** (how themes are selected and applied
  product-wide) → record the decision in `conventions.md`.
- An **i18n / RTL direction** decision (the product supports right-to-left or
  bidirectional layout) → record it in `conventions.md`.

Otherwise **skip** — a pure token/scale/behavior value stays in the design
system and does not touch conventions.

**Architecture reconcile.** If eliciting the design system surfaced a
product-shape change — e.g. a new UI project the registry does not yet list —
update the **registry** in `docs/blueprint/architecture.md` via
`/vwf:architecture` (mirror `blueprint`'s reconcile step). Do not edit the
registry by hand here.

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store durable design
decisions and their rationale to mempalace (room `decisions`) — skip what the
doc captures verbatim. Skip silently if mempalace is unavailable.

### 7. Approval gate

Summarize what was written/changed and wait for explicit approval.

### 8. Commit (git-workflow)

After approval, hand **all** git actions to `/vwf:git-workflow`. Use a
`blueprint(design-system):` or `docs(design-system):` message. Do not run raw
git here.
