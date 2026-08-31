# Pick & trade — Cloud SQL

## When this is the answer

Three signals, any one of which is enough:

- **The data model has real relationships.** Joins, referential integrity and
  constraints enforced by the store rather than by every caller.
- **Reporting and ad-hoc queries matter.** A question nobody anticipated should
  be answerable without a migration or a new denormalized copy.
- **The product must stay portable off this provider.** Postgres has a
  self-hostable engine and a managed equivalent on every cloud; a proprietary
  document store does not.

Against the document-store option in this bundle, that last point is usually the
decisive one, and the trade is explicit: **no client-direct access, and no
emulator** — local development runs Docker.

## When it stops being the answer

- **The access pattern is a key lookup at very high volume**, and the
  relationships are not being used. A managed key-value or document store is
  cheaper and scales without a connection limit.
- **The product wants clients to subscribe to changes.** There is no
  client-direct path here at all, so a realtime UI needs a different store or a
  service-mediated channel in front of this one.
- **Write throughput exceeds what a single primary sustains.** That is a
  genuine ceiling rather than a tuning problem, and the answer is a different
  store shape rather than a bigger instance.

## The higher-floor sibling

The provider offers a Postgres-compatible option built for larger workloads,
with a materially higher cost floor. Its differences are performance, not
semantics — so it is rarely the right answer for a product that has not already
outgrown this service, and moving to it later is not a rewrite. Start here.

## Analytics is not this service's job

Reporting queries against the transactional instance compete with the product
for the same connections and the same CPU. Modest reporting is fine; a real
analytics workload belongs in a warehouse fed from here, and deciding that early
is cheaper than discovering it during an incident.
