# Density — the contract is read by machines

A blueprint doc's audience is `plan`, `execute`, and their subagents. Every line
is re-read on every later turn of whatever loaded it, so length is not free: a
600-line flow doc costs the same attention whether or not the extra 450 lines
carry a decision.

The completeness bars ask *"is this decided?"* and can only ever ask for more.
This reference is the counter-pressure: **a doc that specifies its contract in
fewer lines is better, and one that is long without deciding more is wrong.**
Both directions are reviewer failures.

## The test

For every line, ask: **would `plan` or `execute` do something different if this
line were deleted?**

- **Yes** → it is contract. Keep it.
- **No** → it is commentary. Delete it.

Rationale, history, emphasis, and restatement all fail this test. So does a
sentence explaining a table that is already unambiguous.

## Budgets

Soft ceilings per doc, at `status: reviewed`. Not line-counting for its own sake
— a doc over budget is *almost always* over because of the anti-patterns below,
so the number is a trigger to look, not an automatic failure.

| Doc                  | Budget              | Hard smell       |
| -------------------- | ------------------- | ---------------- |
| flow `index.md`      | 120 lines           | > 200            |
| flow `<platform>.md` | 100 lines           | > 160            |
| entity `index.md`    | 120 lines           | > 200            |
| `product.md`         | 120 lines           | > 200            |
| `conventions.md`     | 60 lines per anchor | > 100 per anchor |
| `architecture.md`    | 100 lines           | > 160            |

A doc genuinely over budget with every line passing the test is fine — say so in
the review and move on. A doc over budget because nobody trimmed it is a gap.

## Anti-patterns

Each of these was measured in a real bundle; the line counts are what they cost
there.

**Rationale in the contract.** "…so the screen shows its correct gated form from
the first frame." The contract is *that* it renders gated; why is a decision
record, and belongs in mempalace room `decisions`.

**Revision narration.** "`subscriber` was renamed to `premium`", "removed
entirely", "reverses the prior model". Git records this. A blueprint states what
**is**, never what it used to be. No exceptions — not even in a blockquote.

**Restating a link's target.** Name the entity and link it; do not summarize
what the linked doc says. The reader can follow the edge, and a summary is a
second copy that will drift.

**Emphasis as a substitute for structure.** When every third phrase is bold,
nothing is emphasized. If a step needs five bolded caveats, it is really five
steps, or a table.

**Prose where a table was meant.** Any "X applies to A but not B" comparison is
a table with one column per case and `yes` / `no` / a limit in each cell —
feature tiers, per-actor permissions, per-platform differences. Prose
comparisons are both longer and harder to diff.

**Sentence-length diagram labels.** A mermaid edge label is a term
(`cancellation webhook`), not a clause. The diagram is a *view* of the steps or
the lifecycle table — if a label carries a condition the table does not, the
table is what is incomplete.

**Open Questions as a parking lot.** Open Questions holds what blocks *this*
doc's contract. Anything else is out-of-scope and goes to mempalace room `gaps`
per the parked-scope rule in `<%= it.root %>/assets/elicitation.md` — not
into a contract doc that every later run must read past.

**Spillover with a cross-reference back.** Splitting one decision across two
sections and linking between them costs more than stating it once in the section
that owns it. Put it where it belongs; do not narrate the split.

## What is never trimmed

Density is not an excuse to drop contract. These stay at any length:

- an acceptance criterion, or a failure/compensation path
- a lifecycle transition, an invariant, or a concurrency rule
- an authorization row, or an audit-recorded marker
- an `UNRESOLVED:` marker — an unfilled decision is reported, never silently cut

Cutting one of these to hit a budget is a worse failure than the budget.
