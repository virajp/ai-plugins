# Liskov Substitution (SOLID: L)

## Definition

Anywhere the code accepts an abstraction, **every implementation must be
usable without the caller knowing which one it got**. A subtype may demand no
more than the contract demands (preconditions never strengthen) and promise
no less than it promises (postconditions and invariants never weaken).
Substitutability is a property of the **contract**, not the type system —
code can inherit an interface and still violate it behaviorally.

This is [design by contract](design-by-contract.md) applied to polymorphism:
the supertype's contract is the promise, and every implementation is bound by
it.

## Smells

- Callers testing the concrete type behind an abstraction (`instanceof`,
  type tags, downcasts) and branching on it.
- An implementation stubbing contract methods with "not supported" errors —
  it implements the interface's shape, not its promise.
- A subtype silently narrowing accepted inputs or returning a degraded
  result the caller has no way to expect.
- Overrides that change semantics: different error behavior, different
  side-effect ordering, surprise caching or retries.
- Test suites duplicated per implementation with *different expectations* —
  the expectations diverging is the contract diverging.

## How a reviewer verifies it

- For each new implementation of an existing abstraction, read the
  abstraction's documented contract and check: inputs accepted at least as
  broad, guarantees at least as strong, error semantics identical in kind.
- Grep callers of the abstraction for type inspection. Any branch on the
  concrete type is either a substitution violation being worked around or an
  abstraction that never fit — both are findings.
- Run the supertype's test suite against the new implementation (a shared
  contract-test suite is the mechanical form of this check; ask for one when
  implementations multiply).
- Watch for the classic shape: a "is-a" relationship from the domain
  (square/rectangle) modeled as subtyping when the *operations* don't
  substitute. The domain taxonomy is not the code's type hierarchy.

## Application patterns

- Write the abstraction's contract down where implementations will read it:
  what inputs are legal, what the result guarantees, what errors mean.
- Keep abstractions **behavior-sized**: the narrower the interface (see
  [interface segregation](interface-segregation.md)), the easier every
  implementation honors all of it.
- When an implementation genuinely can't honor a method, the interface is
  too wide — split it rather than stubbing.
- Encode contract checks where the stack allows: shared contract tests,
  runtime assertions at the boundary, property-based tests over the
  guarantee.

## When not to apply it

- **Don't force substitutability where there is no abstraction.** Two
  concrete types that merely resemble each other owe each other nothing;
  the obligation begins when code accepts them through a common seam.
- Extension mechanisms that are *explicitly* capability-negotiated (a
  feature-detection protocol, optional capabilities queried at runtime) are
  a legitimate design — the contract then includes the negotiation, and
  "may refuse" is part of the promise.
- Inheritance for pure implementation reuse, with no caller ever holding
  the base type, has no substitution obligation — though it usually has a
  better shape as composition.
- During an incremental migration, a temporarily non-conforming
  implementation behind a flag can be acceptable — bounded, named, and
  tracked, never silent.
