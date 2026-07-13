---
type: vwf-integration
title: Flows & Cross-Flow Contracts
description: Catalog of the product's flows plus the inter-service contracts
  and consistency boundaries no single flow owns.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Flows & Cross-Flow Contracts

<!-- Deliberately thin. Per-flow contracts live in flows/<project>/<NNN>-<flow>/index.md — this
     file holds only the catalog and what is cross-flow by nature. Per-flow
     content never leaks back here. See the blueprint-authoring skill
     (flow-contract). -->

## Flow catalog

<!-- One subsection per registry project (the flow group folders); rows in
     numeric (execution) order — NNN is gap-numbered in steps of 10. -->

### <project>

| #     | Flow                                             | Serves goal                         | Entities touched | Status |
| ----- | ------------------------------------------------ | ----------------------------------- | ---------------- | ------ |
| <NNN> | [<flow name>](./<project>/<NNN>-<flow>/index.md) | [<goal>](../product.md#goal-<slug>) | <links>          | draft  |

## Inter-Service Contracts

### Events

| Event | Payload contract | Producer | Consumers | Delivery semantics |
| ----- | ---------------- | -------- | --------- | ------------------ |

### Synchronous calls

| Caller → Callee | Contract | Timeout / Retry | Failure behavior |
| --------------- | -------- | --------------- | ---------------- |

## Consistency Boundaries

- What is strongly consistent vs eventually consistent, system-wide.
