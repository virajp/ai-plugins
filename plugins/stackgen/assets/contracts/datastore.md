# Datastore — the capability contract

What **any** datastore has to satisfy to serve a vwf product, stated without
naming one. The instance packs under `stacks/datastore/` say how a particular
one satisfies it, and a cloud's managed flavour says the same from
`stacks/cloud-service/`.

Capability tokens realized here: `document-datastore`, `relational-datastore`.
Blueprint prose calls both of them **the datastore** — never the product name.

## What a provider must be able to do

1. **Optimistic concurrency on every mutable record.** A record carries a
   version; a write reads it, checks the expected value, and stores
   `version + 1` in the same atomic unit. A stale version fails with the coded
   conflict response rather than silently winning. Without this, two concurrent
   edits are last-write-wins and the loss is invisible.
2. **Atomic multi-record writes.** Anything that must be true together is
   written together — one transaction, one batch, one document. A provider that
   cannot do this constrains the data model, and that constraint belongs in the
   blueprint, not in a code review.
3. **Server-generated time.** Timestamps come from the store, never from a
   caller's clock. Client clocks are wrong, adversarial, and unordered relative
   to each other.
4. **A deterministic local stack.** Tests run against the real engine with a
   ready signal a task can wait on. A store that only exists as a hosted service
   fails this and forces a seam plus a fake, which is a design decision to
   record rather than a detail to discover.
5. **A migration or schema-evolution story.** Forward-only, versioned, and
   applied by an explicit step — not at process start, where two instances
   starting at once race each other.

## The access rule

A project reaches the datastore **only through the shared services layer**; no
project imports a client SDK directly. The projects depend on the interface, and
that indirection is the entire reason a provider can be swapped at all. Every
call carries a caller string, so a hot read has an owner in the telemetry.

The one deliberate exception is a client-direct provider (a store whose security
model is rules evaluated at the edge rather than a server credential). Where a
cloud plugin offers that, its template says so explicitly and says what
re-authorizes on the server side.

## What this contract does not decide

- **Which provider.** That is the user's pick from the menu — the self-hosted
  `postgres` bundle, or a managed flavour from the project's cloud plugin.
- **The data model.** Entities, relationships and lifecycle are blueprint
  contracts, authored per product.
- **The client library or ORM.** That belongs to the project's language plugin.
