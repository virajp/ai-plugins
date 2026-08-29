# Identity — the capability contract

What **any** identity provider has to satisfy to serve a vwf product, stated
without naming one. The provider packs the stack plugin ships say how a
particular one satisfies it; a cloud plugin's managed flavour says the same for
its own.

Capability tokens realized here: `third-party-auth`, `custom-claims-rbac`,
`operator-rbac`. Blueprint prose calls the provider **the identity provider** —
never the product name.

## What a provider must be able to do

1. **Issue a verifiable token.** The product's services verify it themselves,
   in middleware, on **every** authenticated route — not once at a gateway and
   trusted thereafter. Verification is signature plus issuer plus audience plus
   expiry, in that order, and a failure is a coded response rather than a
   stack trace.
2. **Publish its keys.** Rotation must not require a redeploy, which means the
   verifier fetches and caches signing keys rather than carrying one.
3. **Revoke.** A disabled or deleted principal must stop being able to act
   within a bounded, stated window. A provider with no revocation path forces
   the product to check a status on every request, and that is a design decision
   to record, not a detail to discover.
4. **Carry an account status the product can read.** `banned` /
   `to_be_deleted` and their coded responses — see the claims rule below for
   what a claim may *not* carry.
5. **Support the operator plane.** The people who run the product authenticate
   too, and their authorization is not the end-users' shape. Whether they share
   an issuer or get their own is a contract decision.

## The claims rule

**A token claim carries account status only, never roles.** This is the single
most consequential rule here, and every provider tempts you to break it.

Three reasons, all of which bite in production:

- A per-user claim cannot express per-resource authorization. "Is an editor" is
  not an answer to "may edit *this* document".
- Claims are **stale until the token refreshes**. Revoking a role that lives in
  a claim does not revoke it now.
- Claims are size-capped, and the cap is reached exactly when the model is
  already wrong.

Authorization is therefore read **per request, from the datastore**, against the
resource being acted on. The token answers *who*; the product answers *may*.

## The access rule

A project reaches the provider **only through the shared services layer** — no
project imports a vendor SDK directly. Client-side sign-in is the one allowed
exception: the sign-in surface talks to the issuer directly, and every server
route re-verifies regardless of what the client claims to have done.

## What this plugin does not decide

- **Which provider.** That is the user's pick from the menu — this plugin's own
  neutral template, or a managed flavour from the project's cloud plugin.
- **The authorization model.** Who may do what is a blueprint contract, authored
  per product against its entities.
- **The verification library.** That belongs to the project's language plugin.
