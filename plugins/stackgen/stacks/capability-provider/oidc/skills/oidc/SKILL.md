---
name: oidc
version: 0.1.0
category: development
description: An OpenID Connect issuer as this product's identity provider — when
  the open protocol is the right answer, how it satisfies the identity contract,
  the revocation window it forces on the design, verification and credentials,
  cost shape, and the local stack. Auto-applies when editing auth middleware or
  the identity integration.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/auth/**"
  - "**/middleware/**"
---

# OIDC issuer

Identity as a protocol, not a product. This skill carries the judgment; the
issuer's own API surface belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this provider | [Pick & trade](references/pick-and-trade.md) |
| Implementing verification, status, the operator plane | [Contract satisfaction](references/contract-satisfaction.md) |
| Designing around revocation or token lifetime | [The revocation window](references/revocation-window.md) |
| Wiring middleware, discovery, credentials | [Integration & access shape](references/access-shape.md) |
| Sizing, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Standing it up locally or in CI | [Local stack](references/local-stack.md) |

**Two rules that do not wait for a reference:** validate `aud` on every token,
and never accept an ID token as an API credential.
