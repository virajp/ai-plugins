# Artifact — GKE

**The same container image a request-scoped deploy would use.** One shared
multi-stage build per repo, parameterized by the target project, pushed to
**Artifact Registry**. The platform changes; the artifact does not — which is
what keeps a migration between the two compute targets a rewrite of the
deployment description rather than of the build.

## One build file per repo, not one per project

The build builds the workspace once, prunes to the target project's production
closure, and produces a minimal runtime image. One file per deployable project
drifts: a fix lands in one and not the others, and nobody notices until a deploy
behaves differently.

Set a cleanup policy on the registry repository **at creation**. Image storage
accrues quietly, and here it accrues faster, because a cluster typically holds
more deployables than a set of independent services does.

## The digest is the artifact

The image carries **no environment-specific configuration**, so the **same
digest is promoted** across environments rather than rebuilt. A rebuild, however
deterministic the inputs look, is a different artifact that nobody tested.

Two rules follow, and the second is the one Kubernetes makes easy to get wrong:

- **Reference by digest in the manifest, never by a mutable tag.** A tag can be
  moved, and here the consequence is worse than elsewhere: a restarted pod pulls
  whatever the tag now points at, so a cluster can end up running two code
  versions with no deploy having happened.
- **The image pull policy follows from that.** With digests pinned, pulls are
  deterministic; with a floating tag they are a race against whoever pushed last.

## What goes in the image

The runtime and the application's production closure, and nothing else. Build
tooling, test fixtures and the package manager's cache belong to the build
stage — they inflate every pull and every cold start and widen the surface a
vulnerability scanner reports on.

**The ignore file is a correctness file, not a speed one.** It is what keeps host
build state and credentials out of published layers; a local environment file
copied in by a wide `COPY` is a leaked secret in a registry, and no later layer
removes it.

## Where this sits relative to the neutral component

The provider-neutral `deploy-target/container-image` component states the same
image contract for a host that belongs to no cloud. A product on GKE does not
need both — this file is that contract as it applies here.
