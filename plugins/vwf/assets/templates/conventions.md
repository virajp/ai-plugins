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
     docs/blueprint/registry.yaml: record the decision here as the canonical
     contract; the registry holds the one-line selection. Include only the
     concerns the system actually has; omit the rest.

     DENSITY: budget ~60 lines PER ANCHOR. This file is loaded whole every time
     any doc links one of its anchors, so it is the most expensive doc in the
     bundle to let grow — in a measured real bundle it reached 1,574 lines.
     An anchor states the DECISION and the rule that follows from it; it is not
     a tutorial, a rationale, or a code sample. If an anchor needs more than a
     screen, the decision underneath it is really several — split it into
     sibling anchors that docs can link individually, so a doc referencing one
     rule does not drag in twenty.

     `#integrations` is the ONE anchor that names external services by product
     name (see assets/capability-vocabulary.md) — it is the reason every other
     doc can say "the payment provider" and stay true when the provider
     changes. -->

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

<!-- The foundation anchors below exist only when the registry's cross_cutting
     block accepted that foundation (product-foundations skill) — omit the
     rest. Each holds the canonical contract per its skill reference. -->

## Audit {#audit}

## Notifications {#notifications}

## Background processes {#background}

## Rate limiting {#rate-limiting}

## Data retention {#data-retention}

## Release & changelog {#changelog}

## Reliability targets {#reliability}

## Disaster recovery {#disaster-recovery}

## Cost {#cost}

## Engineering baseline {#baseline}

<!-- Seeded by `blueprint` on first touch from the vwf engineering-baseline
     asset: the 15 default technical rules (write-versioning, atomic
     multi-write, server time, soft delete, boundary validation,
     business/technical separation incl. attached resources, idempotency keys,
     error envelope, cursor pagination, retry discipline, tolerant reader,
     stateless processes, graceful shutdown, structured logs no-PII via OTel,
     integer money) as canonical contract lines, each with its baseline/<rule>
     id. Omit any rule a product-wide enforcement.rules waiver covers. Docs and
     cycles follow these by default; only exceptions are documented — on the
     deviating doc AND as a scoped waiver. -->

## Delivery pipeline {#pipeline}

<!-- Seeded by `blueprint` on first touch from the vwf delivery-pipeline asset:
     the canonical environment table (development / staging / production, with
     synonyms normalized) and the pipeline rules (mise-built CI, tag-triggered
     deploys — stage-* → staging from develop, prod-* → production from main,
     branch-validated — and staging-is-not-a-release), each with its
     pipeline/<rule> id. The github-actions plugin generates conforming
     workflows from this anchor. -->

## Shared patterns {#patterns}

<!-- Workspace repos (registry declares a `packages` common project): seed the
     placement rules here as canonical contract lines, unless an
     `enforcement.rules` waiver in `.config/vwf.yaml` covers one —
     1. All shared schemas live in the common package (under its schema export
        subpaths); no other project defines a shared data schema.
     2. All third-party integrations go through the common package's
        wrappers/layers; no other project imports a third-party SDK directly
        (client-side sign-in is the one allowed exception). Name the providers
        under #integrations, not here.
     Entity docs link these anchors; the execute reviewers enforce them. -->
