# OTel-LGTM — pick & trade

## When it is the answer

**When telemetry must not leave the product's own infrastructure.** This is
frequently a regulatory or contractual requirement rather than a preference, and
it is decisive: a managed backend means shipping logs — which contain whatever
the product logged — to a third party. Self-hosting removes that question
entirely.

**When the same stack should run locally and in production.** This is the
quietly large advantage and it is easy to undervalue. Local telemetry is *the
same telemetry*, so a dashboard written against a local run is the dashboard
production uses, and a missing span is caught before release rather than during
an incident. Managed backends generally cannot be run on a laptop, so local
observability becomes a different, worse thing that nobody trusts.

**When a per-ingested-gigabyte bill is the wrong cost curve.** Ingest-priced
backends punish exactly the behaviour you want during an incident — turning up
detail. Self-hosted, the marginal gigabyte is disk, which is cheap and
predictable, so nobody has to decide whether debugging is worth the invoice.

**When the product already runs containers somewhere.** The incremental
operational burden of one more composed stack is much lower for a team already
operating infrastructure than for one running entirely on managed services.

## When it stops being the answer

**When nobody will operate it.** This is the whole trade. Retention is disk you
provision, capacity is yours to plan, and an unbounded label is *your outage*
rather than your invoice. A managed backend absorbs a cardinality explosion as a
surprising bill; a self-hosted one absorbs it by falling over, usually at the
moment you most wanted a dashboard.

**When the team is small and on-call is thin.** The observability stack going
down during an incident is a specific and miserable failure mode. If there is
nobody to keep it healthy, a managed backend is the more honest answer.

**When long retention is required.** Years of retained telemetry is a storage
and backup problem that grows without bound. Managed backends price it, which at
least makes it visible; self-hosted it is a capacity commitment somebody has to
keep making.

## What the choice does not commit you to

**It does not commit the product to anything.** That is the point of the
observability contract's OTLP rule: the product exports OTLP and never a vendor
SDK, so the sink is a destination, not an import. Moving from a self-hosted LGTM
stack to a managed backend later is a collector configuration change, not a code
change — provided nobody ever imported a vendor SDK "just for this one metric".
