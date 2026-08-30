---
axis: deploy
name: GKE Autopilot · Artifact Registry
artifact: container-image
private_plane: private-cluster-internal-lb
---

# Deploy — GKE Autopilot · Artifact Registry

Managed Kubernetes, for products that have outgrown per-service autoscaling or
need workloads Cloud Run cannot host: long-lived stateful processes, sidecars,
custom networking, operators, or scheduling you control.

**Take this deliberately.** It is a larger operational surface than `cloud-run`
and carries a per-cluster cost floor that makes a small deployment markedly more
expensive. If every workload is a stateless HTTP service, `cloud-run` is the
better answer and stays the better answer for longer than most teams expect.

Autopilot over Standard unless you need node-level control: Autopilot removes
node management and bills pod requests rather than nodes, which is both simpler
and closer to how the workload is actually sized.

## Artifact

The same container image as `cloud-run` — one multi-stage Dockerfile per repo,
pushed to **Artifact Registry**, promoted by digest across environments. The
platform changes; the artifact does not, which is what keeps a migration between
the two targets tractable.

## Pipeline

Image → Artifact Registry → cluster, applied behind mise `release:*` tasks.
Manifests are versioned in the repo and rendered per environment; the release
task applies them, so the same command runs locally and in CI.

Deploys obey **vwf's delivery-pipeline contract** — deliberate rather than
branch-pushed, branch-validated, tests gated; the recommended trigger is a
`<project>-<env>-v<semver>` tag. CI belongs to the
CI system pinned on the project's `cicd` axis.

Cloud Deploy is available for progressive rollouts across environments; it earns
its complexity only once promotion between several environments is a routine
event rather than an occasional one.

## The cost model people get wrong

Autopilot bills **pod CPU/memory requests, not usage**. Over-requesting is
invisible — the workload runs fine and the bill is silently multiplied — and it
is the default outcome of copied manifests, because example manifests are sized
for examples.

Right-size requests against observed usage, and revisit after the first week of
real traffic. Add the per-cluster management fee on top: below a certain scale,
that fee alone exceeds the entire Cloud Run bill for the same workload.

## Identity

**Workload Identity Federation** binds a Kubernetes service account to a Google
service account, so pods get short-lived credentials with no key material in the
cluster. Never mount a service-account JSON key as a secret — it is a permanent
credential sitting in etcd. One Google service account per workload, scoped to
what that workload uses. See `gcp-iam`.

## Private plane

A **private cluster** — nodes without public IPs — with workloads exposed
through an internal load balancer, and IAP or an external LB with Cloud Armor
where public access is genuinely required. Network policy restricts pod-to-pod
traffic; the default is allow-all, which is rarely what anyone intends.

## Health

Readiness and liveness probes point at the endpoint vwf's `health` capability
requires. Readiness gates traffic, liveness restarts — configuring one as the
other is the most common cause of restart loops under load.

## Local development

You are testing your process, not the platform: run the container directly
against the backing stack's local services. A local Kubernetes cluster
reproduces manifests, not application behavior, and is rarely worth the
iteration cost — bring one in only when the thing under test *is* the manifest.
