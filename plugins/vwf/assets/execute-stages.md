# Execute Stages (shared by /vwf:execute and /vwf:autopilot)

The stage pipeline, per-stage subagent contracts, and shared stage rules used by
both `/vwf:execute` (gated) and `/vwf:autopilot` (autonomous). The invoking
command owns the orchestration policy — when to pause, how many rounds, what
happens at the end; this file defines what the stages **are**.

## Stages

| Stage    | What             | Model  | Subagent                    |
| -------- | ---------------- | ------ | --------------------------- |
| code     | Write Code (TDD) | sonnet | `execute-coder`             |
| review   | Code Review      | opus   | `execute-code-reviewer`     |
| security | Security Review  | opus   | `execute-security-reviewer` |

Per-stage dispatch contract:

- **code** — dispatch `execute-coder` with the plan (or the plan step), the
  **blueprint slice** it implements, the registry stack, the project wing, the
  **slice name** and **round number** (for its gap tags), and any recall hits.
  It implements under strict TDD — RED → GREEN → REFACTOR for every change — and
  runs the suite to the coverage gate, returning the coverage report: `100%`,
  `<100%` with the uncovered `file:line` list, or `n/a` when the project has no
  coverage tooling. The coder never blocks on coverage — the **orchestrator's
  gate decides**: `execute` presents the coverage report at the human gate,
  `autopilot` documents a sub-100% residual as a gap (never a silent pass). On a
  fix loop-back, pass the review findings **tag** (not the text) — the coder
  recalls the detail from mempalace before fixing.
- **review** — dispatch `execute-code-reviewer` (pass the wing, plus the
  **slice** and **round number** for its recall tag). It reviews the code
  adversarially against the **plan, the blueprint, conventions, and the registry
  stack**, using `/code-review` as its engine. It files its full findings to
  mempalace (room `problems`) and returns the terse findings block plus a recall
  tag.
- **security** — dispatch `execute-security-reviewer` (pass the wing, plus the
  **slice** and **round number** for its recall tag). It threat-models the
  changes against the project's declared **capabilities** in the registry, using
  `/security-review` as its engine, rating findings by exploitability and
  impact. It files its full findings to mempalace (room `problems`) and returns
  the terse findings block plus a recall tag.

## Shared stage rules

- **Model enforcement** — dispatch each subagent on the model in the table.
- **Terse subagent output** — a subagent's full reply lands in the
  orchestrator's context. The pipeline agents return fixed contract blocks; any
  *other* agent spawned (e.g. `Explore` for research) must be instructed to
  return only conclusions and `file:line` pointers — never code excerpts, diffs,
  or full file/dir dumps. The orchestrator reads files itself when it needs
  their contents.
- **Loop on findings** — review/security issues loop back to `code` with the
  **tag**, re-commit via `/vwf:git-workflow`, then re-review. If the coder's
  recall of that tag misses (mempalace down or the drawer absent), the
  orchestrator passes the terse FINDINGS block it already holds from the
  reviewer's return — the loop never stalls on a recall miss. The invoking
  command sets the gating and round policy.
- **Capture blueprint/plan gaps as they surface** — a *gap* (a hole in the
  blueprint or plan, distinct from a code finding) reported by any stage is
  never silently worked around. The subagent files the full gap to mempalace
  room `gaps` and returns a terse pointer; the orchestrator mirrors that terse
  line into the durable, mempalace-independent on-disk record **the moment it
  surfaces** — the plan doc's "Gaps surfaced during execution" section for
  `execute`, the gap-report for `autopilot`. Gaps do not block the pipeline;
  they are reconciled at cycle end.
- **Never silently edit the blueprint** — flag drift and offer; do not rewrite
  it.

## Reconcile (end of run)

1. **Architecture.** If the implementation introduced a topology change (new
   project, dependency, or capability), update the **registry block** in
   `docs/blueprint/architecture.md` to match what was actually built — via
   `/vwf:architecture` for non-trivial changes. Edit the registry precisely; do
   not rewrite prose unless topology genuinely changed.
2. **Environment.** If the change introduced a **new secret or env var** (an
   integration key, credential, or operational variable a project now reads),
   reconcile `docs/blueprint/environment.md` — add the variable's catalog row
   (name / purpose / issuer / used-by / required / classification, **no
   value**), creating the doc from the environment template if it did not exist.
   A committed secret value or an undocumented credential is a security finding,
   not a reconciliation.
