# OIDC issuer — the revocation window

The one property that reshapes how the product is built around this provider.
Every other trap in an OIDC integration is a mistake to avoid; this is a
constraint to design against.

## The constraint

**An access token stays valid until it expires.** The issuer cannot reach out
and un-issue it. If a user is banned, deletes their account, or has their access
withdrawn, they keep working for as long as their current token lives.

This is the protocol working as designed — stateless verification is *why* the
product can validate a token without calling the issuer on every request, which
is what makes it fast and what keeps the issuer off the critical path of every
call. The property that gives you performance is the same one that costs you
instant revocation. You cannot have one without the other.

## The three designs, and what each costs

**1. Short lifetime, refresh is the revocation point.** Access tokens live
minutes; the refresh exchange checks status and refuses. Revocation takes effect
within one token lifetime. Costs a refresh round-trip per lifetime, and the
window must be stated in the blueprint — "access is withdrawn within N minutes"
is a product guarantee, not an implementation detail.

**2. Status checked per request against the datastore.** Revocation is
effectively immediate. Costs a datastore read on every authenticated request,
which is a real latency and load decision, and it partially gives back the
statelessness that motivated the choice. Correct when the product has a genuine
revoke-now requirement — moderation, safety, regulated access.

**3. A denylist of revoked token identifiers**, checked per request from a fast
cache. Immediate revocation without a datastore read per request, at the cost of
another piece of infrastructure that must be available or the gate fails open —
and a gate that fails open under load is worse than the window it replaced.

## What to record in the blueprint

Whichever is chosen, the **window is a stated guarantee**, because flows depend
on it. A moderation flow that says "the user is blocked immediately" is making a
claim the identity design has to actually support, and the mismatch between that
sentence and a 60-minute token is the kind of thing found in production.

## The related trap: multi-issuer

**Accepting more than one issuer is a design decision, not a config value.** The
moment a second issuer is accepted, `sub` is no longer unique — two issuers can
mint the same `sub` for different humans. The principal key becomes `(iss, sub)`
**everywhere**: in the datastore, in audit records, in every foreign key.

Retrofitting that is a migration of every table that references a user. Decide
it before the first one exists, even if the answer is "one issuer for now" —
because the cheap version of that decision is a composite key with one value in
it today.
