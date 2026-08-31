---
name: gcp-firebase-auth
version: 0.1.0
category: development
description: Firebase Auth and Identity Platform as this product's identity
  provider — when the managed issuer is the right answer, how it satisfies the
  identity contract, why custom claims carry status and never roles, what phone
  sign-in costs, the grants a server needs, and the emulator's stubbed provider
  handshake. Use when wiring sign-in, verifying tokens, or designing
  authorization.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Firebase Auth · Identity Platform

The provider's managed identity issuer — **one service under two names**, the
second being the same product at organization scale. This skill carries what is
this service's alone; the provider-wide judgment it sits on — cost doctrine,
IAM, the emulator map, the private plane — is the `gcp` skill's, cited and never
restated. The SDK surface belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this provider | [Pick & trade](references/pick-and-trade.md) |
| Verifying tokens, designing authorization, modelling users | [Service doctrine](references/service-doctrine.md) |
| Costing sign-in, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Granting a server what it needs, minting or revoking tokens | [Identity shape](references/identity-shape.md) |
| Testing sign-in and authenticated routes | [Local dev](references/local-dev.md) |

**The two rules that do not wait for a reference:** every authenticated route
verifies the token itself, in middleware — never once at an edge and trusted
after. And custom claims carry account **status**, never roles; roles live in
the datastore.
