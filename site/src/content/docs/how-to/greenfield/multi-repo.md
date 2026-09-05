---
title: "Start a product that spans several repos"
description: "Where the walk differs when a product is a base repo holding the blueprint plus one member repo per group of projects."
order: 5
---

Your product will not fit in one checkout — its pieces cannot share a dependency
graph, or cannot ship on one cadence, or one of them holds credentials the rest
have no business seeing. vwf calls that shape `multi-repo`: a **base** repo
holding the blueprint and no product code, plus one **member** repo per group of
projects.

This guide narrates only where that walk differs from the single-repo spine,
[Start a product from an empty repo](./single-repo.md) — read that first, since
every stage below assumes it. The worked example is **Stallfront**, an
e-commerce product in four repos: `stallfront` (the base, documentation only),
`stallfront-api` (the backend), `stallfront-web` (the storefront), and
`stallfront-infra` (infrastructure as code). At the end Stallfront has one
blueprint in the base repo covering all three code projects, a recorded
membership in both directions per member, and its first slice planned and built
in the repo that owns the code.

Mechanics — flags, halt conditions, config keys, file formats — live in the
[vwf plugin manual](../../plugins/vwf.md).

## The journey

### 1. Install the plugins

Identical to the spine — one name, with `stackgen` arriving as its dependency:
[install the plugins](./single-repo.md#install-the-plugins). One thing matters
more here than it does in a single-repo product — install at **user** scope,
which is the default. You will be running vwf commands from four different
checkouts, and `--scope project` would reach exactly one of them.

### 2. /vwf:init, then /vwf:setup, in the base repo

Create the base repo first, and leave it empty. It is where `docs/blueprint/`,
the vwf config, the plan index, the product-wide toolchain config and the local
stack live, and it holds no product code — now or ever.

```text
/vwf:init
/vwf:setup
```

`init` shapes the base repo the same way it shapes any other
([`/vwf:init`](./single-repo.md#vwfinit)) — and each member repo gets its own
`init` run when it is created, since the shape is per repo, not per product.

The setup run is the spine's blank-repo bootstrap unchanged
([`/vwf:setup`](./single-repo.md#vwfsetup)): two questions, both proposed from
the directory name, both answered `stallfront` — the product name and the memory
wing. It asks nothing about structure, and could not usefully have: the member
repos do not exist yet, and neither does the product contract that will say how
many there should be.

Stallfront now has a bootstrapped base repo whose config knows a product name
and nothing about shape.

### 3. /vwf:product

Unchanged — [`/vwf:product`](./single-repo.md#vwfproduct). Stallfront's contract
pins the problem (small brands sell through marketplaces that keep the customer
relationship, so they have no way to reach their own buyers twice), two user
classes (shoppers, who browse and buy; merchandisers, who run the catalogue from
inside that same signed-in storefront rather than from a console of their own),
goals under stable anchors, and a slice priority that starts at browse-and-buy.

One thing to watch while writing it, because the next command reads it
structurally: user classes that touch the product through genuinely different
surfaces are what become separate projects, and separate projects are what may
become separate repos.

### 4. /vwf:architecture — where the multi-repo answer lands

```text
/vwf:architecture
```

This is the command that decides the shape. With `product.md` written and no
registry yet it derives rather than interviews, handing back each structural
value beside the sentence of the contract it rests on and taking your
corrections by MCQ — the same derivation mode the spine describes at
[`/vwf:architecture`](./single-repo.md#vwfarchitecture). What is different is
that one of the values it derives is **repo placement**, not just project
boundaries.

Stallfront's corrections:

- **Projects** — three: `api` (platforms `[service]`), `web` (`[webapp]`), and
  `infra` (`[iac]`).
- **Topology** — proposed `monorepo`, corrected to `multi-repo`. The API and the
  storefront could genuinely have shared one checkout; `infra` could not. A
  project declaring the `iac` platform is always its own repo under every
  topology, so acquiring one turns a would-be monorepo into a multi-repo product
  by that fact alone. Stallfront takes the consequence and gives each project
  its own repo, since a two-member product with a stranded third repo is worse
  documentation of itself than three members are.
- **Stacks** — three project-axis rounds rather than one, since the axis is per
  project: `typescript-effect-hono` for `api`, `typescript-hono-refine` for
  `web`, `typescript-pulumi` for `infra`, plus `postgres` on `api`'s backing
  axis. The **repo** axis is the one that behaves differently from the spine —
  it describes a checkout, so in a multi-repo product each member answers it for
  itself rather than the product answering once
  ([stack pins, one axis at a time](./single-repo.md#stack-pins-one-axis-at-a-time)).
- **Foundations** — the same thirteen-concern walk, with the same guidance:
  [the thirteen foundations](./single-repo.md#the-thirteen-foundations).

Note where the topology question is *asked*. The spine makes the same point for
a different reason: `/vwf:setup` on a blank repo does not ask it, and here it
could not have, because the answer is derived from a product contract that did
not exist yet.

### 5. Wire the members, then onboard each one

Stallfront wires its members as `submodule`, the recommended linkage —
[Submodules or siblings](#submodules-or-siblings) is where that choice is worth
making deliberately. So: create the three code repos empty, and add each as a
submodule of the base.

```sh
git submodule add git@github.com:stallfront/stallfront-api.git api
git submodule add git@github.com:stallfront/stallfront-web.git web
git submodule add git@github.com:stallfront/stallfront-infra.git infra
```

Then, from inside each one:

```text
/vwf:init
/vwf:setup
```

Adding a repo to a vwf product **is** a setup run from inside that repo, with
`init` first because each member carries its own shape. Finding no config of its
own, the run onboards it; base-repo resolution reaches Stallfront's config from
there, so it acts on that one member's delta instead of re-onboarding the
product. What it records is the membership in both directions — the base gains
an entry naming the member, where it sits, the git URL to clone it from, and
which registry projects live in it, and the member gains a small file naming the
product and the way back to the base. Neither direction is decoration: the entry
is what lets a command running in the base find code it does not contain, and
the back-link is what stops a command running inside a member reporting a
perfectly onboarded repo as un-onboarded. Where each one lives, and why both
directions matter: [Structure](../../plugins/vwf.md#structure).

What is deliberately **not** recorded is which members are cloned on this
machine. That is per-developer state that changes daily, so it is detected on
every run — a twenty-repo product with three cloned is a normal configuration,
not a degraded one. Each member that *is* cloned gets its own `.graphifyignore`
from that run, since the file is per checkout like the graph it narrows — see
[Code intelligence](../../plugins/vwf.md#code-intelligence).

Stallfront can now run a vwf command from any of its four checkouts and have it
resolve the same product.

### 6. /vwf:design-system

Unchanged — `web` declares a screen platform, so the design system is a
foundation rather than an option:
[`/vwf:design-system`](./single-repo.md#vwfdesign-system).

### 7. /vwf:blueprint

```text
/vwf:blueprint
```

Run it in the base repo, along with every other command that only reads docs.
There is **one** blueprint bundle per product and it lives in the base — flows
are grouped by the registry project that owns them, so Stallfront's tree carries
`api` and `web` sections side by side and describes work that will land in two
different repos. The sweep, the per-doc gates and the coherence review are
exactly the spine's: [`/vwf:blueprint`](./single-repo.md#vwfblueprint).

`infra` is registered and then skipped — an `iac` project is exempt from
blueprint coverage, so its absence from the sweep is by design and the coverage
stamp completes without it.

### 8. /vwf:plan

Run this from inside the repo you are about to write code in — for Stallfront's
first slice, `stallfront-web`:

```text
/vwf:plan browse-catalogue
```

Three deltas, all of them from the same fact — a plan lives in the repo whose
code it changes:

- **The plan doc lands in the member**, and the base repo keeps a one-row index
  entry naming the plan, its target repo and its status. That is what lets
  anything enumerate the product's plans without walking members that are not
  here.
- **A dependency chain can cross a repo boundary.** Stallfront's browse flow
  stands on a `product` entity that `api` owns and nothing has built, so that
  entity is planned first — as its own plan, in `stallfront-api`, approved
  behind its own gate — before the flow's plan is written in `stallfront-web`.
- **A member that is not on this machine is offered, not assumed.** `plan` says
  what the repo is needed for and offers to clone it; decline and it proceeds
  with that project excluded and says so in its output and in the plan doc, so
  nobody later mistakes a partial delta for a complete one.

Everything else — the diff shape, what to read before approving — is the spine's
[`/vwf:plan`](./single-repo.md#vwfplan) and the manual's
[`/vwf:plan`](../../plugins/vwf.md#vwfplan).

### 9. /vwf:execute

```text
/vwf:execute
```

The stage pipeline, the finding loops and the single human gate are unchanged:
[`/vwf:execute`](./single-repo.md#vwfexecute). Two things are
multi-repo-specific.

**The worktree follows the linkage.** Under Stallfront's `submodule` linkage the
worktree is of the base repo with the members populated inside it, so one tree
holds both the code being written and the blueprint docs being stamped, and
nothing about the run is cross-repo. Under `siblings` it is not — see
[Submodules or siblings](#submodules-or-siblings).

**Absence is a halt here, not an offer.** Where `plan` proceeds with a blind
spot, `execute` stops: there is no honest partial result from writing code into
a repo you do not have.

### 10. /vwf:verify

Same command, same reporting, and one difference in what a clean production run
offers. Stallfront's `api` declares `service` and no screen platform, so it has
consumers it does not itself ship — the storefront is a separate deployable in a
separate repo — and freezing its contract on a release is what makes backward
compatibility enforceable from then on. The spine's single-project example was
skipped by exactly this test, because its API served only its own UI. Details:
[`/vwf:verify`](./single-repo.md#vwfverify) and
[`/vwf:verify`](../../plugins/vwf.md#vwfverify).

## Decision points

### Which topology

The menu is three — `repo`, `monorepo`, `multi-repo` — and what each one means
is the table in [Structure](../../plugins/vwf.md#structure). What you are
actually deciding is not how many projects you have but whether the product's
code can share **one dependency graph and one release cadence** — an on-device
app beside server code is the classic no, since store review cannot sync with
continuous deploy.

Two things make the answer less free than it looks. An `iac` project settles it
on its own, as Stallfront's did. And what you pick decides where the blueprint
lives and how a plan maps a slice to code, so changing it later is real work
rather than a config edit. Against that, multi-repo costs coordination on every
run that touches code: member resolution, clone offers, and a plan index that
exists only because no single checkout can see everything. Take it when the
product's shape demands it, not to keep future options open.

The spine covers the same decision from the other side:
[the topology answer](./single-repo.md#the-topology-answer).

### Which repo is the base

The base holds the blueprint, the config, the plan index and no product code, so
the honest answer is usually **a new empty repo created for the purpose**, which
is what Stallfront did. The tempting alternative is to promote the repo that
feels most central — the backend, usually — and hang the others off it. That
works right up until the day the backend is not central any more, or somebody
wants to clone the product's documentation without a service's dependency tree,
or a second product needs to borrow that backend and cannot, because it is
carrying another product's blueprint.

A dedicated base repo also makes the "no product code" rule enforceable by
inspection rather than by discipline: anything that appears in it is a mistake
by construction.

### Submodules or siblings

Both linkages are first-class and the difference is only how the members are
wired, never how vwf behaves.

`submodule` is recommended, and Stallfront took it: one
`clone --recurse-submodules` reproduces the whole product, the pointer commits
record which member versions were ever consistent together, and a member can
find its product structurally by walking up. The cost is real — detached HEADs,
a pointer commit in the base for every member commit, and a plain `clone` that
silently yields an empty checkout.

`siblings` means the members are ordinary repos cloned next to the base, wired
by nothing in git at all. Pick it when the repos already exist independently and
are not going to be re-wired, when one of them is shared with another product
and so cannot be any single product's submodule, or when there are more of them
than submodule bookkeeping carries comfortably.

Three consequences follow the choice rather than being chosen separately. The
first of these surfaces at `/vwf:execute`:

- **A sibling member is its own outermost superproject**, so a run's worktree is
  of the member, not of the base. The blueprint writes that close the run —
  implementation stamps, docs sync — then reach the base checkout as a second
  working tree, and the two commit separately with the base last.
- **The back-link file stops being belt-and-braces and becomes load-bearing**,
  since there is no superproject walk to fall back on.
- **Per-checkout tooling multiplies.** Memory and code intelligence follow the
  checkout, so siblings means one mempalace config per repo, all naming the same
  wing, where submodule linkage keeps one at the base.

Neither answer is permanent — both are written uniformly enough that switching
is a config edit rather than a second migration.

## When things halt

Every halt on the spine's list still applies. These are the ones this shape
adds:

- **An `iac` project sitting inside another project's repo** is a blocking
  `/vwf:doctor` finding, so `/vwf:setup` and `/vwf:execute` stop on it. Setup
  writes the extraction up as a recommendation and moves nothing; recording the
  decline drops it to a warning reported on every run.
  [Stack templates](../../plugins/vwf.md#stack-templates)
- **Membership that disagrees with itself in either direction, or a member entry
  with no clone URL**, is blocking: each leaves exactly one of the two entry
  paths silently wrong. The two files and what they record:
  [Structure](../../plugins/vwf.md#structure)
- **`/vwf:execute` against a member that is not on this machine** halts rather
  than proceeding with a blind spot, which is the one place it diverges from
  `/vwf:plan`. [`/vwf:execute`](../../plugins/vwf.md#vwfexecute)
