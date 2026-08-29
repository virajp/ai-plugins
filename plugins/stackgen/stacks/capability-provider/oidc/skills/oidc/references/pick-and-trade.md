# OIDC issuer — pick & trade

## When it is the answer

**When the product must stay portable across providers.** OIDC is a
specification, not a vendor. An issuer can be swapped for another issuer, or a
managed one for a self-hosted one, without the product's verification logic
changing — because that logic is written against the protocol.

**When an enterprise customer will bring their own issuer.** This is frequently
the deciding factor and it is worth surfacing early: a customer who requires
sign-in through their own directory can only be served if the product speaks the
protocol they speak. A cloud's proprietary identity product generally cannot,
and discovering that after the architecture is set is expensive.

**When the operator plane needs a directory the product does not own.** The
people who run the product often already exist in an organizational directory.
Speaking OIDC means the operator plane can point at it rather than becoming a
second place where staff accounts are created and — more importantly —
forgotten when someone leaves.

**When the guarantee needs to be inspectable.** The protocol's checks are
public, testable and reviewable. Being able to state exactly what is verified,
and to demonstrate it, is worth a great deal in an audit.

## When it stops being the answer

**When you want a bundled client SDK and a console.** A cloud's managed identity
comes with sign-in UI, session handling, an admin console and an emulator. With
OIDC you get a protocol and its guarantees; everything above them is yours to
build and operate. For a small product that will never leave one cloud, that is
a real cost for a portability nobody will use.

**When nobody will operate an issuer.** Self-hosted, the issuer is on the
critical path of **every** authenticated request, so it needs at least the
availability the product needs. That is a serious operational commitment, and
the honest alternative is a managed issuer — which is fine, and is still OIDC.

**When revoke-now is a hard requirement and per-request status checks are
unacceptable.** The protocol's revocation model is bounded by token lifetime.
There is a design that meets revoke-now — see
[the revocation window](revocation-window.md) — but it costs a datastore read
per request, and if that is unacceptable, this is the wrong provider.

## What the choice is often confused with

Picking OIDC is not picking **self-hosted**. A managed issuer speaking OIDC gets
the portability and the enterprise story without the operational burden; the
contract satisfaction is identical either way. Record which one the product is
on, because the cost shapes are entirely different — see
[cost shape](cost-shape.md).
