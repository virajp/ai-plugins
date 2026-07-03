# Workspace Structure

The shape and stacks vwf **enforces** for a multi-project product — applied when
onboarding a new/empty repo, proposed (consent-gated) as a migration for an
existing repo that does not match. Structure and stacks each carry one escape
hatch: an explicit user objection is honored and recorded as a `deviations:`
entry in the architecture registry (scope, choice, reason). A recorded deviation
is settled — never re-asked or re-proposed.

## The shape

A parent **workspace** git repo whose children are **git submodules**:

```text
workspace/            # parent repo — vwf lives here
├── .gitmodules       # backend + frontend
├── docs/blueprint/   # the vwf bundle (one per workspace)
├── .config/          # mise config (workspace tooling)
├── backend/          # submodule — monorepo
│   ├── projects/
│   │   ├── service/  # type: service
│   │   ├── worker/   # type: worker
│   │   ├── web/      # type: site
│   │   └── console/  # type: console
│   └── packages/
│       └── common/   # type: packages
└── frontend/         # submodule — single-package on-device app (type: frontend)
```

- The **workspace parent** holds everything product-wide: `docs/blueprint/`,
  mise config, CI glue, local emulators. `/vwf:setup` and the other vwf commands
  run here.
- **backend** is a monorepo: deployable projects under `projects/`, shared
  libraries under `packages/` — tooling per the
  [monorepo stack](${CLAUDE_PLUGIN_ROOT}/assets/stacks/monorepo.md).
- **frontend** is a single-package app repo — mobile apps are never monorepos.
- Not every project must exist: a product may have no `console`, no `web`, or no
  `frontend` yet. Absence is fine; a project that exists under another layout is
  what triggers the migration proposal below.

## Existing repos

A `.gitmodules` naming child repos (each child dir carrying its own `.git`) →
**workspace** topology. Classify each child on its own signals per
[topology detection](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/topology-detection.md),
and record the shape in the registry and the `.vwf.yml` stamp
(`topology: workspace`).

A repo that does **not** conform gets a **restructure proposal** folded into the
setup migration plan: in-repo layout moves (`projects/` / `packages/` grouping,
project naming) as normal consent-gated batches; anything crossing a repo
boundary — e.g. splitting a single repo into parent + submodules — only ever as
a written recommendation, per
[migration & consent](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/migration-and-consent.md).
A decline is recorded as a `deviations:` entry (`scope: structure`) and not
re-proposed on later runs.

## Reference stacks (enforced)

Each project type has exactly one reference stack, detailed in its stack doc:

| Project    | Type       | Reference stack                                | Stack doc                                                   |
| ---------- | ---------- | ---------------------------------------------- | ----------------------------------------------------------- |
| `common`   | `packages` | TypeScript · Effect-TS                         | [packages](${CLAUDE_PLUGIN_ROOT}/assets/stacks/packages.md) |
| `service`  | `service`  | TypeScript · Hono · Effect-TS                  | [service](${CLAUDE_PLUGIN_ROOT}/assets/stacks/service.md)   |
| `worker`   | `worker`   | TypeScript · Temporal · Effect-TS              | [worker](${CLAUDE_PLUGIN_ROOT}/assets/stacks/worker.md)     |
| `web`      | `site`     | TypeScript · Astro (SSR) · React               | [site](${CLAUDE_PLUGIN_ROOT}/assets/stacks/site.md)         |
| `console`  | `console`  | TypeScript · Hono + Effect-TS · React + Refine | [console](${CLAUDE_PLUGIN_ROOT}/assets/stacks/console.md)   |
| `frontend` | `frontend` | Dart · Flutter                                 | [frontend](${CLAUDE_PLUGIN_ROOT}/assets/stacks/frontend.md) |

The stacks are **fixed, not defaults**: state them (from the stack docs), do not
elicit alternatives. The escape hatch: an explicit user objection is honored —
record the stack they name plus a `deviations:` entry
(`scope: stack/<project>`). The table is what vwf ships today; more options
arrive by extending vwf, not by per-repo improvisation.

`console` is the **operator/back-office control panel** — the internal,
privileged counterpart to `web`, and the **sole holder of admin capabilities**
(the public `service` exposes no admin routes). It is a single deployable: one
server app serving both the operator API and an embedded web UI from the same
origin. Operators authenticate with the product's auth under a dedicated
operator role; privileged operations go through the shared package and hand
long-running actions to the `worker`. It therefore typically carries
`depends_on: [common, worker]` and richer capabilities (auth, datastore, RBAC,
audit) than `web`.

## The common-package rules

`packages/common` is the workspace's chokepoint, and two placement rules are
enforced (seeded into `conventions.md#patterns` on onboarding; the execute
reviewers flag violations unless a `deviations:` entry — `scope: rules/<rule>` —
waives one):

1. **All shared schemas live in `common`** (`rules/schemas-in-common`) — shared
   data schemas are defined once, under the common package's schema export
   subpaths; no other project defines a shared data schema.
2. **All third-party integrations go via `common`**
   (`rules/integrations-via-common`) — Firebase and every other external service
   are accessed only through the common package's wrappers/layers; no other
   project imports a third-party SDK directly. Client-side sign-in is the one
   allowed exception.

## Infrastructure defaults

Alongside the stacks: Firebase (auth, data, messaging), mise (tool manager),
Docker-run local emulators. Per-project infrastructure detail (hosting, secrets,
testing modes) lives in each stack doc.
