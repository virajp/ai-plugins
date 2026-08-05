---
axis: deploy
name: Cloud Run · Artifact Registry
artifact: container-image
private_plane: internal-ingress-iap
---

# Deploy — Cloud Run · Artifact Registry

Serverless containers: scale to zero, no cluster to operate, one service per
deployable project. The default deploy target for a `service` or `fullstack`
project, and the right answer until a workload genuinely does not fit it.

Reach for `gke` instead when you need workloads Cloud Run cannot host — long-
lived stateful processes, custom networking, operators — or when per-service
autoscaling is no longer the unit you want to reason about.

## Artifact

One shared multi-stage Dockerfile per repo, parameterized by the target project.
It builds the workspace, prunes to that project's production closure, and
produces a minimal runtime image pushed to **Artifact Registry**.

The image is the only deploy artifact and carries no environment-specific
configuration, so the **same digest is promoted** from staging to production
rather than rebuilt — which is what makes the tested artifact the released one.
Set a cleanup policy on the repository at creation; image storage accrues
quietly.

## Pipeline

Image → Artifact Registry → Cloud Run, released behind mise `release:*` tasks so
the same command runs locally and in CI. Keeping the release behind a task is
what keeps the target swappable: the workflow calls the task, not `gcloud`.

Deploys obey **vwf's delivery-pipeline contract** — tag-triggered only, shaped
`<project>-<env>-v<semver>`, branch-validated, and gated on the tagged project's
tests plus its dependents'. CI itself belongs to the `github-actions` plugin;
Cloud Build is deliberately not part of this stack, so there is exactly one
place a pipeline is defined.

## The three settings that decide cost and behavior

- **`min-instances`** defeats scale-to-zero. One warm instance is a permanent
  charge, per service, per region. Set it for latency-critical services only —
  never as a default across every service.
- **Concurrency** is the largest lever available: raising it serves the same
  traffic from fewer instances. The default is conservative for most web
  workloads.
- **`max-instances`** is the guardrail. Without a ceiling, a runaway loop or a
  traffic spike becomes an invoice — and, against Cloud SQL, a connection
  exhaustion outage. Set it on every service.

CPU is throttled between requests unless `cpu-always-allocated` is set; use that
only for genuine in-process background work, and know it bills continuously.

## Configuration and secrets

Environment variables and mounted Secret Manager versions, injected by the
platform. Nothing environment-specific is baked into the image.

## Private plane

A project that must not be publicly reachable — an operator back-office, an
internal tool — is kept off the public internet at the infrastructure layer, not
by application auth alone: **internal-only ingress** plus **IAP** in front, or a
private service reachable only through a load balancer with Cloud Armor. Either
way the admin plane is invisible to the public internet rather than merely
authenticated.

## Identity

One service account per service, never the project default (which carries
Editor). Service-to-service calls authenticate with the caller's service account
granted `run.invoker` on the callee — no shared secret, no API key. See
`gcp-iam`.

## Health

Every deployed project exposes the readiness endpoint vwf's `health` harness
capability requires; the platform's startup and liveness probes point at it.

## Client-distributed projects

A `frontend` project does not deploy here — it ships through its platform's
store or update channel, pinning `deploy_template: n/a`. A `cli` frontend ships
to a package registry instead.
