---
type: vwf-architecture
title: <System Name> — Architecture
description: System shape and the machine-readable Project Registry.
status: draft # draft | reviewed | stable
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# <System Name> — Architecture

> **Source of truth for system structure.** Lives at
> `docs/blueprint/architecture.md`. Read by humans and by documentation tooling.
> `blueprint` and `plan` parse the **Project Registry** block at the bottom of
> this file to resolve stack vocabulary and the entity→project mapping. Keep the
> prose and the registry in sync: every project in the registry must appear in
> the prose, and vice versa.

## System Overview

<!-- What the system is and its high-level shape. State the deployment split:
which projects are cloud-hosted and share the common packages, and which run on
the client device and ship through the app stores. State the shared-package
strategy in one or two sentences. -->

<!-- Draw a simple diagram if it helps. Use mermaid only — for system topology a
`flowchart`/`graph`. Follow the documentation-standards diagram conventions
(type-by-purpose, quoted labels, GitHub/GitLab-renderable, no init directives). -->

## Projects

<!-- One short subsection per project. Describe responsibility and boundaries —
not implementation detail. -->

### <Project Name> (`<type>`)

<!-- What it does, its boundaries, and any notable architectural choice. -->

## How Projects Interconnect

<!-- Who calls whom. The auth flow (where identity is established and how it
propagates). The data flow (where the system of record lives and how reads/writes
move between projects). A simple text diagram is welcome. -->

## Hosting & Deployment

<!-- Where each project runs and how it ships. For cloud projects: the platform
and region. For the mobile app: the stores and release channel. -->

## Cross-cutting Decisions

<!-- One-line selections for system-wide engineering concerns. These are the
inputs `blueprint` expands into canonical contracts under docs/blueprint/conventions.md.
Record the *decision* (the selection) here; the *contract* (the full blueprint) lives
in conventions.md. Include only concerns the system actually has; omit the rest.
Keep this table in sync with the `cross_cutting` block in the registry below. -->

| Concern       | Decision            |
| ------------- | ------------------- |
| auth          | <selection>         |
| errors        | <selection>         |
| observability | <selection>         |
| config        | <selection>         |
| testing       | <selection>         |
| integrations  | <selection or none> |

## Project Registry

> Machine-readable. `blueprint` and `plan` parse this block to resolve each
> entity section's target project, stack vocabulary, and capabilities. Keep it
> accurate.
>
> - `type` ∈ `service` | `worker` | `packages` | `site` | `frontend` | `console`
> - `doc_unit` ∈ `entity` | `page` | `module`
> - `capabilities` — see the Capability Vocabulary in the architecture phase;
>   extensible.
> - `cross_cutting` — one-line decision per system-wide concern; the input to
>   `blueprint`'s conventions.md. Include only the concerns that exist.
> - Enforcement opt-outs (structure/stack/rule deviations) do **not** live here
>   — they are vwf operating config, recorded under `enforcement:` in
>   `.config/vwf.yaml`. The registry describes the system as it **is** (the
>   actual stack, even a deviated one), with no waiver metadata.

```yaml
projects:
  - name: <project-name>
    type: <service|worker|packages|site|frontend|console>
    path: <repo-or-directory>
    stack: [ <language>, <framework>, <...> ]
    capabilities: [ <capability>, <...> ]
    depends_on: [ <project-name>, <...> ] # or []
    doc_unit: <entity|page|module>

cross_cutting: # system-wide concerns → blueprint's conventions.md
  auth: <selection> # e.g. firebase-id-token, jwt, session-cookie, none
  errors: <selection> # e.g. coded-envelope, http-status-only
  observability: <selection> # e.g. structured-json-logs, otel-tracing, none
  config: <selection> # e.g. env-vars, secrets-manager
  testing: <selection> # e.g. vitest-unit-integration, none
  integrations: [ <service-name>, <...> ] # external services, or []
```
