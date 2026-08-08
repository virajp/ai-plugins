# Structure

**Structure is a menu, not a mandate.** Since format 19 vwf ships three topology
templates and `<%= it.cmd("vwf:setup") %>` presents them, exactly as it presents stack
templates. The user picks; the choice and its reason are recorded in
`.config/vwf.yaml`. There is nothing to deviate *from*, so
`enforcement.structure` is retired — a topology matching your product is a
normal answer, not an exception to justify.

## The topology menu

| Topology                                                          | What it is                                                    | `docs/blueprint/` lives |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------- |
| [`repo`](<%= it.root %>/assets/topologies/repo.md)         | One codebase, deployed as a whole                             | the repo root           |
| [`monorepo`](<%= it.root %>/assets/topologies/monorepo.md) | One VCS repo, several independently-buildable projects        | the repo root           |
| [`polyrepo`](<%= it.root %>/assets/topologies/polyrepo.md) | A group of repos, wired as submodules under a **parent** repo | the parent repo         |

Each template carries its layout, when to choose it, and when to grow out of it.
Read the one being proposed; do not summarize all three at the user.

**The deciding question** is not project count but whether the product's code
can share **one dependency graph and one release cadence**. Yes → `monorepo` (or
`repo`, if there is only one project). No → `polyrepo`.

**A polyrepo is rooted at a submodule parent.** vwf needs one place for
`docs/blueprint/`, and a group of unlinked repos has none. This is the one
structural requirement left, and it carries a real onboarding cost for a product
whose repos are not already submodules — the polyrepo template states it
plainly.

Adding a topology means **adding a template file** under
`<%= it.root %>/assets/topologies/`. Nothing else changes.

## Detecting and recording

Classify the repo per
[topology detection](<%= it.root %>/skills/project-setup/references/topology-detection.md),
present the matching template for confirmation, and record `topology:` plus
`topology_reason:` in `.config/vwf.yaml`. In a polyrepo, classify **each member
on its own signals** — a member may be a `repo` or a `monorepo`, and each
carries its own `repo.stack` block.

A repo whose layout differs from its topology template's suggested grouping gets
a **restructure proposal** folded into the setup migration plan: in-repo layout
moves (`projects/` / `packages/` grouping, project naming) as normal
consent-gated batches. Anything crossing a repo boundary — splitting a repo into
parent + submodules — is only ever a **written recommendation**, per
[migration & consent](<%= it.root %>/skills/project-setup/references/migration-and-consent.md).
A decline is settled and not re-proposed.

## Adding and removing repos or projects

Both are **incremental** — `<%= it.cmd("vwf:setup") %>` re-runs against the delta rather than
re-onboarding. Adding is a registry entry (plus `git submodule add` in a
polyrepo). Removing **archives** the removed unit's flows and entities under
`docs/blueprint/archived/` — vwf never deletes a blueprint doc — deregisters its
projects, and recomputes the coverage stamp without them.

## Stack templates (a menu)

Each role has one or more templates, **all of them shipped by a plugin rather
than by vwf**. What ships today:

| Role        | Template                                                    | Stack                                          |
| ----------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `packages`  | `typescript-effect` — in the **typescript** plugin          | TypeScript · Effect-TS                         |
| `service`   | `typescript-effect-hono` — in the **typescript** plugin     | TypeScript · Hono · Effect-TS                  |
| `worker`    | `typescript-effect-temporal` — in the **typescript** plugin | TypeScript · Temporal · Effect-TS              |
| `site`      | `typescript-astro-react` — in the **typescript** plugin     | TypeScript · Astro (SSR) · React               |
| `fullstack` | `typescript-hono-refine` — in the **typescript** plugin     | TypeScript · Hono + Effect-TS · React + Refine |
| `frontend`  | `dart-flutter` — in the **flutter** plugin                  | Dart · Flutter                                 |
| `frontend`  | `typescript-effect-cli` — in the **typescript** plugin      | TypeScript · @effect/cli (platform `cli`)      |
| `iac`       | `typescript-pulumi` — in the **typescript** plugin          | TypeScript · Pulumi                            |

Three more axes compose with the project one — pick one of each, and pick them
**per project** (`backing`, `deploy`) or per repo (`repo`):

| Axis      | Scope       | Ships today                                                                                                                                                                                                     |
| --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backing` | per project | none here — a **capability** plugin ships the contract and its own provider (`datastore`, `identity`, `observability`, `orchestration`, `object-storage`), a **cloud** plugin the managed flavour               |
| `deploy`  | per project | `npm-package` (in the **typescript** plugin) · the hosted targets come from a **cloud** plugin (`gcp`, `cloudflare`)                                                                                            |
| `repo`    | per repo    | `pnpm-turbo` · `bun` — both in the **typescript** plugin                                                                                                                                                        |

**One entry per role is not a default.** `<%= it.cmd("vwf:architecture") %>` presents the menu
for the project's role and the user picks, always — plus an **other (describe)**
option that records `template: custom` and the axes they give. A stack matching
no template is a normal answer: there is no deviation, no `enforcement` entry,
and nothing to justify.

Each template's frontmatter carries the four axes (`languages` /
`optional_languages` / `frameworks` / `dependencies`) that land in
`.config/vwf.yaml` and that `<%= it.cmd("vwf:doctor") %>` checks the repo against; its prose
carries the layout, testing and deployment conventions `plan` and `execute`
read. Languages come from the closed vocabulary in
[stack-vocabulary](<%= it.root %>/assets/stack-vocabulary.md).

Adding a stack option means **adding a template file** — a new slug under the
role's directory, or under `backing/` or `deploy/`. Nothing else changes.

The **operator back-office** — `role: fullstack` with the `operator-rbac`
capability, no longer a `console` type — is the internal, privileged counterpart
to `web`, and the **sole holder of admin capabilities** (the public `service`
exposes no admin routes). It is a single deployable: one server app serving both
the operator API and an embedded web UI from the same origin. Operators
authenticate with the product's auth under a dedicated operator role; privileged
operations go through the shared package and hand long-running actions to the
`worker`. It therefore typically carries `depends_on: [common, worker]` and
richer capabilities (auth, datastore, RBAC, audit) than `web`.

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
like the project axis, and `<%= it.cmd("vwf:architecture") %>` presents them **per project**.
What is fixed is the **shape**: a backing list naming the
datastore/identity/queue/storage services that project uses, one deploy template
naming its artifact and release path, and mise as the tool manager. Two projects
in the same product may answer differently — a site on one cloud, an API on
another — and config_format 13 records each separately rather than forcing one
product-wide pin. Detail (hosting, secrets, testing modes) lives in the selected
templates, never here.

Infrastructure **as code** is a different thing again: a project with
`role: iac`, which is registered, exempt from blueprint coverage, and required
to live in **its own repo** (`<%= it.root %>/assets/topologies/`).
