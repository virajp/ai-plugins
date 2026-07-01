---
type: vwf-entity
title: Order
description: A customer's completed purchase — one row per placed order.
status: reviewed
tags: [ sales, commerce ]
# optional timestamp/owner/resource omitted — in-repo, git tracks edit time
---

# Entity: Order

<!-- Conformance example (blueprint-format 2). A worked, format-valid entity doc:
     mandatory frontmatter, Relationships/References/Screens as resolving links.
     This bundle omits architecture.md for brevity, so the "→ <project>" section
     targets (api, web) are illustrative registry names, not live links. -->

## Purpose

An Order records a customer's intent to buy a set of items at agreed prices, and
tracks that purchase from placement through fulfilment. It is the system of
record for what was bought, by whom, and for how much.

## Out of Scope

- Payment instrument storage (a Payments concern, not Order).
- Inventory reservation (owned by the Catalog entity).
- Shipping carrier tracking beyond the terminal `fulfilled` transition.

## Actors & Actions

| Actor    | Action       | Precondition             | Authorization      | Outcome (observable)       |
| -------- | ------------ | ------------------------ | ------------------ | -------------------------- |
| Customer | Place order  | Cart non-empty           | Owner of the cart  | Order created in `placed`  |
| Customer | Cancel order | Order in `placed`/`paid` | Owner of the order | Order moves to `cancelled` |
| System   | Mark paid    | Payment authorized       | Service role       | Order moves to `paid`      |
| Staff    | Fulfil order | Order in `paid`          | Role `fulfilment`  | Order moves to `fulfilled` |

## Lifecycle / State Machine

| From     | To          | Trigger               | Guard                      | Side effect                  |
| -------- | ----------- | --------------------- | -------------------------- | ---------------------------- |
| —        | `placed`    | Customer places       | Cart non-empty             | Snapshot line items + prices |
| `placed` | `paid`      | Payment authorized    | Amount matches order total | Record paid timestamp        |
| `placed` | `cancelled` | Customer/staff cancel | —                          | Release any soft holds       |
| `paid`   | `fulfilled` | Staff fulfil          | All items in stock         | Emit `order.fulfilled` event |
| `paid`   | `cancelled` | Customer/staff cancel | Before fulfilment          | Trigger refund flow          |

## Invariants

- An order's `total_amount` equals the sum of its line-item subtotals at
  placement time, and never changes after `placed`.
- Every non-initial state is reachable only via a listed transition.
- A `cancelled` order is terminal; no transition leaves it.

<!-- ───────────── above = product intent (stable) ───────────── -->
<!-- ───────────── below = engineering detail (volatile) ───────────── -->

## Data Model → api

| Field          | Type            | Optional | Default   | Validation / Format                                |
| -------------- | --------------- | -------- | --------- | -------------------------------------------------- |
| `id`           | string          | no       | generated | See [ids](./conventions.md#ids)                    |
| `customer_id`  | string          | no       | —         | FK to [Customer](./customer.md)                    |
| `status`       | enum            | no       | `placed`  | one of: `placed`, `paid`, `fulfilled`, `cancelled` |
| `total_amount` | integer (minor) | no       | —         | ≥ 0, in the currency's smallest unit               |
| `currency`     | enum            | no       | —         | ISO 4217: one of `USD`, `EUR`, `GBP`               |
| `placed_at`    | timestamp       | no       | generated | UTC                                                |
| `paid_at`      | timestamp       | yes      | null      | UTC; set on transition to `paid`                   |

## Relationships

| Related entity            | Cardinality | Ownership | On delete | Required |
| ------------------------- | ----------- | --------- | --------- | -------- |
| [Customer](./customer.md) | N–1         | reference | restrict  | yes      |

<!-- N Orders reference 1 Customer. Reference (not composition): an Order is not a
     child of Customer. restrict: a Customer with orders cannot be hard-deleted. -->

## Concurrency & Consistency

- Concurrent-write resolution: optimistic — a version token guards each state
  transition; a stale write returns a conflict error.
- Uniqueness under races: `id` is unique; no two placements share it.
- Idempotency: `Mark paid` is idempotent per payment reference (re-delivery of
  the same authorization is a no-op).

## API Surface → api

| Method | Path                | Auth (role)   | Request  | Response | Errors                   | Idempotent |
| ------ | ------------------- | ------------- | -------- | -------- | ------------------------ | ---------- |
| POST   | /orders             | Customer      | cart ref | Order    | `validation`, `conflict` | no         |
| GET    | /orders/{id}        | Owner / staff | —        | Order    | `not_found`, `forbidden` | yes        |
| POST   | /orders/{id}/cancel | Owner / staff | —        | Order    | `conflict`, `forbidden`  | yes        |

<!-- Error envelope: see [errors](./conventions.md#errors). Auth: see
     [auth](./conventions.md#auth). -->

## Screens → web

| Screen        | Route        | Reads (API)      | States (loading/error/empty)          | Actions          | Form validation |
| ------------- | ------------ | ---------------- | ------------------------------------- | ---------------- | --------------- |
| Order detail  | /orders/{id} | GET /orders/{id} | loading skeleton · error · —          | Cancel (confirm) | —               |
| Order history | /orders      | GET /orders      | loading · error · empty (first order) | Open detail      | —               |

<!-- Visual language (tokens, type, spacing, motion, component behavior) comes
     from [design-system](./design-system.md); record only deviations here. -->

## References

<!-- Markdown links (OKF edges), not bare text — each resolves. -->

- [auth](./conventions.md#auth), [errors](./conventions.md#errors),
  [ids](./conventions.md#ids)
- [design-system](./design-system.md) — Order has Screens

## Open Questions

- [ ] Partial fulfilment (split shipments) — deferred to a later cycle.
      (2026-07-01)
