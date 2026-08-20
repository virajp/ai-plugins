# Explicit Error Semantics

## Definition

Every failure a component can produce is part of its contract: **named,
typed where the stack allows, and meaningful to the caller** — who can tell
from the error alone whether to retry, fix the input, give up, or page
someone. The opposite is error *noise*: failures swallowed, coerced to
defaults, stringly-typed, or re-thrown until all context is gone.

The [engineering baseline](../engineering-baseline.md) enforces the surface
forms — one error envelope across every service, boundary inputs rejected
never coerced, structured logs. This entry is the judgment for the interior:
what an error should carry, who handles it, and when not to handle it at
all.

## Smells

- Silent swallowing: an empty catch, a logged-and-continued failure the
  caller never learns about, a default value returned where the operation
  actually failed.
- One opaque error kind for everything, forcing callers to parse messages
  or guess.
- Retryability undeclared — callers retrying validation failures or giving
  up on transient ones, because the error doesn't say which it is (see
  [idempotency](idempotency.md) for what retrying then costs).
- Handling at the wrong altitude: deep code deciding user-facing policy
  (exit, message wording), or every layer catching, wrapping, and
  re-throwing until the original cause needs an archaeologist.
- Errors that leak internals across a trust boundary — stack traces, query
  fragments, other tenants' identifiers.
- The unhappy paths untested; the test suite exercising only success.

## How a reviewer verifies it

- Enumerate the diff's failure points (I/O, parsing, contract checks,
  arithmetic edges) and follow each to where it is **decided** — someone
  retries, reports, compensates, or deliberately crashes. A failure whose
  trail ends in a swallow or a bare log is the finding.
- Check the distinctions callers actually need are representable:
  caller-fixable vs transient vs invariant-broken. Fewer kinds than
  decisions → callers are guessing.
- At boundaries, verify conformance to the product's error envelope and
  that nothing internal leaks outward.
- Look for the coercion shape the baseline bans: `catch → return default`.
  Ask what the caller now believes happened.
- Confirm error paths have tests asserting the *semantics* (kind,
  retryability, message audience), not just "throws something".

## Application patterns

- Design errors as a small closed vocabulary per boundary — aligned with
  the product envelope at the edge (per the
  [rest-api-design skill](../../skills/rest-api-design/SKILL.md)'s error
  section), carrying cause, retryability, and a correlation id inward.
- Handle at the altitude that can decide; below it, either add real context
  and propagate, or don't touch the error at all — a wrap that adds nothing
  subtracts a stack frame of truth.
- Fail fast on broken invariants ([design by contract](design-by-contract.md)):
  a crash near the cause beats a limp to a corruption far from it.
- Reserve recovery for failures with a recovery: degrade only where the
  product defines degraded (a cache miss, an optional enrichment), and say
  so in the result.

## When not to apply it

- **Not every failure deserves a bespoke type.** Kinds exist to change a
  caller's decision; distinctions no caller acts on are taxonomy for its
  own sake — collapse them.
- At the outermost edge, exhaustive interior semantics compress into the
  audience's vocabulary: a user gets an actionable message, not the causal
  chain; the causal chain goes to the structured logs.
- Best-effort-by-design paths (telemetry emission, speculative prefetch)
  may legitimately drop their own failures — as a **stated** property of
  that path, with a counter, not as an empty catch someone forgot.
- Panic-and-restart is a valid strategy for invariant violations in a
  supervised process (the baseline's graceful-shutdown rule makes sudden
  death survivable) — explicit semantics there means *choosing* the crash,
  not sprinkling handlers that pretend to recover.
