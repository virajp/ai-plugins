---
type: vwf-integration
title: Integration & Flows
description: Cross-entity flows and inter-service contracts for the example
  shop.
status: reviewed
---

# Integration & Flows

## Flows

### Order cancellation & refund

- Trigger: a customer or staff member cancels an [Order](./order.md) in `paid`.
- Steps (entity/service each touches):
  1. The service validates the order is cancellable ([Order](./order.md):
     `paid`, before fulfilment) and moves it to `cancelled`.
  2. The worker requests the refund from the payment provider and records the
     outcome on the [Order](./order.md).
  3. The [Customer](./customer.md) is notified of the refund result.
- Consistency boundary (atomic vs eventual): the state move to `cancelled` is
  atomic; the refund and notification are eventual.
- Failure handling (compensation / rollback): a failed refund never reverts the
  cancellation — the order stays `cancelled` with the refund marked failed for
  staff retry; the customer is told the refund is delayed, not silently dropped.
- Idempotency: cancelling an already-`cancelled` order is a no-op; the refund
  request carries the order id as its idempotency key, so a retry never
  double-refunds.
- Diagram:
  ```mermaid
  sequenceDiagram
      participant C as Customer
      participant S as Service
      participant O as Order
      participant W as Worker
      participant P as Payment provider
      C->>S: "cancel order"
      S->>O: "validate cancellable (paid, before fulfilment)"
      O-->>S: "state → cancelled (atomic)"
      S->>W: "request refund (order id as idempotency key)"
      alt "refund succeeds"
          W->>P: "refund full amount"
          P-->>W: "confirmed"
          W->>O: "record refund outcome"
          W->>C: "cancellation notice"
      else "provider unavailable"
          W->>O: "mark refund failed/pending (order stays cancelled)"
          W->>C: "refund delayed notice"
      end
  ```
- Acceptance:
  - Given a `paid` order before fulfilment, when its owner cancels it, then the
    order reads `cancelled`, the payment provider records exactly one refund for
    its full amount, and the customer receives a cancellation notice.
  - Given the payment provider is unavailable, when the owner cancels a `paid`
    order, then the order still reads `cancelled`, the refund is visibly marked
    failed/pending for staff, and no second refund is issued when the retry
    later succeeds.

## Inter-Service Contracts

### Events

| Event             | Payload contract                   | Producer | Consumers | Delivery semantics |
| ----------------- | ---------------------------------- | -------- | --------- | ------------------ |
| `order.fulfilled` | order id, line items, fulfilled-at | service  | worker    | at-least-once      |

### Synchronous calls

| Caller → Callee           | Contract                             | Timeout / Retry          | Failure behavior                               |
| ------------------------- | ------------------------------------ | ------------------------ | ---------------------------------------------- |
| worker → payment provider | refund(order id, amount), idempotent | 10s / retry with backoff | refund marked failed on the order; staff retry |

## Consistency Boundaries

- Order state transitions are strongly consistent (single system of record).
- Refunds and customer notifications are eventually consistent — observable as
  pending on the order until confirmed.
