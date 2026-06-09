# <System Name> — Architecture

> **Source of truth for system structure.** Read by humans and by documentation
> tooling. `doc-engineering` parses the **Project Registry** block at the bottom
> of this file. Keep the prose and the registry in sync: every project in the
> registry must appear in the prose, and vice versa.

## System Overview

<!-- What the system is and its high-level shape. State the deployment split:
which projects are cloud-hosted and share the common packages, and which run on
the client device and ship through the app stores. State the shared-package
strategy in one or two sentences. -->

<!-- Draw a simple diagram if it helps. Use mermaid diagrams only. -->

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

## Project Registry

> Machine-readable. `doc-engineering` parses this block to pick each project's
> doc set, stack vocabulary, and deep questions. Keep it accurate.
>
> - `type` ∈ `service` | `worker` | `packages` | `site` | `frontend`
> - `doc_unit` ∈ `entity` | `page` | `module`
> - `capabilities` — see the Capability Vocabulary in the skill; extensible.

```yaml
projects:
  - name: <project-name>
    type: <service|worker|packages|site|frontend>
    path: <repo-or-directory>
    stack: [ <language>, <framework>, <...> ]
    capabilities: [ <capability>, <...> ]
    depends_on: [ <project-name>, <...> ] # or []
    doc_unit: <entity|page|module>
```
