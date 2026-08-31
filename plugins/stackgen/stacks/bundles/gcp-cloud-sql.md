---
name: Google Cloud · Cloud SQL
axis: backing
kind: cloud-provider
components:
- cloud-provider/gcp@0.1.0
- cloud-service/cloud-sql@0.1.0
- cloud-service/firebase-auth@0.1.0
- cloud-service/firebase-storage@0.1.0
---

# Backing — Google Cloud · Cloud SQL

Relational Postgres on managed infrastructure, with the provider's managed
identity issuer and object store beside it. Pick it when the data model has real
relationships, when reporting and ad-hoc queries matter, or when the product
must stay **portable off this provider** — Postgres, object storage and a
standard token issuer all have equivalents everywhere, which a proprietary
document store does not.

The trade against `gcp-firebase`: **no client-direct path to the data, and no
emulator for the datastore** — local development runs Docker.

**The composition is one provider component plus three service components.** The
provider carries what spans them — how the meter runs, how a workload gets an
identity without a key, which services have emulators, what a private plane
looks like — and each service **cites it rather than restating it**.

**Three services because three capabilities.** Cloud SQL realizes
`relational-datastore`, Firebase Auth `third-party-auth`, and Cloud Storage for
Firebase `object-file-storage` — one token each. The identity component is the
same one `gcp-firebase` uses: the Identity Platform spelling is that service at
organization scale, one issuer under two names, so choosing a relational
datastore does not change the identity answer.

## What this bundle decides that no component decides alone

**The local stack is Docker-composed**, per `assets/contracts/local-stack.md` in
full: Postgres on production's major version behind a readiness gate, with
migrations run against it as a task. A fixed sleep in place of the gate is a
finding, not a variant. The identity and object-storage halves take the Firebase
Emulator Suite, so this bundle's local stack starts **both** — one task, one gate
that waits for both.

**Access is services-only, and here that is a hard limit rather than a policy.**
There is no client-direct path to the datastore, so a flow whose blueprint
assumes a client subscription needs a different design. Object storage keeps its
client-direct path, governed by rules; the two halves differ, and the blueprint
should say which applies where.

**Cost inverts here, and it is the one thing to carry forward.** The datastore
bills for **provisioned capacity, not consumption** — the instance costs the same
idle, which makes idle non-production instances the most common waste on the
bill, and storage auto-grows but never shrinks. Every other service in the
bundle bills per operation, so the provider's cost principle applies to
everything *except* the piece most people size first.

**The connection trap is the failure to design against.** Scale-to-zero compute
in front of a connection-limited datastore exhausts connections and fails every
request at once. A small per-instance pool, an instance ceiling sized against the
connection limit, and the IAM-authenticating connector are the three decisions
that prevent it, and all three are taken up front.

**Observability is not in this bundle.** Telemetry leaves through OTLP and
terminates in the provider's services as a **sink** — never a vendor SDK in
product code (`assets/contracts/observability.md`).

Full judgment: each component's own skill and its references.
