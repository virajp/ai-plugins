# OIDC issuer — integration & access shape

## Where the boundary sits

The product's boundary with the issuer is **narrower than it first appears**,
and keeping it narrow is what preserves the portability that motivated the
choice.

Three touchpoints, and no more:

1. **The redirect dance**, at sign-in — the client goes to the issuer and comes
   back with a code.
2. **The token exchange**, once — code for tokens.
3. **Verification**, on every request — local, using cached keys.

Everything else the product does with identity is its own. Roles, entitlements,
account status, profile — all in the product's datastore, keyed on `sub`. A
product that reaches into the issuer's API for these has coupled itself to that
issuer and given up the swap it paid for.

## Discovery and key caching

**Discovery is a network call in the request path unless it is cached.** Fetch
`/.well-known/openid-configuration` once, cache the document and the JWKS, and
refetch on an unknown `kid` — not per request, and not on a fixed short timer
that hammers the issuer.

The failure to plan for: the issuer being briefly unreachable. With keys cached,
verification keeps working; without, every request fails because the product
could not fetch a document that had not changed in months.

## Credentials

**Env-injected, names-not-values, catalogued in
`docs/blueprint/environment.md`.** Nothing read from a committed file.

**Public clients hold no secret at all and use PKCE.** A browser or mobile app
cannot keep a secret — shipping one is disclosing it, and the protocol has a
purpose-built answer. A "confidential client" whose secret is in a mobile binary
is a confidential client in name only.

**The client secret, where there is one, is rotatable without a redeploy**,
which means it is read at use time rather than baked into an image.

## Least privilege on the operator plane

Operator tokens carry a distinct audience, so an operator token does not
validate against the end-user API and vice versa. That separation is what makes
the operator plane's authorization enforceable at the edge rather than by a
conditional deep inside a shared handler.

## What never goes in a claim

Per the contract's claims rule: **status, not roles**, and nothing the product
needs to change faster than a token lifetime. A claim is a snapshot from
issuance. Anything read from a claim is being read as of when the user signed
in, which for a long-lived session may be a very long time ago.
