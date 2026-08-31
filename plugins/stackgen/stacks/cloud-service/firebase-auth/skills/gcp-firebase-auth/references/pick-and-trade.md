# Pick & trade — Firebase Auth · Identity Platform

## One service, two names

The two names are the same product at two scales. The Identity Platform spelling
turns on organization-scale features — multi-tenancy, SAML and enterprise SSO,
higher quotas — over the same issuer, the same tokens and the same verification
path.

**That matters for the decision**, because it removes the usual reason to
over-buy at the start: a product can begin on the simpler name and move when it
has an enterprise customer, and the move does not touch the product's
verification code. Do not pick the larger spelling speculatively.

## When this is the answer

- **The product needs federated sign-in** across the usual identity providers
  plus email, and does not want to own credential storage, password reset flows,
  or the breach surface that comes with them.
- **The client is a mobile or web app** where the SDK's session handling, token
  refresh and persistence are real work you would otherwise write.
- **The rest of the stack is already this provider's**, and particularly if the
  document store is: the issuer's identity is what security rules evaluate, so
  the two together give you a governed client-direct path that neither gives
  alone.

## When it stops being the answer

- **The product needs an authorization server, not just an issuer** — its own
  OAuth clients, third-party consent, machine-to-machine grants. This issues
  identity for the product's own clients; it is not a platform on which other
  people's applications authenticate.
- **Portability of the identity layer is a stated requirement.** Users can be
  exported, but sign-in flows, claims and the client SDK's session behaviour are
  not portable, and every path that verifies a token has to change.
- **The organization already has an identity provider.** Then this is a second
  one, and two issuers is a lasting complexity rather than a migration step.

## What it does not decide

**Authorization.** This service answers who the caller is; what they may do is
the product's, and modelling it in the issuer is the mistake
[Service doctrine](service-doctrine.md) exists to prevent.

**The user record.** The product owns its own user entity, keyed by the issuer's
subject identifier — which is what makes the issuer replaceable, and what gives
the product somewhere to put everything the issuer does not model.
