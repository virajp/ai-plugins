# Workspace Structure

The shape vwf **enforces** for a multi-project product — applied when onboarding
a new/empty repo, proposed (consent-gated) as a migration for an existing repo
that does not match. Structure carries one escape hatch: an explicit user
objection is honored and recorded under `enforcement:` in `.config/vwf.yaml`
(the choice and reason — see the vwf-config asset). A recorded deviation is
settled — never re-asked or re-proposed.

**Stacks are not enforced.** They are a menu of templates the user picks from —
see Stack templates below. Structure and stack were one doctrine until
`config_format` 11 split them; only the structure half remains enforced.

## The shape

A parent **workspace** git repo whose children are **git submodules**:

```text
workspace/            # parent repo — vwf lives here
├── .gitmodules       # backend + frontend
├── docs/blueprint/   # the vwf bundle (one per workspace)
├── .config/          # mise config (workspace tooling)
├── backend/          # submodule — monorepo
│   ├── projects/
│   │   ├── service/  # role: service
│   │   ├── worker/   # role: worker
│   │   ├── web/      # role: site
│   │   └── console/  # role: fullstack + operator-rbac capability
│   └── packages/
│       └── common/   # role: packages
└── frontend/         # submodule — single-package on-device app (role: frontend)
```

- The **workspace parent** holds everything product-wide: `docs/blueprint/`,
  mise config, CI glue, local emulators. `/vwf:setup` and the other vwf commands
  run here.
- **backend** is a monorepo: deployable projects under `projects/`, shared
  libraries under `packages/` — tooling per the
  [pnpm-turbo repo template](${CLAUDE_PLUGIN_ROOT}/assets/stacks/repo/pnpm-turbo.md).
- **frontend** is a single-package app repo — mobile apps are never monorepos.
- Not every project must exist: a product may have no operator back-office, no
  `web`, or no `frontend` yet. Absence is fine; a project under another layout
  is what triggers the migration proposal below.

## Existing repos

A `.gitmodules` naming child repos (each child dir carrying its own `.git`) →
**workspace** topology. Classify each child on its own signals per
[topology detection](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/topology-detection.md),
and record the shape in the registry and the vwf config (`.config/vwf.yaml`)
(`topology: workspace`).

A repo that does **not** conform gets a **restructure proposal** folded into the
setup migration plan: in-repo layout moves (`projects/` / `packages/` grouping,
project naming) as normal consent-gated batches; anything crossing a repo
boundary — e.g. splitting a single repo into parent + submodules — only ever as
a written recommendation, per
[migration & consent](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/migration-and-consent.md).
A decline is recorded in `.config/vwf.yaml` (`enforcement.structure`) and not
re-proposed on later runs.

## Stack templates (a menu)

Each role has one or more templates under
`${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/<role>/`. What ships today:

| Role        | Template                                                                                                       | Stack                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `packages`  | [typescript-effect](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/packages/typescript-effect.md)                 | TypeScript · Effect-TS                         |
| `service`   | [typescript-effect-hono](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/service/typescript-effect-hono.md)        | TypeScript · Hono · Effect-TS                  |
| `worker`    | [typescript-effect-temporal](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/worker/typescript-effect-temporal.md) | TypeScript · Temporal · Effect-TS              |
| `site`      | [typescript-astro-react](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/site/typescript-astro-react.md)           | TypeScript · Astro (SSR) · React               |
| `fullstack` | [typescript-hono-refine](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/fullstack/typescript-hono-refine.md)      | TypeScript · Hono + Effect-TS · React + Refine |
| `frontend`  | [dart-flutter](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/frontend/dart-flutter.md)                           | Dart · Flutter                                 |
| `frontend`  | [kotlin-android](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/frontend/kotlin-android.md)                       | Kotlin · Jetpack Compose                       |
| `frontend`  | [swift-ios](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/frontend/swift-ios.md)                                 | Swift · SwiftUI                                |
| `infra`     | [typescript-pulumi](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/infra/typescript-pulumi.md)                    | TypeScript · Pulumi                            |
| `infra`     | [terraform](${CLAUDE_PLUGIN_ROOT}/assets/stacks/project/infra/terraform.md)                                    | Terraform / OpenTofu                           |

Three more axes compose with the project one — pick one of each:

| Axis      | Ships today                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backing` | [firebase](${CLAUDE_PLUGIN_ROOT}/assets/stacks/backing/firebase.md) · [postgres-object-storage](${CLAUDE_PLUGIN_ROOT}/assets/stacks/backing/postgres-object-storage.md) |
| `deploy`  | [cloud-run](${CLAUDE_PLUGIN_ROOT}/assets/stacks/deploy/cloud-run.md) · [container-generic](${CLAUDE_PLUGIN_ROOT}/assets/stacks/deploy/container-generic.md)             |
| `repo`    | [pnpm-turbo](${CLAUDE_PLUGIN_ROOT}/assets/stacks/repo/pnpm-turbo.md) · [bun](${CLAUDE_PLUGIN_ROOT}/assets/stacks/repo/bun.md)                                           |

**One entry per role is not a default.** `/vwf:architecture` presents the menu
for the project's role and the user picks, always — plus an **other (describe)**
option that records `template: custom` and the axes they give. A stack matching
no template is a normal answer: there is no deviation, no `enforcement` entry,
and nothing to justify.

Each template's frontmatter carries the four axes (`languages` /
`optional_languages` / `frameworks` / `dependencies`) that land in
`.config/vwf.yaml` and that `/vwf:doctor` checks the repo against; its prose
carries the layout, testing and deployment conventions `plan` and `execute`
read. Languages come from the closed vocabulary in
[stack-vocabulary](${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md).

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
like the project axis, and `/vwf:architecture` presents them. What is fixed is
the **shape**: one backing template naming the datastore/identity/queue/storage
set, one deploy template naming the artifact and release path, and mise as the
tool manager. Per-project detail (hosting, secrets, testing modes) lives in the
selected templates, never here.
