# Pick & trade — Cloud Run

## When this is the answer

A stateless HTTP workload, one service per deployable project, that should cost
nothing when nobody is using it. That describes most backend services and most
server-rendered frontends, which is why this is the **default** compute target
on this provider and stays the better answer for longer than most teams expect.

What it buys, concretely: no cluster to operate or upgrade, request-based
autoscaling including down to zero, a built-in authenticated URL with no load
balancer to pay for, and an identity attached to the service so no credential
has to be stored.

## When it stops being the answer

Reach for `gcp-gke` instead when the workload genuinely does not fit:

- **Long-lived stateful processes** — anything that holds state between requests,
  or must keep running when no request is in flight.
- **Sidecars and custom networking** beyond what a single container plus egress
  settings can express.
- **Operators, or scheduling you control** — the workload's placement is part of
  its correctness.
- **Per-service autoscaling is no longer the unit you want to reason about** —
  you are managing a fleet rather than a set of independent services.

Do not migrate for cost alone. The pod-scheduled alternative carries a
per-cluster floor that makes a small deployment markedly more expensive, so
below a certain scale that fee alone exceeds the entire request-scoped bill for
the same workload.

## What does not deploy here at all

A **client-distributed project** — a mobile, desktop or web app shipped through
a store or an update channel — has no server-side deploy target. A **CLI**
frontend ships to a package registry. Both record the distribution channel in
the architecture doc and pin `deploy_template` accordingly rather than pointing
at this component.

## The choice that is not this one

Choosing a "function" flavour over a "service" flavour changes the deployment
unit, not the meter: both run on the same request-scoped billing model. Pick
whichever matches how the code is organized, and do not expect the cheaper
sound of one to be a cost decision.
