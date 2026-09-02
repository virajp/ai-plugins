---
type: vwf-product
title: Example Shop — Product
description: Problem, users, goals, and slice priority for the example commerce
  product.
status: reviewed
---

# Example Shop — Product

## Problem

Small independent retailers take orders over chat and spreadsheets: orders get
lost, payment status is untracked, and cancellations turn into manual refund
disputes. They need order-taking that is reliable without hiring back-office
staff. Why now: their chat-based volume doubled in a year and the error rate
grew with it.

## Target users

| Persona | Who they are                                  | Core need                                    |
| ------- | --------------------------------------------- | -------------------------------------------- |
| Shopper | A retail customer buying from a small shop    | Order and pay in one sitting, no lost orders |
| Owner   | The shop owner fulfilling and refunding daily | See every order's true state at a glance     |

## Goals & success metrics

### Reliable ordering {#goal-reliable-ordering}

- Outcome: every placed order reaches a terminal state without manual repair.
- Metric: orders needing manual state correction — target < 0.5% of orders
  within 6 months of launch.
- Measured via: store-metric share of orders whose state needed manual
  correction.
- Re-evaluate if: orders reaching a terminal state unaided below 95% by
  2027-01 → kill / pivot / re-scope.

### Trusted refunds {#goal-trusted-refunds}

- Outcome: cancellations refund promptly enough that shoppers reorder.
- Metric: median cancellation→refund time — target < 1 hour; zero
  double-refunds.
- Measured via: external payment-provider refund timestamps (vs cancellation
  events).

## Slice priority

| Rank | Slice (entity / flow)       | Serves goal                                  | Validates                                | Why now                                        |
| ---- | --------------------------- | -------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| 1    | Order                       | [Reliable ordering](#goal-reliable-ordering) | Shoppers complete payment in one sitting | The system of record everything else hangs off |
| 2    | Order cancellation & refund | [Trusted refunds](#goal-trusted-refunds)     | Owners will trust automated refunds      | The costliest manual process today             |
| 3    | Customer                    | [Reliable ordering](#goal-reliable-ordering) | —                                        | Attribution once orders are solid              |

## Non-goals

- Inventory management — owners keep their existing stock process; this product
  tracks orders, not shelves.
- Multi-shop marketplaces — one shop per deployment.

## Risks & assumptions

| Assumption                                             | Risk if wrong                         | Validation method                                                               | Status   | Evidence |
| ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------- | -------- | -------- |
| Owners will trust automated refunds over manual review | Refund flow goes unused; goal 2 dies  | slice:cancel-refund, accepted-risk — no owner pool to test refund trust cheaply | untested | —        |
| Shoppers complete payment in one sitting               | Order state machine needs a hold step | slice:order (its payment funnel metric)                                         | untested | —        |
