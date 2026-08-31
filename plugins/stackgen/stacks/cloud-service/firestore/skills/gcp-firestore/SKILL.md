---
name: gcp-firestore
version: 0.1.0
category: development
description: Firestore as this product's document datastore — when a document
  model with client-direct access is the right answer, how it satisfies the
  datastore contract, why reads dominate the bill and what that does to the data
  model, security rules versus IAM, and the emulator plus its composite-index
  fidelity gap. Use when designing documents, writing queries or mutations, or
  changing security rules.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Firestore

The document datastore in the Firebase half of Google Cloud. This skill carries
what is Firestore's alone; the provider-wide judgment it sits on — cost
doctrine, IAM, the emulator map, the private plane — is the `gcp` skill's, cited
and never restated. The query API belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this datastore | [Pick & trade](references/pick-and-trade.md) |
| Designing documents, writing mutations and queries | [Service doctrine](references/service-doctrine.md) |
| Sizing, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Writing security rules, granting server access | [Identity shape](references/identity-shape.md) |
| Running the emulator, writing tests | [Local dev](references/local-dev.md) |

**The two rules that do not wait for a reference:** reads are the bill, so
denormalize what a screen displays into the document that screen loads. And the
admin SDK bypasses security rules completely — every server endpoint
re-authorizes on its own.
