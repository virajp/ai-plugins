# Pick & trade — GKE

## Take this deliberately

This is the larger of the two compute answers on this provider, in operational
surface and in cost floor. The honest default is the request-scoped service, and
it stays the honest default for longer than most teams expect. Pick this when a
specific requirement forces it, and be able to name which one.

## When it is the answer

- **Long-lived stateful processes** — anything that holds state between requests
  or must keep running when no request is in flight.
- **Sidecars and custom networking** beyond what a single container plus egress
  settings can express: a service mesh, a local proxy, a per-pod agent.
- **Operators, or scheduling you control** — the workload's placement, affinity
  or ordering is part of its correctness.
- **A fleet rather than a set of services** — per-service autoscaling is no
  longer the unit you want to reason about, and the product needs one scheduler
  with one view of capacity.
- **Portability of the deployment description itself**, where moving to another
  provider's managed Kubernetes is a real requirement rather than a hypothetical
  one.

## When it is not

- **Every workload is a stateless HTTP service.** Then this buys a cluster to
  operate and a management fee, and nothing else.
- **Cost.** Below a certain scale the per-cluster fee alone exceeds the entire
  request-scoped bill for the same workload. Migrating *to* Kubernetes to save
  money is almost always backwards.
- **"We might need it later."** The artifact is the same image either way, which
  is precisely what makes moving later tractable — so the option costs nothing
  to defer and does cost something to take early.

## Autopilot or node-managed

**Autopilot unless node-level control is genuinely needed.** It removes node
management and bills pod requests rather than nodes, which is simpler and closer
to how the workload is actually sized. Take node-managed mode for specific
hardware, custom kernel or node configuration, or a workload whose placement
depends on node identity — and know you have taken on node upgrades, sizing and
patching in exchange.

## The migration property worth knowing

The image is identical between this target and the request-scoped one, and the
digest-promotion contract is the same. What differs is the deployment
description: manifests here, service configuration there. So a move in either
direction is a rewrite of the description and not of the artifact — which is the
main reason to keep provider commands out of the release path and behind tasks.
