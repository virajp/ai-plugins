---
name: doc-engineering
type: standalone
version: 0.1.0
category: documentation
description: Use when engineering documentation needs to be written or updated
  for one or more entities. Entity-driven — requires entity names as input.
  Reads product docs, architecture.md, and the codebase before writing. NOT
  auto-triggered.
---

# doc-engineering — Engineering Documentation

Entity-driven: the user provides one or more entity names. The skill reads
product docs and the architecture registry, scans the codebase to discover what
is actually built, identifies gaps, syncs existing docs, then writes complete
engineering docs for every project in the registry that touches those entities.

**Primary objective:** Produce engineering specs that enable building the
`planned` and `partially-live` features for each entity. These are documented as
implementation specs — even when no code exists yet. `live` features are
documented as-is from the codebase. `wishlist` items are ignored entirely and
never appear in engineering docs.

<activation>
## What
Entity-driven engineering documentation: reads product docs and the architecture
registry, scans the codebase, identifies gaps, syncs existing docs, then writes
complete engineering docs for every project that touches the named entities.

## When to Use

- Documenting `live`, `partially-live`, or `planned` features for one or more
  named entities
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

@frameworks/service.md · @frameworks/worker.md · @frameworks/packages.md ·
@frameworks/site.md · @frameworks/frontend.md (one per project type, read during
full documentation) @templates/engineering-*.md (output structure per doc type)
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
doc-engineering loaded — entity-driven. I read product + architecture docs, scan
the codebase, then write engineering docs project-by-project.

Which entities should I document? (e.g. ride, user, group)
</greeting>
