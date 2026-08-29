---
name: OIDC issuer
axis: backing
kind: capability-provider
components:
- capability-provider/oidc@0.1.0
---

# Backing — OIDC issuer

Identity as an **open protocol** rather than a product: any issuer speaking
OpenID Connect, self-hosted or managed.

**The composition is the neutral identity contract plus this one issuer.** The
contract (`assets/contracts/identity.md`) states what any provider must do —
issue a verifiable token, publish its keys, revoke, carry an account status,
support the operator plane. The `oidc` component states how the protocol does
each, citing rather than restating.

The constraint the product is built around is the **revocation window**: an
access token stays valid until it expires, which is the protocol working as
designed and is why verification can stay stateless. The window is a stated
product guarantee, not an implementation detail.

Full judgment: the component's own skill and its references. The contract it
cites is `assets/contracts/identity.md`.
