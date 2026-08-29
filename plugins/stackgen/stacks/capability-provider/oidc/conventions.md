# OIDC issuer — conventions

Identity as an **open protocol** rather than a product: any issuer speaking
OpenID Connect. The trade against a cloud's managed identity is that you get a
protocol and its guarantees, and everything above them is yours — no bundled
client SDK, no pre-wired console, no emulator.

**Verification happens in middleware, on every authenticated route** — signature,
`iss`, `aud`, `exp`. Never once at a gateway and trusted thereafter.

**`aud` is validated, always.** A signature-only check accepts a valid token
minted for a different application at the same issuer. This is the most common
real hole.

**The ID token is never an API credential.** The ID token describes the sign-in
to the client; the access token authorizes the call.

**The principal key is the token's `sub`**, and account status is read from the
datastore keyed on it — never from a claim. Where more than one issuer is
accepted, the key becomes `(iss, sub)` everywhere, including every foreign key
and audit record.

**Revocation is bounded by access-token lifetime**, which is the protocol rather
than a misconfiguration. Keep that lifetime short and make the refresh path the
revocation point.

**Keys come from JWKS via discovery, cached and refetched on an unknown `kid`** —
so rotation needs no redeploy, and discovery is not a network call in the
request path.

Full judgment: the `oidc` skill's references.
