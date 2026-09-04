# Unit 04 — Goal metrics wired to instrumentation

Implements **Draft 2** of the proposals.

- **Depends on:** unit 01 (foundations MCQ wording it cross-references).
- **Owns:** scoped edits to `assets/templates/product.md` (the `Measured via:`
  line only — unit 05 owns the rest of the template),
  `skills/product-foundations/references/observability.md`,
  `agents/blueprint-coherence-reviewer.md`, `agents/product-reviewer.md`,
  `agents/execute-code-reviewer.md`, `agents/execute-acceptance-verifier.md`,
  `skills/architecture/SKILL.md`.
- **Read first:** every owned file.
- **Lazy-load:** `skills/product/SKILL.md` (only if the template edit needs
  matching elicitation wording), `skills/blueprint/SKILL.md` (only to place the
  counter-beside-Acceptance requirement correctly).

All paths relative to `plugins/vwf/`.

## Edits (in order)

1. **`assets/templates/product.md`** — replace the free-text `Measured via:`
   comment with the four structured forms:

   ```text
   counter <flow-slug>.<outcome>     # flow completed/failed/compensated
   counter <entity>.<state>          # lifecycle-state count
   store-metric <one-line intent>    # derived from stored data
   external <source>                 # support volume, app-store, revenue tool
   ```

   Touch nothing else in this template — unit 05 edits its tables.
2. **`references/observability.md`** — the "business counters are usually…"
   elicitation becomes **mandatory for goal-serving counters**: a goal naming
   `counter <flow>.<outcome>` requires that counter named beside the owning
   flow's Acceptance block; the entity form beside its Lifecycle table. Other
   counters stay elicited-optional.
3. **`agents/product-reviewer.md`** — checklist item: every `Measured via:` uses
   one of the four forms.
4. **`agents/blueprint-coherence-reviewer.md`** — new check, *goal
   instrumentation*: every goal's Measured-via resolves — `counter` forms
   resolve to a declared counter in the owning flow/entity doc (gap if not);
   `store-metric`/`external` are exempt but listed **info-level**, so the
   operator sees every goal the system itself cannot measure in one place.
5. **`agents/execute-code-reviewer.md`** — checklist line: counters declared
   beside the slice's Acceptance block are emitted by the implementation; absent
   = finding.
6. **`agents/execute-acceptance-verifier.md`** — when the harness exposes
   metrics, assert the declared counter increments during the E2E run; else
   `n/a`.
7. **`skills/architecture/SKILL.md`** — foundations walk cross-check: a product
   that declined/deferred observability but writes `counter` Measured-via forms
   is a flagged contradiction — accept observability or change the measurement
   source.

## Verification

- `mise run plugins:check` passes.
- `grep -rn "Measured via" plugins/vwf/` — template, product-reviewer, and
  coherence reviewer agree on the four forms' spelling.
- The template diff touches only the `Measured via:` line and its comment.

## Guardrails

- Do not edit the Risks table, goals lines, or Slice priority table (unit 05).
- Commit: `feat: wire goal metrics to declared business counters end to end`
