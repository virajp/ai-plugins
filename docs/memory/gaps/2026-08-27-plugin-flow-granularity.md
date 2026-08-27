# Gaps — the plugin flow contract does not scale to a fifteen-plugin project

**Date** 2026-08-27 · **Branch** `main` · **Tag** `ws2/found`

Mirrors the mempalace drawer (wing `ai-plugins`, room `gaps`); both stores
written together, per `plugins/vwf/assets/memory.md`.

Found at the start of the `/vwf:blueprint` full-product sweep — the run WS2
exists to perform, and the first one to test the blueprint format against a
plugin product.

## The finding

`plugins/vwf/skills/blueprint-authoring/references/plugin-contract.md` states:

> Its flows are its **extension points** — one flow per skill, command, hook or
> equivalent registration, named for what it does.

This repo's registry declares **one** project, `plugins`, covering all fifteen
plugins. The literal reading therefore asks for:

| Kind      | Count         |
| --------- | ------------- |
| skills    | 82            |
| agents    | 18            |
| hooks     | 2             |
| **total** | **102 flows** |

At the surveyor's 120-line budget per flow `index.md`, that is on the order of
**12,000 lines** — against a repo whose `CLAUDE.md`, the densest doc it has, is
roughly 600.

## Why it is a format finding and not just a big repo

Three things make it structural rather than incidental:

- **The contract has no granularity dial.** It says one flow per extension
  point, full stop. There is no provision for a project holding many
  independently-shipped extensions, and no guidance on when a coarser unit is
  correct.
- **`doc_unit: module` does not help.** It governs whether `schema.yaml` may be
  `N/A`, not how finely flows are cut. The two decisions look adjacent and are
  unrelated.
- **The registry cannot express it either.** One directory of fifteen shippable
  plugins is one project by every rule vwf has — they share a path, a manifest
  format and a release cadence. Splitting them into fifteen registry projects
  would be a worse lie, and would triplicate nothing usefully.

## The second mismatch, found alongside

**`product.md`'s slice priority does not decompose into flows.** Its four ranked
slices are *work to do on the repo* — a local verification task, one change
through plan→execute, post-release install verification, the consolidation waves
— not journeys through the product. So the goals-to-flows spine the sweep is
built on has nothing to bite on here: the goals are about the workflow operating
correctly, while the flows are its extension points.

This is likely the more interesting half. A product whose users are *its own
maintainers* describes its goals in terms of its own operation, and the format
assumes goals describe user journeys.

## A third mismatch: the engineering baseline assumes a networked service

`conventions.md` was absent, so the sweep reached its first touch, which seeds
the **15 engineering-baseline rules**. Roughly ten of them have **no referent in
this product**, which has no datastore, no published API, no worker, no money,
no PII and no process that outlives a command:

| Rule                                                                   | Here                                        |
| ---------------------------------------------------------------------- | ------------------------------------------- |
| `write-versioning`, `atomic-multi-write`, `server-time`, `soft-delete` | nothing is stored                           |
| `idempotency-keys`, `error-envelope`, `cursor-pagination`              | no API is published                         |
| `graceful-shutdown`, `structured-logs-no-pii`                          | a one-shot command with no logging pipeline |
| `integer-money`                                                        | no money                                    |

Five do apply, and two of those are load-bearing: `boundary-validation` (the
flag surface — and the one rule that may never be waived product-wide),
`business-technical-separation`, `tolerant-reader` (the legacy-receipt reader
genuinely is one), `retry-discipline`, and `stateless-processes` (trivially, but
truly).

**The vocabulary gap: there is no way to say "inapplicable".** The asset offers
exactly one escape — an `enforcement.rules` waiver, which means *a deliberate
deviation from a rule that applies*. Recording ten waivers here would assert
this product decided to depart from rules it has no surface for, which is a
different and false claim. Seeding all fifteen regardless states contracts that
are vacuously true and cost a reader time on every visit.

Neither option is right, and that is the finding: the baseline needs a third
state — **inapplicable, with the reason** — distinct from *enforced* and from
*waived*.

## Worked around, not fixed

Per the plan's log-don't-fix rule the sweep did not author a contract change.
The scope taken instead: **flows for `vwf` + `stackgen` only** — what the
two-plugin north star keeps — with the other thirteen represented by an explicit
`N/A` reading *pending migration*, per
[the no-skill-lost decision](../decisions/2026-08-27-no-skill-lost-in-the-merge-waves.md).

That still leaves roughly **48 flows**, which is a large sweep but not a
throwaway one.

## Measured cost — the evidence that settled it

One flow was authored end-to-end (`flows/plugins/010-vwf-setup`) before the
sweep was paused, specifically to replace the estimate with a number:

| Stage                | Tokens   | Wall clock |
| -------------------- | -------- | ---------- |
| `flow-writer`        | 104k     | 4m 39s     |
| `blueprint-reviewer` | 66k      | 2m 13s     |
| **one round**        | **170k** | **~7 min** |

The reviewer returned **six gaps**, so at least one fix round follows: call it
**~250k tokens and ~10 minutes per flow**, and that is for a flow whose contract
was already written down in a `SKILL.md` — the cheapest case this product has.

Across the 48-flow scope: **~12M tokens and ~8 hours.** The session in which
this was measured had ~14.9M remaining, so a single sweep would consume nearly
all of it and still not finish.

**This converts the finding from a judgment call into arithmetic.**
Per-extension-point granularity is not merely verbose at this repo's scale — it
is unaffordable, and a contract whose only conformant reading cannot be executed
is a contract that needs changing. The sweep was **paused** here rather than
worked around, on the reasoning that authoring 48 flows against a format known
not to fit would produce expensive artifacts nobody should trust.

## What the first flow taught about the contract itself

The six gaps split three and three, and both halves are informative.

**Three were defects in how the flow was commissioned**, not in the flow:

- **Code-independence was applied too strictly, and the plugin contract says
  so.** `plugin-contract.md` *requires* naming the host's extension mechanism
  ("the mechanism is named in the host's own vocabulary"), because skill,
  command and hook supply different inputs — so the choice is load-bearing. A
  blanket "name no technology" instruction makes the required section
  unwritable. **The two rules genuinely conflict at this one point**, and the
  plugin contract wins; that is worth stating explicitly somewhere, because the
  obvious reading of the code-independence rule forbids it.
- Real product names still leaked through anyway ("git flow", "gitignored", "the
  main checkout"), which suggests the prose nouns for version control are
  missing from `capability-vocabulary.md`'s mapping table.
- A configuration **key spelling** reached the doc, which the plugin contract
  classes as realization.

**Three were genuine contract holes** the reviewer was right to catch: steps
carrying no actors and no resolving links; two declared non-halting degradations
with no acceptance criteria; and a two-way fork stated without saying what
differs between the branches.

**The link finding compounds the scale problem.** A flow's steps must link to
the sibling flows they delegate to — and this one delegates to at least three.
With 48 flows the cross-link graph is dense, so flows cannot be authored
independently: each early flow accrues `target not yet authored` gaps that only
close once the later ones exist. The sweep is therefore not 48 independent units
but one large interdependent graph, which the per-flow cost above does not
capture.

## What would close it

A vwf-side decision on **plugin flow granularity** — whether a plugin project
may cut flows per *plugin* rather than per extension point, and if so what the
condition is. It is a `plugin-contract.md` change and probably a
`blueprint-surveyor` rule 5 change, with no format bump if coverage semantics do
not move.

Worth deciding **before** the merge waves rather than after: Wave D collapses
fifteen plugins into two, which changes the count from 102 to about 48 without
resolving whether 48 is the right cut either.
