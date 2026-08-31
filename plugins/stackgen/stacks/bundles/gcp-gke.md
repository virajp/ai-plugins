---
name: Google Cloud · GKE Autopilot · Artifact Registry
axis: deploy
kind: cloud-provider
components:
- cloud-provider/gcp@0.1.0
- cloud-service/gke@0.1.0
artifact: container-image
---

# Deploy — Google Cloud · GKE Autopilot · Artifact Registry

Managed Kubernetes, for products that have outgrown per-service autoscaling or
need workloads a request-scoped platform cannot host: long-lived stateful
processes, sidecars, custom networking, operators, or scheduling you control.

**Take this deliberately.** It is a larger operational surface than
`gcp-cloud-run` and carries a per-cluster cost floor that makes a small
deployment markedly more expensive. If every workload is a stateless HTTP
service, the request-scoped target is the better answer and stays the better
answer for longer than most teams expect.

**The composition is one provider component plus one compute service.** The
provider carries what spans its services — the cost principle and the day-one
guardrails, keyless workload identity, the private-plane mechanisms — and the
compute component **cites it rather than restating it**.

## What this bundle decides that no component decides alone

**The artifact is the same container image `gcp-cloud-run` uses**, promoted by
digest across environments. The platform changes; the artifact does not, which
is what keeps a migration between the two targets a rewrite of the deployment
description rather than of the build. One rule is sharper here: **manifests
reference digests, never mutable tags** — a restarted pod pulls whatever the tag
now points at, so a floating tag lets a cluster end up running two code versions
with no deploy having happened.

**The bill follows resource requests, not usage.** Autopilot charges pod CPU and
memory requests plus a per-cluster fee, so over-requesting is invisible waste and
is the default outcome of copied manifests. Right-sizing is the largest lever on
this bundle and it is a values change, not a rewrite.

**Manifests live in the repo and are applied by a mise task**, rendered per
environment, so the same command runs locally and in CI. A change applied by hand
is a change nobody reviewed, and on this platform it survives until something
overwrites it. **One pipeline**: the provider's build service and its
progressive-delivery service can each define one, and a second, unmaintained
pipeline is how a green check comes to mean nothing.

**The trigger is not this bundle's decision.** Deploys obey vwf's
delivery-pipeline contract — deliberate, branch-validated, tested before release
— and *what fires the task* belongs to the CI system pinned on the project's
`cicd` axis, behind `assets/contracts/release-trigger.md`.

**Network policy is not optional.** Pod-to-pod traffic is allow-all until a
policy says otherwise, which on a private cluster is what turns one compromised
workload into every workload. Default-deny per namespace, then open the paths
the product uses.

**The local stack is not here.** Containers do two unrelated jobs and this bundle
is the deploy artifact; the local stack belongs to the backing bundle and to
`assets/contracts/local-stack.md`. A local Kubernetes cluster reproduces
manifests, not application behaviour, and is rarely worth the iteration cost.

Full judgment: each component's own skill and its references.
