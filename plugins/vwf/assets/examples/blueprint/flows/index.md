---
type: vwf-integration
title: Flows & Cross-Flow Contracts
description: Catalog of the example shop's flows plus the inter-service
  contracts
  and consistency boundaries no single flow owns.
status: reviewed
---

# Flows & Cross-Flow Contracts

<!-- Conformance example (blueprint-format 11). Deliberately thin: per-flow
     contracts live in flows/<project>/<device>/<NNN>-<flow>/index.md — this
     file holds only the catalog and what is cross-flow by nature. -->

## Flow catalog

### web

#### web

| #   | Flow                                                                | Serves goal                                               | Entities touched                                                               | Status   |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| 010 | [Place order](./web/web/010-place-order/index.md)                   | [Reliable ordering](../product.md#goal-reliable-ordering) | [Order](../entities/order/index.md), [Customer](../entities/customer/index.md) | reviewed |
| 020 | [Order cancellation & refund](./web/web/020-cancel-refund/index.md) | [Trusted refunds](../product.md#goal-trusted-refunds)     | [Order](../entities/order/index.md), [Customer](../entities/customer/index.md) | reviewed |

## Inter-Service Contracts

### Events

| Event             | Payload contract                   | Producer | Consumers | Delivery semantics |
| ----------------- | ---------------------------------- | -------- | --------- | ------------------ |
| `order.fulfilled` | order id, line items, fulfilled-at | api      | worker    | at-least-once      |

### Synchronous calls

| Caller → Callee           | Contract                             | Timeout / Retry          | Failure behavior                               |
| ------------------------- | ------------------------------------ | ------------------------ | ---------------------------------------------- |
| worker → payment provider | refund(order id, amount), idempotent | 10s / retry with backoff | refund marked failed on the order; staff retry |

## Consistency Boundaries

- Order state transitions are strongly consistent (single system of record).
- Refunds and customer notifications are eventually consistent — observable as
  pending on the order until confirmed.
