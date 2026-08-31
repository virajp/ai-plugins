# Cost shape — GKE

The provider-wide principle, the six day-one guardrails and the four-question
cost review are the `gcp` skill's cost-doctrine reference. This file states only
what is this service's own. No dollar figures — the billing model and its trap
are what stay true.

## The meter

Autopilot bills **pod CPU and memory requests**, plus a **per-cluster management
fee**.

Two things follow from that, and between them they account for nearly every
surprise on this service.

## The trap: you pay requests, not usage

Over-requesting is **invisible**. The workload runs fine, every dashboard looks
healthy, and the bill is silently multiplied by however far the request exceeds
the need. Nothing surfaces it except looking.

It is also the *default* outcome, because manifests are copied and example
manifests are sized for examples. Treat every request value arriving from
outside the repo as a placeholder, and set it against measured usage after the
first week of real traffic.

The corollary is the good news: **right-sizing is the single largest lever on
this service**, it is a values change rather than a rewrite, and it is
repeatable as traffic changes.

## The floor: the per-cluster fee

A cluster costs its management fee whether or not anything is scheduled on it.
Below a certain scale that fee alone exceeds the entire bill a request-scoped
service would have charged for the same workload — which is why "we moved to
Kubernetes to save money" is almost always backwards, and why a per-environment
cluster is a decision to take on purpose rather than by symmetry with the
one-project-per-environment guardrail.

Where several environments genuinely need isolation, namespaces with network
policy and separate identities are the cheaper answer; separate clusters are the
stronger one. Pick against the threat, not against habit.

## What is not on this meter but lands on the bill

- **Load balancers.** Each one is a standing charge, and an ingress that creates
  one per service adds them faster than anyone tracks.
- **Egress**, including cross-region chatter between your own services.
- **Persistent volumes**, which outlive the pods that created them and are a
  classic orphaned cost.
- **Whatever the workloads call.** As everywhere on this provider, the datastore
  reads on the hot path are usually the larger line.
