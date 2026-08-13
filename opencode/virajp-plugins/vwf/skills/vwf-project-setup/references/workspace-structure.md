# Structure

**Structure is a menu, not a mandate.** Since format 19 vwf ships three topology
templates and `/vwf-setup` presents them, exactly as it presents stack
templates. The user picks; the choice and its reason are recorded in
`.config/vwf.yaml`. There is nothing to deviate *from*, so
`enforcement.structure` is retired — a topology matching your product is a
normal answer, not an exception to justify.

## The topology menu

| Topology                                                          | What it is                                                    | `docs/blueprint/` lives |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------- |
| [`repo`](%%AI_PLUGINS_ROOT%%/assets/topologies/repo.md)         | One codebase, deployed as a whole                             | the repo root           |
| [`monorepo`](%%AI_PLUGINS_ROOT%%/assets/topologies/monorepo.md) | One VCS repo, several independently-buildable projects        | the repo root           |
| [`multi-repo`](%%AI_PLUGINS_ROOT%%/assets/topologies/multi-repo.md) | A group of repos, coordinated by a **base** repo              | the base repo           |

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
the way back. That file is belt-and-braces under `submodule` (the superproject
walk already worked) and load-bearing under `siblings` (nothing else links a
member to its product). Writing it uniformly is what lets a product switch
linkage later without a second migration. The contract, the resolution order and
the absent-member sequence are in
[membership](%%AI_PLUGINS_ROOT%%/assets/membership.md).

**Which members are cloned on this machine is not part of this choice.** It is
detected every run and never recorded — see the same reference.

Adding a topology means **adding a template file** under
`%%AI_PLUGINS_ROOT%%/assets/topologies/`. Nothing else changes.

## Detecting and recording

Classify the repo per
[topology detection](references/topology-detection.md),
present the matching template for confirmation, and record `topology:` plus
`topology_reason:` (and `linkage:` for multi-repo) in `.config/vwf.yaml`. In a
multi-repo product, classify **each member on its own signals** — a member may
be a `repo` or a `monorepo`, and each carries its own `repo.stack` block.

A repo whose layout differs from its topology template's suggested grouping gets
a **restructure proposal** folded into the setup migration plan: in-repo layout
moves (`projects/` / `packages/` grouping, project naming) as normal
consent-gated batches. Anything crossing a repo boundary — splitting a repo into
base + members — is only ever a **written recommendation**, per
[migration & consent](references/migration-and-consent.md).
A decline is settled and not re-proposed.

## Adding and removing repos or projects

Both are **incremental** — `/vwf-setup` re-runs against the delta rather than
re-onboarding. Adding a project is a registry entry; adding a **repo** is a
`members:` entry plus its `.config/vwf-membership.yaml` (plus `git submodule
add` under submodule linkage). Removing **archives** the removed unit's flows and
entities under `docs/blueprint/archived/` — vwf never deletes a blueprint doc —
deregisters its projects, drops its `members:` entry, and recomputes the coverage
stamp without them.

## Stack templates (a menu)

**vwf ships no stack templates and holds no list of them.** Every template comes
from a stack plugin, and the authoritative list is the plugin's own
`<plugin>-stack-menu` — ask it, per the stack-adapter contract
(`%%AI_PLUGINS_ROOT%%/assets/stack-adapter.md`). A table here would be a second copy
that drifts the moment a plugin adds a template, which is exactly what this
effort removed.

Four axes compose, at three scopes:

| Axis      | Scope       | Comes from                                                        |
| --------- | ----------- | ------------------------------------------------------------------ |
| `project` | per project | a **language** plugin, per the project's `platforms`              |
| `backing` | per project | a **capability** plugin's contract + a **cloud** plugin's flavour |
| `deploy`  | per project | a **cloud** plugin, or a language plugin for a published artifact |
| `repo`    | per repo    | a **language** or **tooling** plugin                              |

Which plugins are asked is the product-wide `stacks:` roster in
`.config/vwf.yaml`; which template each project picks is per project.

**One entry per platform is not a default.** `vwf-architecture` presents the
menu for the project's platforms and the user picks, always. The menu is also
the *whole* vocabulary: there is no **other (describe)** option and
`template: custom` is retired (`config_format` 14), so a platform no installed
plugin ships a template for is a **halt** — install the plugin that has one, or
write it. A pick off the menu needs no `enforcement` entry and nothing justified.

Since format 22 a template declares the **platforms it serves** in its own
frontmatter rather than sitting in a role-named directory, because one template
routinely serves several: a Flutter template covers `mobile`, `tablet`,
`desktop` and `webapp` from one codebase, and a directory name cannot say that.
**A project's pin must cover every platform it declares** — a rule
`vwf-doctor` checks and the old directory keying could not state.

Each template's frontmatter also carries the four axes (`languages` /
`optional_languages` / `frameworks` / `dependencies`) that land in
`.config/vwf.yaml` and that `vwf-doctor` checks the repo against; its prose
carries the layout, testing and deployment conventions `plan` and `execute`
read. The shape of a language fact — and what happens to a token nobody has
written a plugin for — is in
[stack-vocabulary](%%AI_PLUGINS_ROOT%%/assets/stack-vocabulary.md).

Adding a stack option means **adding a template file** — a new slug under
`stacks/project/`, `stacks/backing/` or `stacks/deploy/`, declaring its
platforms. Nothing else changes.

The **operator back-office** — `platforms: [service, webapp]` with the
`operator-rbac` capability — is the internal, privileged counterpart to the
public site, and the **sole holder of admin capabilities** (the public `service`
exposes no admin routes). It is a single deployable: one server app serving both
the operator API and an embedded web UI from the same origin. Operators
authenticate with the product's auth under a dedicated operator role; privileged
operations go through the shared package and hand long-running actions to the
`worker`. It therefore typically carries `depends_on: [common, worker]` and
richer capabilities (auth, datastore, RBAC, audit) than a public site.

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
   through the common package's wrappers/layers; no other project imports a
   third-party SDK directly. Client-side sign-in is the one allowed exception.

   This rule is what makes the **backing axis** swappable at all: the projects
   depend on the common package's interface, not on any vendor, so changing the
   backing template is a change in one package rather than everywhere.

## Infrastructure

There is no infrastructure *default* — the backing and deploy axes are menus
like the project axis, and `vwf-architecture` presents them **per project**.
What is fixed is the **shape**: a backing list naming the
datastore/identity/queue/storage services that project uses, one deploy template
naming its artifact and release path, and mise as the tool manager. Two projects
in the same product may answer differently — a site on one cloud, an API on
another — and config_format 13 records each separately rather than forcing one
product-wide pin. Detail (hosting, secrets, testing modes) lives in the selected
templates, never here.

Infrastructure **as code** is a different thing again: a project declaring the
`iac` platform, which is registered, exempt from blueprint coverage, and required
to live in **its own repo** (`%%AI_PLUGINS_ROOT%%/assets/topologies/`).
