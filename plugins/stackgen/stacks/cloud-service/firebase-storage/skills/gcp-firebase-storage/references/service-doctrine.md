# Service doctrine — Cloud Storage for Firebase

This component realizes the `object-file-storage` capability, so what it owes is
the neutral object-storage contract
(`assets/contracts/object-storage.md`), clause by clause. The contract states
what **any** object store must satisfy; this file states how this one does,
**citing rather than restating**.

## Contract satisfaction

**Serve bytes without the application in the path.** Two mechanisms here, and
picking between them is the decision this component exists for: a **signed,
expiring URL** issued by a service that authorized the request, or the
**client-direct path** governed by rules. Either satisfies the clause. What does
not is a service that proxies file bytes — that turns a storage bill into a
compute bill, a memory limit and a timeout.

**Express lifecycle as a bucket policy.** Lifecycle rules — expiry, tiering,
versioning — are set **at bucket creation**. This is one of the provider's six
day-one guardrails for the same reason the contract states it: a retention rule
that lives in a cron job is a retention rule that stops running, quietly, and
nobody notices until the bill or an audit says so.

**State its consistency.** Object writes are strongly consistent here: a read
after a successful write sees it, and a delete is immediate. Listing is where
care is needed — a listing is not a transaction, so a flow that enumerates and
then acts must tolerate the set having changed.

**Bound access by prefix.** The **key layout is the authorization boundary**,
and it is effectively immutable once objects exist. Design it before the first
upload: a prefix per tenant, per user, or per entity, chosen so that "may this
identity touch this object" is answerable from the path alone. A credential or a
rule scoped to the whole bucket is one that reaches every tenant's files.

**Price egress, and say so.** Storage is cheap; reading it back is not. See
[Cost shape](cost-shape.md).

## Uploads

**Resumable uploads for anything a user might upload from a phone.** A
connection drops mid-upload routinely, and a non-resumable upload restarts from
zero — which the user experiences as the feature not working, and the bill
experiences as the bytes being sent twice.

**Content type and size are constrained where the upload happens.** On a signed
URL that means at issue time — signing an unconstrained upload URL is signing a
blank cheque. On the client-direct path it means in the rules, because there is
no service to check. An unbounded upload path is an unbounded bill and a denial
of service against your own storage.

**Never trust the declared content type** for anything downstream. It is
client-supplied; a service that serves it back verbatim is a stored-XSS
mechanism, so serve user content with an explicit type and disposition, from a
path that cannot execute in the product's own origin.

## The object is not the record

The product's own datastore holds the entity; the object is referenced from it.
Two consequences worth writing into the flow rather than discovering:

- **A completed upload that no record points at is an orphan**, and an orphan
  nothing cleans up is permanent. Either write the record first and the object
  second under a key the record names, or run a lifecycle rule over an
  incoming prefix that expires anything unclaimed.
- **A deleted record does not delete its objects.** What happens on delete —
  hard delete, tombstone, or lifecycle expiry — is a retention and PII decision
  the blueprint makes, and it has to be made, because the default is that the
  bytes stay forever.

## The access rule

A project reaches the store **only through the shared services layer** — no
project imports the vendor SDK directly. Signing happens there, once, so expiry
and constraints are decided in one place rather than per caller. The
client-direct path is the deliberate exception, governed by rules; see
[Identity shape](identity-shape.md).
