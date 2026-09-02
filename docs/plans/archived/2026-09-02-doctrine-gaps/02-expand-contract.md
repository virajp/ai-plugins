# Unit 02 — Stored-schema evolution (expand-contract)

Implements **Draft 5** of the proposals.

- **Depends on:** unit 01 (committed).
- **Owns:** `assets/engineering-baseline.md`, plus scoped edits to
  `skills/verify/SKILL.md`, `agents/blueprint-coherence-reviewer.md`,
  `skills/plan/references/delta-checks.md`.
- **Read first:** every owned file; in `verify/SKILL.md` locate the release
  freeze (`apis/released/` snapshot) before editing.
- **Lazy-load:**
  `skills/blueprint-authoring/references/api-and-schema-contracts.md` (only to
  mirror the released-diff wording), `references/flow-contract.md` Background
  Jobs section (only to reference the job shape correctly).

All paths relative to `plugins/vwf/`.

## Edits (in order)

1. **`assets/engineering-baseline.md`** — append rule 16 under a fitting group
   (extend **Data-write discipline** or add a small **Schema evolution** group),
   id **`baseline/expand-contract`**:
   - A non-additive change to a stored entity's schema ships in stages:
     **expand** (new form written alongside old; readers tolerate both) →
     **migrate** (backfill as an idempotent, resumable background job with
     progress checkpoints — the flow contract's Background Jobs shape) →
     **contract** (old form removed).
   - Expand and contract land in **separate releases**, so every single release
     is N-1 compatible; destructive DDL never rides the release that stops
     writing the old form.
   - Inapplicable-state mechanics apply (no datastore → inapplicable).
   - In "How the surfaces apply it": execute reviewers flag a migration that
     drops/renames in the same release as the code change that stops writing the
     old form.
2. **`skills/verify/SKILL.md`** — extend the release freeze: a clean production
   run snapshots entity `schema.yaml`s beside `apis/released/` (a sibling
   `entities/` dir, same copy machinery, same freeze moment).
3. **`agents/blueprint-coherence-reviewer.md`** — extend the released-diff
   check: a post-freeze breaking change to a released entity schema is a
   **HARD** gap unless the plan carries the staged expand→migrate→contract note.
   Mirror the existing released-API diff wording.
4. **`skills/plan/references/delta-checks.md`** — new preflight: diff desired
   entity schemas against the released snapshot; any non-additive delta forces
   the plan to spell the three stages as explicit ordered steps (expand release
   → backfill job → contract release), each behind its own approval like any
   step. Backfill steps carry acceptance criteria (completion metric or
   row-count parity).

## Verification

- `mise run plugins:check` passes.
- `grep -rn "expand-contract" plugins/vwf/` — identical id in baseline,
  coherence reviewer, delta-checks.
- Baseline still numbers 1–16 with no renumbering of 1–15; waiver example block
  untouched.
- verify's freeze section names both `apis/released/` and the new `entities/`
  sibling.

## Guardrails

- Do not add the rollback rule here — unit 03 owns `delivery-pipeline.md`'s
  rollback text and will cite `baseline/expand-contract` by id.
- Commit:
  `feat: add expand-contract baseline rule and released entity-schema freeze`
