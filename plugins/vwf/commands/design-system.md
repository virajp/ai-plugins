---
description: Create or update docs/blueprint/design-system.md — the
  product-wide
  UX/visual contract (semantic tokens, typography, spacing, motion, accessibility
  standard, component behaviors) that every blueprint screen references. A vwf
  foundation, mandatory once the product has a UI surface.
argument-hint: ""
model: opus
effort: high
---

# design-system — Product-Wide UX/Visual Contract

Maintain `docs/blueprint/design-system.md`: the product's design system as a
**code-independent contract**. It is a vwf foundation alongside
`architecture.md`, and `blueprint` requires it once the registry has a
frontend/app project. Author the *decisions* — semantic token values, type and
spacing scales, motion principles, the accessibility standard, and global
component behaviors. Never name the component library, CSS framework, or design
file — that is `plan`.

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
frontend/app project (no UI surface), tell the user a design system may not be
needed and ask whether to proceed.

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

Write `docs/blueprint/design-system.md` from the template. Promote to the folder
form `docs/blueprint/design-system/` once it grows large.

### 5. Self-gate (checklist)

Check the doc against the design-system skill's **pre-delivery checklist**.
Resolve every failure (re-eliciting as needed) or record it under Open
Questions. Do not pass with silent gaps.

### 6. Reconcile & persist

Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store durable design decisions and
their rationale to mempalace (room `decisions`) — skip what the doc captures
verbatim. If the design system implies a cross-cutting convention, note it in
`docs/blueprint/conventions.md`.

### 7. Approval gate

Summarize what was written/changed and wait for explicit approval.

### 8. Commit (git-workflow)

After approval, hand **all** git actions to `/vwf:git-workflow`. Use a
`blueprint(design-system):` or `docs(design-system):` message. Do not run raw
git here.
