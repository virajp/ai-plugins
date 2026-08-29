# The artifact — one build file, many deployables

## One file per repo, parameterized

A repo builds every deployable from **one shared multi-stage build file**,
taking the target project as a parameter. It builds the workspace, prunes to
that project's production closure, and produces a minimal runtime image.

One file rather than one per project because the divergence between copies
is almost always accidental. A base-image bump applied to three of five
services is a class of drift nothing catches until something breaks in only
one environment — and by then the change that caused it is weeks old.

**Parameterize what genuinely differs; do not fork the file.** What
genuinely differs is usually the project name, its entrypoint, and its
exposed port. If a second project needs a fundamentally different build, that
is worth stating as a decision rather than resolving with a copy.

## Stage the build so the runtime stage is small

The build stage carries the toolchain, the sources and the dev
dependencies. The runtime stage carries the built output and the production
closure, and nothing else — no compiler, no package manager, no source, no
test fixtures.

Two reasons, and the second is the one that matters more over time: a
smaller image pulls faster on every scale-out, and a runtime stage with no
toolchain in it has a much smaller attack surface to patch.

## Pin the base image

Pin to an explicit version, and update it deliberately as its own change. A
floating base tag makes the build non-reproducible in exactly the way that
breaks promotion — the same commit builds a different image tomorrow, so the
digest that was tested and the digest that ships stop being the same thing
for reasons nobody changed.

## Layer for the cache, deliberately

Copy the dependency manifests and install before copying the sources, so a
source-only change does not reinstall the world. This is a build-time
economy rather than a correctness rule, but it is the one that decides
whether the pipeline takes one minute or ten.

## Run as an unprivileged user

The runtime stage drops to a non-root user. A container escape is a much
smaller event when the process inside was not root, and nothing in an
application image needs to be.

## What does not belong in the build

- **No environment-specific configuration** — that is what makes one digest
  promotable.
- **No secrets, including as build arguments** — build arguments are visible
  in image metadata.
- **No provider-specific entrypoint or agent** — that would tie a
  deliberately neutral artifact to one host.
- **No test execution** — the pipeline runs tests, against the artifact or
  before it; a build that also tests conflates two failures.
