---
type: vwf-architecture
title: virajp-plugins — Architecture
description: System shape and the machine-readable Project Registry.
status: draft # draft | reviewed | stable
---

# virajp-plugins — Architecture

> **The human-readable system shape.** Lives at
> `docs/blueprint/architecture.md`. The machine-readable **Project Registry** is
> its own file — `docs/blueprint/registry.yaml` — which is what `blueprint`,
> `plan`, and `execute` parse; they never read this doc. Every registry project
> appears here as prose and as a diagram node, and nothing appears here that the
> registry does not have.

## System Overview

The system is a method for a coding agent to build products: a multi-agent
plugin toolkit, plus a small installer that delivers it. It has two projects,
and both run entirely on a developer's own machine — there is no hosted runtime
and nothing ships to a device app store, so there is no cloud-hosted vs.
client-device split to describe.

`plugins` and `installer` share no code; the workspace links them for tooling
only, never at runtime.

```mermaid
flowchart LR
    installer["installer (cli)"] -->|delivers| plugins["plugins (plugin)"]
```

## Projects

### plugins

The plugin toolkit itself: the extension points an agent host loads directly
into a developer's own session. It includes a private, never-published tooling
surface that runs straight from a checkout — it generates the toolkit's catalog
manifest from the individual extension manifests, and statically validates the
authored tree against a fixed set of rules. That tooling has no purpose
independent of the tree it checks, so it is part of this project's build surface
rather than a project of its own. It runs on every commit locally and on every
push in continuous integration.

### installer

A one-shot command-line tool that delivers `plugins` onto a developer's machine:
it sequences the agent host's own catalog-registration and extension-install
commands. It has no runtime relationship to the extensions it installs beyond
that sequencing.

## How Projects Interconnect

`installer` delivers `plugins`; it does not call it, and neither imports code
from the other. That is a delivery relation, not a build or call edge, which is
why both projects declare no dependency on each other in the registry —
`depends_on` records call and build edges, and this relationship is neither. It
is recorded here in prose deliberately, since a registry field for "delivers"
was considered and deferred until some behaviour needs to branch on it.

## Hosting & Deployment

The two projects ship by completely different routes, and this is the most
important shape fact about the system:

- **`plugins` is served directly from its source location**, not built, and has
  no deploy target: what a developer installs is whatever the project's default
  published line currently holds. The continuous-integration workflow that
  validates every push is the only guarantee behind it.
- **`installer` is published to a package registry** on a version tag, using
  short-lived, workflow-scoped credentials rather than a stored secret, so
  provenance is attached automatically. The publish step is idempotent — it
  skips rather than fails when that version already exists.

## Registry

The machine-readable system description lives in
[registry.yaml](./registry.yaml) — projects, capabilities, dependencies, and the
cross-cutting selections. It is authoritative; this doc is its prose view.
