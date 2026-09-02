# Unit 01 — Reliability made mandatory

Implements **Draft 3** of the proposals. Assumed decision #1 applies: core =
users, observability, reliability targets, DR & backup (rate-limiting stays
elective).

- **Depends on:** nothing (first unit).
- **Owns:** `skills/product-foundations/SKILL.md`,
  `skills/product-foundations/references/reliability-targets.md`,
  `skills/blueprint-authoring/references/flow-contract.md`,
  `skills/blueprint-authoring/references/entity-contract.md`,
  `assets/delivery-pipeline.md`, plus scoped edits to
  `agents/blueprint-reviewer.md`, `skills/plan/SKILL.md`,
  `skills/plan/references/delta-checks.md`, `skills/verify/SKILL.md`,
  `skills/architecture/SKILL.md`.
- **Read first:** every owned file, top to bottom, before editing.
- **Lazy-load:** `assets/vwf-config.md` (only to confirm where a registry token
  like `reliability: deferred-preprod` is documented),
  `skills/blueprint-authoring/references/density.md` (only if the Guarantees
  column edit strains a budget).

All paths relative to `plugins/vwf/` unless rooted.

## Edits (in order)

1. **`skills/product-foundations/SKILL.md`** — introduce the core/elective
   split:
   - Mark the four core rows in the checklist table (a `Core` marker column or a
     bolded note — match the table's existing style).
   - Rewrite the MCQ contract: elective foundations keep accept / adapt /
     not-applicable; **core** foundations offer accept / adapt / **defer — not
     production-bound**. A deferral records a registry token
     (`<foundation>: deferred-preprod`), never an omission — omission stays the
     record only for electives.
   - State the gate: `/vwf:plan` (production-bound slice) and
     `/vwf:verify production` treat any `deferred-preprod` core token as a
     **blocking** finding.
   - Update the "Twelve concerns" phrasing only if your edit falsifies it (unit
     07 adds #13 and owns that count).
2. **`skills/architecture/SKILL.md`** — in the step-3c foundations walk, adjust
   the MCQ wording to the core/elective options above and the deferral token
   recording.
3. **`references/reliability-targets.md`** — in *Blueprint expansion*, add the
   capacity paragraph: `conventions.md#reliability` gains, on first touch,
   expected user count and aggregate request-rate at a stated horizon — two
   extra elicited questions beside the SLOs.
4. **`references/flow-contract.md`** — extend the **Guarantees** bullet: the
   table gains a `Load & latency` column per step-group — expected peak rate
   (order of magnitude, `~10/s`) and a p95 budget for user-facing groups, or the
   token `default — per conventions#reliability`. Note the default token is the
   normal cell, so density cost is near zero.
5. **`references/entity-contract.md`** — add a one-line `Scale:` requirement:
   expected count order-of-magnitude at a stated horizon plus the growth driver
   (example: `~10^6 rows in year 1, grows with orders`); it is the number that
   justifies or waives index/pagination/archival decisions in plan.
6. **`agents/blueprint-reviewer.md`** — two checklist items: every Guarantees
   row carries a `Load & latency` cell (default token counts as complete); every
   entity doc carries a `Scale:` line.
7. **`assets/delivery-pipeline.md`** — append rule 6,
   **`pipeline/load-proven`**: before the first production release of a flow
   whose declared peak rate meets a threshold (default `~10/s`), a load run on
   staging demonstrates the SLO holds at declared peak; evidence linked in the
   release record. Mechanism and tooling belong to the cicd-axis stack plugin;
   waivable via the standard `pipeline/…` doc-note + waiver pair. Extend "How
   the surfaces apply it" accordingly.
8. **`skills/plan/SKILL.md` + `references/delta-checks.md`** — add `test:load`
   to the harness-capability preflight vocabulary (bootstrap-step injection like
   the existing capabilities), and the deferred-core-token blocking check from
   edit 1.
9. **`skills/verify/SKILL.md`** — production runs treat a deferred core token as
   blocking (one sentence in the preflight/report section; match its existing
   finding classes).

## Verification

- `mise run plugins:check` passes.
- `grep -rn "load-proven" plugins/vwf/` — identical spelling in
  delivery-pipeline, and nowhere else yet (units 03/06 add siblings later).
- `grep -rn "deferred-preprod" plugins/vwf/` — appears in foundations SKILL,
  architecture, plan, verify; consistent token shape.
- Flow/entity contract edits stay inside their existing sections — no new
  top-level headings.

## Guardrails

- Do not renumber existing pipeline rules 1–5 or baseline rules 1–15.
- Do not touch `engineering-baseline.md` (unit 02 owns it).
- Commit:
  `feat: make core reliability foundations non-skippable with per-flow load contracts`
