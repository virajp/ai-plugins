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
> Every entity's Purpose links the goal(s) it serves; the blueprint-reviewer
> flags surfaces that trace to no goal.

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
- Measured via: <analytics event / store metric / support volume / ...>

## Slice priority

<!-- The ordered "build next" list over entities/flows — what /vwf:blueprint
     and /vwf:plan pick up first, and why. Re-rank on each /vwf:product re-run;
     history lives in git. -->

| Rank | Slice (entity / flow) | Serves goal | Why now |
| ---- | --------------------- | ----------- | ------- |

## Non-goals

<!-- Explicit exclusions — the scope fence the minimalism checks lean on. What
     this product deliberately does not do, and (briefly) why. -->

- ...

## Risks & assumptions

<!-- Riskiest first: what must be true for the goals to be reachable, and how
     each assumption gets validated (or which slice validates it). -->

| Assumption | Risk if wrong | Validated by |
| ---------- | ------------- | ------------ |
