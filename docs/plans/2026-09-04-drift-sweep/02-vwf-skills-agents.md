# U2 — vwf skills, agents and vendored files

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/vwf/skills/**`, `plugins/vwf/agents/**`,
  `plugins/vwf/vendor/**`
- **Model:** inherit
- **Read first:** every owned file named below, top to bottom, before editing.
  Read `plugins/vwf/assets/standard-flows.md:100-140` and
  `plugins/vwf/assets/stack-adapter.md:150-240,320-370` first (read-only, U1
  owns them) — they are the authorities.
- **Lazy-load:** `plugins/vwf/assets/templates/flow-platform.md`,
  `plugins/vwf/assets/templates/registry.yaml`,
  `plugins/vwf/skills/blueprint-authoring/references/frontmatter-and-links.md:50-60`
  (the entity path convention).

## Ruling

Quoted from index.md:

> 1 — Retired `web` platform token: Replace with `site` / `webapp` per
> `standard-flows.md` at every live site; screens brief filenames become
> `site.md | webapp.md`. Lineage and synonym-normalization rows are untouched.

> 2 — UX gate name: The unprefixed `ux-gate` per `stack-adapter.md:325-334`, at
> all five sites.

> 3 — Axis count: Six everywhere, per `stack-adapter.md`'s enum.

> 11 — Counts in prose: Volatile counts (mempalace tool count, `/vwf:` command
> count) are removed.

> 13 — Vendored files: Edited: dead links dropped from the two mempalace skills,
> the Cursor auto-registration claim and tool count dropped, the karpathy
> README's renderer note becomes a plain statement of where the vendored copy is
> used.

> 20 — `runtime-settings.md` places the settings entity at
> `docs/blueprint/entities/settings/`.

## Edits

1. **`skills/blueprint/SKILL.md`** — lines 71 and 109: the platform list
   replaces `web` with `site`, `webapp`, matching `standard-flows.md:116-133`.
2. **`skills/blueprint/references/flow-placement.md`** — line 13: same.
3. **`skills/blueprint-authoring/references/frontmatter-and-links.md`** — line
   77: same.
4. **`skills/blueprint-authoring/references/flow-contract.md`** — line 11: same.
5. **`skills/screens/SKILL.md`** — lines 48 and 77: the brief filename `web.md`
   becomes `site.md | webapp.md`, one file per platform the flow implements.
6. **`skills/import-screens/SKILL.md`** — line 31: same platform replacement.
7. **`skills/architecture/references/stack-menu.md`** — lines 9 and 56: "four"
   becomes six, consistent with the bullet list at 44-47 which already elicits
   six. Lines 193-194 of `skills/architecture/SKILL.md` are synonym rows: leave.
8. **`skills/doctor/references/stack-checks.md`** — line 103: "The four stack
   axes … since format 19 a stack is composed from four independent templates"
   becomes six axes, naming them, and points to `assets/stack-adapter.md` for
   the enum. Keep the per-project / per-repo split it describes.
9. **`agents/execute-ux-reviewer.md`** — frontmatter `description` (lines 5-6):
   "the stack plugin's `-ux-gate` skill" becomes "the repo's `ux-gate` skill".
   Lines 62 and 77: same replacement; the body at line 35 already has it right —
   align to that wording. The frontmatter is strict YAML: keep the description
   on the same number of lines or re-fold carefully.
10. **`skills/product-foundations/references/runtime-settings.md`** — line 43:
    `docs/blueprint/settings/` becomes
    `docs/blueprint/entities/settings/index.md` plus `schema.yaml`, per
    `frontmatter-and-links.md:57`.
11. **`skills/mempalace/SKILL.md`** — line 130: remove the "auto-registered by
    this plugin" Cursor claim and the tool count; say the MCP server is declared
    by the vwf plugin manifest. Line 131: remove the link to
    `../../website/guide/cursor-hooks.md` and the sentence that needs it.
12. **`skills/mempalace-recall/SKILL.md`** — line 69: remove the link to
    `../../integrations/shared/recall-protocol.md`; if the sentence exists only
    to point there, remove the sentence.
13. **`vendor/andrej-karpathy-skills/README.md`** — lines 7 and 52: the
    references to `renderer/src/targets/cursor.test.ts` and "the renderer"
    become a plain statement that the vendored copy is what
    `skills/karpathy-guidelines/` ships, with no path into a tree that no longer
    exists.

## Verification

- `mise run plugins:check` passes (it validates every skill's frontmatter — a
  dropped skill shows as a lower skill count than 32; compare before and after).
- The backticked `web` token is gone from live lines:

  ```sh
  grep -rn '`web`' plugins/vwf/skills plugins/vwf/agents \
    | grep -v 'format-lineage\|architecture-writer\|architecture/SKILL.md\|retired\|migration\|→'
  ```

  returns nothing.
- `grep -rn -- '-ux-gate' plugins/vwf/agents plugins/vwf/skills` returns
  nothing.
- `grep -rn 'four stack\|four independent\|four axes\|four stack rounds' plugins/vwf/skills`
  returns nothing.
- `grep -rn 'website/guide\|integrations/shared\|renderer/' plugins/vwf/skills plugins/vwf/vendor`
  returns nothing.

## Guardrails

- Do not touch `plugins/vwf/assets/**` (U1). If an asset line reads wrong
  against your edit, return it as `DOCS FALSIFIED:`.
- Strict-YAML frontmatter: a broken `description` drops the agent or skill
  silently. Re-read every edited frontmatter block and confirm the checker's
  skill and agent counts are unchanged (32 skills, 18 agents).
- `plugins/**/*.md` is not dprint-formatted: match the surrounding fold width.
- Migration and synonym rows that mention `web` on purpose
  (`agents/architecture-writer.md:153-155`,
  `skills/setup/references/format-lineage.md:41-50`,
  `skills/architecture/SKILL.md:193-194`) are correct: do not edit them.
- Byte-copy, never retype, any line you are not changing.

## Commit

`fix(vwf): retire web in the skills and agents, name the ux-gate, six axes,
drop dead vendored links`
— written by the orchestrator after the wave gate, not by the unit.
