# KISS — Keep It Simple

## Definition

Of the designs that solve the problem, prefer the one a reader can hold in
their head. Simplicity is measured at the **reader**, not the writer: fewer
concepts to learn before the code makes sense, fewer places to look to trace
one behavior, fewer states a component can be in. A clever solution that saves
ten lines but adds a concept is not simpler.

KISS governs **how** something is built; whether it is built at all is the
[minimalism ladder](../minimalism.md)'s question, and its brevity rung
(rung 6) is KISS applied at the line level. The
[karpathy guidelines](../../skills/karpathy-guidelines/SKILL.md) carry the
behavioral version: don't overcomplicate, make the change surgical.

## Smells

- An abstraction with exactly one implementation and no second one in sight.
- Configuration or parameters that no caller varies.
- A design pattern named in the code (factory, strategy, visitor) where a
  function would do.
- Indirection a reader must step through to find where anything happens —
  layers that only forward.
- A "flexible" data model (generic key-value fields, type discriminators) for
  data whose shape is actually fixed.
- Metaprogramming, reflection, or code generation where plain code was
  possible.

## How a reviewer verifies it

- **Trace one behavior end to end** and count the files and concepts touched.
  If the count is out of proportion to what the behavior does, name the layer
  that only forwards.
- For every abstraction in the diff, ask for the **second concrete use**. One
  use and a hypothetical is a violation of [YAGNI](yagni.md) wearing KISS's
  clothes — flag it under whichever the author claims.
- Rewrite the hardest hunk mentally in the most naive style that still works.
  If the naive version is correct and clearly shorter, the finding is the
  difference.
- Check that variation points in the code correspond to variation that
  **actually occurs** — in requirements, in tests, or in callers.

## Application patterns

- Default to plain data and plain functions; reach for interfaces and
  polymorphism when a second implementation exists, not before.
- Keep one obvious place per behavior — a reader asking "where does X happen"
  should have one answer.
- Prefer the boring idiom of the language over an imported style; the stack's
  own conventions are part of what the reader already holds.
- When complexity is genuinely required, **fence it**: one module owns the
  hard part behind a simple boundary, per
  [information hiding](information-hiding.md).

## When not to apply it

- **Essential complexity does not simplify away.** A domain with intricate
  rules needs code that carries them; flattening it loses correctness, not
  complexity. Simplify the expression, never the contract.
- **Safety guardrails stay** — validation, data-loss handling, security
  controls, accessibility. The minimalism protocol's guardrail list applies
  verbatim; simple-but-unsafe is not simple, it is unfinished.
- A performance-critical path may justify a design a naive reading would not —
  but the measurement that justifies it belongs next to it.
- Don't confuse *familiar* with *simple*: an idiom the whole stack community
  uses may look indirect to an outsider and still be the simplest choice for
  every future reader of that stack.
