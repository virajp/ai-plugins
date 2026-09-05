# U3 — Docs reconciled; the sibling-bundle decision recorded

- **Wave:** 2
- **Depends on:** U1, U2
- **Owns:** `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`,
  `.claude/skills/stackgen-plugin/**`, `.claude/skills/plugin-authoring/**`,
  `.claude/skills/vwf-plugin/**`, `site/src/content/docs/**`,
  `docs/memory/decisions/*`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** index.md's **Facts** and **Run log**, then the
  `docs-reconciler` findings the orchestrator passes in, then every
  `DOCS
  FALSIFIED:` line the wave-1 units returned.
- **Lazy-load:** the wave-1 diff for any passage whose falsification you need to
  verify rather than take on report; the required plan's docs commit, so the
  manual's Cloudflare entry and this plan's Astro entries read as one story.

## Ruling

The whole assumed-decisions table, as the docs must describe the tree that
landed. Specifically D1 (a sibling bundle per mode, on the CLI precedent), D3
(one pack, both modes) and D5 (the named dist fact) — and the framing that this
is **not** a reversal of the 2026-08-17 north-star decision.

## Edits

1. **`docs/memory/decisions/2026-09-05-astro-modes-are-sibling-bundles.md`** —
   new. What was decided (one real `framework/astro` pack carrying both output
   modes; three `site` bundles; the dist contract as a named fact in the
   framework pack's conventions), the alternatives rejected from the table (a
   mode field, a per-project setting, two packs, keeping `@generated`, folding
   React in, a `build_output:` payload field), why (the first real greenfield
   run; the frontmatter has no mode key; SSR is load-bearing in the existing
   body; the CLI precedent), and the explicit note that the north-star
   decision's "closed menu" objection is not reopened because the generator's
   open entry still ships.
2. **`site/src/content/docs/plugins/stackgen.md`** — wherever the manual lists
   project-axis bundles or the `site` platform: the three Astro bundles, one
   sentence each, and that all three pin the `astro` pack; the framework pack
   beside `effect` wherever framework packs are listed; the dist contract stated
   once, cross-linking the Cloudflare Workers entry the required plan added.
   Every link and anchor must resolve — `site:check` is the gate.
3. **`.claude/skills/stackgen-plugin/SKILL.md`** — wherever it says only one
   framework pack exists, or lists `framework/*` refs as all `@generated`,
   update; the counts are generated (`inventory.md`) — never hand-type one.
4. **`readme.md`** — only if it names the framework packs or the `site` bundles;
   one clause.
5. **`.claude/skills/vwf-plugin/**`** — only if the reconciler finds a passage
   falsified (the vwf side did not change; expect nothing).
6. Every `DOCS FALSIFIED:` line the wave-1 units returned, verified against the
   diff before applying.

## Verification

- `mise run site:check` exits 0.
- `mise run plugins:check` exits 0.
- `dprint check` clean over every dprint-formatted file you touched
  (`readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`,
  `site/src/content/docs/**`) — run the formatter, do not hand-pad.
- `ls docs/memory/decisions/2026-09-05-astro-modes-*.md` exists.

## Guardrails

- Do not edit anything under `plugins/`; report a stale passage there as
  `DOCS FALSIFIED:`.
- `cat` is aliased to `bat` — Write/Edit only. A pipe containing `npm` is
  rewritten to `pnpm` — use Write for any such line.
- Do not describe `framework/react@generated` as a gap; describe it as the
  generated path, which is first-class.

## Commit

`docs: document the astro pack, the three site bundles and the sibling-bundle decision`
— written by the orchestrator after the wave gate, not by the unit.
