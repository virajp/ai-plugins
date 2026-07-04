# Memory Protocol (mempalace)

vwf uses the **mempalace** MCP server as cross-session memory: each cycle
recalls prior decisions and findings instead of re-deriving them, and review
findings are filed once and recalled on fix loop-backs — so multi-round detail
never piles up in the orchestrator's context. The orchestrator resolves the
scope and persists durable decisions; the execute subagents persist and recall
their own findings directly, so that detail bypasses the orchestrator entirely.

> mempalace is a hard dependency of vwf. If its tools are unavailable, skip
> every memory step silently and proceed — never block on it.
>
> **Exception: `/vwf:handoff` and `/vwf:recall`.** The handoff *is* the
> deliverable, not a side memory — so when mempalace is unavailable they do
> **not** skip; they fall back to `docs/handoffs/<name>.md` on disk (write on
> handoff, read on recall).

## Scope (wing + room)

- **wing** — the current project. The orchestrator resolves it once: use
  `memory.wing` from `.config/vwf.yaml` when present (falling back to
  `product.name`); otherwise reuse the project's existing wing from
  `mempalace_status`, else the first write creates it) and passes it to every
  subagent it dispatches. Subagents never resolve the wing themselves — they use
  the wing they were given.
- **room** — `decisions` (design/architecture decisions + the *why*), `problems`
  (review/security findings + how they were resolved), `planning` (plan
  rationale and deferred options), `gaps` (blueprint/plan holes surfaced
  **during execution** + how they were reconciled), and `runs` (the **execute**
  run journal — dependency order and per-step progress, for resuming a paused
  run; see below).

## Recall — before work

Before deriving anything, `mempalace_search` (or `mempalace_kg_query`) scoped to
wing + room with a natural-language query for the entity/slice, `limit` 3-5.
Hits are **context, not truth**: the blueprint/plan/conventions docs on disk
stay authoritative. Use recall to skip resolved questions and to check work
against prior findings — never to replace reading a doc you must follow exactly.

## Persist — durable only

Store only **durable** outcomes — decisions and their rationale, findings and
how they were resolved, flagged drift — never transient chatter or text a doc
already captures verbatim. Use `mempalace_add_drawer(wing, room, content)`; the
orchestrator may use `mempalace_kg_add` for an atomic fact that may later change
(and `mempalace_kg_invalidate` it when it does).

Keep entries compressed in the spirit of AAAK — tight, one fact per line,
pipe-separated fields, ISO dates, importance ★1-5; skip the personal emotion
markers, these are technical memories. Example:

    DECISION 2026-06-21 ★4 | entity:order | embed line-items vs ref → embed
    — items immutable post-checkout, read-locality wins | alt ref rejected (no reuse)

## Findings memory — execute loop-backs

Each review/security subagent files its **full** findings to room `problems`,
tagged `<slice>/<stage>/<round>` (e.g. `order/review/2`), and returns only its
terse contract block plus that tag. The orchestrator presents the terse block at
the gate and, on a fix loop-back, hands the coder just the **tag** — not the
findings text. The coder recalls the tagged findings from mempalace, fixes them,
and the detail never enters the orchestrator's context. This is the core context
optimization: rich review detail lives in mempalace, not in the conversation.

## Gap memory — blueprint/plan holes surfaced during execution

A **gap** is distinct from a finding: a finding is wrong *code*; a gap is a hole
in the *blueprint or plan* that execution exposed — an underspecified behaviour
the coder had to guess, a plan step contradicted by the real code, a requirement
the blueprint never stated that review/security found missing. Gaps are captured
**as they surface**, never silently worked around.

Each stage subagent that hits a gap files its **full** gap detail to room
`gaps`, tagged `<slice>/gap/<round>` — what is under/mis-specified, where, and
the assumption it proceeded on — and surfaces only a terse one-line pointer in
its return block. The orchestrator mirrors that terse line into a durable
**"Gaps surfaced during execution"** section in the plan doc (the on-disk copy
that survives a mempalace outage), and at reconcile recalls the `gaps` room to
drive the blueprint/plan fixes. Because mempalace is skip-if-unavailable, the
plan-doc line is the source of truth when recall is empty; the `gaps` room
carries the rich detail when it is up.

## Run journal — execute resumability (execute only)

`/vwf:execute` keeps a single drawer per plan in room `runs` (drawer =
`<plan>`): the dependency-ordered step sequence and, per step, its status
(pending/done), commit ref, review/security round counts, and gap tags. The
orchestrator writes it when it derives the order and updates it as each step
completes (`mempalace_add_drawer` then `mempalace_update_drawer`). Because an
autonomous run's primary pause is a resource cap (`/vwf:handoff` → later
`/vwf:recall`), a resumed run reads this journal to skip finished steps and pick
up at the current one — without it, resume would re-implement completed work.
Skip silently if mempalace is unavailable; the worktree's commits are the
fallback record. This room is execute-specific; blueprint/plan do not use it.
