# Workspace Structure

The ideal shape for a multi-project product — **detected** in existing repos,
**recommended** (accept/deny) when onboarding a new/empty one. It is an optional
opinionated layer: the user may decline the structure, the stack defaults, or
both.

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
  mise config, CI glue, local emulators. `/vwf:init` and the other vwf commands
  run here.
- **backend** is a monorepo: deployable projects under `projects/`, shared
  libraries under `packages/`.
- **frontend** is a single-package app repo — mobile apps are never monorepos.
- Not every project must exist: a product may have no `console`, no `web`, or no
  `frontend` yet. The shape is the ideal, not a checklist.

## Detection (existing repos)

A `.gitmodules` naming child repos (each child dir carrying its own `.git`) →
**workspace** topology. Classify each child on its own signals per
[topology detection](${CLAUDE_PLUGIN_ROOT}/skills/project-init/references/topology-detection.md),
and record the shape in the registry and the `.vwf.yml` stamp
(`topology: workspace`). **Never propose restructuring an existing repo toward
this shape** — for existing repos it is a detection target only.

## Recommendation (new/empty repos only)

When detection finds a new or empty repo (no manifests, no source), recommend —
via MCQ, accept/deny — the shape above **and** the reference stack as
pre-selected, per-project-overridable defaults:

| Project    | Type       | Reference stack                   |
| ---------- | ---------- | --------------------------------- |
| `service`  | `service`  | TypeScript · Hono · Effect-TS     |
| `worker`   | `worker`   | TypeScript · Temporal · Effect-TS |
| `web`      | `site`     | Astro                             |
| `console`  | `console`  | elicit (no reference default)     |
| `common`   | `packages` | TypeScript · Effect-TS            |
| `frontend` | `frontend` | Dart · Flutter                    |

Infrastructure defaults to offer alongside: Firebase (auth, data, messaging),
mise (tool manager), Docker-run local emulators. The stacks are **defaults** —
elicit per-project overrides one at a time; the structure itself is a single
accept/deny recommendation. A decline of either is recorded and not re-asked.
