# Decisions — the product doc re-derived from repo evidence

**Date** 2026-09-03 · **Branch** `product-rederive` (from `develop`) · Records
only what `docs/blueprint/product.md` does not state verbatim.

## The mode was chosen against the skill's own default

`/vwf:product` was invoked with "reverse generate product doc from repo" against
a doc that already existed and was complete. Three readings were offered —
audit-and-reconcile (recommended), re-derive-from-scratch, fill-gaps-only. The
user took **re-derive from scratch**, explicitly overriding the recommendation.

The derivation was then run cold against repo evidence only (readme, registry,
config, CI, the plugin trees, `docs/how-to/`), and diffed against the existing
doc rather than replacing it — which is what kept the elicited 2026-08-23
content intact where the evidence agreed with it.

**The result is the finding worth keeping: the doc held.** The problem framing,
all eight goals with their metrics, three of four personas and four of five
non-goals reproduced from repo evidence alone. A from-scratch pass is a strong
test of a doc's honesty and this one passed it — do not read the five changes
below as the doc having been wrong.

## What the re-derivation actually caught

All five are things the repo had moved past, not framing errors:

- **A delivered slice still ranked as pending.** "Consolidation of the optional
  parts" was rank 4; the marketplace carries exactly two plugins. Retired.
- **The blocking slice was unlisted.** Coverage reads `partial`, which
  hard-halts planning — so the old rank 2 (one change through plan → execute)
  could not start at all. The sweep became rank 1.
- **A tested assumption still marked untested.** See below.
- **`docs/how-to/operate/` served no persona.** Three guides for steady-state
  operation; all three personas described getting *in*. Added a fourth.
- **The memory layer had no goal.** mempalace, `docs/memory/`, handoff, recall
  and the auto-save hooks are a large share of vwf; Problem bullet 2 names the
  failure they prevent and nothing measured it.

## The risk row was booked as a failure, deliberately

The contract-format assumption could have been marked `validated` — three flows
are written and certified. It was marked **`invalidated`** instead, with a
successor row for the revised rule.

The reasoning, chosen over the simpler reading: the format did not survive its
first contact. The 2026-08-27 sweep found the literal reading demanded 102 flows
against a repo whose densest doc is ~600 lines. What followed was a **format
change** (vwf 19.2.0), not a successful test. Booking a format change as
validation would hide that the original assumption was wrong, and the successor
— that the revised granularity rule holds across all 25 flows — is genuinely
untested with 22 flows unwritten.

## The ninth goal measures the mechanism, not the outcome

Two framings were offered for the memory goal: "a decision is made once"
(machine-checkable — runs that filed their decisions) and "work outlives the
session" (truer to experience, needs judgment to read). The mechanism framing
won, consistent with the 2026-08-23 preference for metrics something already
running can read. The outcome framing remains the better one to reach for if
this metric ever reads 100% while sessions still re-litigate.

## Pre-existing defects the reviewer caught, in goals nobody touched

Round 1 returned three gaps, **all in unchanged goals** and all the same one:
`Measured via:` must be exactly one structured form, and three counter forms had
explanatory prose appended naming a second counter. Fixed by moving the ratio
explanation onto the `Metric:` line, meaning preserved verbatim.

Worth knowing: these shipped past the reviewer on 2026-08-23's create-mode run.
The reviewer is stricter now, or was luckier then — either way a re-run over an
approved doc is not a formality, and the next one should expect to find
something similar. See [[vwf-blueprint-direction]].

## Coverage after the run

Nine goals, six served by the three written flows. `#goal-consistent-toolkit`,
`#goal-unconditional-quality-gates` and the new `#goal-decisions-persist` are
served by none — expected with 22 of 25 flows unwritten, which is rank 1's job.
No dangling anchors: no goal was retired, so nothing needed reconciling.
