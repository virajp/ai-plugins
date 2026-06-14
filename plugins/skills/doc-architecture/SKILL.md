---
name: doc-architecture
description: Use when the workspace-level architecture doc needs to be created
  or
  updated. Produces docs/architecture.md — the single source of truth that
  doc-engineering parses to learn each project's type, stack, and
  capabilities. NOT auto-triggered.
---

# doc-architecture — System Architecture Documentation

Creates or updates the one workspace-level `docs/architecture.md`. The document
is written for two readers: a human engineer who needs the system's shape, and
the `doc-engineering` skill, which parses the machine-readable **Project
Registry** block to decide which doc set, stack vocabulary, and deep questions
apply to each project.

**Model:** Opus. **Persona:** Senior Systems Architect — thinks in project
boundaries, data flow, deployment topology, and shared-code strategy; produces a
document equally legible to a new engineer and to a tool that must parse it;
never invents a project, stack, or capability the user did not confirm.

> **Run this skill with your session on Opus** (`/model opus`). Architecture
> judgment — project boundaries, capability tagging, dependency reasoning — runs
> in the orchestrator, i.e. your session model. See the session check below.

## Doc Path

| Doc          | Path                                                        |
| ------------ | ----------------------------------------------------------- |
| Architecture | `docs/architecture.md`                                      |
| Template     | `.claude/skills/doc-architecture/templates/architecture.md` |

There is exactly one architecture doc per workspace. It describes every project.

## Topology

The orchestrator (your interactive session) adopts the persona and runs the
entire flow — elicitation and writing. No subagents: this skill is interactive
end-to-end and has no isolated review step. (This is deliberate; a subagent
cannot run an interactive multiple-choice elicitation.)

## Step 0 — Session model check

State which model you are running as. If it is not Opus, alert the user: "This
skill is designed for Opus. You appear to be on `<model>`. Run `/model opus` and
re-invoke." Halt until the user confirms Opus or explicitly tells you to proceed
anyway.

## Process

1. Invoke `skills:git-workflow` — keep the worktree **local**, never push
   remotely.
2. **Detect mode.** If `docs/architecture.md` exists, read it fully — this is an
   update; preserve confirmed content and only fill or revise. If it does not
   exist, this is first creation.
3. Adopt the Senior Systems Architect persona. Invoke
   `superpowers:brainstorming` to elicit the content below. **Ask one question
   at a time. Every question must offer multiple-choice answers, including an
   "Other (please specify)" option** — even where the answer is open (stack,
   path), offer the common choices plus Other so the user is never forced into
   unstructured free text.
4. Elicit the **system-level** content (prose):
   - System overview — what the system is, its high-level shape, the
     cloud-hosted vs client-device split, and the shared-package strategy.
   - How projects interconnect — who calls whom, the auth flow, the data flow.
   - Hosting & deployment — where each project runs and how it ships.
5. Elicit the **per-project registry** content. Enumerate the projects first,
   then for each project gather:
   - `name`
   - `type` — one of: `service`, `worker`, `packages`, `site`, `frontend`
     (definitions below)
   - `path` — repo or directory location
   - `stack` — languages and frameworks (offer common per-type options + Other)
   - `capabilities` — multi-select from the **Capability Vocabulary** below,
     plus Other. These gate the deep questions `doc-engineering` will ask.
   - `depends_on` — other projects/packages it depends on (multi-select from the
     enumerated projects, plus None)
   - `doc_unit` — `entity`, `page`, or `module` (default by type below)
6. Write `docs/architecture.md` from `templates/architecture.md`. Fill the human
   prose sections from step 4 and the `` ```yaml `` Project Registry block from
   step 5. Keep the prose and the registry in sync — every project in the
   registry must be described in the prose, and vice versa.
7. Mark anything genuinely unresolved with `<!-- TODO: needs input -->` rather
   than guessing.
8. When done, suggest:
   `commit changes, merge to default branch of main worktree, push changes,
   switch to main worktree & clean up additional worktree`

## Project Types

| Type       | What it is                                 | Default `doc_unit` | Hosted on |
| ---------- | ------------------------------------------ | ------------------ | --------- |
| `service`  | API backend                                | `entity`           | cloud     |
| `worker`   | Background-task processor                  | `entity`           | cloud     |
| `packages` | Shared libraries used by others            | `module`           | n/a (lib) |
| `site`     | Website                                    | `page`             | cloud     |
| `frontend` | Client-side application (mobile apps only) | `entity`           | device    |

`service`, `worker`, `packages`, and `site` are cloud-hosted; `frontend` runs on
the client (browser, mobile device, or desktop) and ships through whatever
distribution channel the project uses (app store, web host, etc.).

## Capability Vocabulary

Capabilities are stack-agnostic feature flags. They are the gates that decide
which deep, stack-specific questions `doc-engineering` asks. Pick all that apply
per project; add Other for anything not listed. This list is extensible — add
new capabilities as the system grows.

- **Data & storage:** `document-datastore`, `relational-datastore`,
  `object-file-storage`, `cache-layer`, `search-index`
- **Async & messaging:** `durable-workflows`, `message-queue`, `pub-sub`,
  `scheduled-jobs`
- **Realtime & comms:** `realtime-sync`, `realtime-location`,
  `push-notifications`, `voice-audio`
- **Auth & identity:** `third-party-auth`, `custom-claims-rbac`
- **Commerce:** `payments-subscriptions`
- **Geo:** `maps-navigation`
- **Web rendering:** `ssr`, `ssg`, `cms-content`, `seo`
- **Mobile:** `offline-first`, `deep-linking`, `device-permissions`
- **Observability:** `distributed-tracing`

## Commit Message Format

Use conventional commits. Examples:

```text
docs(architecture): create system architecture doc
docs(architecture): add worker project to registry
docs(architecture): update service capabilities — add realtime-location
```
