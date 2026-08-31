---
name: gcp-firebase-storage
version: 0.1.0
category: development
description: Cloud Storage for Firebase as this product's object storage — when
  a governed client-direct path is worth having, how it satisfies the
  object-storage contract, the key layout as the security boundary, why egress
  and class transitions are the traps, rules versus IAM, and what the emulator
  does not simulate. Use when designing uploads, key layouts, retention, or
  storage rules.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Cloud Storage for Firebase

The provider's object store with a security-rules layer in front. This skill
carries what is this service's alone; the provider-wide judgment it sits on —
cost doctrine, IAM, the emulator map, the private plane — is the `gcp` skill's,
cited and never restated. The SDK surface belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this store | [Pick & trade](references/pick-and-trade.md) |
| Designing key layouts, uploads, retention | [Service doctrine](references/service-doctrine.md) |
| Sizing, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Writing storage rules, granting server access | [Identity shape](references/identity-shape.md) |
| Testing uploads and downloads | [Local dev](references/local-dev.md) |

**The two rules that do not wait for a reference:** the key layout is the
security boundary and is effectively immutable once objects exist — design it
before the first upload. And lifecycle rules are set at bucket creation, because
a retention rule living in a cron job is a retention rule that stops running.
