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

## Engineering baseline {#baseline}

The centralized technical defaults every doc and cycle follows (seeded from
vwf's engineering-baseline asset); only exceptions are documented — on the
deviating doc and as an `enforcement.rules` waiver:

1. `baseline/write-versioning` — every mutating write is optimistically
   versioned: version token checked and incremented atomically; stale writes
   fail with the conflict error.
2. `baseline/atomic-multi-write` — writes spanning documents happen in one
   transaction/batch.
3. `baseline/server-time` — timestamps are server-authoritative UTC.
4. `baseline/soft-delete` — deletion is a lifecycle state; hard deletion only as
   scheduled by the data-retention contract.
5. `baseline/boundary-validation` — every boundary input/output validates
   against its schema; malformed data is rejected, never coerced.
6. `baseline/business-technical-separation` — technical concerns live in
   common/shared layers; business rules never inside technical helpers.
7. `baseline/idempotency-keys` — every mutating operation is idempotent; creates
   carry an idempotency key.
8. `baseline/error-envelope` — one error shape ([Errors](#errors)) everywhere.
9. `baseline/cursor-pagination` — collections paginate by cursor.
10. `baseline/retry-discipline` — retries only on idempotent operations,
    exponential backoff + jitter, bounded attempts.
11. `baseline/tolerant-reader` — event contracts versioned; consumers ignore
    unknown fields.
12. `baseline/stateless-processes` — no state in process memory across requests;
    every service/worker safe at N replicas.
13. `baseline/graceful-shutdown` — drain on termination; acknowledged work is
    never lost to a shutdown.
14. `baseline/structured-logs-no-pii` — structured logs, opaque ids, no PII;
    logs, traces, and metrics via OpenTelemetry.
15. `baseline/integer-money` — money as integer minor units with a currency
    field.

Active waiver: `baseline/write-versioning/entities/customer` — profile fields
are last-write-wins by design (see the
[customer entity](./entities/customer/index.md)).

## Config {#config}

Configuration is injected as environment variables — non-secret operational
values from the deployment env, secrets from the org secrets manager — never
committed to the repo. This anchor records the *mechanism* (the decision); the
per-project inventory of the variables themselves lives in
[environment.md](./environment.md).
