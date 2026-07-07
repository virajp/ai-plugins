---
type: vwf-integration
title: Flows & Cross-Flow Contracts
description: Catalog of the product's flows plus the inter-service contracts
  and consistency boundaries no single flow owns.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Flows & Cross-Flow Contracts

<!-- Deliberately thin. Per-flow contracts live in flows/<flow>/index.md — this
     file holds only the catalog and what is cross-flow by nature. Per-flow
     content never leaks back here. See the blueprint-authoring skill
     (flow-contract). -->

## Flow catalog

| Flow                             | Serves goal                         | Entities touched | Status |
| -------------------------------- | ----------------------------------- | ---------------- | ------ |
| [<flow name>](./<flow>/index.md) | [<goal>](../product.md#goal-<slug>) | <links>          | draft  |

## Inter-Service Contracts

### Events

| Event | Payload contract | Producer | Consumers | Delivery semantics |
| ----- | ---------------- | -------- | --------- | ------------------ |

### Synchronous calls

| Caller → Callee | Contract | Timeout / Retry | Failure behavior |
| --------------- | -------- | --------------- | ---------------- |

## Consistency Boundaries

- What is strongly consistent vs eventually consistent, system-wide.
