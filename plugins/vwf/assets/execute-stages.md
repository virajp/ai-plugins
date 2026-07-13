# Execute Stages (used by /vwf:execute)

The stage pipeline, per-stage subagent contracts, and shared stage rules used by
`/vwf:execute`. The invoking command owns the orchestration policy — when to
pause, how many rounds, what happens at the end; this file defines what the
stages **are**.

## Stages

| Stage      | What             | Model  | Subagent                      |
| ---------- | ---------------- | ------ | ----------------------------- |
| code       | Write Code (TDD) | sonnet | `execute-coder`               |
| review     | Code Review      | opus   | `execute-code-reviewer`       |
| security   | Security Review  | opus   | `execute-security-reviewer`   |
| acceptance | Acceptance (E2E) | sonnet | `execute-acceptance-verifier` |
| ux         | UX Conformance   | opus   | `execute-ux-reviewer`         |

`acceptance` and `ux` run **once per cycle**, after **all** steps, back to back
so one boot of the local stack serves both. Each is conditional — skipped
**explicitly** (journaled and stated at the final gate), never silently:

- `acceptance` — only when the plan's "Acceptance criteria (from blueprint)"
  section carries criteria (skip on `none — no flow touched`).
- `ux` — only when the slice changes screens in a UI project (registry type
  `site`, `console`, or `frontend`). Web UI gets the full rendered review;
  `frontend` (Flutter) gets the code-level review only (`RENDERED: n/a`).

Per-stage dispatch contract:

- **code** — dispatch `execute-coder` with the plan (or the plan step), the
  **blueprint slice** it implements, the registry stack, the project wing, the
  **slice name** and **round number** (for its gap tags), and any recall hits.
  It implements under strict TDD — RED → GREEN → REFACTOR for every change — and
  runs the suite to the coverage gate, returning the coverage report: `100%`,
  `<100%` with the uncovered `file:line` list, or `n/a` when the project has no
  coverage tooling. The coder never blocks on coverage — the **orchestrator
  decides**: a residual below the configured target is documented as a gap and
  reported at the final gate (never a silent pass). On a fix loop-back, pass the
  review findings **tag** (not the text) — the coder recalls the detail from
  mempalace before fixing.
- **review** — dispatch `execute-code-reviewer` (pass the wing, plus the
  **slice** and **round number** for its recall tag). It reviews the code
  adversarially against the **plan, the blueprint, conventions, and the registry
  stack**, using `/code-review` as its engine. When the plan touches a service's
  API surface, also pass the **living contract**
  (`docs/blueprint/apis/<project>.openapi.yaml`) and the **latest released
  snapshot** (highest semver under `docs/blueprint/apis/released/`, when one
  exists) — the reviewer's released-contract compatibility dimension checks the
  change against both and returns an `API COMPAT:` line; a `[breaking-api]`
  finding gates like a security finding (always fixed, exempt from the round
  cap). It files its full findings to mempalace (room `problems`) and returns
  the terse findings block plus a recall tag.
- **security** — dispatch `execute-security-reviewer` (pass the wing, plus the
  **slice** and **round number** for its recall tag). It threat-models the
  changes against the project's declared **capabilities** in the registry, using
  `/security-review` as its engine, rating findings by exploitability and
  impact. It files its full findings to mempalace (room `problems`) and returns
  the terse findings block plus a recall tag.
- **acceptance** — dispatch `execute-acceptance-verifier` (pass the plan's
  "Acceptance criteria (from blueprint)" section with each criterion's source
  flow, the registry, the wing, and the **slice** and **round number**). It
  independently maps each criterion to an E2E test (never trusting the coder's
  mapping), boots the repo's own E2E harness, runs it, and returns per-criterion
  `PASS` / `FAIL` / `NOT-COVERED` — a `FAIL` or `NOT-COVERED` loops back to
  `code` like any finding (the fix is the code **or the missing E2E test**).
  When the repo has **no E2E harness**, it returns `ACCEPTANCE: n/a` naming the
  missing capability in the harness-contract vocabulary
  (`${CLAUDE_PLUGIN_ROOT}/assets/harness.md`) — the **orchestrator decides**
  (mirror of the coverage policy): it is recorded as a gap and reported at the
  final gate. Never a silent pass. (With `plan`'s harness preflight this should
  be rare — the plan injects bootstrap steps for capabilities the gates need, so
  an `n/a` here usually means the preflight was skipped or the plan predates
  it.)
- **ux** — dispatch `execute-ux-reviewer` (pass the changed screens from the
  plan's screen steps, the `design-system.md` path, the owning flow docs'
  Screens section(s) (`docs/blueprint/flows/<project>/<NNN>-<flow>/index.md`),
  the UI project's registry entry, the wing, and the **slice** and **round
  number**). It renders the changed screens via the repo's own dev server +
  Playwright (per state where drivable), judges them against the design system
  and the Screens contract, runs an **axe** accessibility scan (WCAG A/AA
  violations are findings), and always adds a code-level token/state pass —
  which is the whole review for a Flutter slice. Findings loop back to `code`
  like review findings; `RENDERED: n/a` on a web slice is recorded as a gap and
  reported at the final gate.

## Shared stage rules

- **Model enforcement** — dispatch each subagent on the model in the table,
  unless `.config/vwf.yaml` `pipeline.models` overrides that stage's tier (per
  the vwf-config asset). A downgrade from the shipped default is **stated in
  that stage's report and at the final gate** — a weakened review is never
  invisible. The stage itself always runs; config cannot skip it.
- **Pipeline knobs** — the invoking command reads `.config/vwf.yaml` `pipeline`
  for `coverage_target` (default 100; per-project override under
  `projects.<name>.coverage_target`) and `review_round_cap` (default 4), and
  reports configured-vs-default at the final gate.
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
  surfaces** — the plan doc's "Gaps surfaced during execution" section. Gaps do
  not block the pipeline; they are reconciled at cycle end.
- **Never silently edit the blueprint** — flag drift and offer; do not rewrite
  it. **Single exception:** the Reconcile step updates the `implementation:`
  frontmatter key on the docs the plan's `covers:` lists — a state stamp the
  pipeline owns, recording what the run landed. No other frontmatter key, and no
  body or schema content, may be touched; anything else is drift to flag.
- **The blueprint is the source of truth — code follows.** When landed code
  contradicts the blueprint (not merely lags it), the pipeline never adjusts the
  blueprint to match: the contradiction is surfaced (a finding when the plan
  pinned it, a gap otherwise) and resolved by conforming the code or by the user
  consciously amending the contract via `/vwf:blueprint`.

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
3. **Harness stamp.** If the cycle added a harness capability (a bootstrap step
   landed — e2e task, dev server, health endpoint, staging mode), update the
   `harness:` block in `.config/vwf.yaml` to match, per
   `${CLAUDE_PLUGIN_ROOT}/assets/harness.md`.
4. **Docs.** Per `${CLAUDE_PLUGIN_ROOT}/assets/docs-sync.md`, reconcile the
   repo's human docs (README, CLAUDE.md, any doc the change contradicts) with
   what actually landed — surgical edits in the same worktree/commit flow, and
   report what was synced (or `docs: nothing contradicted`). Stale docs are more
   harmful than no docs; this step is never skipped silently.
5. **Implementation stamp.** For each blueprint doc in the plan's `covers:`
   frontmatter, set its `implementation:` key to what the run actually landed —
   the single carve-out from the never-silently-edit rule (state stamp only,
   never content):
   - a **flow** is `complete` when every plan step covering it landed **and**
     its Acceptance criteria all returned `PASS` (stage run, none
     `FAIL`/`NOT-COVERED`) **and** no open gap in the plan doc names it;
   - an **entity** is `complete` when its blueprint delta fully landed with no
     open gap naming it (entities are verified through flows — no acceptance
     requirement of their own);
   - anything less that still landed code is `partial`; nothing landed leaves
     the stamp untouched. Commit the stamp edits in the worktree like every
     other change and report each stamp written at the final gate.
