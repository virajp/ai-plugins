# Memory Protocol (mempalace)

vwf uses the **mempalace** MCP server as cross-session memory: each cycle
recalls prior decisions and findings instead of re-deriving them, and review
findings are filed once and recalled on fix loop-backs — so multi-round detail
never piles up in the orchestrator's context. The orchestrator resolves the
scope and persists durable decisions; the execute subagents persist and recall
their own findings directly, so that detail bypasses the orchestrator entirely.

> mempalace is a hard dependency of vwf. If its tools are unavailable, skip
> every memory step silently and proceed — never block on it.

## Scope (wing + room)

- **wing** — the current project. The orchestrator resolves it once (reuse the
  project's existing wing from `mempalace_status`, else the first write creates
  it) and passes it to every subagent it dispatches. Subagents never resolve the
  wing themselves — they use the wing they were given.
- **room** — `decisions` (design/architecture decisions + the *why*), `problems`
  (review/security findings + how they were resolved), `planning` (plan
  rationale and deferred options).

## Recall — before work

Before deriving anything, `mempalace_search` (or `mempalace_kg_query`) scoped to
wing + room with a natural-language query for the entity/slice, `limit` 3-5.
Hits are **context, not truth**: the spec/plan/conventions docs on disk stay
authoritative. Use recall to skip resolved questions and to check work against
prior findings — never to replace reading a doc you must follow exactly.

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
