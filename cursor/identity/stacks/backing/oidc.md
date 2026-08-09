---
axis: backing
name: OIDC issuer
capabilities: [third-party-auth]
local_stack: docker-compose
---

# Backing — OIDC issuer

Identity as an **open protocol** rather than a product: any issuer speaking
OpenID Connect, self-hosted or managed. Pick it when the product must stay
portable across providers, when an enterprise customer will bring their own
issuer, or when the operator plane needs a directory the product does not own.

The trade against a cloud's managed identity: no bundled client SDK, no
pre-wired console, and no emulator — you get a protocol and its guarantees, and
everything above them is yours.

## How it satisfies the contract

- **Verification** — middleware validates the JWT's signature, `iss`, `aud` and
  `exp` on every authenticated route. Keys come from the issuer's JWKS endpoint,
  discovered through `/.well-known/openid-configuration`, cached with respect
  for its `kid` so rotation needs no redeploy.
- **Revocation** — an access token stays valid until it expires; that is the
  protocol, not a misconfiguration. Keep access-token lifetime **short** and
  make the refresh path the revocation point. Where the product needs
  revoke-now, it checks account status per request against the datastore.
- **Account status** — read from the datastore keyed on the token's `sub`, not
  from a claim. `sub` is the only durable identifier the protocol guarantees;
  email changes and is not unique across issuers.
- **Operator plane** — a separate issuer, or the same issuer with a distinct
  audience. Either way operators are not end-users with an extra flag.

## The traps that actually bite

- **Never trust the ID token as an API credential.** The ID token describes the
  sign-in to the client; the access token authorizes the call. Products that
  confuse them work in development and fail an audit.
- **Validate `aud`.** A signature-only check accepts a valid token minted for a
  *different* application at the same issuer. This is the most common real hole.
- **Discovery is a network call in the request path** unless it is cached.
  Cache the document and the keys; refetch on an unknown `kid`, not per request.
- **Multi-issuer is a design decision, not a config value.** If more than one
  issuer is accepted, the principal key becomes `(iss, sub)` everywhere — in the
  datastore, in audit records, in every foreign key.

## Cost shape

Self-hosted, the cost is operational: an issuer is on the critical path of every
request, so it needs the availability the product needs. Managed, the cost is
almost always **per monthly active user**, which grows with reach rather than
with usage — model it against the product's growth curve, not its traffic.

## Local stack

A docker-composed OIDC issuer behind a `wait-on` readiness gate, seeded with the
test principals the acceptance suite needs. That gate is vwf's one
non-negotiable mechanism: the acceptance verifier needs a deterministic ready
signal.

Where running a real issuer locally is not worth it, keep verification behind a
seam and inject a verified-principal fake — but say so, because a product whose
tests never verify a real token has never tested `aud`.

## Secrets

The client secret and any issuer credential are injected as environment
variables and catalogued by name in `docs/blueprint/environment.md`. Nothing is
read from a committed file. Public clients hold no secret at all and use PKCE.
