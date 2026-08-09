---
axis: topology
name: Polyrepo (submodule parent)
slug: polyrepo
blueprint_root: the parent repo
submodules: true
---

# Topology — Polyrepo

A **group of repos** — each itself a single repo or a monorepo — that together
build one product. The shape to pick when the product spans toolchains that
cannot share a dependency graph, or release cadences that cannot sync.

## The parent is the product root

vwf needs one place for `docs/blueprint/`, so a polyrepo is **materialized as a
parent repo whose members are git submodules**. The parent is the product; the
members are its building blocks.

```text
my-product/           # parent repo — vwf lives here
├── .gitmodules
├── docs/blueprint/   # the vwf bundle (one per product)
├── .config/          # mise config, vwf.yaml
├── backend/          # submodule — a monorepo
│   ├── projects/
│   │   ├── api/      # role: service
│   │   ├── worker/   # role: worker
│   │   └── ops/      # role: fullstack + operator-rbac
│   └── packages/
│       └── common/   # role: packages
└── app/              # submodule — a single repo (role: frontend)
```

The parent holds everything product-wide: the blueprint, mise config, CI glue,
the local stack. `/setup` and every other vwf command run **there**.

Each member is classified on its own signals per
[topology detection](%%AI_PLUGINS_ROOT%%/skills/project-setup/references/topology-detection.md)
— a member may be a monorepo or a single repo, and each carries its own
`repo.stack` block.

## An `iac` member is mandatory, not optional

A project with `role: iac` is **always its own repo** — here that means its own
submodule, never a directory inside another member and never a directory in the
parent. This is the one structural rule vwf enforces rather than offers:
`/doctor` raises a violation as **blocking**, and `/setup` offers a
consent-gated restructure. The reasoning — blast radius, credentials, lifecycle,
cadence — is in [monorepo](monorepo.md), where the rule is most surprising.

Polyrepo pays almost nothing for it: the shape already is a group of repos, so
an IaC member is one more `git submodule add`. A product that acquires an `iac`
project while on the **monorepo** shape becomes a polyrepo by that fact alone.

## The onboarding cost, stated plainly

A product whose repos are **not** already wired as submodules has to create a
parent and add them. That is real work, and it is the price of the guarantee
that every vwf gate can find one blueprint from one checkout. A product
unwilling to pay it is usually better served by the **monorepo** shape.

## When this is the right shape

- An on-device app beside server-side code: the app's store-review cadence
  cannot sync with continuous deploys, and Dart or Swift cannot share a
  dependency graph with TypeScript.
- Members with genuinely separate ownership or access control.
- A member that must stay independently cloneable — an open-source component, or
  a repo shared with another product.

## When not to

If every project shares one toolchain and ships together, a **monorepo** gives
the same structure with none of the submodule overhead. Submodules cost real
ergonomics: detached HEADs, pointer commits, and a `git clone` that needs
`--recurse-submodules`.

## Adding and removing members

Adding a member is `git submodule add` plus its registry projects. Removing one
**archives** its flows and entities under `docs/blueprint/archived/` — vwf never
deletes blueprint docs — deregisters its projects, and recomputes the coverage
stamp without them.
