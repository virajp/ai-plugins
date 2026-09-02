# Unit 03 — Release safety: rollback path and dark launches

Implements **Draft 4** of the proposals. Assumed decision #4 applies: no
canary/percentage-rollout mandate — rollback guarantee only.

- **Depends on:** unit 02 (cites `baseline/expand-contract` by id).
- **Owns:** scoped edits to `assets/delivery-pipeline.md`,
  `skills/verify/SKILL.md`,
  `skills/product-foundations/references/runtime-settings.md`,
  `agents/execute-code-reviewer.md`, `skills/plan/SKILL.md`.
- **Read first:** every owned file; in verify, locate the production failure
  path and the release record before editing.
- **Lazy-load:** `assets/engineering-baseline.md` rule 16 (confirm the exact N-1
  wording you cite), `assets/execute-stages.md` (only if the reviewer edit needs
  the stage context).

All paths relative to `plugins/vwf/`.

## Edits (in order)

1. **`assets/delivery-pipeline.md`** — append rule 7,
   **`pipeline/rollback-path`** (rule 6 is unit 01's `load-proven`):
   - Every production deploy has a stated rollback: the previous release tag
     remains deployable, and a release containing a stored-schema change is N-1
     compatible per `baseline/expand-contract`, so rolling back never corrupts
     data.
   - The release act records its rollback target; a release that genuinely
     cannot roll back (irreversible step) says so in the release record —
     irreversibility becomes a visible chosen state, never the silent default.
   - Extend "How the surfaces apply it": execute reviewers flag a pipeline file
     with no rollback provision like any conventions violation.
2. **`skills/verify/SKILL.md`** — production failure path: the first offered
   remedy is "roll back to `<previous tag>`" when the release record names one,
   then fix-forward via feedback/plan. Verify **names** the rollback; it never
   executes a deploy (keep that sentence explicit).
3. **`references/runtime-settings.md`** — add a **release flag** paragraph after
   "Flags are settings": a slice may ship dark behind a settings-document flag
   (same schema/cache/audit path — no new infrastructure). A release flag
   carries an owner and a **removal date**. Keep the existing "percentage
   rollouts are elicited, not assumed" line untouched — it is decision #4's
   record.
4. **`agents/execute-code-reviewer.md`** — checklist line: a release flag past
   its removal date is a finding (flag debt never accumulates silently).
5. **`skills/plan/SKILL.md`** — a plan doc may declare `exposure: dark` for a
   slice; doing so injects the flag key (name, owner, removal date) and an
   explicit flag-removal step into the plan.

## Verification

- `mise run plugins:check` passes.
- `grep -rn "rollback-path" plugins/vwf/` — identical id in delivery-pipeline;
  verify references the behavior, not a misspelled id.
- `grep -n "expand-contract" plugins/vwf/assets/delivery-pipeline.md` — the
  citation resolves to unit 02's rule id exactly.
- Pipeline rules now 1–7, none renumbered.

## Guardrails

- Do not add `pipeline/dependency-audit` here — unit 06 owns it.
- Do not alter the environments table or rules 1–5.
- Commit:
  `feat: pin a rollback path per production release and dated release flags`
