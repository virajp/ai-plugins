# Cloudflare — cost doctrine

The provider-wide billing principle. A service's own cost shape cites this
rather than restating it.

## The principle: seats, not traffic

Every other cloud in this taxonomy bills consumption — requests, CPU
seconds, gigabytes stored. Cloudflare's Zero Trust surface bills the
**population allowed through**: a seat per user, independent of how many
requests they make. The cost of the private plane is therefore a function
of the org chart, not of load.

Two consequences follow directly, and they are the whole doctrine:

1. **It is cheap for an operator plane.** A back-office, an internal API,
   a metrics UI — the population is the team, the bill is the team, and
   traffic growth does not move it.
2. **It is the wrong shape for anything customer-facing.** A seat per
   customer is a per-user tax on the product's own users, and it arrives
   alongside a second identity system to keep in step with the first.
   This is the same conclusion the scoping rule reaches from the security
   direction, which is what makes it worth trusting.

Never write dollar figures anywhere. They change, and a stale figure reads
as authoritative in a way a stale principle does not.

## The guardrail: a seat is freed by an act, not by disuse

A seat stays consumed until the user is removed from it. Access expiring,
the user leaving the identity provider, or simply nobody logging in for a
quarter do **not** free it. So offboarding is a billing event as well as a
security one, and the two have the same remedy — which is the argument for
sourcing the allow rule from a group the organisation already maintains
rather than from a list kept here. Remove someone from the group and both
problems close together; keep a second list and both stay open.

The review to run, on whatever cadence the product reviews anything: list
the consumed seats, diff them against the group the policy allows, and
account for every seat with no matching member. A seat with no member is
either a leftover to reclaim or a grant nobody can explain, and both are
worth finding.

## Environment attribution

Staging behind the proxy consumes seats from the same pool production
does. That is easy to forget when a pre-production environment is added
quietly, and it is why the service credential a staging test run presents
is worth preferring over seats for the people who watch that run — a
credential is not a seat.

## What this doctrine deliberately does not cover

The bill for **where the product actually runs**. Cloudflare fronts a
service here; the hosting cloud's own cost doctrine owns the compute,
the storage and the egress, and this component says nothing about them.
