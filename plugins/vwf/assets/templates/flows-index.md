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
     flows/<project>/<NNN>-<flow>/index.md, with each implemented platform's
     screens in a sibling <platform>.md (format 15) — this file holds only the
     catalog and what is cross-flow by nature. Per-flow content never leaks
     back here. See the blueprint-authoring skill (flow-contract). -->

## Flow catalog

<!-- One subsection per registry project — no device sub-headings (format 15:
     a flow folder covers every platform, so there is ONE number line per
     project). Rows in numeric (execution) order. The Platforms column lists
     the platform files that exist for that flow (mobile / tablet / desktop /
     web / auto), which is how the catalog shows platform coverage at a glance;
     it is empty for a non-UI project's flows.

     Numbers are DESIGNATED for standard flows (see the standard-flows asset):
     010 splash, 020 signin, 030 recover-account, 040 onboarding, 100 home,
     110–890 product flows, 910 profile, 920 settings, 930 notifications,
     940 delete-account. -->

### <project>

| #     | Flow                                             | Platforms    | Serves goal                         | Entities touched | Status |
| ----- | ------------------------------------------------ | ------------ | ----------------------------------- | ---------------- | ------ |
| <NNN> | [<flow name>](./<project>/<NNN>-<flow>/index.md) | mobile, auto | [<goal>](../product.md#goal-<slug>) | <links>          | draft  |

## Inter-Service Contracts

### Events

| Event | Payload contract | Producer | Consumers | Delivery semantics |
| ----- | ---------------- | -------- | --------- | ------------------ |

### Synchronous calls

| Caller → Callee | Contract | Timeout / Retry | Failure behavior |
| --------------- | -------- | --------------- | ---------------- |

## Consistency Boundaries

- What is strongly consistent vs eventually consistent, system-wide.
