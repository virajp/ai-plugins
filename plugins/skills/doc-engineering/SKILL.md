---
name: doc-engineering
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

> **Run this skill with your session on Opus** (`/model opus`). Codebase gap
> analysis, elicitation judgment, and convergence reasoning all run in the
> orchestrator. See Step 0.

## Topology

The orchestrator (your interactive session) owns the entire flow. **Subagents
are used for two things only:**

1. **Codebase scan** (Step 4) — one subagent per project, run in parallel, each
   reading its project root and returning structured findings.
2. **Ralph reviewer** (Step 7) — one isolated subagent per doc, receives only
   the doc files, returns a gap list.

All judgment — what counts as a gap, whether a gap resolved, convergence — stays
in the orchestrator.

## Doc Types

| Project type | Sub-file      | Unit   | Output path                                     |
| ------------ | ------------- | ------ | ----------------------------------------------- |
| `service`    | `service.md`  | entity | `docs/engineering/service/api/<entity>.md`      |
| `worker`     | `worker.md`   | entity | `docs/engineering/worker/workflows/<entity>.md` |
| `packages`   | `packages.md` | module | `docs/engineering/packages/<module>.md`         |
| `site`       | `site.md`     | page   | `docs/engineering/site/<page>.md`               |
| `frontend`   | `frontend.md` | entity | `docs/engineering/frontend/<entity>/`           |

For any project type not in this table: alert the user
(`"Project '<name>' has unknown type '<type>' — no sub-file found. Skipping."`)
and continue without halting.

## Doc Paths

| Doc type          | Path                                              |
| ----------------- | ------------------------------------------------- |
| Architecture      | `docs/architecture.md` (prerequisite — read-only) |
| Product           | `docs/product/<entity>/` (prerequisite)           |
| Service API       | `docs/engineering/service/api/<entity>.md`        |
| Worker            | `docs/engineering/worker/workflows/<entity>.md`   |
| Packages          | `docs/engineering/packages/<module>.md`           |
| Schemas           | `docs/engineering/packages/schemas/<entity>.md`   |
| Site              | `docs/engineering/site/<page>.md`                 |
| Frontend (entity) | `docs/engineering/frontend/<entity>/index.md`     |
| Frontend (screen) | `docs/engineering/frontend/<entity>/<screen>.md`  |

---

## Step 0 — Session model check

State which model you are running as. If it is not Opus, alert the user: "This
skill is designed for Opus. You appear to be on `<model>`. Run `/model opus` and
re-invoke." Halt until the user confirms Opus or explicitly tells you to proceed
anyway.

---

## Step 1 — Intake

1. Confirm the entity or entities to document. If the user has not provided
   entity names, ask: "Which entities should I document? (e.g. ride, user,
   group)"
2. Invoke `skills:git-workflow` — keep the worktree **local**, never push
   remotely.

---

## Step 2 — Architecture registry

Read `docs/architecture.md`. If it does not exist, halt: "No architecture doc
found. Run `doc-architecture` first."

Parse the **Project Registry** `` ```yaml `` block. For each project, extract:
`name`, `type`, `stack`, `capabilities`, `depends_on`, and the project's
filesystem root (use the `root` field if present; otherwise infer it as
`./<name>/`). Build a **project map** you will reference throughout.

---

## Step 3 — Product understanding

For each entity provided in Step 1, read all files in `docs/product/<entity>/`.
If the directory does not exist, halt: "No product doc found for `<entity>`. Run
`doc-product` first."

Build an **entity summary** in your context covering: purpose, all defined
actions, user roles, failure cases, edge cases, and out-of-scope items.

---

## Step 4 — Codebase scan

Scan the codebase to discover what is actually built for the specified entities.

**Strategy — prefer graphify, fall back to parallel subagents:**

### If graphify is available

Invoke `graphify` to query the knowledge graph for each entity. Ask:

- "What code exists for entity `<entity>`? List files and describe what each
  implements."
- "Which projects contain `<entity>`-related code?"

Collect the results into the Codebase Map below.

### If graphify is not available (fallback)

For each project in the registry, spawn a `model: opus` subagent with **only**
the project's root path and this instruction (substitute values):

```text
Scan the directory `<root>/` for code related to these entities: <entities>.

Return a report with these four sections — plain text, no prose:

files_found:
  - <relative path> — <one-line description of what it contains>

features_implemented:
  - <feature> — <file(s) where it lives>

features_partial:
  - <feature> — <why it appears incomplete>

notes:
  - <anything architecturally notable, e.g. entity spans multiple files/packages>

Report only what you observe in the code. Do not infer what should exist.
```

Run all project subagents in parallel. Collect responses.

### Codebase Map

Merge all findings into a **Codebase Map** keyed by entity, then by project:

```text
entity: ride
  project: service  → features_implemented, features_partial, files_found
  project: worker   → ...
  project: frontend → ...
  ...
```

---

## Step 5 — Gap analysis

Cross-reference the Codebase Map (Step 4) against the entity summaries (Step 3)
and any existing engineering docs.

**Implementation gaps** — features described in the product docs that are absent
from the Codebase Map. These are missing from the code, not just undocumented.

**Documentation gaps** — features present in the Codebase Map but absent or
stale in `docs/engineering/`. Read each existing engineering doc for the
entities and compare against the codebase scan to identify these.

Present both lists to the user in this format:

```text
Implementation gaps (in product docs, not in code):
  - <entity>: <feature> — <product doc reference>
  ...

Documentation gaps (in code, not in engineering docs):
  - <project>/<entity>: <feature or section> — <file reference>
  ...
```

Then ask: "How should I handle implementation gaps?"

- **(a) Skip them** — document only what is built; note nothing about unbuilt
  features.
- **(b) Note as planned** — add a `<!-- planned: not yet implemented -->` marker
  in the engineering docs where the feature would live.
- **(c) Stop and flag** — pause here; do not proceed until the team has
  reviewed.

Wait for the user's choice before continuing.

---

## Step 6 — Documentation sync

Before writing new docs, bring existing engineering docs up to date with the
current codebase.

For each **documentation gap** from Step 5:

1. Identify the relevant engineering doc path.
2. If the doc exists, open it and update or add only the sections that are
   missing or stale — do not rewrite sections that are accurate.
3. If the doc does not exist, skip it here — Step 7 will create it from scratch.
4. Run the **Ralph loop** (see Shared conventions) on any doc touched in this
   step.

Get user approval after all sync edits before proceeding to Step 7.

---

## Step 7 — Full documentation

For each project in the registry, determine relevance to the specified entities:

**Relevant** if either holds:

- The Codebase Map (Step 4) contains findings for this project under any of the
  specified entities.
- This project is listed in `depends_on` of another relevant project.

Skip non-relevant projects without alerting.

**Order** — document dependencies before consumers:

1. `packages` (shared schemas and contracts)
2. `service` (API layer)
3. `worker` (background jobs)
4. `site` (web pages)
5. `frontend` (mobile/app screens)

Within each type, honour `depends_on`: document a project before any project
that lists it as a dependency.

**For each relevant project:**

1. Read the sub-file matching its `type` (see Doc Types table) and follow it
   completely.
2. You already hold the Codebase Map from Step 4 — use it to pre-fill answers
   where the code makes the answer unambiguous. Only ask elicitation questions
   for details the scan could not determine (e.g. auth rules, retry policies,
   design intent).
3. Apply the implementation-gap decision from Step 5 when a product feature is
   absent from the code.
4. Run the **Ralph loop** and **Approval gate** (see Shared conventions) before
   starting the next project.

---

## New capability or pattern discovered

If elicitation surfaces a capability, dependency, or architectural pattern not
present in the registry, do not edit `docs/architecture.md` here — it is owned
by `doc-architecture`. Alert the user: "This introduces `<capability/pattern>`,
which isn't in the architecture registry. Consider running `doc-architecture` to
record it." Then continue.

---

## Shared conventions (all sub-files)

- **Elicitation:** Invoke `superpowers:brainstorming`. Ask one question at a
  time. Every question must offer multiple-choice answers including "Other
  (please specify)" — even open-ended answers get common options plus Other.
- **Stack injection:** Replace bracketed placeholders in templates
  (`<datastore>`, `<auth-mechanism>`, `<state-management>`, etc.) with the
  actual values from the project's `stack` in the registry.
- **Ralph loop (reviewer):** After writing, spawn a `model: opus` subagent with
  **only** the written engineering docs plus the product/schema docs they
  reference — no conversation context. Context bleed causes the reviewer to fill
  gaps from memory instead of surfacing them — keep its context to doc files
  only. The subagent returns a gap list only, no rewrites. Resolve gaps via
  brainstorming (one at a time, MCQ), update, re-review. **Convergence guard:**
  the orchestrator keeps each round's gap list in memory; pause and surface to
  the user if the gap count did not strictly decrease, or if a resolved gap
  resurfaces. Loop until the reviewer returns `NO GAPS`.
- **Approval gate:** When a project's docs are clean, pause and wait for
  explicit user approval before continuing to the next project.

---

## Commit Message Format

Use conventional commits, scoped by type. Examples:

```text
docs(engineering): add ride service API spec
docs(engineering): sync ride worker doc to current code
docs(engineering): add ride frontend screens & state
docs(engineering): add shared ride schema contract
```
