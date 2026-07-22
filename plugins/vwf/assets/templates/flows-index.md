---
type: vwf-integration
title: Flows & Cross-Flow Contracts
description: Catalog of the product's flows plus the inter-service contracts
  and consistency boundaries no single flow owns.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Flows & Cross-Flow Contracts

<!-- Deliberately thin. Per-flow contracts live in
     flows/<project>/<NNN>-<flow>/index.md — one uniform depth for UI and
     non-UI projects alike (format 14) — this file holds only the catalog and
     what is cross-flow by nature. Per-flow content never leaks back here. See
     the blueprint-authoring skill (flow-contract). -->

## Flow catalog

<!-- One subsection per registry project (the flow group folders); for a UI
     project, one sub-subsection per device type, READ FROM EACH FLOW'S device
     FRONTMATTER KEY (mobile / web / carplay / android-auto) — the path no
     longer carries it (format 14). Rows in numeric (execution) order — NNN is
     gap-numbered in steps of 10, per device, so each device heading restarts
     the number line. Drop the device heading for a non-UI project (its flows
     carry no device key). -->

### <project>

#### <device>

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
