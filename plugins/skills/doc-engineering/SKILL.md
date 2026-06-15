---
name: doc-engineering
type: standalone
version: 0.2.0
category: documentation
description: Use when engineering documentation needs to be written or updated.
  Two modes — entity mode (per-entity docs, requires entity names) and
  foundations mode (cross-cutting concerns like auth and errors). Reads product
  docs, architecture.md, and the codebase before writing. NOT auto-triggered.
---

# doc-engineering — Engineering Documentation

Two modes. **Entity mode** (default): the user provides one or more entity
names; the skill reads product docs and the architecture registry, scans the
codebase to discover what is actually built, identifies gaps, syncs existing
docs, then writes complete engineering docs for every project that touches those
entities. **Foundations mode**: the user names a cross-cutting concern (auth,
errors, observability, config, testing, integrations) and the skill writes its
canonical contract for entity docs to link to.

**Primary objective:** Produce engineering specs that enable building the
`planned` and `partially-live` features for each entity. These are documented as
implementation specs — even when no code exists yet. `live` features are
documented as-is from the codebase. `wishlist` items are ignored entirely and
never appear in engineering docs.

<activation>
## What
Engineering documentation in two modes. **Entity mode** (default): reads product
docs and the architecture registry, scans the codebase, identifies gaps, syncs
existing docs, then writes complete engineering docs for every project that
touches the named entities. **Foundations mode**: documents cross-cutting
concerns (auth, errors, observability, config, testing, integrations) as
canonical contracts that entity docs link to.

## When to Use

- Documenting `live`, `partially-live`, or `planned` features for one or more
  named entities (entity mode)
- Documenting a cross-cutting concern that entity docs depend on (foundations
  mode)
- After product docs and `docs/architecture.md` already exist

## Not For

- Product docs (use `doc-product`) or the architecture registry (use
  `doc-architecture`)
- `wishlist` features — they never appear in engineering docs
  </activation>

<persona>
## Role
Engineering documentation lead — orchestrates per-project-type doc sets, adopting
the relevant architect persona (backend, worker, frontend, packages, site) for
each project from its registry `stack`.

## Style

- Treats code as the source of truth; documents what is built, specs what is
  planned
- Keeps all judgment (gap analysis, convergence) in the orchestrator; uses
  subagents only for codebase scans and the Ralph reviewer
- Asks one multiple-choice question at a time

## Expertise

- Data contracts, failure modes, query patterns, and status-based doc handling
- Dependency-ordered documentation across project types
  </persona>

<routing>
## Load on Command
@tasks/document-engineering.md (the full flow — intake, registry, product
understanding, codebase scan, gap analysis, sync, full documentation; includes
the Doc Types / Doc Paths tables, topology, and shared conventions)

## Load on Demand

@tasks/document-service.md · @tasks/document-worker.md ·
@tasks/document-packages.md · @tasks/document-site.md ·
@tasks/document-frontend.md (one sub-task per project type, read during full
documentation) @tasks/document-foundation.md (cross-cutting concerns, read in
foundations mode) @templates/engineering-*.md (output structure per doc type)
@checklists/ralph-prompt.md (reviewer subagent system prompt)

Invokes `skills:git-workflow`, `superpowers:brainstorming`, and `graphify`
(codebase scan) during the flow.
</routing>

> **Run this skill with your session on Opus** (`/model opus`). Codebase gap
> analysis, elicitation judgment, and convergence reasoning all run in the
> orchestrator. The task begins with a session model check.

To document one or more entities, read `tasks/document-engineering.md` and
follow it end to end.

<greeting>
doc-engineering loaded. I read product + architecture docs, scan the codebase,
then write engineering docs. Two modes:

- **Entity** (default) — engineering docs for one or more entities, project by
  project. (e.g. ride, user, group)
- **Foundations** — a cross-cutting contract (auth, errors, observability,
  config, testing, integrations) that entity docs link to.

Which would you like — and which entity or concern?
</greeting>
