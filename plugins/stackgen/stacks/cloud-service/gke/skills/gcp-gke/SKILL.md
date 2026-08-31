---
name: gcp-gke
version: 0.1.0
category: development
description: GKE Autopilot as this product's deploy target — when managed
  Kubernetes is worth its operational surface and when the request-scoped target
  still wins, why the bill follows pod requests rather than usage, the image
  contract, manifests behind mise tasks, workload identity, and readiness versus
  liveness. Use when deploying to, sizing, or debugging a GKE workload.
license: MIT
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# GKE Autopilot · Artifact Registry

Managed Kubernetes on Google Cloud. This skill carries what is GKE's alone; the
provider-wide judgment it sits on — cost doctrine, IAM, the emulator map, the
private plane — is the `gcp` skill's, cited and never restated. Kubernetes' own
API reference belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this target | [Pick & trade](references/pick-and-trade.md) |
| Writing manifests, sizing workloads, configuring the cluster | [Service doctrine](references/service-doctrine.md) |
| Explaining or reducing the bill | [Cost shape](references/cost-shape.md) |
| Giving a pod an identity, granting it access | [Identity shape](references/identity-shape.md) |
| Running a workload locally or in tests | [Local dev](references/local-dev.md) |
| Writing or changing the build file, pushing to the registry | [Artifact](references/artifact.md) |
| Wiring the release, or changing what triggers it | [Pipeline](references/pipeline.md) |
| Wiring probes and the health endpoint | [Health](references/health.md) |

**The two rules that do not wait for a reference:** resource requests are the
bill, not a hint — an over-requested workload runs fine and costs multiples. And
pod-to-pod traffic is allow-all until a network policy says otherwise.
