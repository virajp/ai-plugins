---
axis: topology
name: Monorepo
slug: monorepo
blueprint_root: the repo root
submodules: false
---

# Topology — Monorepo

One VCS repository containing several **independently-buildable** projects that
share tooling, dependency resolution, and atomic cross-project commits.

## Layout

```text
my-product/
├── docs/blueprint/   # the vwf bundle
├── .config/          # mise config, vwf.yaml
├── projects/         # deployable projects
│   ├── api/          # role: service
│   ├── worker/       # role: worker
│   ├── web/          # role: site
│   └── ops/          # role: fullstack + operator-rbac
└── packages/
    └── common/       # role: packages
```

Deployables under `projects/`, shared libraries under `packages/`. The grouping
is a convention `/vwf:setup` proposes, not a hard requirement — a repo that
already groups its projects differently records what it has.

`docs/blueprint/` lives at the repo root.

## What makes this a monorepo rather than a polyrepo

**One dependency graph and one release cadence.** Every project resolves
dependencies together, and an atomic commit can change several at once. When
that stops being true — a project on a different toolchain, or one whose release
cycle cannot sync with the others — the product wants the **polyrepo** shape
instead.

## Repo tooling

The `repo` stack axis carries the package manager, task runner, and workspace
wiring. Since all projects share it, there is exactly one `repo.stack` block.

## Adding and removing projects

Adding a project is a registry entry plus a directory. Removing one **archives**
its flows and entities under `docs/blueprint/archived/` — vwf never deletes
blueprint docs — and recomputes the coverage stamp without them.
