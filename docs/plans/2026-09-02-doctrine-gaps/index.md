# Plan — vwf doctrine gaps (2026-09-02)

**Status: DRAFT — awaiting review. Do not execute.**

Implements all seven drafts of
[`docs/scratchpad/vwf-doctrine-proposals.md`](../../scratchpad/vwf-doctrine-proposals.md)
as nine sequential subagent units. Every unit edits `plugins/vwf/` doctrine
only; nothing here touches `cli/`, `scripts/`, or stackgen.

## Assumed decisions — confirm or override at review

These are the proposals' open decision points, resolved to my recommendations.
Overriding one changes only the unit named in its row.

| # | Decision                                  | Assumed                                                         | Unit |
| - | ----------------------------------------- | --------------------------------------------------------------- | ---- |
| 1 | Core foundation set                       | users, observability, reliability targets, DR & backup          | 01   |
| 2 | Riskiest-assumption build-validation rule | reviewer-flagged, satisfiable by `accepted-risk` — never a halt | 05   |
| 3 | Experiment records                        | optional (mandatory only for counter-measured goals)            | 05   |
| 4 | Canary / percentage rollout               | not mandated; rollback guarantee only                           | 03   |
| 5 | Full STRIDE / threat-model doc            | not added; abuse cases + registry threat notes only             | 06   |

## Unit map

Sequential — units share doctrine files (see ownership below), so no two run
concurrently. Each unit = one subagent, one commit.

| Order | Unit file                                        | Implements       | Owns (primary files)                                                            |
| ----- | ------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------- |
| 1     | [01-reliability-core.md](01-reliability-core.md) | Draft 3          | product-foundations SKILL, reliability-targets, flow/entity contracts, pipeline |
| 2     | [02-expand-contract.md](02-expand-contract.md)   | Draft 5          | engineering-baseline, verify freeze, coherence reviewer, plan delta-checks      |
| 3     | [03-release-safety.md](03-release-safety.md)     | Draft 4          | delivery-pipeline, verify remedy, runtime-settings, execute-code-reviewer       |
| 4     | [04-metrics-wiring.md](04-metrics-wiring.md)     | Draft 2          | product template, observability ref, coherence reviewer, architecture           |
| 5     | [05-validation.md](05-validation.md)             | Draft 1          | product template, new validation ref, product-reviewer, feedback                |
| 6     | [06-security.md](06-security.md)                 | Draft 6          | delivery-pipeline, doctor, flow-contract, blueprint-reviewer, architecture      |
| 7     | [07-incidents.md](07-incidents.md)               | Draft 7          | new incident-response ref, foundations SKILL, feedback, verify                  |
| 8     | [08-format-bump.md](08-format-bump.md)           | format + version | blueprint-format, format-check, setup migration, plugin.json, marketplace       |
| 9     | [09-docs-and-verify.md](09-docs-and-verify.md)   | docs + gates     | readme.md, CLAUDE.md, docs/plugins/vwf.md, .claude/skills/vwf-plugin            |

Dependency notes: 03 cites `baseline/expand-contract` (created in 02). 07 uses
the core/elective mechanism (created in 01). 04 runs before 05 because both edit
`assets/templates/product.md`. 08 and 09 run last, once, for all units.

## Execution protocol (for the orchestrator, when approved)

1. Create an isolated worktree via the `vwf:git-workflow` skill. All nine units
   run in it; the branch is the reviewable change — land to `develop` only with
   explicit consent (per standing rule).
2. Per unit, in order: spawn one `general-purpose` subagent with the prompt
   *"Read `docs/plans/2026-09-02-doctrine-gaps/index.md` (Shared guardrails +
   your row's assumed decisions), then read your unit file in full. Execute its
   Edits in order, run its Verification, then commit per the commit rules below.
   Report what changed and any deviation."* Pass the unit file path explicitly.
   Do not pass conversation context — the files are the contract.
3. A subagent that cannot satisfy its Verification stops and reports; the
   orchestrator halts the sequence rather than patching around it.
4. After unit 9: run the full local gate (`mise run plugins:check`,
   `mise run plugins:marketplace --check`, `mise x -- vitest run`,
   `tsc --noEmit` in `cli/` and `scripts/`) and stop. **No merge, no push, no
   `plugins:release`** without the user saying so.

## Shared guardrails (every subagent reads this section)

- **`plugins/**/*.md` is NOT dprint-formatted.** Match the surrounding fold
  width (~80 cols) by hand. Repo-root and `docs/` markdown IS formatted —
  pre-commit's formatter will reflow those; commit again after it does (never
  `--amend`, never `--no-verify`).
- **Strict-YAML frontmatter**: malformed frontmatter drops a skill silently. New
  reference files under `skills/*/references/` take no frontmatter; never add or
  reorder frontmatter keys on a SKILL.md beyond your edit.
- **Rule-id spelling is load-bearing.** New ids introduced by this plan —
  `pipeline/load-proven`, `pipeline/rollback-path`, `pipeline/dependency-audit`,
  `baseline/expand-contract` — must be spelled identically everywhere they
  appear (asset, reviewer checklist, waiver examples). Grep before commit.
- **Additive edits only.** Do not restructure sections you aren't changing, do
  not renumber existing rules, do not touch other units' files.
- **No version or format bumps in units 1–7.** Unit 08 does both, once.
- Commits: conventional format per `.config/git-conventional-commits.yaml`
  (types include `feat`, `docs`; scopes list is empty — omit scope). Use
  `mise x -- git commit`. One commit per unit: `feat: <unit summary>` for 01–08,
  `docs: …` for 09.
- Verification floor for every unit: `mise run plugins:check` passes, plus the
  unit's own grep checks.

## Lazy-load library

Load these only when your unit file lists them or an edit turns out to need them
— not by default. All paths relative to `plugins/vwf/`.

| File                                                                             | What it is                                                      |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `assets/engineering-baseline.md`                                                 | 15 enforced rules + waiver/inapplicable mechanics               |
| `assets/delivery-pipeline.md`                                                    | environment names + 5 pipeline rules                            |
| `assets/format-check.md`, `assets/blueprint-format`                              | format-stamp machinery (the 3-byte file is the format number)   |
| `skills/blueprint-authoring/references/*.md`                                     | flow/entity/API contracts, density budgets                      |
| `skills/product-foundations/SKILL.md` + `references/`                            | the foundations checklist and its 12 references                 |
| `agents/blueprint-reviewer.md`, `…-coherence-reviewer.md`, `product-reviewer.md` | the reviewer checklists units extend                            |
| `skills/{plan,execute,verify,feedback,doctor,setup,architecture}/SKILL.md`       | the workflow skills units touch                                 |
| `docs/scratchpad/vwf-doctrine-proposals.md` (repo root docs/)                    | rationale per draft — read your draft's section for intent      |
| `.claude/skills/vwf-plugin/SKILL.md`                                             | the plugin's own shape — auto-applies under `plugins/vwf/`      |
| `.claude/skills/plugin-authoring/SKILL.md`                                       | checker rules + authoring traps — auto-applies under `plugins/` |
