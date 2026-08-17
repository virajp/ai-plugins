# Structure

**Structure is a menu, not a mandate.** vwf ships three topology templates and
`/vwf:setup` presents them, exactly as it presents stack templates. The user
picks; the choice and its reason are recorded in `.config/vwf.yaml`. There is
nothing to deviate *from*, so `enforcement.structure` is retired — a topology
matching your product is a normal answer, not an exception to justify.

## The topology menu

| Topology                                                          | What it is                                                    | `docs/blueprint/` lives |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------- |
| [`repo`](${CLAUDE_PLUGIN_ROOT}/assets/topologies/repo.md)         | One codebase, deployed as a whole                             | the repo root           |
| [`monorepo`](${CLAUDE_PLUGIN_ROOT}/assets/topologies/monorepo.md) | One VCS repo, several independently-buildable projects        | the repo root           |
| [`multi-repo`](${CLAUDE_PLUGIN_ROOT}/assets/topologies/multi-repo.md) | A group of repos, coordinated by a **base** repo              | the base repo           |

Each template carries its layout, when to choose it, and when to grow out of it.
Read the one being proposed; do not summarize all three at the user.

**The deciding question** is not project count but whether the product's code
can share **one dependency graph and one release cadence**. Yes → `monorepo` (or
`repo`, if there is only one project). No → `multi-repo`.

## Multi-repo has a second question: linkage

Once `multi-repo` is picked, ask how the members are wired — recorded as
`linkage:`:

| Linkage | The members are | Pick it when |
| --- | --- | --- |
| `submodule` **(recommended)** | git submodules of the base repo | the repos are yours to wire, and reproducing the whole product at a known-good set of commits is worth the pointer-commit ceremony |
| `siblings` | ordinary repos cloned next to the base | the repos already exist independently, one is shared with another product, or there are more of them than submodule bookkeeping carries comfortably |

Recommend `submodule` and say why — a member can find its product structurally,
and the pointer commits record which versions were ever consistent together.
**Do not enforce it.** Format 22 removed that requirement precisely because it
made a whole class of product un-onboardable without restructuring work the user
never asked for.

**Under either linkage the base repo holds the blueprint and no product code**,
and every member carries `.config/vwf-membership.yaml` naming the product and
the way back — belt-and-braces under `submodule`, load-bearing under `siblings`,
and written uniformly so a later switch of linkage is a config edit rather than
a second migration. **Which members are cloned on this machine is not part of
this choice**: it is detected every run and never recorded. The contract, the
resolution order and the absent-member sequence are in
[membership](${CLAUDE_PLUGIN_ROOT}/assets/membership.md).

Adding a topology means **adding a template file** under
`${CLAUDE_PLUGIN_ROOT}/assets/topologies/`. Nothing else changes.

## Detecting and recording

Classify the repo per [topology detection](topology-detection.md),
present the matching template for confirmation, and record `topology:` plus
`topology_reason:` (and `linkage:` for multi-repo) in `.config/vwf.yaml`. In a
multi-repo product, classify **each member on its own signals** — a member may
be a `repo` or a `monorepo`, and each carries its own `repo.stack` block.

A repo whose layout differs from its topology template's suggested grouping gets
a **written recommendation** — the target layout from that template, what
differs, and why closing the gap is worth the work. `/vwf:setup`
moves no source file, in-repo or across a repo boundary, so the recommendation
is the whole deliverable; `/vwf:doctor` is what keeps it visible
afterwards. See [migration & consent](migration-and-consent.md). A decline
recorded under `enforcement:` is settled and not re-proposed.

## Adding and removing repos or projects

Both are **incremental**. Adding a project is a registry entry, recorded by
`/vwf:architecture`. Adding a **repo** is a `members:` entry plus its
`.config/vwf-membership.yaml` (plus `git submodule add` under submodule
linkage), recorded by running `/vwf:setup` from **inside** the new repo, where
the missing config resolves Step 0 to `onboard`. Removing **archives** the removed unit's flows and
entities under `docs/blueprint/archived/` — vwf never deletes a blueprint doc —
deregisters its projects, drops its `members:` entry, and recomputes the coverage
stamp without them.

## Stack templates (a menu)

**vwf ships no stack templates and holds no list of them.** Four axes compose —
`project`, `backing` and `deploy` per project, `repo` per repo — and each one's
options come from a stack plugin, asked for by contracted name. The axes, the
scopes, the closed menu (no *other (describe)*, no `template: custom`, and a
**halt** where no installed plugin covers a platform), and the rule that a pin
must **cover** every platform its project declares are all in
`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`; the shape of a language fact is in
[stack-vocabulary](${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md). Restating them
here would be a second copy that drifts the day a plugin adds a template.

Two things this file owns. Which plugins are asked at all is the product-wide
`stacks:` roster in `.config/vwf.yaml`; which template each project picks is per
project, presented by `/vwf:architecture` and chosen by the
user, always. And adding a stack option means **adding a template file to a
plugin** — never to vwf.

The **operator back-office** is `platforms: [service, webapp]` plus the
`operator-rbac` capability, and it is the **sole holder of admin capabilities**
— the public `service` exposes no admin routes. One deployable serves both the
operator API and its embedded UI from the same origin, so it typically carries
`depends_on: [common, worker]` and richer capabilities (auth, datastore, RBAC,
audit) than a public site.

## The common-package rules

`packages/common` is the workspace's chokepoint, and two placement rules are
enforced (seeded into `conventions.md#patterns` on onboarding; the execute
reviewers flag violations unless an `enforcement.rules` waiver in
`.config/vwf.yaml` covers one):

1. **All shared schemas live in `common`** (`rules/schemas-in-common`) — shared
   data schemas are defined once, under the common package's schema export
   subpaths; no other project defines a shared data schema.
2. **All third-party integrations go via `common`**
   (`rules/integrations-via-common`) — **every** external service (the
   datastore, the identity provider, maps, payments, telemetry) is accessed only
   through the common package's wrappers; no other project imports a third-party
   SDK directly. Client-side sign-in is the one allowed exception. This is what
   makes the **backing axis** swappable at all: projects depend on the common
   package's interface, not on a vendor, so changing the backing template
   changes one package rather than everywhere.

## Infrastructure

There is no infrastructure *default*. What is fixed is the **shape**: a backing
list naming the services a project uses, one deploy template naming its artifact
and release path, and mise as the tool manager. Two projects in the same product
may answer differently — one cloud for a site, another for an API — and the
config records each separately rather than forcing a product-wide pin. Detail
lives in the selected templates, never here.

Infrastructure **as code** is a different thing again: a project declaring the
`iac` platform, which is registered, exempt from blueprint coverage, and
required to live in **its own repo** (`${CLAUDE_PLUGIN_ROOT}/assets/topologies/`) — the
one structural rule vwf states rather than offers, and, since setup moves no
source, one it states as a recommendation plus a standing
`/vwf:doctor` finding.
