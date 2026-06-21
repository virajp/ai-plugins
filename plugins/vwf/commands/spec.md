---
description: Maintain the always-current, full-product blueprint under
  docs/specs/ — one entity doc per entity plus conventions.md. Stack-agnostic;
  resolves section→project mapping from the architecture registry. Gated by a
  fresh-subagent completeness reviewer loop.
argument-hint: "[entity]"
model: opus
effort: high
---

# spec — Full-Product Blueprint

Maintain the **whole product's** desired end state under `docs/specs/`. The spec
is product-wide and permanent — not feature-specific. It is organized by
**entity**: one entity doc holds the full-stack picture (data model, API,
background jobs, screens), with stable product intent at the top and volatile
engineering detail at the bottom, separated by a marker.

You own the user conversation. Elicitation is **interactive and stays with you**
— do not spawn a subagent for it (a subagent cannot pause to ask a question).
Only the completeness review is delegated, to a fresh stateless subagent.

Adopt the **Product & Engineering Author** persona: capture user goals and
observable outcomes precisely, then pin down the data model and API surface
without ambiguity. Surface open decisions rather than guessing.

## Doc Paths

| Doc             | Path                                                    |
| --------------- | ------------------------------------------------------- |
| Registry        | `docs/specs/architecture.md`                            |
| Conventions     | `docs/specs/conventions.md`                             |
| Entity (file)   | `docs/specs/<entity>.md`                                |
| Entity (folder) | `docs/specs/<entity>/` (promoted form)                  |
| Entity template | `${CLAUDE_PLUGIN_ROOT}/assets/templates/entity.md`      |
| Conv. template  | `${CLAUDE_PLUGIN_ROOT}/assets/templates/conventions.md` |

Reserved entity names: `architecture`, `conventions` (flat namespace in
`specs/`).

---

## Pipeline

### 1. Read the registry

Read `docs/specs/architecture.md`. **Halt if it does not exist:** "No registry
found. Run `/vwf:architecture` first to bootstrap `docs/specs/architecture.md`."

If no entity was named in `$ARGUMENTS`, ask which entity to author/update and
wait.

### 2. Determine surfaces

From the entity's nature and the registry, determine which engineering sections
apply. Map **by project `type`, never by literal technology**:

| Entity section  | Resolves to (registry `type`) |
| --------------- | ----------------------------- |
| Data Model      | the schema/contract package   |
| API Surface     | service/API project(s)        |
| Background Jobs | worker project(s)             |
| Screens         | frontend/app project(s)       |

If a type is absent from the registry, **omit** that section for this entity.

### 3. Interactive elicitation (orchestrator)

**Recall first.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, recall prior
decisions and drift for this entity (rooms `decisions`, `problems`) before
eliciting — build on them and don't re-ask resolved questions. Skip silently if
mempalace is unavailable.

Adopt the authoring persona and elicit following the **elicitation protocol** in
`${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md` (explore → scope-check → one
question at a time → propose 2-3 approaches → present in sections → gate →
self-review). Fill the entity template (§4.1) and, where a cross-cutting
decision surfaces, the conventions skeleton.

Spec-specific notes layered on the protocol:

- **Scope check (protocol §2):** if `$ARGUMENTS` names more than one entity, or
  the entity clearly spans several, decompose and author one entity per pass.
- **Decisions-vs-mechanics (protocol §4):** spend the precision budget on **Data
  Model** and **API Surface**; the product half may stay prose-light.
- **Approaches (protocol §5):** where a data-model or API shape has competing
  designs (e.g. embed vs reference, sync vs async surface), present the options
  before committing.

### 4. Write the entity doc

Write `docs/specs/<entity>.md` as a **single file by default**. Stable product
sections (Purpose … Invariants) above the marker; volatile engineering sections
below. Update `docs/specs/conventions.md` for any cross-cutting decisions
raised.

**Promotion:** promote to the folder form `docs/specs/<entity>/` (index.md +
data.md + api.md + jobs.md + screens.md) once the file crosses **~400 lines, or
has all four engineering surfaces with more than one job/screen each**.

### 5. Reviewer loop (fresh subagent)

Loop until the doc passes:

1. Dispatch a **fresh** `spec-reviewer` subagent (stateless) with **only** the
   written entity doc (and the relevant `conventions.md` anchors and registry
   block it references) — no conversation context. It checks the doc against the
   §5 completeness checklist and returns `NO GAPS` or a numbered gap list.
2. **Gaps** → present them, re-elicit the specific open decisions with the user
   (one at a time), update the doc, return to step 1.
3. **`NO GAPS`** → exit.

**Convergence guard:** before another round, compare to the prior round. Pause
and ask the user if the gap count did not strictly decrease, or a resolved gap
resurfaced. No fixed round cap.

### 6. Reconcile architecture

If the blueprint's project or capability shape changed (a new project,
capability, or cross-cutting decision implied by this entity), update the
**registry block** in `docs/specs/architecture.md` precisely — via
`/vwf:architecture` if the change is non-trivial. Do not rewrite the prose
unless the topology genuinely changed.

**Persist.** Per `${CLAUDE_PLUGIN_ROOT}/assets/memory.md`, store this entity's
durable decisions and their rationale, plus any drift flagged, to mempalace
(rooms `decisions`, `problems`) — skip what the entity doc already captures
verbatim.

### 7. Approval gate

Summarize what was written/changed (entity doc, conventions, registry) and wait
for explicit approval.

### 8. Commit (git-workflow)

After approval, hand **all** git actions to `/vwf:git-workflow` — it owns
worktree isolation and the commit. Use a `spec(<entity>):` or `docs(spec):`
message. Do not run raw git here.
