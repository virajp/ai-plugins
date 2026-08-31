---
name: gcp-firebase-messaging
version: 0.1.0
category: development
description: Firebase Cloud Messaging as this product's push transport — when it
  is the right answer, why push is best-effort and never carries state, the
  device-token lifecycle that leaks if nobody prunes it, what actually costs
  money around a free service, the send identity, and testing without an
  emulator. Use when designing notifications or wiring the send path.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Firebase Cloud Messaging

The provider's push transport to mobile and web clients. This skill carries what
is this service's alone; the provider-wide judgment it sits on — cost doctrine,
IAM, the emulator map, the private plane — is the `gcp` skill's, cited and never
restated. The payload schema belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this transport | [Pick & trade](references/pick-and-trade.md) |
| Designing notifications, tokens, delivery handling | [Service doctrine](references/service-doctrine.md) |
| Costing notifications, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Granting the send path what it needs | [Identity shape](references/identity-shape.md) |
| Testing the send path | [Local dev](references/local-dev.md) |

**The two rules that do not wait for a reference:** push is best-effort, so a
message signals that something changed and the client fetches the truth — never
carry state in the payload. And a device token is per device, changes without
warning, and must be deleted when the send path reports it unregistered.
