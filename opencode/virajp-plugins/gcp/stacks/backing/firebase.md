---
axis: backing
name: Firebase
capabilities:
  [
    document-datastore,
    object-file-storage,
    third-party-auth,
    custom-claims-rbac,
    push-notifications,
    realtime-sync,
    distributed-tracing,
  ]
local_stack: firebase-emulator-suite
---

# Backing — Firebase

The fastest path to a working product, and the only backing option here where
**every service has a first-class local emulator** — so tests run offline, with
no billing account and no shared-environment contention.

Pick it when the data model is document-shaped and the product benefits from
client-direct access. Pick `cloud-sql` instead when the model is relational,
when reporting queries matter, or when the product must stay portable off GCP.

## Services

- **Datastore** — Firestore. Documents carry a `version` field; every mutation
  runs in a transaction that reads the document, checks the expected version,
  and writes `version + 1`. A stale version fails with the coded conflict
  response. Multi-document writes use one transaction or batched write;
  timestamps are server timestamps only, never client clocks.
- **Object storage** — Cloud Storage for Firebase.
- **Identity** — Firebase Auth / Identity Platform. ID tokens verified in
  middleware on every authenticated route. Custom claims carry **account status
  only** (`banned` / `to_be_deleted` → coded responses), never roles: a per-user
  claim cannot express per-resource authorization, and claims are capped in size
  and stale until token refresh.
- **Push** — FCM.
- **Realtime** — Firestore listeners, or Realtime Database where presence and
  low-latency fan-out matter more than query power.
- **Telemetry** — OpenTelemetry over **OTLP**, terminating in Cloud
  Trace/Monitoring/Logging. Never a vendor observability SDK: the product's
  instrumentation stays portable even though this backing is not.

## The two access rules

1. **Server code reaches these only through the shared package's services
   layer** — no project imports a vendor SDK directly. That is what keeps the
   vendor swappable: projects depend on an interface, not on Firestore.
2. **Client-direct access is the deliberate exception**, and it is governed by
   **security rules**, not IAM. The Admin SDK bypasses rules entirely, so every
   server endpoint re-authorizes on its own. See the `gcp-iam` skill — this is
   the most common source of both security holes and phantom debugging.

## Cost shape

Firestore bills **per document read**, which dominates every other line. A list
screen that reads 100 documents to show 10 fields bills 100 reads. Denormalize
what a screen displays into the document that screen loads, and treat an
unbounded collection query in a hot path as a defect. See `gcp-cost`.

## Local stack

The **Firebase Emulator Suite** — Auth, Firestore, Storage, Functions, Hosting —
started by one task with its own ready signal. This satisfies vwf's
`local_stack` capability **without Docker**; do not wrap it in a compose file to
look conventional.

The fidelity gap that matters: the emulator answers queries no production
composite index supports. Commit `firestore.indexes.json` and deploy indexes
ahead of the code that needs them, or the first deploy breaks. Full map in
`gcp-local-stack`.

## Secrets

Secret Manager, or the repo's secrets tool — injected as environment variables,
never read from a committed file.
