# Unit 06 — Dependency auditing and earlier threat modeling

Implements **Draft 6** of the proposals. Assumed decision #5 applies: no full
STRIDE/threat-model document — abuse-case criteria plus registry threat notes
only.

- **Depends on:** unit 03 (delivery-pipeline now has rules 1–7).
- **Owns:** scoped edits to `assets/delivery-pipeline.md`,
  `skills/doctor/SKILL.md`,
  `skills/blueprint-authoring/references/flow-contract.md`,
  `agents/blueprint-reviewer.md`, `skills/architecture/SKILL.md`.
- **Read first:** every owned file; in doctor, locate the blocking vs info
  finding classes before editing.
- **Lazy-load:** `assets/capability-vocabulary.md` (only when wording the
  trust-boundary elicitation against real capability names),
  `agents/execute-security-reviewer.md` (only to confirm how it consumes
  registry `capabilities`, so the seeded notes land where it reads).

All paths relative to `plugins/vwf/`.

## Edits (in order)

1. **`assets/delivery-pipeline.md`** — append rule 8,
   **`pipeline/dependency-audit`**: every pipeline run that can lead to a
   release runs the ecosystem's lockfile vulnerability audit; a known-critical
   advisory fails the run. Waivable **per-advisory**
   (`pipeline/dependency-audit/<advisory-id>`, reason + date — dated so waivers
   rot visibly). Automated dependency updates stay recommended-not-mandated;
   tooling is the cicd axis's. Extend "How the surfaces apply it".
2. **`skills/doctor/SKILL.md`** — new check: run the ecosystem's audit per
   project (the package manager's own audit command). Critical advisories report
   as **blocking** (the existing class that halts `/vwf:plan`); high/moderate
   report info-level. Doctor reports, never writes — unchanged.
3. **`references/flow-contract.md`** — extend the **Acceptance** section: a flow
   whose Trigger & Actors table includes an external or unauthenticated actor,
   or that mutates payments/entitlements, carries at least one **abuse-case
   criterion** — a Given/When/Then where the actor attempts what they are not
   authorized to do and the observable outcome is denial plus the audit record.
   `n/a — <why>` allowed.
4. **`agents/blueprint-reviewer.md`** — checklist item mirroring edit 3
   (present, or `n/a — <why>`).
5. **`skills/architecture/SKILL.md`** — step 3c: while walking capabilities,
   elicit one line per trust boundary (external caller, webhook, file upload):
   the worst plausible abuse, recorded in the registry beside `capabilities`,
   where execute's security reviewer already reads.

## Verification

- `mise run plugins:check` passes.
- `grep -rn "dependency-audit" plugins/vwf/` — identical id in delivery-pipeline
  and doctor.
- `grep -n "abuse-case" plugins/vwf/skills/blueprint-authoring/references/flow-contract.md plugins/vwf/agents/blueprint-reviewer.md`
  — both present, same term.
- Pipeline rules now 1–8, none renumbered.

## Guardrails

- Doctor's audit check must degrade gracefully where no lockfile/audit tool
  exists (`n/a`, not a failure).
- Do not touch unit 01's `Load & latency` text in flow-contract — Acceptance
  section only.
- Commit:
  `feat: gate releases on dependency audits and pull abuse cases into the blueprint`
