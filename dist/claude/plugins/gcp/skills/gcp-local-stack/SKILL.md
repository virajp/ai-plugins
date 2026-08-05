---
name: gcp-local-stack
description: Which Google Cloud services can run locally, which cannot, and what
  to do about the ones that cannot — the emulator map behind vwf's `local_stack`
  harness capability. Use when setting up local development or E2E tests against
  a GCP-backed product, or when deciding whether a stack needs Docker.
disable-model-invocation: false
model: sonnet
effort: medium
---

# Local development against Google Cloud

**The question this answers:** can this product's tests run without touching a
real GCP project? The answer decides vwf's `local_stack` harness capability, and
it is per-service knowledge that no SDK reference states.

The stakes are concrete. A service with a real emulator can be tested by anyone
who clones the repo, offline, with no billing account and no shared-environment
contention. A service without one forces a choice between a real project per
developer, a fake you write and maintain, or tests that don't run.

## The emulator map

**First-class emulators** — official, offline, and good enough that tests
running against them are meaningful:

| Service           | Runs via                | Fidelity caveat                                                                                                             |
| ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Firestore         | Firebase Emulator Suite | security rules evaluated; **indexes are not** — a query that needs a composite index passes locally and fails in production |
| Realtime Database | Firebase Emulator Suite | close to complete                                                                                                           |
| Firebase Auth     | Firebase Emulator Suite | no real provider handshake — OAuth flows are stubbed, so provider-specific token claims are not exercised                   |
| Cloud Storage     | Firebase Emulator Suite | object lifecycle rules and storage classes are not simulated                                                                |
| Cloud Functions   | Firebase Emulator Suite | cold-start behavior and concurrency limits are not reproduced                                                               |
| Firebase Hosting  | Firebase Emulator Suite | rewrites/redirects yes; CDN behavior no                                                                                     |
| Pub/Sub           | `gcloud beta emulators` | no IAM, no dead-letter policy enforcement, ordering keys approximate                                                        |
| Bigtable          | `gcloud beta emulators` | no replication, no app profiles                                                                                             |
| Cloud Tasks       | community emulator only | not official; treat as a fake, not a fidelity guarantee                                                                     |

**No emulator — use the real thing or a substitute:**

| Service              | What to do locally                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cloud SQL            | **Docker-composed Postgres** — same major version, behind a `wait-on` gate                                  |
| AlloyDB              | Docker-composed Postgres; AlloyDB's differences are performance, not semantics                              |
| Memorystore          | Docker-composed Redis/Valkey                                                                                |
| BigQuery             | no emulator; keep query logic behind a seam and test it against a real dev dataset                          |
| Cloud Run / GKE      | run the container directly (`docker run`, or the dev task) — you are testing your process, not the platform |
| Secret Manager       | environment variables locally; the code path reading them must be identical                                 |
| Cloud Tasks          | in-process queue behind the same interface                                                                  |
| Eventarc, Workflows  | invoke the handler directly; the routing is not what your test is about                                     |
| Cloud Armor, CDN, LB | not testable locally; these are production edge concerns                                                    |
| Vertex AI            | a real endpoint or a recorded fixture — model output is not reproducible offline                            |

## What this means for vwf's `local_stack`

vwf requires that when a repo needs a local stack, it is **Docker-composed
services behind `wait-on` readiness gates** — because the acceptance verifier
needs a deterministic ready signal. That rule is vwf's and does not bend.

Two consequences:

- A **Firebase-backed product often needs no Docker at all.** The Emulator Suite
  is the local stack, and it has its own ready signal. Report `local_stack` as
  satisfied by the emulator suite with its startup task — not as `false`, and
  not by inventing a compose file that wraps it.
- A **Cloud SQL-backed product does need Docker**, and the gate applies in full.
  A `sleep 5` before tests is a finding, not a variant.

Mixed products take both: emulator suite for the Firebase half, compose for the
rest, one task that starts both and one gate that waits for both.

## The fidelity trap

Emulators make tests possible; they do not make them true. The failures that
survive local green:

- **Composite indexes.** Firestore's emulator answers queries no production
  index supports. A query works all through development and fails on first
  deploy. Commit `firestore.indexes.json` and deploy indexes before the code
  that needs them.
- **IAM.** No emulator enforces IAM. Every permission error is a production-only
  error, which is why least-privilege must be verified in a real environment —
  see the `gcp-iam` skill.
- **Quotas and rate limits.** Never enforced locally. Anything whose correctness
  depends on backoff behavior is untested until staging.
- **Cold starts and concurrency.** Emulated functions are warm and serial. Race
  conditions between concurrent instances do not appear locally.

Design the E2E suite so these four are the *only* categories that can differ.
When a bug escapes to staging, check whether it belongs to one of them before
assuming the test suite is at fault — that check is usually the fastest
diagnosis available.

## Wiring it up

- Point client SDKs at emulators by **environment variable**
  (`FIRESTORE_EMULATOR_HOST`, `PUBSUB_EMULATOR_HOST`, and the suite's own
  config) — never by a code branch. A code branch is a production risk; an unset
  variable simply talks to the real service.
- Seed data through the same interface the product uses, so the seed exercises
  the write path rather than bypassing it.
- **Reset state between test runs**, not between assertions — the suite is fast
  enough to re-seed, and shared mutable state across runs is the most common
  source of tests that pass alone and fail together.
- Keep the emulator suite's version pinned alongside the SDK version; the two
  drift, and a mismatch surfaces as behavior that no one changed.
