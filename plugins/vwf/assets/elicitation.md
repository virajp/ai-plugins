# Elicitation Protocol

The shared questioning discipline for `/vwf:spec`, `/vwf:plan`, and
`/vwf:architecture`. You own the user conversation — elicitation stays with the
orchestrator and is never delegated to a subagent (a subagent cannot pause to
ask a question). Each command names **what** to ask about; this file governs
**how**.

## 1. Explore first

Before asking anything, read the relevant docs, code, and recent commits for the
slice in question. Ground every question in what already exists — never ask for
something the registry, conventions, or code already answers.

## 2. Scope check

If the request spans multiple independent pieces (e.g. several entities or
subsystems at once), say so before refining details. Decompose into the
independent pieces, agree on order, and elicit the first piece through the
normal flow. Don't spend questions on a thing that needs splitting first.

## 3. One question at a time

Ask with `AskUserQuestion` — **one decision per round**. Prefer MCQ + "Other";
open-ended is fine when no clean option set exists. Advance only once the prior
answer is in, and let it shape the next question. Do not batch unrelated
decisions into a single round.

## 4. What to ask — the decisions-vs-mechanics filter

Ask only what has **more than one reasonable answer** given the architecture
registry and conventions. If exactly one idiomatic answer exists, don't ask —
proceed. Focus on purpose, constraints, and success criteria.

**Never guess an open decision.** If the user can't answer or it's genuinely
undecided, record it under Open Questions rather than filling it from memory.

## 5. Propose 2-3 approaches

Before settling on a direction, present 2-3 approaches with their trade-offs.
Lead with your recommendation and the reasoning. Let the user pick or redirect.

## 6. Present in sections

Present the result in sections scaled to their complexity — a few sentences when
straightforward, more when nuanced. Confirm each section before moving on. Be
ready to go back and clarify when something doesn't fit.

## 7. Hard gate

Do **not** write the doc, dispatch a writer subagent, or take any implementation
action until the shape is presented and the user has approved it. This holds
regardless of how simple the change looks.

## 8. Self-review

After writing, re-read with fresh eyes and fix inline:

- **Placeholders** — no `TBD`/`TODO`/incomplete sections remain (except under
  Open Questions).
- **Consistency** — no section contradicts another.
- **Ambiguity** — no requirement reads two ways; if it does, pick one and make
  it explicit.
- **Scope** — still focused enough for a single pass.

## 9. Convergence guard

When looping on a review, compare each round to the prior one. Pause and ask the
user if the gap count did not strictly decrease, or a resolved gap resurfaced.
No fixed round cap.
