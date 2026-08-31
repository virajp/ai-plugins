# Service doctrine — Firebase Auth · Identity Platform

This component realizes the `third-party-auth` capability, so what it owes is
the neutral identity contract (`assets/contracts/identity.md`), clause by
clause. The contract states what **any** identity provider must satisfy; this
file states how this one does, **citing rather than restating**.

## Contract satisfaction

**Issue a verifiable token.** ID tokens are signed JWTs verified by the
product's own services, **in middleware, on every authenticated route** —
signature, then issuer, then audience, then expiry, in that order. Not once at a
gateway and trusted thereafter; a service that trusts a header because something
upstream checked it is a service that can be called directly.

Verification uses the SDK rather than a hand-rolled JWT check, because the key
rotation and the audience rules are exactly the parts a hand-rolled check gets
wrong. A failure is a **coded response**, never a stack trace.

**The claims rule.** The contract's position and this service's failure mode
agree: **custom claims carry account status only** — banned, pending deletion —
each mapping to a coded response. **Never roles.** Three reasons, and any one is
sufficient:

- A per-user claim cannot express **per-resource** authorization, which is what
  real products need.
- Claims are **size-capped**, so the model stops scaling exactly when the
  product succeeds.
- Claims are **stale until the token refreshes**, so a revoked role keeps
  working for the remainder of the token's life. For a *status* flag that
  window is acceptable, because it fails toward denying access; for a role it is
  a privilege escalation with a timer.

**Roles live in the datastore**, read on the request that needs them. That is
one more read on an authorized path, and it is the correct price.

**The access rule.** Every authenticated route re-authorizes. Where a
client-direct store path exists, security rules govern it and the admin SDK
bypasses them — which is why the server path can never delegate its
authorization to the rules. See the `gcp` skill's identity reference for that
seam in general.

## The product owns its user record

Keyed by the issuer's subject identifier, in the product's own datastore. The
issuer's user object is an authentication artifact, not the product's model of a
person — everything the product knows about a user beyond "they can sign in"
belongs on its own entity.

This is what makes the issuer replaceable, and it is also what makes the
lifecycle expressible: a user that exists at the issuer but not in the product's
store is a signup that has not completed, and that is a state the product can
name and handle rather than a null it trips over.

## Sign-out, revocation and the refresh window

Signing out clears the client's session; it does not invalidate an ID token
already issued. Genuine revocation is a server-side act, and the product's own
status check on the next request is what makes it immediate. This is the other
reason status belongs in the datastore path as well as the claim: the claim is
the fast path, the record is the true one.

## Multi-factor and account linking are product decisions

Both are supported and neither is free of consequence. Second factors change the
sign-in flow's states; account linking decides whether two providers with the
same email are one person, and getting that wrong is either an account-takeover
vector or a duplicate-account support burden. Decide both in the blueprint,
explicitly, rather than accepting the SDK default.
