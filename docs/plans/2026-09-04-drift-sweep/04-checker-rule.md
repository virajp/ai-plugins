# U4 — the twelfth checker rule: retired vocabulary

- **Wave:** 1
- **Depends on:** —
- **Owns:** `scripts/src/check.ts`, `scripts/src/check.test.ts`
- **Model:** inherit
- **Read first:** both owned files top to bottom. Note how the existing eleven
  rules are structured, named, counted in the summary line, and tested with
  fixtures in `check.test.ts`.
- **Lazy-load:** `.claude/skills/plugin-authoring/references/checks.md` (the
  rule descriptions the docs unit will extend; read-only),
  `plugins/vwf/skills/setup/references/format-lineage.md` (the exempt file).

## Ruling

Quoted from index.md:

> 14 — New gate: A twelfth `plugins:check` rule: a short retired-vocabulary list
> failing outside exemptions. Line-level exemption when the line carries
> `retired`, `migration`, `→`, `pre-22` or `format 2N`;
> `skills/setup/references/format-lineage.md` exempt whole. The unit tunes the
> patterns until the tree passes after wave 1.

## Edits

1. **`scripts/src/check.ts`** — add one rule, named in the style of the existing
   eleven, that walks every `*.md` and `*.yaml` under `plugins/` and fails on a
   line matching any retired pattern unless the line or file is exempt. Initial
   pattern list (regular expressions, case-sensitive):
   - `` `web` `` — the retired platform token, backticked. Not bare `web`.
   - `-ux-gate` — the retired prefixed gate name.
   - `stacks/project/` and `assets/stacks/` — the retired template paths.
   - `four (stack |independent )?axes`, `four menus`, `four stack rounds` — the
     retired axis count.
   - `private_plane` — the dropped key.
   - `` `devtools` `` where the same line also contains `plugin` and not
     `dissolved`, `retired` or `uninstall` — the dissolved plugin named as
     current.

   Exemptions: a line containing `retired`, `migration`, `→`, `pre-22`, or
   `format 2` followed by a digit; the file
   `plugins/vwf/skills/setup/references/format-lineage.md` in full; and any
   `CHANGELOG.md` / `changelog.md`. A failing line reports `path:line` and the
   pattern that matched, in the same output shape the other rules use. The
   summary line's rule count moves from eleven to twelve wherever the code
   states it.
2. **`scripts/src/check.test.ts`** — a fixture-based test per pattern (one
   failing line each), one test for each exemption form (keyword line, exempt
   file, changelog), and one asserting a clean fixture passes. Follow the
   existing fixture helper.

The pattern list is a starting point. After the wave-1 gate the orchestrator
runs the rule against the real tree; a hit on a line that is legitimately
historical is fixed by adding the narrowest exemption here, not by deleting the
pattern. A hit on a live claim is the owning unit's finding.

## Verification

- `pnpm vitest run --project scripts` (or the equivalent filter the config uses)
  passes with the new tests.
- `pnpm exec tsc --noEmit -p scripts` passes.
- `mise run plugins:check` on the current tree either passes or fails only on
  lines U1–U3 are already assigned to fix (list them in `DECIDED:` so the
  orchestrator can cross-check after the wave).
- `mise run code:lint` and `mise run code:format` report nothing under
  `scripts/`.

## Guardrails

- Do not touch `scripts/src/marketplace.ts`, `inventory.ts` or `plugins.ts`.
- Do not edit any file under `plugins/` to make the rule pass; report the line
  as a `GAP:` naming the owning unit instead.
- The rule must not read `.claude/`, `docs/` or `readme.md` — the checker's
  scope is `plugins/` and the docs units are reviewed, not checked.
- Keep the rule cheap: one pass over files the checker already reads.

## Commit

`feat(scripts): twelfth plugins:check rule fails retired vocabulary stated as
live`
— written by the orchestrator after the wave gate, not by the unit.
