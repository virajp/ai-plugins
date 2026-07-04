---
type: vwf-entity
title: Customer
description: A person who can place orders — the account an Order belongs to.
status: reviewed
tags: [ identity, commerce ]
---

# Entity: Customer

<!-- Conformance example (blueprint-format 3). See order.md for the bundle note. -->

## Purpose

A Customer is the account that places and owns orders. It holds the minimal
identity and contact detail needed to attribute purchases and communicate about
them.

Serves: [Reliable ordering](./product.md#goal-reliable-ordering)

## Out of Scope

- Authentication credentials and sessions (an Auth concern).
- Marketing preferences and segmentation.

## Actors & Actions

| Actor    | Action         | Precondition     | Authorization        | Outcome (observable)         |
| -------- | -------------- | ---------------- | -------------------- | ---------------------------- |
| Customer | Register       | Email not in use | Anonymous            | Customer created in `active` |
| Customer | Update profile | Account active   | Owner of the account | Profile fields updated       |
| Staff    | Deactivate     | Account active   | Role `support`       | Customer moves to `disabled` |

## Lifecycle / State Machine

| From       | To         | Trigger         | Guard        | Side effect            |
| ---------- | ---------- | --------------- | ------------ | ---------------------- |
| —          | `active`   | Register        | Email unique | Send welcome message   |
| `active`   | `disabled` | Staff disable   | —            | Revoke active sessions |
| `disabled` | `active`   | Staff re-enable | —            | —                      |

## Invariants

- `email` is unique across all non-deleted customers.
- A `disabled` customer cannot place new orders, but existing orders remain.

<!-- ───────────── above = product intent (stable) ───────────── -->
<!-- ───────────── below = engineering detail (volatile) ───────────── -->

## Data Model → api

| Field        | Type      | Optional | Default   | Validation / Format             |
| ------------ | --------- | -------- | --------- | ------------------------------- |
| `id`         | string    | no       | generated | See [ids](./conventions.md#ids) |
| `email`      | string    | no       | —         | RFC 5322; unique; lowercased    |
| `name`       | string    | no       | —         | 1–120 chars                     |
| `status`     | enum      | no       | `active`  | one of: `active`, `disabled`    |
| `created_at` | timestamp | no       | generated | UTC                             |

## Relationships

| Related entity      | Cardinality | Ownership | On delete | Required |
| ------------------- | ----------- | --------- | --------- | -------- |
| [Order](./order.md) | 1–N         | reference | restrict  | no       |

<!-- 1 Customer is referenced by N Orders. restrict mirrors Order's side of the
     relation: a customer with orders cannot be hard-deleted. -->

## Concurrency & Consistency

- Concurrent-write resolution: last-write-wins on profile fields; `email`
  uniqueness enforced atomically at write.
- Uniqueness under races: `email` uniqueness holds even for simultaneous
  registrations (one wins, the other gets a `conflict`).
- Idempotency: `Register` is idempotent per email (a repeat returns the existing
  account rather than creating a duplicate).

## API Surface → api

| Method | Path            | Auth (role) | Request        | Response | Errors                    | Idempotent |
| ------ | --------------- | ----------- | -------------- | -------- | ------------------------- | ---------- |
| POST   | /customers      | Anonymous   | email, name    | Customer | `validation`, `conflict`  | yes        |
| GET    | /customers/{id} | Owner/staff | —              | Customer | `not_found`, `forbidden`  | yes        |
| PATCH  | /customers/{id} | Owner       | profile fields | Customer | `validation`, `forbidden` | no         |

<!-- Error envelope: [errors](./conventions.md#errors). Auth: [auth](./conventions.md#auth). -->

## References

- [auth](./conventions.md#auth), [errors](./conventions.md#errors),
  [ids](./conventions.md#ids)

## Open Questions

- [ ] Merge flow for duplicate accounts — deferred. (2026-07-01)
