---
type: vwf-product
title: <Product Name> — Product
description: Problem, users, success metrics, and slice priority — the outcome
  contract the blueprint serves.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# <Product Name> — Product

> **Source of truth for why the product exists and what "good" means.** Lives at
> `docs/blueprint/product.md`, authored by `/vwf:product` — the Phase −1
> foundation before `architecture`. Code- and stack-independent: no technology,
> project, or screen names — those belong to the registry and the entity docs.
> Every flow's Purpose links the goal(s) it serves (entities trace to goals
> through the flows that use them); the blueprint-reviewer flags surfaces that
> trace to no goal.

## Problem

<!-- The problem being solved, who has it, and why now. Concrete enough that a
     stranger could say whether a feature addresses it. -->

## Target users

| Persona | Who they are | Core need |
| ------- | ------------ | --------- |

## Goals & success metrics

<!-- One subsection per goal, each with a stable anchor — entity docs link
     these (`product.md#goal-<slug>`). Every metric is measurable: a number, a
     target, and where it is measured. "Users are happy" is not a metric. -->

### <Goal name> {#goal-<slug>}

- Outcome: <the user/business outcome, one line>
- Metric: <what is measured> — target <value> within <horizon>
- Measured via: <one of the four forms below>
- Re-evaluate if: <metric> below <floor> by <date> → kill / pivot / re-scope

<!-- `Measured via:` takes exactly one of the four structured forms:

       counter <flow-slug>.<outcome>     # flow completed/failed/compensated
       counter <entity>.<state>          # lifecycle-state count
       store-metric <one-line intent>    # derived from stored data
       external <source>                 # support volume, app-store, revenue tool

     A `counter` form must also be declared in the owning doc — the flow form
     beside that flow's Acceptance block, the entity form beside its Lifecycle
     table — or the coherence reviewer flags the goal as unmeasurable. -->

<!-- `Re-evaluate if:` is the goal's kill criterion — mandatory for the first
     goal, optional after. When a reading breaches the floor, /vwf:feedback
     makes the /vwf:product re-run mandatory-offered, with kill / pivot /
     re-scope as the named agenda. A killed goal KEEPS its subsection, marked
     `status: killed — <date, reading>` — never silently deleted. -->

## Tiers & entitlements

<!-- Include ONLY when the product gates capability by plan, tier, role, or
     licence — omit the whole section otherwise. This is the single source for
     "who can do what"; flows LINK here (product.md#tiers) and never restate a
     tier's rules, which is how the same matrix ends up contradicting itself in
     four flow docs.

     One column per tier, one row per gated capability. Cells are `yes` / `no` /
     a limit (`3 / month`) — never a sentence. A capability every tier has is
     not gated: leave it out. Name tiers as the product names them; pricing is
     not contract and does not belong here. -->

| Capability | Free | <Tier> | <Tier> |
| ---------- | ---- | ------ | ------ |
|            | no   | yes    | yes    |

<!-- Note below the table only what a cell cannot carry: how a tier is acquired
     or lost, and what happens to entitlements on downgrade or lapse. One line
     each. The lifecycle itself belongs to the subscription/licence entity. -->

## Slice priority

<!-- The ordered "build next" list — flows first (the primary blueprint unit),
     entities only when a data contract is itself the slice — what
     /vwf:blueprint and /vwf:plan pick up first, and why. Re-rank on each /vwf:product re-run;
     history lives in git. With three or more slices, also draw the build order
     as a small mermaid flowchart (slice names only) so the roadmap reads at a
     glance — a view of the table, which stays authoritative. `Validates` names
     the Risks & assumptions row this slice validates — `—` when it validates
     none. -->

| Rank | Slice (flow / entity) | Serves goal | Validates | Why now |
| ---- | --------------------- | ----------- | --------- | ------- |

## Non-goals

<!-- Explicit exclusions — the scope fence the minimalism checks lean on. What
     this product deliberately does not do, and (briefly) why. -->

- ...

## Risks & assumptions

<!-- Riskiest first: what must be true for the goals to be reachable, and how
     each assumption gets validated (or which slice validates it). -->

| Assumption | Risk if wrong | Validation method | Status | Evidence |
| ---------- | ------------- | ----------------- | ------ | -------- |

<!-- `Validation method` is a closed vocabulary (evidence bars per method are
     the product skill's references/validation.md):

       interviews | landing-page | prototype | concierge | usage-data |
       slice:<name> | accepted-risk — <why>

     `Status` is `untested | validated | invalidated`. `Evidence` is a link or
     one-line source, required once status leaves `untested`. Rule: the top row
     (the riskiest assumption) may not use `slice:` unless marked
     `accepted-risk` — building is the most expensive way to learn. -->
