# Unit 05 — Assumption validation, risk-driven scoping, kill criteria

Implements **Draft 1** of the proposals. Assumed decisions #2 and #3 apply: the
riskiest-assumption rule is reviewer-flagged and satisfiable by `accepted-risk`
(never a hard halt); experiment records are optional except for counter-measured
goals.

- **Depends on:** unit 04 (committed — same template file).
- **Owns:** `assets/templates/product.md` (tables + goal lines), **new**
  `skills/product/references/validation.md`, `agents/product-reviewer.md`,
  `skills/feedback/SKILL.md`, `skills/product/SKILL.md`.
- **Read first:** every owned file; in feedback, locate the metric-reading route
  before editing.
- **Lazy-load:** `assets/elicitation.md` (only to match the product skill's
  elicitation style when wiring the new reference).

All paths relative to `plugins/vwf/`.

## Edits (in order)

1. **`assets/templates/product.md`**:
   - Risks & assumptions table becomes
     `| Assumption | Risk if wrong | Validation method | Status | Evidence |`
     with a comment naming the closed vocabulary — `interviews` | `landing-page`
     | `prototype` | `concierge` | `usage-data` | `slice:<name>` |
     `accepted-risk — <why>` — and `Status` as
     `untested | validated | invalidated` (`Evidence`: link or one-line source
     once status leaves `untested`). Comment the rule: the top row may not use
     `slice:` unless marked `accepted-risk`.
   - Each goal subsection gains one line, mandatory for the first goal, optional
     after:
     `- Re-evaluate if: <metric> below <floor> by <date> → kill / pivot / re-scope`.
     A killed goal keeps its subsection with `status: killed — <date, reading>`
     — never silently deleted.
   - Slice priority table gains a `Validates` column (`—` allowed).
2. **New `skills/product/references/validation.md`** — the method vocabulary
   with what counts as evidence per method, and the lightweight experiment
   record for the appendix
   (`Hypothesis / Metric / Threshold / Result /
   Decision`). State plainly: no
   A/B infrastructure mandated — an experiment is a recorded hypothesis with a
   threshold, however measured; records are optional except when a goal's
   Measured-via is a `counter` form (then one feedback reading closes the
   record). No frontmatter (it's a reference).
3. **`skills/product/SKILL.md`** — point the elicitation at the new reference
   (one line in its references/flow, matching how it links other assets).
4. **`agents/product-reviewer.md`** — three checklist items:
   - validation methods use the closed vocabulary; no row has empty Status;
   - every `untested` assumption using `slice:` appears in some `Validates`
     cell;
   - the rank-1 slice validates the riskiest untested assumption, or one line
     under the table says why not (`accepted-risk` on the row also satisfies).
5. **`skills/feedback/SKILL.md`** — escalate the metric-reading route: a reading
   breaching a goal's re-evaluate floor makes the `/vwf:product` re-run
   mandatory-offered, with kill / pivot / re-scope as the named agenda.

## Verification

- `mise run plugins:check` passes.
- `grep -n "Re-evaluate if" plugins/vwf/` — template and feedback agree on the
  line's shape.
- `grep -rn "accepted-risk" plugins/vwf/` — template, validation reference,
  product-reviewer spell it identically.
- Unit 04's `Measured via:` block is untouched by this diff.

## Guardrails

- The kill rule never deletes a goal section — reviewers must not read a
  `killed` status as a gap.
- Commit:
  `feat: add assumption validation vocabulary, risk-driven slicing, and goal kill criteria`
