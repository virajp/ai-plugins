# Design by Contract

## Definition

Every boundary — function, module, service — carries an explicit contract:
**preconditions** the caller must satisfy, **postconditions** the callee then
guarantees, and **invariants** that hold before and after. The contract
assigns blame: a precondition violation is the caller's bug, a postcondition
violation the callee's — which is what makes failures diagnosable instead of
negotiable.

The [engineering baseline](../engineering-baseline.md)'s boundary-validation
rule is the enforced perimeter form (validate every input *and output*
crossing a boundary). This entry is the judgment for interior contracts and
for what a contract should say.

## Smells

- Defensive programming everywhere: every function re-validating what its
  caller already guaranteed, because nobody wrote down who guarantees what.
- Its twin: interior code trusting nothing *stated* — no assertion, no
  documented precondition — so violations travel far from their cause
  before failing.
- Contracts existing only in the implementor's head: "you have to call
  `init` first", discovered by crashing.
- Functions returning silent degradations (empty result, default value,
  clamped input) when their real precondition was violated — coercion where
  rejection was owed.
- Docs describing what a function *does internally* rather than what it
  requires and guarantees.

## How a reviewer verifies it

- For each new public function or endpoint, ask for its contract in three
  clauses: requires, guarantees, maintains. If the author can't state it,
  the callers certainly can't honor it.
- Check violations **fail fast and loud** at the boundary where blame is
  assignable — per the baseline, rejected, never coerced.
- Look for double validation across a call chain: the same check at three
  depths means ownership was never assigned; the fix is deciding whose
  check it is, not deleting all three.
- Where implementations vary behind one abstraction, verify the contract is
  attached to the **abstraction** — that is the
  [Liskov substitution](liskov-substitution.md) check in contract form.

## Application patterns

- Make illegal states unrepresentable where the type system allows —
  a contract enforced by construction beats one enforced by assertion.
- Validate at trust boundaries per the baseline; **assert** interior
  assumptions cheaply (they document as they defend); keep interior code
  otherwise trusting, so each check has one owner.
- State error semantics as part of the contract — which failures are the
  caller's to prevent vs the callee's to signal — in the product's one
  error shape (see [explicit error semantics](explicit-error-semantics.md)).
- For service boundaries, the contract artifact is the schema/API document,
  authored per the
  [rest-api-design skill](../../skills/rest-api-design/SKILL.md), and
  honored additively once published.

## When not to apply it

- **At trust boundaries, "caller's fault" never means "skip the check".**
  Preconditions on external input are validated, always — contract-style
  trust applies only between components inside one trust domain.
- Exhaustive formal clauses on every private helper is ceremony; interior
  contracts earn writing down in proportion to distance between caller and
  callee (team, module, or time).
- Expensive postcondition checks don't belong in hot production paths —
  assert them in tests and debug builds rather than deleting them.
- Exploratory code whose boundaries are still moving can defer contract
  formality — but the moment a second consumer arrives, the contract is
  due.
