---
name: docker
version: 0.1.0
category: development
description: Docker/OCI doctrine — one shared multi-stage Dockerfile per repo,
  the same digest promoted rather than rebuilt per environment, and Compose as
  the local stack behind `wait-on` readiness gates (vwf's one non-negotiable
  harness mechanism). Auto-applies when editing a Dockerfile, a compose file, or
  .dockerignore.
license: MIT
invocation: model
tools: Read Grep Glob Edit Write Bash
paths:
  - "**/Dockerfile"
  - "**/Dockerfile.*"
  - "**/*.dockerfile"
  - "**/.dockerignore"
  - "**/compose.yaml"
  - "**/compose.yml"
  - "**/docker-compose.yaml"
  - "**/docker-compose.yml"
---

# Docker & OCI images

Containers do two unrelated jobs in this toolkit, and conflating them is the
usual mistake:

1. **The deploy artifact** — one OCI image per deployable project, built once
   and promoted between environments. That is the `container-generic` deploy
   template this plugin ships, offered through
   `<%= it.cmd("devtools:devtools-stack-menu") %>`.
2. **The local stack** — the backing services `e2e_local` needs, run under
   Compose. This is the one harness capability whose *mechanism* vwf fixes.

A repo may need either, both, or neither. A product whose `e2e_local` needs no
backing services needs no Compose file, and a `frontend` project that ships
through a store needs no image at all.

## One Dockerfile per repo, not per project

A monorepo builds every deployable from **one shared multi-stage Dockerfile**,
parameterized by the target project. It builds the workspace, prunes to that
project's production closure, and produces a minimal runtime image.

One file rather than one per project because the divergence between them is
almost always accidental — a base-image bump applied to three of five services
is a class of drift nothing catches until something breaks in only one
environment. Parameterize what genuinely differs; do not fork the file.

The image carries **no environment-specific configuration and no
provider-specific entrypoint or agent**. Configuration arrives as environment
variables from the host, which is what lets the same digest be promoted from
`staging` to `production` instead of rebuilt — and that promotion is the whole
reason the tested artifact and the released artifact are the same artifact. A
rebuild per environment quietly breaks that guarantee while still passing every
test.

## `.dockerignore` is a correctness file

Treat it as load-bearing, not housekeeping. It excludes `node_modules/`,
build output, `.git/`, and anything holding local credentials. Two failures it
prevents: a host `node_modules` shadowing the image's own install (platform-
specific binaries, silently wrong), and a `.env` reaching a published layer.

## The local stack: Compose behind readiness gates

vwf's harness contract lets a repo name the `local_stack` task whatever it
likes, but **not** change the mechanism: when a repo needs a local stack it must
be Docker-composed services behind `wait-on` readiness gates. An ad-hoc `sleep`
is a finding, not a variant — the acceptance verifier depends on a deterministic
ready signal, and a sleep that is long enough on a laptop is short enough on a
loaded CI runner.

Which services run in the stack is the **backing** axis's decision, not this
one's. This plugin owns the wiring; the datastore, queue or identity plugin owns
what is wired.

Read [the local stack](references/local-stack.md) before writing or changing a
compose file — it carries the healthcheck/readiness shape, the gate task, and
the data-lifecycle rules a test run depends on.

## Where this stops

- **Which host runs the image** is the deploy axis's answer, not Docker's. The
  `container-generic` template is deliberately provider-neutral; a cloud plugin
  (`gcp` → Cloud Run, GKE) supplies the managed flavour.
- **Registry choice and release mechanics** live behind mise `release:*` tasks,
  so the same command runs locally and in CI. Keeping the release behind a task
  is what makes the host swappable — the pipeline calls the task, not the
  provider's CLI.
- **The pipeline itself** belongs to the `cicd` plugin. Do not write a build
  pipeline here.
