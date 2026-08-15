---
axis: topology
name: Multi-repo (base repo + members)
slug: multi-repo
blueprint_root: the base repo
submodules: recommended
---

# Topology — Multi-repo

A **group of repos** — each itself a single repo or a monorepo — that together
build one product. The shape to pick when the product spans toolchains that
cannot share a dependency graph, or release cadences that cannot sync.

Renamed from `polyrepo` in blueprint format 22, which also removed its one hard
requirement: **the members no longer have to be submodules.**

## The base repo is the product root

vwf needs one place for `docs/blueprint/`, so a multi-repo product has a **base
repo**: the repo holding the blueprint, `.config/vwf.yaml`, the plan index, the
product-wide mise config and the local stack. `/vwf-setup` runs
there, and so does every command that only reads docs.

The base repo holds **no product code**. Members hold the code; the base holds
what describes and coordinates them.

## Two linkages

Which one a product uses is recorded as `linkage:` in `.config/vwf.yaml`. Both
are first-class; the difference is how the members are wired, never how vwf
behaves.

### `linkage: submodule` — recommended

The members are git submodules of the base repo. This is the older shape and
still the better one when you can have it:

```text
my-product/           # base repo — vwf lives here
├── .gitmodules
├── docs/blueprint/   # the vwf bundle (one per product)
├── docs/plans/index.md
├── .config/          # mise config, vwf.yaml
├── backend/          # submodule — a monorepo
│   ├── .config/vwf-membership.yaml
│   ├── docs/plans/   # this repo's cycle plans
│   ├── projects/
│   │   ├── api/      # platforms: [service]
│   │   ├── worker/   # platforms: [worker]
│   │   └── ops/      # platforms: [service, webapp] + operator-rbac
│   └── packages/
│       └── common/   # platforms: [packages]
└── app/              # submodule — a single repo
    └── .config/vwf-membership.yaml
```

**Why it is recommended.** One `git clone --recurse-submodules` reproduces the
whole product at a known-good set of commits; the pointer commits are a record
of which member versions were ever consistent together; and a member can always
find its product structurally, via
`git rev-parse --show-superproject-working-tree`.

**What it costs.** Detached HEADs, a pointer commit in the base for every member
commit, and a `git clone` that needs `--recurse-submodules` or the checkout is
empty. Real ergonomic friction, and the reason the second linkage exists.

### `linkage: siblings`

The members are ordinary repos, cloned next to the base. Nothing wires them
together in git at all:

```text
~/Projects/acme/
├── acme-product/           # base repo — docs only
│   ├── docs/blueprint/
│   ├── docs/plans/index.md
│   ├── .config/vwf.yaml    # members: [...]
│   └── mempalace.yaml
├── acme-api/               # plain repo
│   ├── .config/vwf-membership.yaml
│   └── docs/plans/
└── acme-app/
    ├── .config/vwf-membership.yaml
    └── docs/plans/
```

**When to pick it.** A product whose repos already exist independently and are
not going to be re-wired; a repo shared with another product, which cannot be
one product's submodule; a product with more repos than submodule bookkeeping
can carry comfortably.

**What it costs.** Git knows nothing about the grouping, so vwf has to. The
`members:` list and the per-member `.config/vwf-membership.yaml` back-links are
what replace `.gitmodules`, and they are load-bearing rather than
documentation — the full contract is
[membership](%%AI_PLUGINS_ROOT%%/assets/membership.md). There is no equivalent of a
pointer commit, so nothing records which member versions were consistent
together.

## Not every member is on every machine

A twenty-repo product does not fit on one laptop, and a developer working on one
service has no reason to clone the other nineteen. **This is expected, and it is
not a property of the product** — it is per-developer, per-machine state that
changes daily.

So vwf **detects** which members are present on every run and never records it.
A small product with every repo cloned and a large one with three cloned are the
*same configuration*; they differ only in what detection finds.

When a command needs a member that is not here, it offers a consent-gated clone
and, if declined, proceeds with that project excluded and **says which projects
it could not inspect**. `vwf-execute` is the exception and
halts — you cannot write code into a repo you do not have. The full sequence is
in [membership](%%AI_PLUGINS_ROOT%%/assets/membership.md).

## An `iac` member is mandatory, not optional

A project with `platforms: [iac]` is **always its own repo** — here that means
its own member, never a directory inside another member and never a directory in
the base. This is the one structural rule vwf enforces rather than offers:
`vwf-doctor` raises a violation as **blocking**, and
`/vwf-setup` writes up the extraction as a recommendation — one
you may decline under `enforcement:`, which leaves the finding standing as a
warning reported every run instead of a halt. The reasoning —
blast radius, credentials, lifecycle, cadence — is in [monorepo](monorepo.md),
where the rule is most surprising.

Multi-repo pays almost nothing for it: the shape already is a group of repos, so
an IaC member is one more entry. A product that acquires an `iac` project while
on the **monorepo** shape becomes multi-repo by that fact alone.

## Where things live

| Thing | Where |
| --- | --- |
| `docs/blueprint/` | the base repo, always — one bundle per product |
| `.config/vwf.yaml` | the base repo, always |
| `.config/vwf-membership.yaml` | every member, never the base |
| A cycle plan | **the repo whose code it changes** |
| `docs/plans/index.md` | the base repo — a thin index of every plan and its target |
| `implementation:` stamps | the blueprint, so the base repo |
| `mempalace.yaml` | under `siblings`, one per repo, all naming the same wing; under `submodule`, one at the base and none in members |
| `graphify-out/` | one per checkout |

## When this is the right shape

- An on-device app beside server-side code: the app's store-review cadence
  cannot sync with continuous deploys, and its language cannot share a
  dependency graph with the backend's.
- Members with genuinely separate ownership or access control.
- A member that must stay independently cloneable — an open-source component, or
  a repo shared with another product.
- More projects than one checkout can usefully hold.

## When not to

If every project shares one toolchain and ships together, a **monorepo** gives
the same structure with none of the coordination overhead. The deciding question
is not project count but whether the product's code can share **one dependency
graph and one release cadence**.

## Adding and removing members

Adding a member is a `members:` entry, a `.config/vwf-membership.yaml` in it, and
its registry projects — plus `git submodule add` under submodule linkage. Run
`/vwf-setup` from **inside the new repo**: finding no config
there, Step 0 resolves `onboard`, and base-repo resolution
(`%%AI_PLUGINS_ROOT%%/assets/membership.md`) reaches the product from it. Its
registry projects are `vwf-architecture`'s to record.

Removing one **archives** its flows and entities under `docs/blueprint/archived/`
— vwf never deletes blueprint docs — deregisters its projects, drops its
`members:` entry, and recomputes the coverage stamp without them.
