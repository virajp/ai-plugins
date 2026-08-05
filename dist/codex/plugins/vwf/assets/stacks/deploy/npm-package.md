---
axis: deploy
name: Package registry · npm
artifact: npm-package
private_plane: scoped-private-package
---

# Deploy — Package registry · npm

The target for a project users **install** rather than one you run: a CLI, or a
library published outside the workspace. The registry is the host; there is no
environment to deploy into and nothing to keep warm.

## Artifact

One published package per project, built from the workspace and pruned to what
consumers need — the `files` allowlist, the `bin` entry for a CLI, and an
`exports` map for a library. The tarball is the only artifact; it carries no
environment-specific configuration, because a published version is immutable and
the same version is what every consumer resolves.

## Pipeline

Build → `publish`, wrapped in mise `release:*` tasks so the same command runs
locally and in CI.

Publishes obey the delivery-pipeline contract
(`%%AI_PLUGINS_ROOT%%/assets/delivery-pipeline.md`): tag-triggered only,
shaped `<project>-<env>-v<semver>`, branch-validated, and gated on the tagged
project's tests plus its dependents'. Two rules are specific to a registry:

- **Publish from CI with a trusted publisher (OIDC)** rather than a stored
  token, so provenance is attached automatically and no long-lived credential
  exists to leak.
- **The publish step is idempotent** — a version already on the registry is a
  skip, not a failure. Tag re-points and re-runs are then safe, which matters
  because a registry publish cannot be rolled back, only superseded.

## Versioning

The published version **is** the release record — semver, and the same number
the tag carries. A version is never republished with different contents; a
mistake ships as the next patch. There is no promotion between environments: a
`staging` publish is a prerelease tag (`1.4.0-rc.1`) on the same line, not a
separate artifact.

## Configuration and secrets

None ship in the package. A CLI reads configuration from its own flags,
environment, and per-user config file at run time on the user's machine — so the
`environment.md` catalog for this project names what it *reads*, and the package
itself embeds nothing. A published secret is unrecallable; the registry is the
one target where a leak cannot be revoked by redeploying.

## Private plane

A package that must not be public is published **scoped and private** to the
organization, or to a private registry. There is no network layer to hide behind
here: publication *is* the exposure, so the access setting is the whole control.

## Health

Not applicable — nothing is running to probe, so this project carries no entry
under `environments:` and no `harness.health` path. `$verify` has no URL to
probe for it and says so rather than reporting a failure.

The equivalent post-release check belongs in the pipeline, not in `verify`: an
**install smoke test** that installs the published version from the registry
into a clean environment and runs its entrypoint. Make it the last step of the
publish job — it is the only check that exercises what consumers actually
resolve, rather than what the workspace built.
