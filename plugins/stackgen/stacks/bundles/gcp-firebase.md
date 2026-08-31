---
name: Google Cloud · Firebase
axis: backing
kind: cloud-provider
components:
- cloud-provider/gcp@0.1.0
- cloud-service/firestore@0.1.0
- cloud-service/firebase-auth@0.1.0
- cloud-service/firebase-storage@0.1.0
- cloud-service/firebase-messaging@0.1.0
---

# Backing — Google Cloud · Firebase

The fastest path to a working product on this provider, and the only backing
option here where **nearly every service has a first-class local emulator** — so
tests run offline, with no billing account and no contention over a shared
environment.

Pick it when the data model is document-shaped and the product benefits from
client-direct access. Pick `gcp-cloud-sql` instead when the model is relational,
when reporting queries matter, or when the product must stay portable off this
provider.

**The composition is one provider component plus four service components.** The
provider carries what spans them — how the meter runs, how a workload gets an
identity without a key, which services have emulators, what a private plane
looks like — and each service **cites it rather than restating it**. That seam is
what keeps the cost and identity doctrine in one place while four services stay
independently substitutable.

**Four services because four capabilities.** Firestore realizes
`document-datastore`, Firebase Auth `third-party-auth`, Cloud Storage for
Firebase `object-file-storage`, and Cloud Messaging `push-notifications` — one
token each. A product can take the identity half without the document store, or
the object store without push; the composition here is the common default, not a
package deal.

## What this bundle decides that no component decides alone

**The local stack is the Firebase Emulator Suite**, started by one task with its
own ready signal, covering the datastore, identity and object storage together.
It satisfies vwf's `local_stack` capability **without Docker**, and wrapping it
in a compose file to look conventional adds a failure mode and satisfies nothing
`assets/contracts/local-stack.md` asks for. Push is the exception with no local
answer at all.

**Two access rules hold across the whole bundle.** Server code reaches these
services only through the product's own services layer — no project imports a
vendor SDK directly, which is what keeps them swappable. And **client-direct
access is the deliberate exception**, governed by security rules rather than
IAM; the admin SDK bypasses rules entirely, so every server endpoint
re-authorizes on its own.

**Reads are the bill.** The document store charges per document read and that
line dominates the bundle. It is why the data model here is designed against the
screens rather than against the entities, and it is where the notification
fan-out's cost lands too.

**Observability is not in this bundle.** Telemetry leaves through OTLP and
terminates in the provider's trace, metrics and logging services as a **sink** —
never a vendor SDK in product code. That is `assets/contracts/observability.md`,
and the provider component states the position.

Full judgment: each component's own skill and its references.
