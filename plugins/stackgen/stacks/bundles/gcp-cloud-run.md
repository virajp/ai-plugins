---
name: Google Cloud · Cloud Run · Artifact Registry
axis: deploy
kind: cloud-provider
components:
- cloud-provider/gcp@0.1.0
- cloud-service/cloud-run@0.1.0
artifact: container-image
---

# Deploy — Google Cloud · Cloud Run · Artifact Registry

Serverless containers: scale to zero, no cluster to operate, one service per
deployable project. The **default** deploy target for a service or fullstack
project on this provider, and the right answer until a workload genuinely does
not fit it.

Reach for `gcp-gke` instead when the workload needs what a request-scoped
platform cannot host — long-lived stateful processes, sidecars, custom
networking, operators — or when per-service autoscaling is no longer the unit
you want to reason about. Do not move for cost: the pod-scheduled alternative
carries a per-cluster floor that makes a small deployment markedly more
expensive.

**The composition is one provider component plus one compute service.** The
provider carries what spans its services — the cost principle and the day-one
guardrails, keyless workload identity, the private-plane mechanisms — and the
compute component **cites it rather than restating it**. That is why a Cloud-Bundle
on the deploy axis still names the provider: the networking and identity
doctrine a deploy target needs is provider-wide, not target-specific.

## What this bundle decides that no component decides alone

**The artifact is a container image, promoted by digest.** One shared multi-stage
build per repo, parameterized by target project, pushed to Artifact Registry.
The image carries no environment-specific configuration, so the **same digest is
promoted** from staging to production rather than rebuilt — which is what makes
the tested artifact the released one. Configuration and secrets arrive from the
platform at deploy time.

**The release runs behind mise tasks, and there is exactly one pipeline.** The
workflow calls the task; the task is the only thing that knows which provider is
on the other end, which is what keeps the target swappable. The provider's own
build service is deliberately not part of this stack, so there is one place a
pipeline is defined and one place to look when a release surprises someone.

**The trigger is not this bundle's decision.** Deploys obey vwf's
delivery-pipeline contract — deliberate rather than branch-pushed,
branch-validated, tested before release — and *what fires the task* belongs to
the CI system pinned on the project's `cicd` axis, behind
`assets/contracts/release-trigger.md`. The recommended default is a
`<project>-<env>-v<semver>` tag.

**A client-distributed project does not deploy here.** A frontend ships through
its platform's store or update channel and a CLI frontend to a package registry;
both record the channel in the architecture doc and pin `deploy_template`
accordingly rather than pointing at this bundle.

**The local stack is not here either.** Containers do two unrelated jobs, and
this bundle is the deploy artifact. The local stack belongs to the backing
bundle and to `assets/contracts/local-stack.md`; running this image locally is
just running the process under test.

Full judgment: each component's own skill and its references.
