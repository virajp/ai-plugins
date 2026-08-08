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

Exactly **one** project in `registry.yaml`, carrying whatever `role` fits
(`service`, `fullstack`, `frontend`, …). `depends_on` is always empty — there is
nothing else in the product to depend on.

## When this is the right shape

- The product is a single deployable: one API, one app, one site.
- A library published on its own (`role: packages`).
- An early product that has not yet split. Growing into a monorepo later is a
  normal migration, not a failure of this choice.

## When to grow out of it

The moment a second independently-buildable project appears, this becomes a
**monorepo** — one repo, several projects. Re-run `$setup` to record the
change; nothing in `docs/blueprint/` moves, since flows are keyed on project
*name* and the first project keeps its name.
