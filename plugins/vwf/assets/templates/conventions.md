---
type: vwf-conventions
title: Conventions
description: Cross-cutting decisions referenced by entity docs.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Conventions

Cross-cutting decisions referenced by entity docs. Define once; entity docs link
to the relevant anchors rather than repeating.

<!-- Maintained by `blueprint`. Mirrors the `cross_cutting` block in
     docs/blueprint/architecture.md: record the decision here as the canonical
     contract; the registry holds the one-line selection. Include only the
     concerns the system actually has; omit the rest. -->

## Auth {#auth}

## Errors {#errors}

## IDs {#ids}

## Observability {#observability}

## Config {#config}

<!-- The injection *mechanism* only (the decision): how configuration and secrets
     reach each project — e.g. env vars from the deployment env, secrets from a
     secrets manager, injected at runtime/build; nothing committed. The per-project
     inventory of the variables themselves lives in environment.md — link it, do
     not list variables here. Omit environment.md (and this anchor's inventory
     pointer) if the system has no external integration or secret. -->

## API conventions {#api}

## Shared patterns {#patterns}
