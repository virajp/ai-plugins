# vwf doctrine proposals — closing the seven gaps

Drafts only — nothing here is implemented. Each section names the exact files
that change, the proposed contract text, and the gate that enforces it.
Untracked scratch; feed accepted sections to `/vwf:plan` (or delete this file).

Repo-wide consequence, once for all seven: drafts 1–3 and 5–6 change the
blueprint format (template/contract/reviewer edits), so each landing bumps the
blueprint format stamp and needs a `/vwf:setup` migration for existing products.
Drafts 4 and 7 touch enforced assets and feedback routing only — no format bump.

---

## Draft 1 — Assumption validation, risk-driven MVP scoping, kill criteria

**Gap.** Validation is the operator's say-so: the Risks table's "Validated by"
cell accepts anything, build order isn't tied to risk, and a missed goal only
re-ranks — nothing can ever kill or pivot.

**Changes.**

1. `assets/templates/product.md` — Risks & assumptions becomes:

   ```text
   | Assumption | Risk if wrong | Validation method | Status | Evidence |
   ```

   `Validation method` is a closed vocabulary: `interviews` | `landing-page` |
   `prototype` | `concierge` | `usage-data` | `slice:<name>`
   (validation-by-building) | `accepted-risk — <why>`. `Status` is
   `untested | validated | invalidated`; `Evidence` is a link or one-line source
   once status leaves `untested`.

   Rule: the top (riskiest) row may not use `slice:` — building is the most
   expensive validation — unless the operator marks it `accepted-risk`, which
   makes the choice visible instead of forbidden.

2. Kill/pivot thresholds — each goal subsection gains one line, **mandatory for
   the first goal**, optional after:

   ```text
   - Re-evaluate if: <metric> below <floor> by <date> → kill / pivot / re-scope
   ```

   `/vwf:feedback`'s metric-reading route escalates: a reading breaching a floor
   makes the `/vwf:product` re-run mandatory-offered with kill / pivot /
   re-scope as the named agenda. Goals are still never silently deleted — a
   killed goal keeps its subsection with `status: killed — <date, reading>`.

3. Slice priority table gains a `Validates` column — which assumption the
   slice's release tests (`—` allowed). `product-reviewer` additions:
   - every `untested` assumption using `slice:` appears in some Validates cell;
   - the rank-1 slice validates the riskiest untested assumption, or one line
     under the table says why not;
   - validation methods use the closed vocabulary; no row has empty Status.

4. New `skills/product/references/validation.md` — the method vocabulary, what
   counts as evidence per method, and a lightweight experiment record for the
   product appendix (`Hypothesis / Metric / Threshold / Result / Decision`). No
   A/B infrastructure mandated: an experiment is a recorded hypothesis with a
   threshold, however measured. Optional, except when a goal's `Measured via` is
   a counter (draft 2) — then closing the record is one feedback reading.

**Enforcement.** `product-reviewer` checklist (3 new items); `/vwf:feedback`
metric route (escalation).

**Your call.** (a) Hardness of the "riskiest assumption can't be
build-validated" rule — I propose reviewer-flagged but satisfiable by
`accepted-risk`, never a hard halt. (b) Experiment records optional as drafted,
or mandatory per goal?

---

## Draft 2 — Goal metrics wired to instrumentation

**Gap.** `Measured via:` is free text; no gate checks the measurement source
exists. The observability reference already *names* the right mechanism —
business counters beside a flow's Acceptance block and an entity's Lifecycle
table — but it's optional-elicited and nothing links goals to it.

**Changes.**

1. `assets/templates/product.md` — `Measured via:` becomes structured, one of
   four forms:

   ```text
   counter <flow-slug>.<outcome>     # flow completed/failed/compensated
   counter <entity>.<state>          # lifecycle-state count
   store-metric <one-line intent>    # derived from stored data
   external <source>                 # support volume, app-store, revenue tool
   ```

2. `skills/product-foundations/references/observability.md` — the "business
   counters usually…" elicitation becomes **mandatory for goal-serving
   counters**: a goal naming `counter <flow>.<outcome>` requires that counter
   named beside the owning flow's Acceptance block (entity form: beside its
   Lifecycle table). Other counters stay elicited.

3. `agents/blueprint-coherence-reviewer.md` — new check, *goal instrumentation*:
   every goal's Measured-via resolves. `counter` forms must resolve to a
   declared counter in the owning doc (gap if not); `store-metric`/`external`
   are exempt but listed info-level, so the operator sees every goal the system
   itself cannot measure in one place.

4. Execute — `execute-code-reviewer` checklist line: counters declared beside
   the slice's Acceptance block must be emitted by the implementation; absent =
   finding. The acceptance verifier asserts the counter increments during the
   E2E run when the harness exposes metrics, else `n/a`.

5. Cross-check at `/vwf:architecture`: a product that skipped the observability
   foundation but writes `counter` Measured-via forms is a flagged contradiction
   — accept observability or change the measurement source.

**Enforcement.** product-reviewer (form), coherence reviewer (resolution),
execute code reviewer (emission).

---

## Draft 3 — Reliability made mandatory: SLOs, per-flow limits, capacity, load proof

**Gap.** Reliability targets are one skippable MCQ; flows carry no load or
latency contract; no capacity assumption exists anywhere; nothing ever proves an
SLO under load.

**Changes.**

1. `skills/product-foundations/SKILL.md` — split the twelve into **core**
   (observability, reliability targets, DR & backup, users) and **elective**
   (the rest). A core foundation's MCQ loses "not applicable"; its options are
   **accept / adapt / defer — not production-bound**, and a deferral is a
   recorded registry token (e.g. `reliability: deferred-preprod`), not an
   omission. `/vwf:plan` (for a production-bound slice) and
   `/vwf:verify production` treat a deferred core token as a **blocking**
   finding: you may defer while prototyping, never while shipping.

2. `skills/blueprint-authoring/references/flow-contract.md` — the Guarantees
   table gains a `Load & latency` column per step-group: expected peak rate
   (order of magnitude, `~10/s`) and a p95 budget for user-facing groups, or
   `default — per conventions#reliability`. The default token keeps density cost
   near zero. `blueprint-reviewer`: cell present on every row.

3. `references/entity-contract.md` — one `Scale:` line per entity: expected
   count order-of-magnitude at a stated horizon plus the growth driver
   (`~10^6 rows in year 1, grows with orders`). This is the number that
   justifies — or waives — index, pagination, and archival decisions in plan.

4. `references/reliability-targets.md` blueprint expansion —
   `conventions.md#reliability` gains a capacity paragraph on first touch:
   expected user count and aggregate request-rate horizon (two extra elicited
   questions beside the SLOs).

5. `assets/delivery-pipeline.md` — new rule **`pipeline/load-proven`**: before
   the first production release of a flow whose declared peak rate meets a
   threshold (default `~10/s`), a load run on staging demonstrates the SLO holds
   at declared peak; evidence linked in the release record. `test:load` joins
   plan's harness-capability preflight vocabulary; tooling belongs to the stack
   plugin (stackgen). Waivable via the standard `pipeline/…` mechanism.

**Enforcement.** blueprint-reviewer (cells), plan/verify (deferred-core
blocking), pipeline rule + execute reviewers (load-proven).

**Your call.** Which foundations are core — I propose the four above;
rate-limiting is the borderline fifth (security-adjacent).

---

## Draft 4 — Release safety: rollback path and dark launches

**Gap.** Delivery is fix-forward only: no rollback doctrine, no progressive
exposure. A bad production release has no stated exit.

vwf never deploys, so all of this is contract on the pipeline + verify +
runtime-settings — mechanisms stay with the cicd-axis plugin.

**Changes.**

1. `assets/delivery-pipeline.md` — new rule **`pipeline/rollback-path`**: every
   production deploy has a stated rollback — the previous release tag remains
   deployable, and a release containing a stored-schema change must be N-1
   compatible (draft 5's expand-contract rule is the data leg) so rolling back
   never corrupts data. The release act records its rollback target; a release
   that genuinely cannot roll back (irreversible step) must say so in the
   release record — irreversibility becomes a visible chosen state, not the
   silent default.

2. `skills/verify/SKILL.md` — production failure path: the first offered remedy
   is "roll back to `<previous tag>`" when the release record names one, then
   fix-forward via feedback/plan. Verify names the rollback; it never executes a
   deploy.

3. `references/runtime-settings.md` — a **release flag** paragraph: a slice may
   ship dark behind a settings-document flag (the existing "flags are settings"
   path — no new infrastructure). A release flag carries an owner and a
   **removal date**; `execute-code-reviewer` flags an expired release flag as a
   finding, so flag debt cannot accumulate silently. A plan doc may declare
   `exposure: dark`, which injects the flag key and its removal step.

**Enforcement.** pipeline rule (execute reviewers flag violating pipeline
files), verify (remedy ordering), execute code reviewer (flag expiry).

**Your call.** I propose **not** mandating canary/percentage rollout — it's
platform-dependent and the runtime-settings reference already elicits it when
genuinely needed. vwf pins only the rollback guarantee. Say if you want canary
as a stated default for `service` projects instead.

---

## Draft 5 — Stored-schema evolution: expand-contract as baseline rule 16

**Gap.** APIs get the additive-only released-snapshot rule and events get
tolerant-reader; stored schemas get nothing — no migration, backfill, or
breaking-change doctrine. Classic scaling wound, and the precondition for draft
4's rollback guarantee.

**Changes.**

1. `assets/engineering-baseline.md` — rule 16, **`baseline/expand-contract`**: a
   non-additive change to a stored entity's schema ships in stages — expand (new
   form written alongside old; readers tolerate both), migrate (backfill as an
   idempotent, resumable background job with progress checkpoints — the existing
   Background Jobs contract shape), contract (old form removed) — with expand
   and contract in **separate releases**, so every single release is N-1
   compatible. Destructive DDL never rides the release that stops writing the
   old form. Inapplicable-state mechanics as usual (no datastore →
   inapplicable).

2. Release freeze extension — `/vwf:verify`'s clean production run snapshots
   entity `schema.yaml`s beside `apis/released/` (one more copied dir,
   `entities/`, reusing the freeze machinery). The coherence reviewer's
   released-diff check extends to it: a post-freeze breaking change to a
   released entity schema is a **HARD** gap unless the plan carries the staged
   migration.

3. `skills/plan/references/delta-checks.md` — new preflight: diff desired entity
   schemas against the released snapshot; any non-additive delta forces the plan
   to spell the three stages as explicit ordered steps (expand release →
   backfill job → contract release), each behind its own approval like any step.
   Backfill steps get acceptance criteria (completion metric or row-count
   parity).

4. Baseline "how the surfaces apply it" — execute reviewers flag a migration
   that drops/renames in the same release as the code change that stops writing
   the old form.

**Enforcement.** coherence reviewer (HARD released diff), plan preflight (staged
steps), execute reviewers (same-release destruction).

---

## Draft 6 — Dependency auditing and earlier threat modeling

**Gap.** No vulnerability scanning anywhere (`doctor` checks manifest drift, not
CVEs); threat modeling happens only post-code in execute's security review.

**Changes.**

1. `assets/delivery-pipeline.md` — new rule **`pipeline/dependency-audit`**:
   every pipeline run that can lead to a release runs the ecosystem's lockfile
   vulnerability audit; a known-critical advisory fails the run. Waivable
   per-advisory (`pipeline/dependency-audit/<advisory-id>` with reason + date —
   dated so waivers rot visibly). Automated dependency updates (renovate-style)
   stay recommended-not-mandated; tooling is the cicd axis's.

2. `skills/doctor/SKILL.md` — new check: run the ecosystem audit per project
   (`pnpm audit` etc.). Criticals report as **blocking** (doctor's existing
   class that halts `/vwf:plan`); high/moderate report info-level. Doctor
   reports, never writes — unchanged.

3. `references/flow-contract.md` Acceptance — flows whose Trigger & Actors table
   includes an external or unauthenticated actor, or that mutate
   payments/entitlements, carry at least one **abuse-case criterion**: a
   Given/When/Then where the actor attempts what they are not authorized to do,
   and the observable outcome is denial plus the audit record. `n/a — <why>`
   allowed. `blueprint-reviewer` checklist item. This moves the cheapest,
   highest-value slice of threat modeling from post-code to pre-code.

4. `/vwf:architecture` step 3c — while walking capabilities, one elicited line
   per trust boundary (external caller, webhook, file upload): the worst
   plausible abuse, recorded in the registry beside `capabilities`. Execute's
   security reviewer already threat-models from `capabilities`; this seeds it
   with the product's own answers instead of leaving it to reconstruct them.

**Enforcement.** pipeline rule, doctor blocking class, blueprint-reviewer (abuse
cases), execute security reviewer (consumes seeded threats).

**Your call.** I propose **no** full STRIDE/threat-model document — items 3+4
capture most of the value at solo-operator scale. Say if you want a threat-model
doc as an elective foundation instead.

---

## Draft 7 — Incident doctrine: alerts as contract, runbooks, postmortem loop

**Gap.** Alerting is explicitly out-of-repo, runbooks stop at the DR restore
pointer, and nothing routes an incident into the workflow's feedback machinery.

**Changes.**

1. New foundation #13, **Incident response** (core class per draft 3), as
   `references/incident-response.md`. Default contract:
   - **Alert conditions are contract**: a small table in
     `conventions.md#incidents` — condition (health down, SLO burn, job backlog,
     budget breach) → destination (even just "email the operator") → runbook
     link. Alert *rules and dashboards* stay in the backing service (the
     observability reference's stance, unchanged) — but the conditions and
     destinations are now written down before the first incident.
   - **Runbooks**: `docs/runbooks/` per deployed project, minimum two —
     health-failure triage and DR restore (the DR reference's existing runbook
     pointer moves under this umbrella).
   - **Postmortems**: every incident gets a stub in
     `docs/runbooks/postmortems.md` — what happened, impact window, contributing
     causes, action items.

2. `skills/feedback/SKILL.md` — intake kind #6, **incident**: files to mempalace
   room `problems`, appends the postmortem stub, and routes each action item
   through the existing classifier (usually a blueprint hole or plan gap). The
   reliability foundation's error-budget stance is what an incident reading
   triggers.

3. `skills/verify/SKILL.md` — a failed production health probe names the
   matching runbook and offers `/vwf:feedback incident`.

Deliberately small: no on-call rotations or severity matrices at solo-operator
scale — noted in the reference as elective growth, not defaults.

**Enforcement.** foundations checklist (core), feedback routing, verify failure
path.

---

## Suggested landing order

1. **Drafts 3 + 5 + 4** — one coherent reliability package (mandatory SLOs →
   expand-contract → rollback guarantee builds on it). Biggest blueprint format
   bump; do together.
2. **Draft 2** — cheap, high leverage; makes draft 1's kill thresholds real.
3. **Draft 1** — product-side; independent of the rest.
4. **Draft 6** — cheap wins (two rules + a doctor check + one checklist item).
5. **Draft 7** — small, last; depends on draft 3's core-foundation mechanism.

Open decision points before any implementation: core-foundation set (draft 3),
riskiest-assumption hardness and experiment optionality (draft 1), canary stance
(draft 4), threat-model-doc stance (draft 6).
