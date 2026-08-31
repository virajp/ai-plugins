# Identity shape — Cloud Storage for Firebase

The provider's identity doctrine — one service account per workload, no key
files, the roles that are broader than they look, the six-question privilege
review — is the `gcp` skill's identity reference, and its "security rules are not
IAM" section is the general statement of the seam below. This file states the
grants this service needs and what the rules layer must do.

## The grants

The server's service account gets an **object-level** role — read, create, or
the combined data-plane role — **on the specific bucket**. It does **not** get
the storage admin role: that permits deleting buckets and changing their IAM,
which is the naming trap the provider's IAM reference documents, and it is
several orders of privilege beyond writing a file.

Where the product has more than one bucket with different sensitivity, that is a
reason to keep them separate: a grant is per bucket, so one bucket per
sensitivity class is how the grant boundary is made to mean something.

## Signing is a capability, and it is the one to watch

An identity that can sign a URL can hand out access to anything the signature
covers, for as long as the signature lasts. So:

- **Sign in the services layer, once**, with expiry and constraints decided
  there rather than per caller.
- **Expiries are short.** Long enough for the operation, not long enough to be
  shared. A signed URL that outlives the request is a credential in a log, a
  browser history and a support ticket.
- **Sign for a specific object and a specific method.** A signature covering a
  prefix is a signature covering everything under it.

The identity that signs needs a token-signing capability of its own, which is
worth granting deliberately rather than as a side effect of the data-plane role.

## The rules layer

Rules govern the **client-direct** path and are the entire access-control layer
for it. IAM governs the server path, and the admin SDK **bypasses rules
completely** — so a server endpoint can never delegate its authorization to
them.

Writing rules that hold, on this service specifically:

- **Default deny**, and read the ruleset as a whole rather than as a list of
  exceptions.
- **Authorize on the path**, which is why the key layout is the security
  boundary. `users/{uid}/...` matched against the token's subject is the shape
  that works; anything conditional on state that lives in the datastore is a
  billed read on every access and usually a sign the operation belongs to a
  service.
- **Constrain size and content type in the rule**, because on this path there is
  no service to do it.
- **Test with client credentials against the emulator**, including negative
  cases. Rules tested through the admin SDK are not tested at all.

## Nothing is public

A bucket opened to the internet is irreversible in the sense that matters: you
cannot know what was copied while it was open. Where a client needs an object it
does not own the path to, the answer is a signed URL — never public access, and
never a rule that allows read to any authenticated user because that was easier
than modelling the share.

## Reviewing this bucket

1. Does the server identity hold the **admin** role rather than an object-level
   one?
2. Are any objects or buckets **publicly readable**?
3. Do the rules **constrain size and content type** on the client-direct path?
4. What is the **longest-lived signed URL** the product issues, and why?
