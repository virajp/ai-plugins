---
name: doc-engineering
description: Use when engineering documentation needs to be written or updated
  for a project in the workspace. Reads docs/architecture.md to learn each
  project's type, stack, and capabilities, then runs the matching doc set
  (service, worker, packages, site, or frontend). Requires architecture.md and,
  for entity-driven types, the relevant product docs. NOT auto-triggered.
---

# doc-engineering — Engineering Documentation

Writes or updates engineering docs for a project. The project's **type**
(declared in `docs/architecture.md`) decides which doc set runs:

| Type       | Doc set covers                              | Sub-file       | `doc_unit` |
| ---------- | ------------------------------------------- | -------------- | ---------- |
| `service`  | endpoints, auth, query patterns, indexes    | `service.md`   | entity     |
| `worker`   | workflows, activities, triggers, retries    | `worker.md`    | entity     |
| `packages` | shared modules + schemas & data contracts   | `packages.md`  | module     |
| `site`     | pages/routes, rendering, content, SEO       | `site.md`      | page       |
| `frontend` | screens (per-screen specs), state, navigation| `frontend.md`  | entity     |

Each set runs independently — run one, several, or all depending on what the
feature touches.

> **Run this skill with your session on Opus** (`/model opus`). The persona,
> elicitation judgment, and convergence reasoning run in the orchestrator, i.e.
> your session model. See Step 0.

## Topology

The orchestrator (your interactive session) adopts the persona for the chosen
type and runs the entire interactive flow — elicitation and writing.
**Subagents are used for one thing only: the isolated reviewer in each sub-file's
Ralph loop.** A subagent cannot run an interactive multiple-choice elicitation,
so all brainstorming happens in the orchestrator.

## Doc Paths

| Doc type        | Path                                              |
| --------------- | ------------------------------------------------- |
| Architecture    | `docs/architecture.md` (prerequisite — read-only) |
| Product         | `docs/product/<entity>/` (prereq for entity types)|
| Service API     | `docs/engineering/service/api/<entity>.md`        |
| Worker          | `docs/engineering/worker/workflows/<entity>.md`   |
| Packages        | `docs/engineering/packages/<module>.md`           |
| Schemas         | `docs/engineering/packages/schemas/<entity>.md`   |
| Site            | `docs/engineering/site/<page>.md`                 |
| Frontend (entity)| `docs/engineering/frontend/<entity>/index.md`    |
| Frontend (screen)| `docs/engineering/frontend/<entity>/<screen>.md` |
| Templates       | `.claude/skills/doc-engineering/templates/`     |

Schemas and data contracts live under `packages/` because they are shared across
projects; `service`, `worker`, `frontend`, and `site` docs reference them by
link rather than restating the shape.

## Step 0 — Session model check

State which model you are running as. If it is not Opus, alert the user:
"This skill is designed for Opus. You appear to be on `<model>`. Run
`/model opus` and re-invoke." Halt until the user confirms Opus or explicitly
tells you to proceed anyway.

## Prerequisites & Halt Conditions

1. **Architecture.** If `docs/architecture.md` does not exist, halt:
   "No architecture doc found. Run `doc-architecture` first." Read it and
   parse the **Project Registry** ` ```yaml ` block to obtain, for the target
   project: `type`, `stack`, `capabilities`, `depends_on`, `doc_unit`.
2. **Product (entity-driven types only).** For `service`, `worker`, and
   `frontend` (where `doc_unit: entity`), if `docs/product/<entity>/` does not
   exist, halt: "No product doc found for `<entity>`. Run `doc-product`
   first." For `site` (page) and `packages` (module), product docs are optional
   context — read any related entity's product docs if they exist, but do not
   halt.

## Process

1. Run Step 0 (session check).
2. Read `docs/architecture.md`; parse the registry. Identify the target
   project(s) and their `type`. If the user's request spans multiple projects
   (e.g. a full-stack feature touching `service` + `worker` + `frontend`), run
   each type's doc set in turn.
3. Enforce the halt conditions above for each type being run.
4. Invoke `superpowers:using-git-worktrees` — keep the worktree **local**, never
   push remotely.
5. **Read the sub-file for the type and follow it.** Each sub-file injects the
   project's `stack` into its persona and fires capability-gated questions based
   on the project's `capabilities`.

| Type       | Sub-file      |
| ---------- | ------------- |
| `service`  | `service.md`  |
| `worker`   | `worker.md`   |
| `packages` | `packages.md` |
| `site`     | `site.md`     |
| `frontend` | `frontend.md` |

## New capability or pattern discovered

If elicitation surfaces a capability, dependency, or architectural pattern not
present in the registry, **do not edit `docs/architecture.md` here** — it is
owned by `doc-architecture`. Instead, alert the user: "This introduces
`<capability/pattern>`, which isn't in the architecture registry. Consider
running `doc-architecture` to record it." Then continue.

## Shared conventions (all sub-files)

- **Elicitation:** Invoke `superpowers:brainstorming`. Ask one question at a
  time. Every question must offer multiple-choice answers including "Other
  (please specify)" — even open answers (types, retry values) get common options
  plus Other.
- **Stack injection:** Replace bracketed placeholders in templates
  (`<datastore>`, `<auth-mechanism>`, `<state-management>`, `<workflow-engine>`,
  etc.) with the project's actual `stack` from the registry.
- **Ralph loop (reviewer):** After writing, spawn a `model: opus` subagent (the
  `opus` alias resolves to the latest Opus model) with **only** the written
  engineering docs plus the product/schema docs they reference — no conversation
  context. It returns a gap list only, no rewrites. Resolve gaps via
  brainstorming (one at a time, MCQ), update, re-review. Apply the **convergence
  guard**: the orchestrator keeps each round's gap list in memory; pause and
  surface to the user if the gap count did not strictly decrease, or if a
  resolved gap resurfaces. Otherwise loop until the reviewer returns `NO GAPS`.
  Context bleed makes the reviewer fill gaps from memory instead of surfacing
  them — keep its context to the doc files only.
- **Approval gate:** When the type's docs are clean, pause and wait for explicit
  user approval before continuing to `spec-plan`.

## Commit Message Format

Use conventional commits, scoped by type. Examples:

```
docs(engineering): add ride service API spec
docs(engineering): add ride status worker workflows
docs(engineering): add shared ride schema contract
docs(engineering): add community site pages
docs(engineering): add ride frontend screens & state
```
