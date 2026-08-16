# Execute Stages (used by /skill:vwf-execute)

The stage pipeline, per-stage subagent contracts, and shared stage rules used by
`/skill:vwf-execute`. The invoking command owns the orchestration policy — when to
pause, how many rounds, what happens at the end; this file defines what the
stages **are**.

## Stages

| Stage      | What             | Model  | Subagent                      | Runs                     |
| ---------- | ---------------- | ------ | ----------------------------- | ------------------------ |
| code       | Write Code (TDD) | opus   | `execute-coder`               | per step                 |
| review     | Code Review      | opus   | `execute-code-reviewer`       | per step, ‖ `security`   |
| security   | Security Review  | opus   | `execute-security-reviewer`   | per step, ‖ `review`     |
| acceptance | Acceptance (E2E) | sonnet | `execute-acceptance-verifier` | once, after all steps    |
| ux         | UX Conformance   | opus   | `execute-ux-reviewer`         | once, after `acceptance` |

`review` and `security` are **independent read-only passes over the same diff**
— neither reads the other's output. Dispatch both in a single message so they
run concurrently, and merge their findings into **one** loop-back to `code`.
Their gating is unchanged and stays per-stage (security and `[breaking-api]`
always fixed; other review findings capped).

`acceptance` and `ux` run **once per cycle**, after **all** steps, back to back
so one boot of the local stack serves both. Each is conditional — skipped
**explicitly** (journaled and stated at the final gate), never silently:

- `acceptance` — only when the plan's "Acceptance criteria (from blueprint)"
  section carries criteria (skip on `none — no flow touched`).
- `ux` — only when the slice changes screens on a **screen platform** (`site`,
  `webapp`, `desktop`, `mobile`, `tablet`, `auto`). Every screen surface gets a real visual gate and a
  real accessibility gate, delivered by the stack plugin's `-ux-gate` — never a
  code-only read.

Per-stage dispatch contract:

- **code** — dispatch `execute-coder` with the plan (or the plan step), the
  **blueprint slice** it implements, the **resolved stack** — both halves: the
  `projects.<name>.stack` block from `.config/vwf.yaml` (the blueprint carries
  none) **and the `conventions:` prose** Setup step 3 fetched for each of its
  templates, which is what the code is actually written to — the project wing,
  the **slice name** and **round number** (for its gap tags), and any recall
  hits. It implements under
  strict TDD — RED → GREEN → REFACTOR for every change — and runs the suite to
  the coverage gate, returning the coverage report: `100%`, `<100%` with the
  uncovered `file:line` list, or `n/a` when the project has no coverage tooling.
  The coder never blocks on coverage — the **orchestrator decides**: a residual
  below the configured target is documented as a gap and reported at the final
  gate (never a silent pass). On a fix loop-back, pass the review findings
  **tag** (not the text) — the coder recalls the detail from mempalace before
  fixing.
- **review** — dispatch `execute-code-reviewer` (pass the wing, plus the
  **slice** and **round number** for its recall tag, plus the same **resolved
  stack** the coder got — block and `conventions:` prose both; a reviewer holding
  less than the coder cannot tell a convention breach from a style preference).
  It reviews the code adversarially against the **plan, the blueprint,
  `conventions.md`, and the resolved stack**, using `/code-review` as its engine. When the plan touches a service's
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
  (`%%AI_PLUGINS_ROOT%%/assets/harness.md`) — the **orchestrator decides**
  (mirror of the coverage policy): it is recorded as a gap and reported at the
  final gate. Never a silent pass. (With `plan`'s harness preflight this should
  be rare — the plan injects bootstrap steps for capabilities the gates need, so
  an `n/a` here usually means the preflight was skipped or the plan predates
  it.)
- **ux** — dispatch `execute-ux-reviewer` (pass the changed screens from the
  plan's screen steps, the `design-system.md` path, the owning flow docs'
  Screens section(s) (`docs/blueprint/flows/<project>/<NNN>-<flow>/index.md`),
  the project's registry entry (role and platforms), the wing, and the **slice** and **round
  number**). For a **web** slice it renders the changed screens via the repo's
  stack plugin's `-ux-gate`, which renders each changed screen and runs its
  ecosystem's accessibility scan; violations come back at WCAG A/AA severity
  whatever the ecosystem, so one rule applies across every stack. The reviewer
  itself never renders. Either way it judges against the design system and the Screens
  contract and adds a code-level token/state pass. Findings loop back to `code`
  like review findings; `RENDERED: n/a` on **any** UI slice is recorded as a gap
  and reported at the final gate.

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
  **tag**, re-commit via `/skill:vwf-git-workflow`, then re-review. Send **both**
  reviewers' tags in a single `code` dispatch and re-run both concurrently: one
  merged fix pass keeps the two stages from rewriting each other's lines, and a
  round counts once even though two reviewers ran. If the coder's recall of a
  tag misses (mempalace down or the drawer absent), the orchestrator passes the
  terse FINDINGS block it already holds from that reviewer's return — the loop
  never stalls on a recall miss. The invoking command sets the gating and round
  policy.
- **Convergence guard** — a round cap bounds how long a loop runs; it cannot
  tell *converging slowly* from *not converging at all*. Before dispatching each
  new round, compare this round's findings with the previous round's — matching
  on the `file:line` + rule in the terse FINDINGS block (the recall tag
  identifies the round, not the finding). The loop is **not converging** when
  either holds:
  - the finding count did not **strictly decrease**;
  - a finding an earlier round resolved has **resurfaced**.

  Do not spend the remaining rounds proving it. Stop the loop where it stands
  and record the contested findings as an **oscillation** gap naming them and
  the rounds tried. The diagnosis is the loop — the coder trading one reviewer's
  fix against the other's, or regressing an earlier one — so it is never filed
  as "blueprint/plan was not thorough enough", which sends the reconciliation at
  the far end to rewrite a contract that was never at fault. (This is the review
  loop's form of the convergence guard `elicitation.md` §9 puts on review loops
  during authoring — same idea, different loop.)

  **Cap-exempt findings never take this exit.** Security and `[breaking-api]`
  findings must be fixed and can never be downgraded to gaps, so a guard trip on
  one is not a gap at all — it is a decision the rules do not cover, and the
  invoking command pauses on it.
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
  consciously amending the contract via `/skill:vwf-blueprint`.

## Run journal (the record the gate renders)

The run journal — mempalace room `runs`, drawer `<plan>` — is the pipeline's
checkpoint. A resumed run reads it to skip finished work, and the final gate
**renders** it instead of recalling a long autonomous run from context, which is
exactly the context most likely to have been compacted or handed off. Both uses
fail the same way if the journal is loose prose, so its entries take a fixed
shape: one record per node **execution**.

| Field     | Value                                                                     |
| --------- | ------------------------------------------------------------------------- |
| `step`    | `<n>/<total> <title>` — or `acceptance`, `ux`, `reconcile`                |
| `node`    | the stage that ran: `code`, `review`, `security`, `acceptance`, `ux`      |
| `round`   | `1` on the first pass, incremented per fix loop                           |
| `model`   | the tier it ran on, `(downgraded from <default>)` when config overrode it |
| `outcome` | `pass` / `findings(<n>)` / `fail(<n>)` / `skipped` / `blocked`            |
| `detail`  | terse — coverage vs target, per-criterion counts, finding tags            |
| `commit`  | the commit ref for a `code` node; `—` otherwise                           |
| `why`     | **required** when `outcome` is `skipped` or `blocked`                     |

- **The drawer opens with the step sequence** written at Setup — every step
  pending — and accumulates node records beneath it. A step is done when its
  `code` node carries a commit and its reviewers' last round is clean.
- **One record per execution, not per stage.** A step whose findings looped
  three times writes three `review` records. The round count is then the number
  of records, and the convergence guard compares two records — never two numbers
  the orchestrator is holding in its head.
- **A skip is a record.** The conditional stages' "skipped explicitly, never
  silently" rule is discharged *by the record existing*, with its `why`. A stage
  with no record did not run, and the gate reports it that way.
- **Downgrades are recorded where they happened** — on the node that ran under
  the weaker model, not summarized at the end.
- **Write on return.** Append the record when the node returns, before
  dispatching the next. This is the checkpoint: a record written late is a step
  a resumed run repeats.
- **When mempalace is down**, the journal degrades with every other memory
  surface — but the final gate must then say the report was **reconstructed**,
  not rendered. Whoever approves the merge needs to know which one they are
  reading.

## Reconcile (end of run)

1. **Architecture.** If the implementation introduced a topology change (new
   project, dependency, or capability), update the **registry block** in
   `docs/blueprint/registry.yaml` to match what was actually built — via
   `/skill:vwf-architecture` for non-trivial changes. Edit the registry precisely; do
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
   `%%AI_PLUGINS_ROOT%%/assets/harness.md`.
4. **Docs.** Delegate to /skill:vwf-docs-sync with this run's change
   set — it reconciles the repo's human docs (README, CLAUDE.md, any doc the
   change contradicts) with what actually landed, editing in this worktree so
   the sync rides the run's own commit flow — and relay its report line (what
   was synced, or `docs: nothing contradicted`). Stale docs are more harmful
   than no docs; this step is never skipped silently.
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
