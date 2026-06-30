# Minimalism Protocol — the Ponytail Decision Ladder

The best code is the code you never wrote. This protocol governs **what gets
built** across vwf's phases and is the yardstick reviewers measure against. It
adapts the [ponytail](https://github.com/DietrichGebert/ponytail) methodology:
be lazy about the *solution*, never about *reading* — trace the real flow of the
code a change touches before picking a rung. The ladder runs **after** the
problem is understood, not instead of it.

## The decision ladder

For every capability a phase is about to add, walk these rungs in order and
**stop at the first that applies**:

1. **Necessity (YAGNI)** — does this need to exist at all? Build a capability
   only when a current requirement needs it, never because you foresee you
   *might* need it later. If no requirement needs it now, skip it. See
   [YAGNI](https://www.geeksforgeeks.org/software-engineering/what-is-yagni-principle-you-arent-gonna-need-it/).
2. **Reuse** — already in this codebase? Reuse it; don't rewrite.
3. **Standard library** — does the language's stdlib do it? Use that.
4. **Native platform** — does the platform/framework provide it natively? Use
   that.
5. **Installed dependency** — does an already-installed dependency do it? Use
   that; don't add a new one or hand-roll it.
6. **Brevity** — can it be one line? Make it one line.
7. **Last resort** — only then write the minimum viable solution, nothing more.

## Safety guardrails — never on the chopping block

Lazy, not negligent. Minimalism is never an excuse to remove or weaken:

- trust-boundary / input validation
- data-loss handling
- security controls
- accessibility

A lower rung never justifies dropping one of these. When a guardrail forces more
code, that code stays.

## By role

- **Authoring (blueprint)** — apply rung 1 to *requirements*: specify only
  fields, endpoints, states, and features a stated product goal needs. Do not
  invent unstated requirements or speculative configurability.
- **Building (plan, coder)** — run the full ladder before writing each unit of
  work. The plan prefers reuse/stdlib/native/existing-deps over new code and
  carries no speculative steps; the coder writes the minimum that satisfies the
  failing test, nothing the plan does not call for.
- **Reviewing (blueprint-reviewer, code-reviewer)** — flag the inverse: anything
  present that no requirement, plan step, or rung justifies (speculative
  features, premature abstraction, a rewrite of something reusable, a needless
  dependency), while never penalizing code a safety guardrail requires.
