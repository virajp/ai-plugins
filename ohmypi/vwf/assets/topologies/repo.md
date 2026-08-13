---
axis: topology
name: Single repo
slug: repo
blueprint_root: the repo root
submodules: false
---

# Topology — Single repo

One codebase, deployed as a whole. The simplest shape vwf supports, and the
right answer for a product that is one deployable.

## Layout

```text
my-product/
├── docs/blueprint/   # the vwf bundle
├── .config/          # mise config, vwf.yaml
└── src/              # the one project
```

`docs/blueprint/` lives at the repo root, because the repo *is* the product.

## Registry

Exactly **one** project in `registry.yaml`, carrying whatever `role` and
`platforms` fit. `depends_on` is always empty — there is nothing else in the
product to depend on. One project may still declare several platforms: a single
codebase shipping mobile, desktop and web is one project with four platforms,
and stays a single repo.

**Except `iac`.** A project with `platforms: [iac]` is never that one project's
neighbour: it is its own repo, always. A single-repo product that provisions its
own infrastructure as code therefore has **two** repos — the product, and the
IaC one beside it — which makes it a small multi-repo product, not a single
repo. This is
the one structural rule vwf enforces rather than offers: `/skill:vwf-doctor` raises a
violation as **blocking**, and `/skill:vwf-setup` offers a consent-gated restructure.
The reasoning — blast radius, credentials, lifecycle, cadence — is in
[monorepo](monorepo.md), and holds identically here; a smaller product does not
make an accidental teardown of the live environment smaller.

## When this is the right shape

- The product is a single deployable: one API, one app, one site.
- A library published on its own (`platforms: [packages]`).
- An early product that has not yet split. Growing into a monorepo later is a
  normal migration, not a failure of this choice.

## When to grow out of it

The moment a second independently-buildable project appears, this becomes a
**monorepo** — one repo, several projects. Re-run `/skill:vwf-setup` to record the
change; nothing in `docs/blueprint/` moves, since flows are keyed on project
*name* and the first project keeps its name.
