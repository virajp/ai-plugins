# Pick & trade — Cloud Storage for Firebase

## What this actually is

**An ordinary bucket on the provider's object store, plus a rules layer.** A
server reaches it through the same object-storage API it would use anywhere on
this provider; what this component adds is a governed **client-direct** path, so
a client can upload and download without a service in the middle and without the
product issuing a signed URL for every file.

That framing matters for the decision, because it means picking this is not
picking a different store. It is picking whether the client path exists.

## When the client path is worth having

- **The client uploads user content routinely** — photos, documents, recordings.
  The alternative is a signed URL per upload, which is a round trip to a service
  the client-direct path removes.
- **Ownership is expressible as a path.** A user's own files under their own
  prefix is a rule of two lines; anything more conditional belongs to a service.
- **The identity provider is already this provider's.** The rules evaluate the
  same identity, so the two together give something neither gives alone.

## When it is not

- **Authorization is not path-shaped.** A share, a team, an expiring grant, a
  moderation state — anything where "may this user read this object" needs to
  consult the datastore is a service's decision. Rules can read a document to
  decide, and that read is billed and on the latency path of every access, which
  makes it a poor place for real logic.
- **The upload has to be processed or validated before it counts.** Then the
  service is in the path anyway, and the client-direct path buys nothing.
- **Server-only content.** Exports, backups, generated artifacts: use the bucket
  through the server path and never wire the rules layer at all.

Both paths in one product is normal — user content client-direct under a
per-user prefix, everything else server-mediated. Decide per bucket, and say
which in the blueprint.

## The signed-URL fallback stays

Even with the client path, a signed, expiring URL issued by a service that
authorized the request is the answer whenever a client needs an object it does
not own the path to. That is the contract's mechanism
(`assets/contracts/object-storage.md`), it does not go away, and it is always
the answer in preference to opening a bucket.

## What this does not decide

**What is stored, for how long, and what happens on delete.** Entities,
retention and PII are blueprint contracts authored per product; this component
provides the mechanisms they choose between.
