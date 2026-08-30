# Decisions — where the generalization plan stops and stackgen's Wave C starts

**Date** 2026-08-26 · **Branch** `main` (worked in place, per the WS4 decision)
· **Plans** `docs/plans/archived/2026-08-26-vwf-generalization/index.md` and
`docs/plans/2026-08-19-stackgen.md`

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`.

Taken before either plan's Stage 1 ran, because the two documents each warned
about the other and neither said who yields. The parked audit drawer
(`docs/memory/gaps/2026-08-26-stack-vocabulary-coverage-audit.md`) had asked for
exactly this: *whoever answers 1a should read this drawer first*.

## The seam was already written down, in stackgen

`plugins/stackgen/assets/taxonomy.md` states it under **The capability seam**:
capability tokens are **vwf's**, the category taxonomy is **stackgen's**, and —
the sentence that settles the argument — *minting capabilities is vwf's move*.
It then declines to mint one for `cdn` and records the hole as a vwf-side gap.

So generalization **1a.1** (classify vwf's capability tokens by kind) is not
Wave C's territory and never was. It is the vwf-side counterpart the taxonomy
was written waiting for. Same for **1a.2** (the missing-provider doctor check),
**1b** and **1c** — none of them touches a surface stackgen owns.

**The collision is 1a.3 alone**, and it is about a file, not a vocabulary.

## Ruling 1 — the generalization plan authors no backing template

Binding, not a recommendation. Both plans already leaned this way (the
generalization plan's Stage 1a recommends deferring 1a.3; its scope boundary
says a template written there is a file Wave C would convert to a pack), but
"recommended" is what gets overturned mid-sweep by a gate that wants a pin.

If 1a.3 turns out to need a document store, it becomes a **Wave C item** and the
repo **re-declares its capability** in the meantime. The generalization plan's
own reading is that `docs/memory/` plus a Qdrant index is closer to
`search-index` than to `document-datastore`, in which case the token is simply
wrong and nothing needs writing at all.

## Ruling 2 — 1a.1 restructures, and mints nothing

The kind classification (backing-service / product-foundations / project-axis)
lands now. **No missing token is added** — not `cdn`, which `taxonomy.md`
already names, and not whatever the closed category lists surface later.

Rejected: minting `cdn` now, on the grounds that it is provably real and costs
one row. Also rejected: folding the whole parked audit into 1a.1, which the
audit drawer itself argues against — auditing against the post-wave surface
before the waves exist audits an intention.

**What this buys the parked audit**: it inherits a settled shape and shrinks to
adding rows, rather than restructuring and populating in one pass against a
surface half of which does not exist. The audit keeps a real job; it just stops
being a taxonomy decision.

## What this does not decide

The three Stage 1 questions themselves. 1a.1's *answer* (does the vocabulary get
split, and into which kinds), 1a.2, 1b and 1c are still to be walked with the
user one at a time. This drawer only fixes the **boundary** — which plan owns
each, and that no file lands on the wrong side of it.

Wave A/B/C/D are likewise still unstarted and each still needs its own explicit
go-ahead, per the stackgen plan's Execution gates row.
