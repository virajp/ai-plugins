---
axis: deploy
name: OCI image · any container host
artifact: container-image
private_plane: network-policy
---

# Deploy — OCI image · any container host

A **provider-neutral** deploy target: build a standard OCI image, push it to any
registry, run it on any host that runs containers (a managed container service,
a scheduler, or a plain VM). The option to pick when the product must not be
tied to one cloud.

## Artifact

One shared multi-stage Dockerfile per repo, parameterized by the target project.
It builds the workspace, prunes to that project's production closure, and
produces a minimal runtime image. The image is the only deploy artifact, and it
carries no provider-specific entrypoint or agent.

## Pipeline

Image → any OCI registry → the host's own release mechanism, wrapped in mise
`release:*` tasks so the same command runs locally and in CI. Keeping the
release behind a task is what makes the host swappable: the workflow calls the
task, not the provider's CLI.

Deploys obey the delivery-pipeline contract
(`${CLAUDE_PLUGIN_ROOT}/assets/delivery-pipeline.md`): tag-triggered only,
shaped `<project>-<env>-v<semver>`, branch-validated, and gated on the tagged
project's tests plus its dependents'.

## Configuration and secrets

Injected as environment variables by the host. The image contains no
environment-specific configuration, so the same digest is promoted from
`staging` to `production` rather than rebuilt — which is what makes the tested
artifact the released artifact.

## Private plane

A project that must not be publicly reachable is kept off the public network at
the infrastructure layer — a private network, an ingress allowlist, or a mesh
policy — rather than relying on application auth alone.

## Health

Every deployed project exposes the readiness endpoint the `health` harness
capability requires; the host's liveness/readiness probes point at it.

## Client-distributed projects

A `frontend` project does not deploy here — it ships through its platform's
store or update channel. Record that channel in `architecture.md`; nothing in
this axis applies to it.
