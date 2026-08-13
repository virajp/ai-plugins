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
│   ├── api/          # platforms: [service]
│   ├── worker/       # platforms: [worker]
│   ├── web/          # platforms: [site]
│   └── ops/          # platforms: [service, webapp] + operator-rbac
└── packages/
    └── common/       # platforms: [packages]
```

Deployables under `projects/`, shared libraries under `packages/`. The grouping
is a convention `/skill:vwf-setup` proposes, not a hard requirement — a repo that
already groups its projects differently records what it has.

`docs/blueprint/` lives at the repo root.

## What makes this a monorepo rather than multi-repo

**One dependency graph and one release cadence.** Every project resolves
dependencies together, and an atomic commit can change several at once. When
that stops being true — a project on a different toolchain, or one whose release
cycle cannot sync with the others — the product wants the **multi-repo** shape
instead.

## The one exception: an `iac` project is its own repo

**A project with `platforms: [iac]` never lives in the monorepo.** It is an independent
repo, or a member of a product base repo — which turns a monorepo product into a
two-member multi-repo product the moment it acquires one. This is the single structural
rule vwf **enforces**: `/skill:vwf-doctor` raises a violation as a **blocking** finding,
and `/skill:vwf-setup` offers a consent-gated restructure. Everything else on this page
is a menu.

The rest of the topology model is deliberately unenforced — a repo shape is a
tradeoff with no universally right answer, so vwf presents the three and records
what the user picks. This role is different for reasons that are not about taste:

- **Blast radius.** An IaC apply can destroy the product's data stores. Merge
  rights on application code and merge rights on the thing that can delete
  production are not the same permission, and a monorepo cannot separate them —
  one repo means one set of branch protections and one CODEOWNERS surface.
- **Credentials.** The IaC pipeline holds the most privileged credential the
  product owns. In a monorepo, every CI job in every project runs in a
  repository that can read those secrets. A separate repo is what makes
  least-privilege stateable at all.
- **Lifecycle.** Infrastructure exists **before** the first application project
  and **after** the last one is retired. A project whose lifetime brackets the
  monorepo's cannot be a directory inside it.
- **Cadence.** An infrastructure change is reviewed, planned and applied on its
  own schedule, against real state. Coupling it to the application's atomic
  commits — the whole reason to pick a monorepo — is the opposite of what it
  needs.

The cost is honest: a second repo to clone, and a change spanning both cannot be
one commit. That is the point. An infrastructure change that *had* to be atomic
with an application change is a change that should have been two deploys.

## Repo tooling

The `repo` stack axis carries the package manager, task runner, and workspace
wiring. Since all projects share it, there is exactly one `repo.stack` block.

## Adding and removing projects

Adding a project is a registry entry plus a directory. Removing one **archives**
its flows and entities under `docs/blueprint/archived/` — vwf never deletes
blueprint docs — and recomputes the coverage stamp without them.
