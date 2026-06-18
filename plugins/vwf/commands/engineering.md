---
description: Write or update engineering documentation for one or more entities
  (entity mode) or a cross-cutting concern (foundations mode). Reads product
  docs, architecture.md, and the codebase before writing. Specs planned features;
  documents live ones from code.
argument-hint: "[entity names | foundations <concern>]"
model: inherit
---

# engineering — Engineering Documentation Orchestrator

Write and update engineering documentation in two modes. **Entity mode**
(default): the user names one or more entities; read product docs and the
architecture registry, scan the codebase to discover what is built, identify
gaps, sync existing docs, then write complete engineering docs for every project
that touches those entities. **Foundations mode**: the user names a
cross-cutting concern (auth, errors, observability, config, testing,
integrations) and you write its canonical contract for entity docs to link to.

Heavy reasoning runs in subagents (scan, audit, author, verify). You own the
user conversation (clarify, approval gates) and the commit. A subagent cannot
pause to ask the user a question — its output returns only when it finishes. The
author subagent writes files directly rather than returning bodies for you to
re-emit.

**Primary objective:** produce engineering specs that enable building the
`planned` and `partially-live` features for each entity — documented as
implementation specs even when no code exists yet. `live` features are
documented as-is from the codebase. `wishlist` items are ignored entirely and
never appear in engineering docs.

## Mode Detection

Read the mode from `$ARGUMENTS`:

- **One or more entity names (default)** → **entity mode**.
- **`foundations [concern]`, or a named cross-cutting concern** (auth, errors,
  observability, config, testing, integrations) → **foundations mode**.

If ambiguous, ask: "Entity mode (engineering docs for an entity) or foundations
mode (a cross-cutting contract)? And which entity or concern?" **Wait for the
response.** If the mode is clear but the target is missing, ask for it and wait.

## Doc Types

| Project type    | Playbook (`${CLAUDE_PLUGIN_ROOT}/assets/playbooks/`) | Unit    | Output path                                     |
| --------------- | ---------------------------------------------------- | ------- | ----------------------------------------------- |
| `service`       | `document-service.md`                                | entity  | `docs/engineering/service/api/<entity>.md`      |
| `worker`        | `document-worker.md`                                 | entity  | `docs/engineering/worker/workflows/<entity>.md` |
| `packages`      | `document-packages.md`                               | module  | `docs/engineering/packages/<module>.md`         |
| `site`          | `document-site.md`                                   | page    | `docs/engineering/site/<page>.md`               |
| `frontend`      | `document-frontend.md`                               | entity  | `docs/engineering/frontend/<entity>/`           |
| `foundations`\* | `document-foundation.md`                             | concern | `docs/engineering/foundations/<concern>.md`     |

\* `foundations` is a **mode**, not a registry project type; it documents
cross-cutting concerns and runs as layer-0 (before `packages`).

For any project type not in this table: alert the user
(`"Project '<name>' has
unknown type '<type>' — no playbook found. Skipping."`)
and continue without halting.

## Doc Paths

| Doc type          | Path                                              |
| ----------------- | ------------------------------------------------- |
| Architecture      | `docs/architecture.md` (prerequisite — read-only) |
| Product           | `docs/product/<entity>/` (prerequisite)           |
| Foundation        | `docs/engineering/foundations/<concern>.md`       |
| Service API       | `docs/engineering/service/api/<entity>.md`        |
| Worker            | `docs/engineering/worker/workflows/<entity>.md`   |
| Packages          | `docs/engineering/packages/<module>.md`           |
| Schemas           | `docs/engineering/packages/schemas/<entity>.md`   |
| Site              | `docs/engineering/site/<page>.md`                 |
| Frontend (entity) | `docs/engineering/frontend/<entity>/index.md`     |
| Frontend (screen) | `docs/engineering/frontend/<entity>/<screen>.md`  |

## Shared conventions

- **Stack injection:** the author subagent replaces bracketed template
  placeholders (`<datastore>`, `<auth-mechanism>`, `<state-management>`, etc.)
  with the actual values from the project's `stack` in the registry.
- **Status callouts:** `planned` sections open with `> **Status: Planned**`;
  `partially-live` documents the built parts then opens the remainder with
  `> **Status: Partially Live**`.
- **Cross-link discipline:** entity docs **link** to `foundations/<concern>.md`
  for auth flows and standard error sets — they never restate them.

---

## Pipeline

### 1. Setup

Invoke `/git-workflow` to ensure an isolated workspace. Keep the worktree
**local** — never push remotely.

### 2. Seed (orchestrator + scan subagents)

**2a — Architecture registry.** Read `docs/architecture.md`. If it does not
exist, halt: "No architecture doc found. Run `/product` and accept its
architecture step first." Parse the **Project Registry** `yaml` block. For each
project extract `name`, `type`, `stack`, `capabilities`, `depends_on`, and the
filesystem root (`path`/`root` if present, else infer `./<name>/`). Build a
**project map**. Also parse the **`cross_cutting`** block (one-line selections
such as `auth: firebase-id-token`) — these are the `{decision}` lines for
foundation docs.

**2b — Product understanding (entity mode only; foundations mode skips this).**
For each entity, read all files in `docs/product/<entity>/`. If the directory is
absent, halt: "No product doc found for `<entity>`. Run `/product` first." Build
an **entity summary** with five status buckets:

| Status             | Treatment in engineering docs                               |
| ------------------ | ----------------------------------------------------------- |
| **live**           | Document what exists in the codebase                        |
| **partially-live** | Document the built parts; write a spec for what remains     |
| **planned**        | Write a complete implementation spec                        |
| **wishlist**       | **Skip entirely — never appears in engineering docs**       |
| **untriaged**      | Treat as unknown — ask the user to triage before proceeding |

List `wishlist` so the user sees what was dropped, then ignore it. `untriaged`
items must be classified by the user before authoring.

**2c — Codebase scan.** Discover what is actually built. **Prefer the `graphify`
skill**; if unavailable, dispatch one `engineering-scanner` subagent per project
root **in parallel** (mechanical scanning, not judgment), passing each the
project root and the entities (entity mode) or the concern (foundations mode).
Merge the findings into a **Codebase Map** keyed by entity/concern, then by
project:

```text
entity: ride
  project: service  → features_implemented, features_partial, files_found
  project: worker   → ...
```

### 3. Audit + gaps (auditor subagent)

Dispatch one `engineering-auditor` subagent holding the whole **Codebase Map**,
the **entity summary** (or concern list), the **project map**, the
**mode/targets**, and any **existing engineering docs** for the targets. A
single cross-project audit is deliberate — relational gaps (an entity spanning
service + worker + frontend) only surface when one context holds the whole map.

It returns a report with these categories, each multi-valued question framed as
2–3 options with a recommendation:

- **Implementation gaps** — `planned` features absent from code, plus the
  unbuilt remainder of `partially-live` features.
- **Documentation gaps** — features in code but absent/stale in
  `docs/engineering/`.
- **Foundations gaps** — a concern an entity doc references with no
  `docs/engineering/foundations/<concern>.md` yet.
- **Open questions** per relevant project, drawn from that project type's
  playbook tiers (Tier 1 always; Tier 2 only for capabilities the registry
  declares).

`wishlist` is never an implementation gap; `untriaged` blocks — surface it for
triage.

### 4. Clarify + approval gate (orchestrator)

You — not the subagent — talk to the user here.

1. **Present the gap lists** (implementation / documentation / foundations /
   wishlist-excluded / untriaged).
2. **Ask the open questions in batches** via `AskUserQuestion`, grouped by
   project, lowest dependency first. For option-framed questions, offer the
   options, lead with the recommended one, include "Other". Pre-fill any answer
   the Codebase Map already makes unambiguous and just confirm it. **Never
   assume** — an unanswered question stays open.
3. **Approval gate (before any write).** Summarize, per project, what will be
   created or changed and which status callouts apply (`planned` /
   `partially-live`). Wait for sign-off. No file is written on an unapproved
   plan.

### 5. Author + Verify + Converge (per unit, dependency order)

Determine the relevant units and order them:

- **Entity mode:** projects relevant to the entities (in the Codebase Map, or in
  another relevant project's `depends_on`). Order: `packages` → `service` →
  `worker` → `site` → `frontend`; within a type, dependencies before consumers.
  Any referenced foundation concern should already have a doc.
- **Foundations mode:** one unit per concern; foundations are layer-0 and run
  before any entity work.

Run each unit through this chain:

**5a — Author (`engineering-author` subagent).** Give it the approved answers,
the project type and its playbook path
(`${CLAUDE_PLUGIN_ROOT}/assets/playbooks/document-<type>.md`), the matching
template(s) under `${CLAUDE_PLUGIN_ROOT}/assets/templates/`, the Codebase Map
slice, and the **stack** from the registry (so it injects `<datastore>`,
`<auth-mechanism>`, `<state-management>`, etc.). It writes the doc files
directly and updates the relevant `readme.md` index. It applies status handling:
`live` from code; `partially-live` built parts + a
`> **Status: Partially Live**` build spec; `planned` a full
`> **Status: Planned**` build spec; `wishlist` omitted; `untriaged` not written.
It returns a change summary only:

```text
FILES_WRITTEN: <paths>
CHANGES: <one line per section, tied to the answer/feature it applied>
UNRESOLVED: <approved item it could not apply, with why>
```

**5b — Verify (`engineering-reviewer` subagent).** Spawn a **fresh** reviewer
(stateless, no conversation context) on **only** the written doc files plus the
product/schema/foundation docs they reference. For a `frontend` unit, pass the
`index.md` **and** every screen file. It returns the structured `NO GAPS` / gap
block (re-review + self-review).

**5c — Converge (orchestrator).** Hold this unit's per-round gap lists in your
own memory (subagents are stateless). On gaps, loop back to **Clarify** for this
unit, re-author, re-verify. **Convergence guard:** pause and surface to the user
if the gap count did not strictly decrease, or a resolved gap resurfaced.
Otherwise loop until `NO GAPS`.

**5d — Approval gate.** When a unit's docs are clean, pause for explicit user
approval before the next unit.

### 6. New capability or pattern discovered

If clarification surfaces a capability, dependency, or pattern not in the
registry, do **not** edit `docs/architecture.md` here — it is owned by
`/product`'s architecture phase. Alert the user: "This introduces
`<capability/pattern>`, which isn't in the architecture registry. Consider
running `/product` and accepting its architecture step to record it." Then
continue.

### 7. Commit

Commit via `/git-workflow` using a conventional `docs(engineering): …` message.
Keep the worktree **local** — never push remotely. Then suggest the
merge/cleanup sequence:

`commit changes, merge to default branch of main worktree, push changes, switch
to main worktree & clean up additional worktree`

#### Commit message examples

```text
docs(engineering): add ride service API spec
docs(engineering): sync ride worker doc to current code
docs(engineering): add ride frontend screens & state
docs(engineering): add shared ride schema contract
docs(engineering): document auth foundation contract
```
