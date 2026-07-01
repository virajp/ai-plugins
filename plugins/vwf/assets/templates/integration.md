---
type: vwf-integration
title: Integration & Flows
description: System-level cross-entity flows and inter-service contracts.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Integration & Flows

<!-- System-level cross-entity contracts. Per-entity relationships live in each
     entity doc; this file holds multi-entity flows, inter-service contracts,
     and consistency boundaries. See the blueprint-authoring skill
     (integration-and-flows). Code-independent: name what integrates and with
     what guarantees, never the queue/library/transport. Promote to
     docs/blueprint/flows/ when this grows past a handful of flows.
     Name each entity/service a flow touches as a markdown link to its blueprint
     doc (the OKF edge), e.g. [Order](./order.md) — so the flow graph resolves. -->

## Flows

### <flow name>

- Trigger:
- Steps (entity/service each touches):
- Consistency boundary (atomic vs eventual):
- Failure handling (compensation / rollback):
- Idempotency:

## Inter-Service Contracts

### Events

| Event | Payload contract | Producer | Consumers | Delivery semantics |
| ----- | ---------------- | -------- | --------- | ------------------ |

### Synchronous calls

| Caller → Callee | Contract | Timeout / Retry | Failure behavior |
| --------------- | -------- | --------------- | ---------------- |

## Consistency Boundaries

- What is strongly consistent vs eventually consistent, system-wide.
