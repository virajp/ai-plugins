# Gaps — the stack-vocabulary coverage audit, parked

**Date** 2026-08-26 · **Branch** `main` · **Tag** `stackgen/parked`

Mirrors the mempalace drawer (wing `ai-plugins`, room `gaps`); both stores
written together, per `plugins/vwf/assets/memory.md`.

Filed while archiving
[the stackgen depth plan](../../plans/archived/2026-08-19-stackgen-depth.md),
whose Backlog section is the only place this had been recorded. Archiving that
doc would have buried it, so it is lifted here before the doc leaves the active
set.

## What was raised

Audit vwf's `plugins/vwf/assets/stack-vocabulary.md` against everything stackgen
can express once the merge waves land — kinds, packs, `language_facts`, the
materialized escape, and the retired language-plugin contract — so the
vocabulary's fact shape and axis definitions cover the full generated + pack
surface with no orphaned concepts left over from the plugin era.

Explicitly included when it was raised (2026-08-19): **the capability-vocabulary
gaps stackgen's taxonomy exposes**. `cdn` has no capability token today, and the
closed category lists in `plugins/stackgen/assets/taxonomy.md` will surface
more.

## Why it is parked

It is scheduled **after the merge waves** — Phase 5 (waves A–D) of
[the stackgen plan](../../plans/2026-08-19-stackgen.md), none of which has
started. Auditing the vocabulary against a surface that does not exist yet would
audit an intention. Verified on 2026-08-26: vwf's one dependency is still
`devtools` rather than `stackgen` (wave A), `plugins/stackgen/stacks/` holds
only a readme (wave C), and the marketplace still carries 15 plugins rather than
2 (wave D).

## Which pass it belongs to

Phase 5 of the stackgen plan, as the audit that closes it — not a pass of its
own.

## The overlap worth knowing

Its capability-vocabulary half **collides with decision 1a** of
[the generalization plan](../../plans/archived/2026-08-26-vwf-generalization/index.md),
which asks whether the capability vocabulary needs splitting by kind (a token
naming a backing service, versus a product-foundations concern, versus a
project-axis fact). That decision is being taken *now*, well before the merge
waves.

So the two must not be answered independently. If 1a restructures the
vocabulary, this audit inherits the new shape and shrinks to the
stackgen-surface half; if 1a defers, the missing tokens (`cdn`, and whatever
else the category lists surface) are this audit's to find. **Whoever answers 1a
should read this drawer first.**

## Resolved 2026-08-26 — the first branch, both halves

Settled before either plan's Stage 1 ran; full reasoning in
[the boundary decision](../decisions/2026-08-26-generalization-vs-stackgen-wave-c-boundary.md).

**1a.1 restructures and mints nothing.** The kind classification
(backing-service / product-foundations / project-axis) lands in the
generalization plan; no missing token is added there, `cdn` included. So this
audit **inherits the new shape** — and keeps the missing-token half anyway,
which the paragraph above had treated as an either/or. It shrinks to *adding
rows to a settled structure*, not restructuring and populating at once.

The seam that decided it was already written, in
`plugins/stackgen/assets/taxonomy.md` under *The capability seam*: capability
tokens are vwf's, categories are stackgen's, *minting capabilities is vwf's
move*. This audit's remaining job is the stackgen-surface sweep plus those rows;
it is no longer a taxonomy decision. Still Phase 5, still after the waves.
</content>
