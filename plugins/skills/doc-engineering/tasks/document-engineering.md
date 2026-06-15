<purpose>
Produce engineering documentation for one or more named entities: read product
and architecture docs, scan the codebase, identify implementation and
documentation gaps, sync existing docs, then write complete engineering docs for
every relevant project in dependency order. Produce specs that enable building
`planned` and `partially-live` features; document `live` features as-is; ignore
`wishlist`.
</purpose>

<user-story>
As an engineer, I want complete, code-grounded engineering docs for an entity
across every project that touches it, so that the team can build planned features
and rely on accurate documentation of what already exists.
</user-story>

<when-to-use>
- The user provides one or more entity names to document
- Product docs and `docs/architecture.md` already exist
- Entry point routes here for the full engineering-documentation flow
</when-to-use>

## Topology

The orchestrator (your interactive session) owns the entire flow. **Subagents
are used for two things only:**

1. **Codebase scan** (`codebase_scan`) — one subagent per project, run in
   parallel, each reading its project root and returning structured findings.
2. **Ralph reviewer** (Ralph loop) — one isolated subagent per doc, receives
   only the doc files, returns a gap list.

All judgment — what counts as a gap, whether a gap resolved, convergence — stays
in the orchestrator.

## Doc Types

| Project type    | Sub-task file                  | Unit    | Output path                                     |
| --------------- | ------------------------------ | ------- | ----------------------------------------------- |
| `service`       | `tasks/document-service.md`    | entity  | `docs/engineering/service/api/<entity>.md`      |
| `worker`        | `tasks/document-worker.md`     | entity  | `docs/engineering/worker/workflows/<entity>.md` |
| `packages`      | `tasks/document-packages.md`   | module  | `docs/engineering/packages/<module>.md`         |
| `site`          | `tasks/document-site.md`       | page    | `docs/engineering/site/<page>.md`               |
| `frontend`      | `tasks/document-frontend.md`   | entity  | `docs/engineering/frontend/<entity>/`           |
| `foundations`\* | `tasks/document-foundation.md` | concern | `docs/engineering/foundations/<concern>.md`     |

\* `foundations` is a **mode**, not a registry project type — it documents
cross-cutting concerns (auth, errors, observability, config, testing,
integrations) and runs as layer-0 (before `packages`). See the `intake` mode
branch.

For any project type not in this table: alert the user
(`"Project '<name>' has unknown type '<type>' — no sub-file found. Skipping."`)
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

<steps>

<step name="session_model_check" priority="first">
State which model you are running as. If it is not Opus, alert the user: "This
skill is designed for Opus. You appear to be on `<model>`. Run `/model opus` and
re-invoke." Halt until the user confirms Opus or explicitly tells you to proceed
anyway.
</step>

<step name="intake">
1. Determine the **mode**:
   - **Entity mode** (default) — the user named one or more entities.
   - **Foundations mode** — the user asked for `foundations`, or named a
     cross-cutting concern (auth, errors, observability, config, testing,
     integrations).

If the request is ambiguous, ask: "Entity mode (engineering docs for an entity)
or foundations mode (a cross-cutting contract)? And which entity or concern?"
**Wait for response.** 2. Confirm the target:

- Entity mode → confirm the entity or entities. If none provided, ask: "Which
  entities should I document? (e.g. ride, user, group)" **Wait for response.**
- Foundations mode → confirm the concern(s). If none provided, ask: "Which
  concern? (auth, errors, observability, config, testing, integrations)" **Wait
  for response.**

3. Invoke `skills:git-workflow` — keep the worktree **local**, never push
   remotely.

<if condition="mode is foundations">
Foundations mode skips `product_understanding` (concerns are not product
features) and runs only `architecture_registry`, `codebase_scan`,
`gap_analysis`, then `foundation_documentation` (below). The `full_documentation`
project loop does not run.
</if>
</step>

<step name="architecture_registry">
Read `docs/architecture.md`. If it does not exist, halt: "No architecture doc
found. Run `doc-architecture` first."

Parse the **Project Registry** `` ```yaml `` block. For each project, extract:
`name`, `type`, `stack`, `capabilities`, `depends_on`, and the project's
filesystem root (use the `root` field if present; otherwise infer it as
`./<name>/`). Build a **project map** you will reference throughout.

Also parse the **`cross_cutting`** block in the same registry yaml (one-line
selections such as `auth: firebase-id-token`, `errors: coded-envelope`). These
are the `{decision}` lines for foundation docs. If the block is absent,
foundations mode derives the decisions from the codebase and asks the user to
confirm (and suggests recording them via `doc-architecture`).
</step>

<step name="product_understanding">
<if condition="mode is foundations">
Skip this step — cross-cutting concerns are not product features. Their scope
comes from the architecture decisions and the codebase scan. Proceed to
`codebase_scan`.
</if>

For each entity provided in `intake`, read all files in
`docs/product/<entity>/`. If the directory does not exist, halt: "No product doc
found for `<entity>`. Run `doc-product` first."

Product docs use five explicit status values. Match features to exactly these —
do not invent or conflate statuses:

| Status             | Meaning                                         | Treatment in engineering docs                               |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------------- |
| **live**           | Fully built and shipped                         | Document what exists in the codebase                        |
| **partially-live** | Exists in code but incomplete or behind a flag  | Document the built parts; write a spec for what remains     |
| **planned**        | Confirmed not built; fully scoped, next release | Write a complete implementation spec                        |
| **wishlist**       | Confirmed not built; post-launch, not committed | **Skip entirely — never appears in engineering docs**       |
| **untriaged**      | New doc; never verified against the codebase    | Treat as unknown — ask the user to triage before proceeding |

Build an **entity summary** in your context with five sections:

```text
entity: <name>
  live:
    - <feature> — <product doc reference>
  partially-live:
    - <feature> — <product doc reference> — remaining spec: <what's unbuilt>
  planned:
    - <feature> — <product doc reference>
  wishlist (excluded):
    - <feature>
  untriaged (needs classification):
    - <feature>
```

The summary covers purpose, user roles, failure cases, and edge cases — but only
for `live`, `partially-live`, and `planned` items. Wishlist items are listed so
the user can see what was dropped, then ignored for all subsequent steps.
Untriaged items must be classified by the user before the skill continues.
</step>

<step name="codebase_scan">
<if condition="mode is foundations">
Scan for the **concern**, not an entity: locate where it is implemented across
all projects (e.g. for `auth`, the auth middleware and role checks; for `errors`,
the error enum/envelope; for `observability`, the logging setup). Use graphify if
available ("Where is `<concern>` implemented? List files and what each does."),
else spawn one scan subagent per project root with the concern as the target.
Merge into a Codebase Map keyed by concern, then by project. Then proceed to
`gap_analysis`.
</if>

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

</step>

<step name="gap_analysis">
Cross-reference the Codebase Map (`codebase_scan`) against the entity summaries
(`product_understanding`) and any existing engineering docs.

**Implementation gaps** — features with status `planned` that are absent from
the Codebase Map, plus the unbuilt portions of `partially-live` features. These
need implementation specs written. `wishlist` features are never implementation
gaps — they were excluded in `product_understanding`.

**Documentation gaps** — features present in the Codebase Map but absent or
stale in `docs/engineering/`. Read each existing engineering doc for the
entities and compare against the codebase scan to identify these.

Present both lists to the user in this format:

```text
Implementation gaps (planned / partially-live remainder, not yet in code):
  - <entity>: <feature> [planned | partially-live] — <product doc reference>
  ...

Documentation gaps (in code, not in engineering docs):
  - <project>/<entity>: <feature or section> — <file reference>
  ...

Wishlist items excluded (not documented):
  - <entity>: <feature>
  ...

Untriaged items (need classification before proceeding):
  - <entity>: <feature>
  ...
```

**Automatic handling — no user choice required:**

| Status           | Action                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `live`           | Document what the codebase contains                                                                                                                                              |
| `partially-live` | Document the built parts from code; write an implementation spec for what remains; open the unbuilt section with `> **Status: Partially Live** — remaining work is a build spec` |
| `planned`        | Write a full implementation spec; open with `> **Status: Planned** — Not yet implemented. This section is a build spec.`                                                         |
| `wishlist`       | Skip; list in the transparency section only                                                                                                                                      |
| `untriaged`      | Block — ask the user to triage before proceeding                                                                                                                                 |

If a planned or partially-live feature has conflicting or missing scope, surface
it to the user before writing the spec. Do not guess.

**Foundations gaps** — a cross-cutting concern an entity doc references (or will
reference) that has no `docs/engineering/foundations/<concern>.md` yet. The most
common are `auth` (any role-gated endpoint or auth-gated screen) and `errors`
(any error code). List them so the foundation can be documented first:

```text
Foundations gaps (referenced cross-cutting concerns without a foundation doc):
  - <concern> — referenced by <entity/doc> — run foundations mode first
  ...
```

In **foundations mode**, the gap is simpler: which parts of the concern are
`live` in code (document as-is) versus `planned`/`partially-live` (write as a
build spec). There are no entity status buckets.
</step>

<step name="documentation_sync">
<if condition="mode is foundations">
Skip — `foundation_documentation` reads any existing foundation doc and updates
it in place. Proceed there.
</if>

Before writing new docs, bring existing engineering docs up to date with the
current codebase.

For each **documentation gap** from `gap_analysis`:

1. Identify the relevant engineering doc path.
2. If the doc exists, open it and update or add only the sections that are
   missing or stale — do not rewrite sections that are accurate.
3. If the doc does not exist, skip it here — `full_documentation` will create it
   from scratch.
4. Run the **Ralph loop** (see Shared conventions) on any doc touched in this
   step.

Get user approval after all sync edits before proceeding to
`full_documentation`.
</step>

<step name="foundation_documentation">
**Foundations mode only.** For each concern confirmed in `intake`:

1. Read `tasks/document-foundation.md` and follow it completely.
2. Use the Codebase Map and the architecture cross-cutting decision to pre-fill
   what the code makes unambiguous; ask only what the scan cannot determine.
3. Apply status handling: document `live`/`partially-live` parts from code;
   write `planned` parts as build specs with the status callout.
4. Write `docs/engineering/foundations/<concern>.md` using
   `templates/engineering-foundation.md`, then update
   `docs/engineering/foundations/readme.md`.
5. Run the **Ralph loop** and **Approval gate** before the next concern.

When done, stop — the `full_documentation` project loop does not run in
foundations mode.
</step>

<step name="full_documentation">
**Entity mode only.** Foundations are layer-0: any concern these entities depend
on should already have a foundation doc (if not, it surfaced as a foundations gap
in `gap_analysis` — document it in foundations mode first). Entity docs **link**
to the foundation docs; they never restate auth flows or the standard error set.

For each project in the registry, determine relevance to the specified entities:

**Relevant** if either holds:

- The Codebase Map contains findings for this project under any of the specified
  entities.
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

1. Read the sub-task matching its `type` (see Doc Types table) from
   `tasks/document-<type>.md` and follow it completely.
2. You already hold the Codebase Map — use it to pre-fill answers where the code
   makes the answer unambiguous. Only ask elicitation questions for details the
   scan could not determine (e.g. auth rules, retry policies, design intent).
3. Apply the status-based handling from `gap_analysis` for every feature
   section:
   - **`live`** — document what exists in the code.
   - **`partially-live`** — document the built parts from the codebase, then
     write an implementation spec for the remaining unbuilt work. Open the
     unbuilt section with:
     ```markdown
     > **Status: Partially Live** — The section above reflects what is built. Below
     > is a build spec for what remains.
     ```
   - **`planned`** — write a complete implementation spec (data models, API
     contracts, sequence flows, error cases, acceptance criteria). Open the
     section with:
     ```markdown
     > **Status: Planned** — Not yet implemented. This section is a build spec.
     ```
   - **`wishlist`** — do not include at all.
   - **`untriaged`** — do not write; surface to the user for triage first.
4. Run the **Ralph loop** and **Approval gate** (see Shared conventions) before
   starting the next project.
   </step>

</steps>

## New capability or pattern discovered

If elicitation surfaces a capability, dependency, or architectural pattern not
present in the registry, do not edit `docs/architecture.md` here — it is owned
by `doc-architecture`. Alert the user: "This introduces `<capability/pattern>`,
which isn't in the architecture registry. Consider running `doc-architecture` to
record it." Then continue.

## Shared conventions (all sub-files)

- **Elicitation:** Invoke `superpowers:brainstorming`. Ask one question at a
  time. Every question must offer multiple-choice answers including "Other
  (please specify)" — even open-ended answers get common options plus Other.
- **Stack injection:** Replace bracketed placeholders in templates
  (`<datastore>`, `<auth-mechanism>`, `<state-management>`, etc.) with the
  actual values from the project's `stack` in the registry.
- **Ralph loop (reviewer):** After writing, load `checklists/ralph-prompt.md` as
  the system prompt and spawn a `model: opus` subagent with **only** the written
  engineering docs plus the product/schema docs they reference — no conversation
  context. Context bleed causes the reviewer to fill gaps from memory instead of
  surfacing them — keep its context to doc files only. The subagent returns a
  gap list only, no rewrites. Resolve gaps via brainstorming (one at a time,
  MCQ), update, re-review. **Convergence guard:** the orchestrator keeps each
  round's gap list in memory; pause and surface to the user if the gap count did
  not strictly decrease, or if a resolved gap resurfaces. Loop until the
  reviewer returns `NO GAPS`.
- **Approval gate:** When a project's docs are clean, pause and wait for
  explicit user approval before continuing to the next project.

## Commit Message Format

Use conventional commits, scoped by type. Examples:

```text
docs(engineering): add ride service API spec
docs(engineering): sync ride worker doc to current code
docs(engineering): add ride frontend screens & state
docs(engineering): add shared ride schema contract
```

<output>
**Entity mode:** complete engineering docs under `docs/engineering/` for every
relevant project that touches the named entities — `live` features documented
from code, `partially-live`/`planned` features written as build specs with status
callouts, `wishlist` excluded, cross-cutting concerns linked to their foundation
docs — each passing the Ralph reviewer (`NO GAPS`) with user approval per project.

**Foundations mode:** a canonical contract at
`docs/engineering/foundations/<concern>.md` for each named concern, that entity
docs link to — passing the Ralph reviewer (`NO GAPS`) with user approval.
</output>

<acceptance-criteria>
- [ ] Session model confirmed as Opus (or user explicitly overrode)
- [ ] Mode determined (entity vs foundations); target confirmed
- [ ] Architecture registry read (incl. cross-cutting decisions); halt messages honored if missing
- [ ] Entity mode: product docs read and entity summary built with all five status buckets
- [ ] Codebase scanned (graphify or parallel subagents) into a Codebase Map keyed by entity or concern
- [ ] Implementation, documentation, and foundations gaps presented to the user
- [ ] Entity mode: existing docs synced before new docs written; user approval obtained
- [ ] Entity mode: projects documented in dependency order using the matching sub-task; cross-cutting concerns linked to foundation docs, not restated
- [ ] Foundations mode: each concern documented from code/decision with status callouts via `tasks/document-foundation.md`
- [ ] Status-based handling applied; `wishlist` excluded; `untriaged` blocked
- [ ] Ralph loop run to `NO GAPS` and approval gate honored per project/concern
</acceptance-criteria>
