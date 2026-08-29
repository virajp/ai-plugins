# Object storage — the capability contract

What **any** object store has to satisfy to serve a vwf product, stated without
naming one. Unlike every other capability plugin, this one ships **no provider
template of its own** — see below for why, because that absence is a decision
rather than a gap.

Capability token realized here: `object-file-storage`. Blueprint prose calls it
**object storage** — never the product name.

## Why there is no vendor-neutral template here

Every object store worth using belongs to a cloud. There is a widely-implemented
wire protocol, but a protocol is not a stack template: it names no lifecycle
policy, no consistency guarantee, no egress price, no retention mechanism — and
those are exactly the decisions a template exists to record.

Writing a "compatible" template would therefore mean writing prose that is true
of nothing in particular, and a product would adopt it believing a decision had
been made. So the flavour comes from the **project's cloud plugin**, and this
plugin owns the contract that flavour must satisfy.

That is a stated position, not an empty result. The menu says it out loud on
every answer, because a menu that comes back short with no explanation is
indistinguishable from a broken adapter — which is the exact silent failure the
stack-adapter contract exists to prevent.

## What a provider must be able to do

1. **Serve bytes without the application in the path.** Uploads and downloads
   go **direct**, authorized by a short-lived signed URL the product issues. An
   application that proxies file bytes has turned a storage bill into a compute
   bill, a memory limit and a timeout.
2. **Express lifecycle as a bucket policy.** Expiry, tiering and versioning are
   set **at bucket creation**, not implemented in application code. A retention
   rule that lives in a cron job is a retention rule that stops running.
3. **State its consistency.** Whether a read immediately after a write is
   guaranteed to see it, and whether a delete is immediate, changes what a flow
   may assume. It goes in the contract, not in a comment.
4. **Bound access by prefix.** A credential scoped to the whole bucket is a
   credential that reads every tenant's files. Prefixes are the authorization
   boundary, and they must be designed with the key layout.
5. **Price egress, and say so.** Storage is cheap and reading it back is not.
   Egress is the line that surprises products, and it is a design input for
   anything media-heavy.

## What the product decides, whatever the provider

- **The key layout**, because it is the security boundary and it is effectively
  immutable once objects exist.
- **Whether an object is user-visible**, and therefore whether a signed URL is
  ever long-lived. It should not be.
- **What happens on delete** — hard delete, tombstone, or lifecycle expiry —
  which is a data-retention and PII decision, not a storage one.
- **Content-type and size limits at issue time.** Signing an unconstrained
  upload URL is signing a blank cheque.

## The access rule

A project reaches the store **only through the shared services layer** — no
project imports a vendor SDK directly. Signing happens there, once, so the
expiry and the constraints are decided in one place rather than per caller.

## What this contract does not decide

- **Which store.** It comes from the project's cloud plugin; no bundle here has
  a candidate to offer, and this contract does not pretend otherwise.
- **What is stored.** Entities, retention and PII are blueprint contracts,
  authored per product.
- **The client library.** That belongs to the project's language plugin.
