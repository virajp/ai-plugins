# Elicitation Protocol

The shared questioning discipline for every skill that asks the user anything —
`product`, `architecture`, `design-system`, `blueprint`,
`screens`, `plan`, `/vwf-setup`, and `feedback`. You own the user
conversation — elicitation stays with the orchestrator and is never delegated to
a subagent (a subagent cannot pause to ask a question). Each command names
**what** to ask about; this file governs **how**.

## 1. Explore first

Before asking anything, read the relevant docs, code, and recent commits for the
slice in question. Ground every question in what already exists — never ask for
something the registry, conventions, or code already answers.

## 2. Scope check

If the request spans multiple independent pieces (e.g. several entities or
subsystems at once), say so before refining details. Decompose into the
independent pieces, agree on order, and elicit the first piece through the
normal flow. Don't spend questions on a thing that needs splitting first.

**Park out-of-scope answers — durably.** Mid-elicitation, an answer will
sometimes raise something beyond the current pass's scope (a new feature,
another flow or entity's behaviour, a future concern). Acknowledge it and do
**not** expand the pass — but never leave it only in conversation. Before asking
the next question, capture it per the parked-scope rule in
`%%AI_PLUGINS_ROOT%%/assets/memory.md`: file the full point to mempalace room
`gaps`, and mirror a terse line into the pass's durable doc — the flow/entity
doc's Open Questions, the plan's "Out of scope for this cycle", the product
doc's Risks & assumptions, or the doc's nearest equivalent. A parked point must
survive the session: when the scope change arrives in a later session, the
`gaps` recall and the doc line are what surface it — a point that lived only in
chat is lost.

## 3. One question at a time

Ask with `AskUserQuestion` — **one decision per round**. Prefer MCQ + "Other";
open-ended is fine when no clean option set exists. Advance only once the prior
answer is in, and let it shape the next question. Do not batch unrelated
decisions into a single round.

## 3a. Every question names its scope

**A question that does not say what it is about gets answered for something
else.** In a workspace with more than one project, "what should happen on error
here?" has a different right answer for a `service` than for a `frontend` — and
the user cannot see which doc you are writing. Never make them infer it.

State the scope in **both** places `AskUserQuestion` gives you:

- **`header`** (≤ 12 chars) — the shortest unambiguous scope token, not a
  restatement of the topic. The registry project name (`api`, `web`, `console`),
  or `<project>·<platform>` when the decision is platform-specific
  (`app·mobile`, `app·auto`). Reserve the topic for the question text; the chip
  is for *where*.
- **the question text** — the full scope, up front, because the header
  truncates. Name the registry project **and its `role`** the first time it
  appears in a pass, then the project alone: "In `api` (a `service`), when a
  refund request times out …".

Scope has four levels; use the narrowest that is true:

| Level         | Say                         | When                                                |
| ------------- | --------------------------- | --------------------------------------------------- |
| Whole product | "across the whole product"  | `product.md` goals, tiers, product-wide conventions |
| Project       | `<project>` (`<type>`)      | anything resolved per registry project              |
| Platform      | `<project>` · `<platform>`  | screens, components, per-platform behaviour         |
| Unit          | the flow or entity, by name | a decision local to one doc                         |

Two rules that follow:

- **Product-wide is a scope, not the absence of one.** Say "across the whole
  product" explicitly. Silence reads as "the thing we were just discussing".
- **A cross-project question names every project it binds.** An inter-service
  contract question that names only one side will be answered for that side.

Do this in a single-project workspace too. It costs a few words, and the
transcript is what a later `/vwf-recall` — or a reader of the mempalace
`decisions` drawer — has to reconstruct the decision from.

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
