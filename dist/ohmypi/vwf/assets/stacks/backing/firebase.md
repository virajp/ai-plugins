---
axis: backing
name: Firebase · Temporal · OTel-LGTM
capabilities:
  [
    document-datastore,
    object-file-storage,
    third-party-auth,
    custom-claims-rbac,
    push-notifications,
    durable-workflows,
    distributed-tracing,
  ]
local_stack: docker-compose
---

# Backing — Firebase · Temporal · OTel-LGTM

The **backing services** a project talks to, and how it is allowed to talk to
them. Independent of the language/framework a project is written in (the project
axis) and of where it ships (the deploy axis).

## Services

- **Datastore** — Firestore. Documents carry a `version` field; every mutation
  runs in a transaction that reads the document, checks the expected version,
  and writes `version + 1` (the `baseline/write-versioning` realization). A
  stale version fails with the coded conflict response. Multi-document writes
  use one transaction or batched write; timestamps are
  `FieldValue.serverTimestamp()` only.
- **Object storage** — Firebase Storage.
- **Identity** — Firebase Auth. ID tokens verified in middleware on every
  authenticated route. Custom claims carry **account status only** (`banned` /
  `to_be_deleted` → coded responses), never roles: a per-user claim cannot
  express per-resource authorization.
- **Push** — FCM.
- **Durable workflows** — Temporal. Callers start and signal workflows through a
  client service, lazily connected, idempotent on already-started, and recording
  rather than connecting under test.
- **Telemetry** — OpenTelemetry exported to a Grafana OTel-LGTM stack.

## The access rule

Every one of these is reached **only through the shared package's aggregate
services layer** — no project imports a vendor SDK directly
(`rules/integrations-via-common`). Client-side sign-in is the one allowed
exception. Every datastore call passes a caller string for observability.

This is what keeps the vendor swappable: the projects depend on the shared
package's interface, not on Firestore.

## Local stack

Docker Compose brings up the Firebase emulator suite (Auth, Firestore, Storage),
a Temporal dev server, and the OTel-LGTM stack, with `wait-on` readiness gates
in front of every dependent task. This satisfies the `local_stack` harness
capability; the acceptance verifier depends on the readiness gates being
deterministic.

## Secrets

Injected by Doppler; nothing is read from a committed file.
