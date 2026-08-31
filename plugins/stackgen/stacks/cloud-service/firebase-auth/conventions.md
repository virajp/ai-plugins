# Firebase Auth · Identity Platform — conventions

The provider's managed identity issuer. **One service under two names**: the
Identity Platform spelling is the same product with organization-scale features
turned on — multi-tenancy, SAML, enterprise SSO — so a product can start on one
name and move to the other without changing its verification path. This
component covers both.

**Tokens are verified in middleware, on every authenticated route**, by the
product's own services — signature, then issuer, then audience, then expiry. Not
once at a gateway and trusted thereafter. A failure is a coded response, never a
stack trace. That is the identity contract's requirement
(`assets/contracts/identity.md`), and it does not bend because the issuer is
managed.

**Custom claims carry account status only** — banned, pending deletion, and the
like, each mapping to a coded response — **never roles**. A per-user claim cannot
express per-resource authorization, claims are capped in size, and they are
stale until the token refreshes. **Roles live in the datastore**, read on the
request that needs them.

**The identity provider is not the user record.** The product owns its own user
entity, keyed by the issuer's subject identifier. That is what makes the issuer
replaceable and what gives the product somewhere to put everything the issuer
does not model.

**Security rules are not IAM**, and the admin SDK bypasses rules entirely — so
every server endpoint re-authorizes on its own. See the `gcp` skill's identity
reference.

**Phone sign-in is the cost trap.** Message delivery is billed per message and
is the standing target of toll-fraud traffic; take it deliberately, with abuse
protection on, or not at all.

**The emulator stubs the provider handshake.** Federated sign-in flows and
provider-specific token claims are never exercised locally, so keep verification
behind a seam and inject a verified-principal fake in tests
(`assets/contracts/local-stack.md`).

Full judgment: the `gcp-firebase-auth` skill's references. The provider-wide
half — cost doctrine, IAM, the emulator map, the private plane — is the `gcp`
skill's.
