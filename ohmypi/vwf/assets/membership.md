# Product Membership — how vwf finds the product from any repo

A product is **one blueprint**. In a `repo` or `monorepo` topology that is
trivially the checkout you are standing in. In a `multi-repo` topology the
product spans several repos, and every vwf command has to answer one question
before it can do anything else: **where is the base repo?**

This asset defines that answer. Read it in any skill that must resolve the
product root, enumerate members, or decide what to do about one that is not on
this machine.

## The two files

**The base repo declares the membership.** `.config/vwf.yaml` carries a
`members:` list — one entry per member repo, naming it, where it sits, where to
clone it from, and which registry projects live in it:

```yaml
topology: multi-repo
linkage: siblings # submodule | siblings

members:
  - name: acme-api
    path: ../acme-api # relative to the BASE repo root
    url: git@github.com:acme/acme-api.git
    projects: [ api, worker ] # registry project names
  - name: acme-app
    path: ../acme-app
    url: git@github.com:acme/acme-app.git
    projects: [ acme-app ]
```

**Each member back-links to the base.** `.config/vwf-membership.yaml`, in every
member repo:

```yaml
vwf_membership: 1
product: acme # matches product.name in the base config
host: ../acme-product # relative path to the BASE repo root
```

The base repo carries **no** membership file — it is the host, and
`.config/vwf.yaml` is what says so.

## Why both directions

Under `linkage: submodule` a member can always find its product structurally:
`git rev-parse --show-superproject-working-tree` walks up, and
/skill:vwf-git-workflow already relies on exactly this. **Under
`linkage: siblings` there is no such mechanism** — the member is an ordinary
repo that happens to sit next to some others.

Without the back-link, membership would be one-directional: the base knows its
members, no member knows the base. That breaks the ordinary way of working,
because you run /skill:vwf-plan and /skill:vwf-execute from
**inside the repo you are coding in**. vwf would find no `.config/vwf.yaml`, no
registry and no blueprint there, and report a perfectly onboarded repo as
un-onboarded. The failure is silent and looks like a bug in the product, not in
the wiring.

The file is committed and travels with the repo, so a fresh clone on another
machine is a member immediately.

## Resolving the base repo

From the current working directory, in order — stop at the first that hits:

1. **`.config/vwf.yaml` here** → this is the base repo. Done.
2. **`.config/vwf-membership.yaml` here** → resolve `host:` relative to this
   repo's root and read `.config/vwf.yaml` there. Done.
3. **A superproject** (`git rev-parse --show-superproject-working-tree` is
   non-empty) → move there and start again at step 1. Repeat until the walk
   ends; this is the `linkage: submodule` path, and also covers a member that
   predates its membership file.
4. **A linked worktree** (`git rev-parse --git-dir` differs from
   `--git-common-dir`, and no superproject) → resolve the main checkout from
   `--git-common-dir`'s parent and start again at step 1.
5. Otherwise → **not a vwf repo**. Say so and stop; do not guess a parent
   directory.

Step 4 matters more than it looks: every vwf pipeline runs in a worktree, and a
worktree of a *member* repo has to resolve two hops — main checkout, then base
repo.

**`host:` and `path:` must agree.** /skill:vwf-doctor reads both
directions and reports a disagreement: a member listed in `members:` whose
membership file names a different product or host, or a repo carrying a
membership file the base does not list. Neither errors on its own — a
one-directional link simply makes one of the two entry paths silently wrong,
which is the failure this whole contract exists to prevent.

## Which members are on this machine is **not** a product fact

A member is **present** when its resolved `path` exists and is a git work tree.
This is per-developer, per-machine, and changes daily — a twenty-repo product
where three are cloned is the normal state, not a degraded one.

So **presence is detected on every run and never recorded in `.config/vwf.yaml`**.
A committed key would be one developer's laptop asserted as the product's shape,
and it would be wrong for everyone else the moment it was written.

This is also why a small product with every repo cloned and a large product with
a handful cloned are the *same configuration* to vwf. They differ only in what
detection finds.

## An absent member

Commands split cleanly by what they actually need:

- **Docs only** — /skill:vwf-product,
  /skill:vwf-architecture, /skill:vwf-design-system,
  /skill:vwf-blueprint, /skill:vwf-screens,
  /skill:vwf-mockups, /skill:vwf-feedback,
  /skill:vwf-archive. These read the blueprint, which is wholly in the
  base repo. **Absence is not a condition for them** — never detect, never ask.
- **Code** — /skill:vwf-plan, /skill:vwf-execute,
  /skill:vwf-doctor, /skill:vwf-verify. These follow the
  sequence below.

**The sequence, identical in every one of them:**

1. **Detect.** Resolve each member the run needs — for `plan`, every repo
   holding a project in the slice's dependency chain; for `execute`, the target
   repo; for `doctor`, every member.
2. **Offer.** For each absent one, say what it is needed *for*, then offer a
   consent-gated clone: `git submodule update --init <path>` under submodule
   linkage, `git clone <url> <path>` under siblings. Never clone uninvited — it
   writes to the user's disk outside the repo they invoked you in.
3. **On accept** — clone, then proceed normally.
4. **On decline** — **proceed with that project excluded, and record the blind
   spot.** Name every project that could not be inspected in the command's own
   output, and in whatever artifact it writes: `plan` stamps them in the plan
   doc so a reader knows the delta was computed without seeing them. A plan
   written against incomplete knowledge is useful; one that *looks* complete is
   not.
5. **`execute` is the exception** — it **halts**. You cannot write code into a
   repo you do not have, and there is no honest partial result.

A decline is per-run, not persisted. The next run asks again, because the answer
genuinely changes — the usual reason to decline is "not right now".

## Where a plan lives

**A plan lives in the repo whose code it changes.** In a `repo` or `monorepo`
topology that is the base repo, so the rule costs nothing and needs no
configuration; in `multi-repo` it is the member. The base keeps a thin index at
`docs/plans/index.md` — one row per plan, naming the plan, its target repo, and
its status.

Two things follow that are worth knowing before implementing against this:

- **This does not remove /skill:vwf-execute's cross-repo write.**
  `execute` sets the `implementation:` stamp on the blueprint's flow and entity
  docs, and those are in the base repo by definition — that is what makes the
  blueprint the source of truth. What distribution buys is the absence of merge
  contention on one shared `docs/plans/`, and each plan reviewed in its own
  repo's flow.
- **The dependency-chain gate is unaffected.** `execute` halts until every
  `requires:` plan's `covers:` docs read `implementation: complete`, and those
  are blueprint docs. So the chain resolves entirely from the base repo even
  when the plans themselves are scattered across twenty members — an upstream
  plan's own repo need not be present to know its work landed.

## Memory and code intelligence follow the repo

Both are per-checkout tools, so `multi-repo` changes where they live, not what
they do.

- **mempalace** — under `linkage: siblings`, **one `mempalace.yaml` per repo**,
  every one naming the same wing and the same seven rooms. `mempalace mine`
  reads its config only from the directory it is pointed at, and sibling members
  are outside the base repo's tree, so a single config would silently mine the
  base alone. Under `linkage: submodule` the members *are* inside that tree, so
  today's rule holds unchanged: exactly one config, at the parent root, members
  get none. Full contract: `%%AI_PLUGINS_ROOT%%/assets/memory.md`.
- **graphify** — a graph per checkout, refreshed by that checkout's own hook.
  /skill:vwf-doctor gates every **locally-present** repo; an absent
  member is a blind spot, not a finding. Full contract:
  `%%AI_PLUGINS_ROOT%%/assets/graphify.md`.
