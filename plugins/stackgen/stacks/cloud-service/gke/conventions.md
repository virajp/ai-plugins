# GKE Autopilot · Artifact Registry — conventions

Managed Kubernetes, for products that have outgrown per-service autoscaling or
need workloads a request-scoped platform cannot host: long-lived stateful
processes, sidecars, custom networking, operators, or scheduling you control.

**Take this deliberately.** It is a larger operational surface than a
request-scoped service and carries a per-cluster cost floor that makes a small
deployment markedly more expensive. If every workload is a stateless HTTP
service, the request-scoped target is the better answer and stays the better
answer for longer than most teams expect.

**Autopilot over node-managed mode** unless node-level control is genuinely
needed. It removes node management and bills pod requests rather than nodes,
which is both simpler and closer to how the workload is actually sized.

**The cost model is what people get wrong.** Autopilot bills pod CPU and memory
**requests, not usage** — so over-requesting is invisible waste, the workload
runs fine and the bill is silently multiplied. It is the default outcome of
copied manifests, because example manifests are sized for examples.

**The artifact is the same container image** a request-scoped deploy would use:
one multi-stage build per repo, pushed to Artifact Registry, promoted by digest
across environments. The platform changes; the artifact does not, which is what
keeps a migration between the two targets tractable.

**The release runs behind a mise task**, applying manifests versioned in the
repo and rendered per environment, so the same command runs locally and in CI.
Deploys obey vwf's delivery-pipeline contract; the trigger belongs to the CI
system on the project's `cicd` axis (`assets/contracts/release-trigger.md`).

**Workload identity federation binds a Kubernetes service account to a cloud
one**, so pods get short-lived credentials with no key material in the cluster.
A mounted key file is a permanent credential sitting in cluster state.

**A private cluster with an internal load balancer** is the private plane here,
and **network policy is not optional**: pod-to-pod traffic is allow-all by
default, which is rarely what anyone intends.

**Readiness gates traffic and liveness restarts.** Configuring one as the other
is the most common cause of restart loops under load.

Full judgment: the `gcp-gke` skill's references. The provider-wide half — cost
doctrine, IAM, the emulator map, the private plane — is the `gcp` skill's.
