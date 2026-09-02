# Unit 09 — Docs reconciliation and final gate

The repo rule is "docs ship with the change": this branch is the change, and
this unit reconciles every human-facing doc it falsified, then runs the full
local gate.

- **Depends on:** units 01–08 all committed.
- **Owns:** `readme.md`, `CLAUDE.md`, `docs/plugins/vwf.md`,
  `.claude/skills/vwf-plugin/` (SKILL.md + references), `docs/how-to/` (only if
  a page describes a changed behavior).
- **Read first:** the branch delta (`git log --oneline develop..HEAD`,
  `git diff develop...HEAD --stat`).
- **Method:** run the **`vwf:docs-sync`** skill over the branch delta (or
  delegate the survey to the `docs-reconciler` agent, passing the diff) and
  apply only what the changes falsified — no opportunistic rewrites.

## Known reconciliation targets

Verify each against the actual delta; this list seeds the survey, it does not
replace it.

- `.claude/skills/vwf-plugin/` — the assets map (delivery-pipeline now 8 rules,
  baseline now 16), the foundations count (13), the new references
  (`validation.md`, `incident-response.md`), the format-stamp value.
- `docs/plugins/vwf.md` — workflow description where it names skippable
  foundations, feedback kinds (now 6), release/rollback behavior, the format
  number if stated.
- `CLAUDE.md` — only if a falsified sentence exists (it summarizes vwf at low
  resolution; expect little or nothing).
- `readme.md` — same bar: only falsified passages.
- Remember: `CLAUDE.md`/`readme.md` are dprint-formatted (widening a table cell
  re-pads rows — fine); `plugins/**` and `.claude/skills/**` markdown is not —
  match fold width by hand.

## Final gate (after the docs commit)

```sh
mise run plugins:check
mise run plugins:marketplace --check
mise x -- vitest run
cd cli && mise x -- tsc --noEmit && cd ..
cd scripts && mise x -- tsc --noEmit && cd ..
```

All must pass. Then **stop**: report the branch summary (commits, files, gates)
to the orchestrator. Merging to `develop`, pushing, and releasing are
user-consent actions outside this plan.

## Guardrails

- Docs edits trace to a falsified sentence — cite which unit falsified each
  edited passage in the report.
- Commit: `docs: reconcile repo docs with the doctrine-gaps package`
