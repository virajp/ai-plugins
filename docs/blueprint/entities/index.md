---
type: vwf-entities
title: Entities
description: Catalog of the product's entities and the product-wide
  entity-relationship view.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Entities

<!-- Deliberately thin: a catalog plus ONE product-wide erDiagram. The diagram
     is a VIEW of the union of every entity's Relationships table (which stays
     authoritative) — same nodes and edges, nothing more. The coherence
     reviewer checks the two stay in sync. -->

## Entity catalog

| Entity                          | Purpose (one line) |
| ------------------------------- | ------------------ |
| [<Entity>](./<entity>/index.md) |                    |

## Relationship view

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
```
