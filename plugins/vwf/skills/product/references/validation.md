# Validation Methods & Experiment Records

The closed vocabulary behind the `Validation method` column of `product.md`'s
Risks & assumptions table, the evidence bar per method, and the lightweight
experiment record for the appendix. Read when eliciting Risks & assumptions
(Step 3.6) or when a goal's `Measured via:` uses a `counter` form.

## The method vocabulary

Seven methods, ordered roughly cheapest-first. Anything outside this list in a
`Validation method` cell is a reviewer gap.

| Method                  | What it is                                                    | What counts as evidence                                                                     |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `interviews`            | Conversations with people matching a named persona            | How many, which persona, and the one-line takeaway — a link to notes where they exist        |
| `landing-page`          | A promise page measuring intent before anything is built      | Visitors vs sign-ups (or clicks) against a stated threshold, dated                           |
| `prototype`             | A throwaway artifact put in front of users                    | Sessions run and what users did — task completion, preference, or abandonment, one line each |
| `concierge`             | Delivering the outcome manually before automating it          | Deliveries performed and whether users came back (or paid), dated                            |
| `usage-data`            | Existing production or analytics data answering the question  | The reading itself — metric, value, date, and where it was measured                          |
| `slice:<name>`          | Build-validation: a Slice-priority slice ships and its usage answers the assumption | The slice's metric reading after release (via `/vwf:feedback`)         |
| `accepted-risk — <why>` | No validation — the risk is knowingly carried                 | The `<why>` on the row itself; nothing further is owed                                       |

`Status` moves `untested → validated | invalidated`; the `Evidence` cell is a
link or one-line source, required the moment status leaves `untested`.

**The riskiest-assumption rule.** The table's top row — the riskiest assumption
— may not use `slice:` unless marked `accepted-risk`: building is the most
expensive way to learn, so the riskiest assumption is validated by a cheaper
method first, or the build-validation risk is accepted explicitly (append
`accepted-risk — <why>` to the cell). The product-reviewer flags a violation;
it is never a halt.

## The experiment record

A recorded hypothesis with a threshold — that is the whole bar. **No A/B
infrastructure is mandated**: however the metric is measured, writing the
threshold down *before* the reading arrives is what makes the result a
decision instead of a rationalization.

Records live in a `## Experiments` appendix of `product.md` (create on first
use — a log, like Metric readings, not part of the reviewed contract):

```markdown
## Experiments

### <experiment name>

- Hypothesis: <what we believe, falsifiably>
- Metric: <what is measured>
- Threshold: <the number that decides>
- Result: <reading, dated — `pending` until one arrives>
- Decision: <validated | invalidated → what changes now>
```

Records are **optional** — with one exception: a goal whose `Measured via:` is
a `counter` form opens one (the goal's metric and target are the Hypothesis,
Metric, and Threshold), and the first `/vwf:feedback` metric reading for that
goal closes it — filling `Result` and `Decision` in the same edit as the
Metric-readings row.
