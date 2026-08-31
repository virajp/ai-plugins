# Cost shape — Cloud Storage for Firebase

The provider-wide principle, the six day-one guardrails and the four-question
cost review are the `gcp` skill's cost-doctrine reference. This file states only
what is this service's own. No dollar figures — the billing model and its trap
are what stay true.

## The meter

Billed per **stored byte by storage class**, per **operation**, and per **byte
of egress**.

Three terms, and products routinely model only the first — which is the one that
matters least.

## Trap one: egress is the bill, not storage

Storage is cheap and reading it back is not. For anything media-heavy — images
on a feed, video, downloadable documents — egress dominates, and it scales with
usage rather than with content, so it grows exactly when the product is
succeeding.

The controls are architectural rather than configurational: put a CDN in front
of anything read repeatedly, so the byte leaves storage once and the cache
serves it thereafter. Serve appropriately-sized derivatives rather than
originals — a thumbnail served as a full-resolution image is the same failure as
reading a hundred documents to show ten fields. And keep the reader in the same
region as the bucket, since cross-region traffic between your own services is
billable.

## Trap two: class transitions and early deletion carry minimums

Colder storage classes carry a **minimum storage duration**. Moving data to a
colder class and then deleting it soon after can cost **more** than leaving it
where it was, because the minimum is charged regardless.

So a lifecycle policy that tiers aggressively and expires aggressively is a
policy that pays both. Set the tiering threshold and the expiry threshold
against each other, not independently, and be sure the data being tiered is
genuinely cold rather than merely old — a colder class also charges retrieval.

## Trap three: operations are metered, and listing is an operation

A job that lists a large prefix to find something is paying per listing, and
paying repeatedly if it polls. Where the product needs to know what exists, the
datastore knows — the object is not the record, and the record is cheaper to
query.

## The control that goes in first

**Lifecycle rules at bucket creation.** It is one of the provider's six day-one
guardrails, and on this service it is the only thing standing between the
product and a store that grows monotonically forever. An object nothing deletes
is a cost that only rises, and retrofitting a policy over an existing bucket
means reasoning about data you no longer remember writing.
