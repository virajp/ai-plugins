---
axis: deploy
name: Google Cloud Run · Artifact Registry
artifact: container-image
private_plane: cloudflare-zero-trust
---

# Deploy — Google Cloud Run · Artifact Registry

Where and how each project ships. Independent of what a project is written in
(the project axis) and of what it talks to (the backing axis).

## Artifact

One shared multi-stage Dockerfile for every deployable, parameterized by
`APP_NAME`. It builds the workspace, prunes to the target project's production
closure, and produces a distroless-style runtime image.

## Pipeline

Image → **Artifact Registry** → **Cloud Run**, released by `gcloud run deploy`
behind mise `release:*` tasks so the same command runs locally and in CI. One
Cloud Run service per deployable project.

Deploys obey the delivery-pipeline contract
(`${CLAUDE_PLUGIN_ROOT}/assets/delivery-pipeline.md`): tag-triggered only,
shaped `<project>-<env>-v<semver>`, branch-validated, and gated on the tagged
project's tests plus its dependents'.

## Private plane

A project that must not be publicly reachable — an operator back-office, an
internal tool — runs as a **private** Cloud Run service behind
[Cloudflare Zero Trust Access](https://www.cloudflare.com/zero-trust/) on its
own hostname. The admin plane is invisible to the public internet rather than
merely authenticated.

## Health

Every deployed project exposes the readiness endpoint the `health` harness
capability requires; Cloud Run's own health checking is pointed at it.

## Client-distributed projects

A `frontend` project does not deploy here — it ships through its platform's
store or update channel. Record that channel in `architecture.md` and pin
`deploy_template: n/a`. The one exception is a `cli` frontend, which ships to a
package registry: it pins `deploy/npm-package` instead.
