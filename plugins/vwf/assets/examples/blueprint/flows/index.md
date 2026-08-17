---
type: vwf-integration
title: Flows & Cross-Flow Contracts
description: Catalog of the example shop's flows plus the inter-service
  contracts
  and consistency boundaries no single flow owns.
status: reviewed
---

# Flows & Cross-Flow Contracts

<!-- Conformance example (blueprint-format 22). Deliberately thin: per-flow
     contracts live in flows/<project>/<NNN>-<flow>/index.md with each
     platform's screens in a sibling <platform>.md — this file holds only the
     catalog and what is cross-flow by nature. One section per project, no
     device headings (format 15). -->

## Flow catalog

### web

| #   | Flow                                                            | Platforms | Serves goal                                               | Entities touched                                                               | Status   |
| --- | --------------------------------------------------------------- | --------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| 100 | [Home](./web/100-home/index.md)                                 | webapp    | [Reliable ordering](../product.md#goal-reliable-ordering) | [Order](../entities/order/index.md)                                            | reviewed |
| 110 | [Place order](./web/110-place-order/index.md)                   | webapp    | [Reliable ordering](../product.md#goal-reliable-ordering) | [Order](../entities/order/index.md), [Customer](../entities/customer/index.md) | reviewed |
| 120 | [Order cancellation & refund](./web/120-cancel-refund/index.md) | webapp    | [Trusted refunds](../product.md#goal-trusted-refunds)     | [Order](../entities/order/index.md), [Customer](../entities/customer/index.md) | reviewed |

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
