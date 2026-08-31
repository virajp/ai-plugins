# Local development map — Google Cloud

**The question this answers:** can this product's tests run without touching a
real project on this provider? The answer decides vwf's `local_stack` harness
capability, and it is per-service knowledge no SDK reference states.

The stakes are concrete. A service with a real emulator can be tested by anyone
who clones the repo — offline, with no billing account and no contention over a
shared environment. A service without one forces a choice between a project per
developer, a fake you write and maintain, or tests that do not run.

## The emulator map

**First-class emulators** — official, offline, and good enough that tests
running against them are meaningful:

| Service | Runs via | Fidelity caveat |
| --- | --- | --- |
| Firestore | Firebase Emulator Suite | security rules are evaluated; **indexes are not** — a query needing a composite index passes locally and fails in production |
| Realtime Database | Firebase Emulator Suite | close to complete |
| Firebase Auth | Firebase Emulator Suite | no real provider handshake — OAuth flows are stubbed, so provider-specific token claims are never exercised |
| Cloud Storage | Firebase Emulator Suite | object lifecycle rules and storage classes are not simulated |
| Cloud Functions | Firebase Emulator Suite | cold-start behaviour and concurrency limits are not reproduced |
| Firebase Hosting | Firebase Emulator Suite | rewrites and redirects yes; CDN behaviour no |
| Pub/Sub | the provider CLI's emulator | no IAM, no dead-letter policy enforcement, ordering keys approximate |
| Bigtable | the provider CLI's emulator | no replication, no app profiles |
| Cloud Tasks | community emulator only | not official; treat it as a fake, not as a fidelity guarantee |

**No emulator — use the real thing, or a substitute:**

| Service | What to do locally |
| --- | --- |
| Cloud SQL | **Docker-composed Postgres**, same major version, behind a readiness gate |
| AlloyDB | Docker-composed Postgres; the differences are performance, not semantics |
| Memorystore | Docker-composed Redis or Valkey |
| BigQuery | no emulator; keep query logic behind a seam and test it against a real development dataset |
| Cloud Run, GKE | run the container directly — you are testing your process, not the platform |
| Secret Manager | environment variables locally; the code path that reads them must be identical |
| Cloud Tasks | an in-process queue behind the same interface |
| Eventarc, Workflows | invoke the handler directly; the routing is not what the test is about |
| Cloud Armor, CDN, load balancing | not testable locally; these are production edge concerns |
| Vertex AI | a real endpoint or a recorded fixture — model output is not reproducible offline |

**Firebase Cloud Messaging has no emulator for delivery.** The Functions
emulator can trigger the code path that sends, but nothing local delivers to a
device.

## What this means for vwf's `local_stack`

The harness contract is `assets/contracts/local-stack.md`, and it is what the
acceptance verifier gates on: a local stack comes up behind a **deterministic
readiness signal**, never a fixed sleep. Read it for the full mechanism — this
file only says which half of it each service lands in.

Three consequences:

- A **Firebase-backed product often needs no Docker at all.** The Emulator Suite
  *is* the local stack, and it has its own ready signal. Report `local_stack` as
  satisfied by the suite with its startup task — not as `n/a`, and not by
  inventing a compose file that wraps it to look conventional. This is the one
  place the contract's Compose mechanism is met by a first-party emulator
  instead; the readiness gate it exists for still applies in full, on the
  suite's own endpoints.
- A **Cloud SQL-backed product does need Docker**, and the contract applies
  unaltered. A `sleep` before the tests is a finding, not a variant.
- **A mixed product takes both** — the suite for the Firebase half, Compose for
  the rest, one task that starts both and one gate that waits for both.

## The fidelity trap

Emulators make tests possible; they do not make them true. Four categories of
failure survive local green:

- **Composite indexes.** The Firestore emulator answers queries no production
  index supports, so a query works all through development and fails on first
  deploy. Commit the index definitions and deploy them ahead of the code that
  needs them.
- **IAM.** No emulator enforces it, so every permission error is a
  production-only error — which is why least privilege has to be verified in a
  real environment.
- **Quotas and rate limits.** Never enforced locally. Anything whose correctness
  depends on backoff behaviour is untested until staging.
- **Cold starts and concurrency.** Emulated functions are warm and serial, so
  races between concurrent instances do not appear locally.

Design the E2E suite so these four are the *only* categories that can differ.
When a bug escapes to staging, check whether it belongs to one of them before
assuming the suite is at fault — that check is usually the fastest diagnosis
available.

## Wiring it up

- Point client SDKs at emulators by **environment variable**, never by a code
  branch. A branch is a production risk; an unset variable simply talks to the
  real service.
- Seed data **through the same interface the product uses**, so the seed
  exercises the write path rather than bypassing it.
- **Reset state between runs**, not between assertions. The suite is fast enough
  to re-seed, and shared mutable state across runs is the most common source of
  tests that pass alone and fail together.
- Keep the emulator suite's version pinned alongside the SDK version. The two
  drift, and a mismatch surfaces as behaviour nobody changed.
