# Acceptance & UX — Autonomous Policy

Read this when the `acceptance` or `ux` stage returns anything other than a
clean pass. A run whose both stages pass first time, or whose skip conditions
held, never needs it — the stage contracts themselves live in
`%%AI_PLUGINS_ROOT%%/assets/execute-stages.md`.

- **Acceptance `FAIL` / `NOT-COVERED`, and ux findings → loop to `code`** for
  the step that owns the flow/screen (dispatch `execute-coder` with the **tag**;
  the fix is the code, the missing E2E test, or the style/state correction),
  re-commit, re-verify the affected stage — **up to 4 rounds** (the review-cap
  rule), under the same **convergence guard**: a round that doesn't strictly
  reduce the failures, or that re-breaks a criterion an earlier round fixed,
  ends the loop early as an oscillation gap. Residuals — at the cap or at the
  guard — are documented as gaps and the run proceeds to the final gate; a
  residual is never silently dropped.
- **Acceptance `n/a — no harness`**, or **ux `RENDERED: n/a` on a web slice** →
  record it as a gap (what harness/capture is missing, in the harness-contract
  vocabulary) and proceed — never scaffold infrastructure beyond the plan's own
  steps.
- **Untestable criteria / unpinned states** (`SPEC/PLAN GAPS` / `SPEC GAPS`) →
  plan-doc gap section + room `gaps`, per the gap rules.
