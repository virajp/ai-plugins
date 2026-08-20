# Single Responsibility (SOLID: S)

## Definition

A module should have **one reason to change** — one stakeholder, policy, or
concern whose evolution forces an edit here. Responsibility is defined by
*change*, not by size or by "does one thing": a hundred-line module serving
one policy is fine; a ten-line function mixing a business rule with a
transport concern already has two masters.

The [engineering baseline](../engineering-baseline.md)'s
business/technical-separation rule is the enforced, coarse-grained version of
this principle. This entry carries the finer judgment inside each layer.

## Smells

- A module edited in unrelated commits for unrelated reasons — its history is
  the evidence.
- A class or module whose name needs "and": parses *and* persists, validates
  *and* notifies.
- Imports from disparate worlds in one file: domain rules next to transport,
  serialization, and vendor SDK calls.
- "Manager", "Processor", "Service" grab-bags that accrete every behavior
  vaguely near their noun.
- A change request that should be one edit fanning out across the module's
  unrelated halves — or worse, a one-concern edit that risks breaking the
  other concern's tests.

## How a reviewer verifies it

- For each new or grown module, name its **one reason to change** in a
  sentence. Needing "and" in that sentence is the finding.
- Take two plausible upcoming changes from different concerns (a business
  rule tweak; a storage change) and ask whether both land in this module.
  Both landing here → split candidate.
- Check the tests: a module with one responsibility has tests that read as
  one topic. Test files mixing unrelated scenarios mirror the mix in the
  code.
- Look at what the diff had to touch: an author forced to edit serialization
  code to change a business rule has found the violation for you.

## Application patterns

- Separate along **change axes**: policy vs mechanism, decision vs execution,
  domain vs boundary. The stable side gets an interface; the volatile side
  gets a module per variant.
- Let the layering carry the coarse split (business vs technical, per the
  baseline) and apply this principle *within* a layer: one domain concept, one
  policy, one module.
- Name modules after their responsibility, not their pattern — the name is
  the cheapest enforcement, because a misplaced addition looks wrong in a
  well-named home.
- When splitting, keep each piece whole per
  [information hiding](information-hiding.md): split by decision owned, not
  by arbitrary size.

## When not to apply it

- **Don't split below the concept.** Scattering one coherent responsibility
  across five tiny files adds navigation cost with no decoupling gain —
  cohesion is the goal; fragment count is not a metric.
- Code that is **stable and finished** does not benefit from a speculative
  split; responsibility separation pays when change arrives, and
  [YAGNI](yagni.md) applies to refactorings too.
- At a system's small beginnings, a modest grab-bag module is acceptable
  scaffolding — flag it when its second concern starts *changing*, not the
  day it appears.
- Glue code at the composition root legitimately touches everything; wiring
  is its single responsibility.
