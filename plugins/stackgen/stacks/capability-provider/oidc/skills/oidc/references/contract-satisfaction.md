# OIDC issuer — contract satisfaction

Clause by clause against the neutral identity contract
(`assets/contracts/identity.md`). The contract states what any provider must do;
this states how an OIDC issuer does it. It cites, and does not restate.

## Issue a verifiable token

**Middleware validates the JWT on every authenticated route** — signature,
`iss`, `aud` and `exp`. Not once at a gateway and trusted thereafter, which is
the contract's explicit requirement and the thing gateways tempt you to do.

**Validating `aud` is not optional.** A signature-only check accepts a valid,
correctly-signed, unexpired token that was minted for a *different* application
at the same issuer. It will pass every test written against your own tokens and
fail an audit. This is the most common real hole in OIDC integrations.

**The ID token is not an API credential.** The ID token describes the sign-in to
the client. The access token authorizes the call. Products that confuse them
work in development — both are JWTs from the same issuer — and are wrong.

## Publish its keys

**Keys come from the issuer's JWKS endpoint, discovered through
`/.well-known/openid-configuration`.** The verifier caches the document and the
keys, and refetches on an unknown `kid` rather than per request.

That `kid` behaviour is what satisfies the contract's rotation clause: the
issuer can rotate signing keys and the product picks up the new one on first
sight, with no redeploy and no coordination.

## Revoke

**Bounded, and the bound is the access token's lifetime** — that is the
protocol, not a misconfiguration. The contract requires a *stated* window rather
than an instant one, so this satisfies it provided the window is written down.

Keep access-token lifetime short and make the refresh path the revocation point.
Where the product genuinely needs revoke-now, it checks account status per
request against the datastore. See [the revocation window](revocation-window.md)
for the trade.

## Carry an account status the product can read

**Read from the datastore, keyed on the token's `sub` — never from a claim.**
This is the contract's claims rule and the reason for it is concrete: a claim is
a snapshot from issuance time, so a user banned one minute after signing in
carries a claim saying otherwise until their token expires.

`sub` is the only durable identifier the protocol guarantees. Email changes, and
is not unique across issuers.

## Support the operator plane

**A separate issuer, or the same issuer with a distinct audience.** Either
satisfies the contract; what does not is operators being end-users with an extra
flag, which is the shape the contract exists to prevent.

The distinct audience is what makes the separation enforceable rather than
conventional: an operator token simply does not validate against the end-user
API's expected `aud`.
