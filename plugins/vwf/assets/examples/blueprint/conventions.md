---
type: vwf-conventions
title: Conventions
description: Cross-cutting decisions the Order and Customer docs link to.
status: reviewed
---

# Conventions

Cross-cutting decisions referenced by entity docs. Defined once; entity docs
link to the relevant anchors rather than repeating.

<!-- Conformance example (blueprint-format 14). Only the anchors the example
     entities reference are filled; a real conventions.md carries every
     system-wide concern the architecture registry declares. -->

## Auth {#auth}

Requests carry a bearer session token. Identity resolves to a Customer; roles
(`support`, `fulfilment`, service) are claims on the token. "Owner"
authorization means the token's customer id matches the resource's
`customer_id`.

## Errors {#errors}

All errors return a coded envelope: a stable machine `code`, a human `message`,
and an optional `details` map. The code vocabulary the examples use:
`validation`, `conflict`, `not_found`, `forbidden`. HTTP status mirrors the code
class (4xx client, 5xx server).

## IDs {#ids}

Identifiers are UUIDv7, string-encoded, with a per-entity prefix (`ord_`,
`cus_`). They are globally unique, sortable by creation time, and opaque to
clients.

## Config {#config}

Configuration is injected as environment variables — non-secret operational
values from the deployment env, secrets from the org secrets manager — never
committed to the repo. This anchor records the *mechanism* (the decision); the
per-project inventory of the variables themselves lives in
[environment.md](./environment.md).
