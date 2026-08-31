# Artifact — Cloud Run

## One build file per repo, not one per project

A shared multi-stage build parameterized by the target project: it builds the
workspace once, prunes to that project's production closure, and produces a
minimal runtime image. One file per deployable project drifts — a fix lands in
one and not the others, and nobody notices until a deploy behaves differently.

The image is pushed to **Artifact Registry**. Set a cleanup policy on the
repository **at creation**: image storage accrues quietly and is one of the
line items nobody models.

## The digest is the artifact

The image carries **no environment-specific configuration**, so the **same
digest is promoted** from staging to production rather than rebuilt. That is
what makes the tested artifact the released artifact — a rebuild, however
deterministic the inputs look, is a different artifact that nobody tested.

Two consequences worth stating as rules:

- **Deploy by digest, never by a mutable tag.** A tag can be moved; a digest
  cannot. A pipeline that deploys `latest` to production has no answer to what
  is running.
- **Configuration reaches the running container from the platform**, as
  environment variables and mounted secret versions. Anything baked into a layer
  is baked into every environment.

## What goes in the image

The runtime and the application's production closure, and nothing else. Build
tooling, test fixtures, source maps of dependencies and the package manager's
cache belong to the build stage, not the final one — they inflate every pull and
every cold start, and they widen the vulnerability surface a scanner has to
report on.

**The ignore file is a correctness file, not a speed one.** It is what keeps
host build state and credentials out of published layers — a local environment
file copied in by a wide `COPY` is a leaked secret in a registry, and no later
layer removes it.

## Where this sits relative to the neutral component

The provider-neutral `deploy-target/container-image` component states the same
image contract for a host that belongs to no cloud. A product on Cloud Run does
**not** need both: this file is that contract as it applies here, and the trade
the neutral component describes — portability bought by declining managed
features — is the trade taken in the other direction by picking this service.
