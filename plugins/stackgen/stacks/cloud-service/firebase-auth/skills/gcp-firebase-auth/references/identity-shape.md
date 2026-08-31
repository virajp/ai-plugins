# Identity shape — Firebase Auth · Identity Platform

The provider's identity doctrine — one service account per workload, no key
files, the roles that are broader than they look, the six-question privilege
review — is the `gcp` skill's identity reference. This file states what a server
needs to hold *over this service*, which is the confusing case: the service
whose subject is identity has its own IAM position, and the two are unrelated.

## Two identities in one sentence

**The end user's identity** is what this service issues, and what security rules
evaluate. **The service account's identity** is what lets a server administer
this service — create users, set claims, revoke tokens. Conflating them is how a
back-office endpoint ends up able to mint a session for anyone.

## What a server needs, and what it does not

Verification needs **nothing**. It reads public keys over the network and checks
a signature; no grant, no credential, no privileged client. A service that only
authenticates requests holds no role on this service at all — which is the
common case and the one to default to.

Administration — creating users, setting custom claims, revoking refresh tokens,
listing users — needs the admin credential, and that is a **materially more
powerful** capability than it looks: an identity that can set a custom claim can
grant itself whatever a claim grants, and an identity that can mint a custom
token can act as any user.

So: **the admin capability belongs to a separate workload from the one serving
requests.** A user-administration service, or a job, with its own service
account. The request-serving service verifies and reads; it does not administer.

## Custom tokens are an impersonation primitive

Minting a custom token produces a credential that signs in as a chosen user.
That is exactly what a migration or a support-impersonation feature needs, and
exactly what an attacker who reaches the endpoint needs. Where the product has
one, it is a privileged, audited action with its own authorization — not an
ordinary endpoint on the request-serving service.

## Where claims are set

Only by the administering workload, and only for **status**, per the doctrine. An
endpoint that lets a request influence which claim is set is an escalation path,
even when the claim is "only" a status flag — banned is a state a user would
like to change.

## Reviewing this service

1. Does the **request-serving** workload hold the admin credential it does not
   need?
2. Can any identity **mint a custom token**, and is that path audited and
   separately authorized?
3. Is any **role** expressed as a custom claim?
4. Does token verification happen **in the service**, or is a header from an edge
   being trusted?
