# Unit 08 — Format bump, setup migration, version bump

Units 01–06 changed the blueprint format (templates, contracts, reviewer bars);
this unit records that **once** and makes the plugin shippable.

- **Depends on:** units 01–07 all committed.
- **Owns:** `assets/blueprint-format`, `assets/format-check.md`,
  `skills/setup/SKILL.md` (migration), `.claude-plugin/plugin.json` (vwf), the
  generated marketplace manifests.
- **Read first:** `assets/blueprint-format` (the 3-byte format number),
  `assets/format-check.md` (how drift is detected and reported),
  `skills/setup/SKILL.md` end-to-end — find how previous format migrations are
  expressed before writing this one.
- **Lazy-load:** `.claude/docs/plugins.md` (only for the manifest/version
  conventions), `.claude/skills/vwf-plugin/SKILL.md` (the two format stamps —
  confirm only the blueprint stamp moves).

Paths relative to `plugins/vwf/` unless rooted.

## Edits (in order)

1. **`assets/blueprint-format`** — increment the format number by one.
2. **`assets/format-check.md`** — if it enumerates per-format changes, add this
   format's entry; otherwise leave mechanics untouched.
3. **`skills/setup/SKILL.md`** — add the migration for existing products, in the
   same shape as prior migrations. What a pre-existing blueprint needs:
   - `product.md`: Risks table gains `Validation method | Status | Evidence`
     (map old `Validated by` text into `Validation method`, status `untested`
     unless evidence exists); Slice priority gains `Validates` (`—`); first goal
     gains a `Re-evaluate if:` line (elicit); `Measured via:` re-shaped into the
     four structured forms (elicit where ambiguous).
   - Flow docs: Guarantees rows gain a `Load & latency` cell — default token
     `default — per conventions#reliability`.
   - Entity docs: gain a `Scale:` line (elicit).
   - Externally-triggered flows: abuse-case acceptance criterion (elicit or
     `n/a — <why>`).
   - Registry: core foundations previously skipped-by-omission become either
     accepted or an explicit `deferred-preprod` token (elicit).
   - `conventions.md`: `#baseline` gains rule 16, `#pipeline` gains rules 6–8,
     `#incidents` appears when the incident foundation is accepted.
4. **`plugins/vwf/.claude-plugin/plugin.json`** — bump the **minor** version
   (behavior additions, no breaking install-surface change).
5. **`mise run plugins:marketplace`** — regenerate both marketplace manifests;
   stage `.claude-plugin/marketplace.json` (the dev manifest is gitignored).

## Verification

- `mise run plugins:check` and `mise run plugins:marketplace --check` pass.
- `git diff` shows exactly: format file +1, setup migration, plugin.json
  version, regenerated marketplace manifest.
- The migration section names every format-affecting change from units 01–06
  (cross-check against each unit file's Edits list).

## Guardrails

- One bump for the whole plan — never per unit.
- **No `plugins:release`, no tags** — releasing is a separate, user-approved
  ritual.
- Commit:
  `feat: bump blueprint format and vwf version for the doctrine-gaps package`
