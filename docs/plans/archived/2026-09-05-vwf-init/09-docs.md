# U9 — Docs reconciled, five decisions recorded

- **Wave:** 3
- **Depends on:** all of U1–U8
- **Owns:** `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`,
  `.claude/skills/vwf-plugin/**`, `.claude/skills/stackgen-plugin/**`,
  `.claude/skills/plugin-authoring/**`, `site/src/content/docs/**`,
  `docs/memory/decisions/2026-09-05-*.md` (new). Touch nothing outside this
  list.
- **Model:** inherit
- **Read first:** the `docs-reconciler` report the orchestrator passes in
  (dispatched first with the wave 1–2 diff); every `DOCS FALSIFIED:` line from
  U1–U8; then the survey list below, each at the cited lines.
- **Lazy-load:** the unit files of this plan when a passage needs the exact
  ruling.

## Ruling

Index.md §Goal, the five reversals, quoted in full there — each becomes one
decisions doc.

D2 (Parked rollout sequence) — the site's how-to pages describe setup's tooling
step today; they now describe init.

`CLAUDE.md` rule: "Docs ship with the change. Any change to plugin behavior must
reconcile `readme.md`, this file, and the manual under `site/src/content/docs/`
in the same commit."

## Edits

The survey's falsified passages (reconcile each; the reconciler's findings and
the units' `DOCS FALSIFIED:` lines extend this list):

1. **`readme.md`** — `### The workflow` (~206): the vwf blurb gains init in the
   command chain (`init → setup → product → …`);
   `### Tooling, design and
   delivery` (~221): the sentence "gate configs like
   `dprint.json` are deliberately outside that fence, named as prerequisites
   rather than written" is replaced by the new fence (gate and provider configs
   written; manifests and CI workflows not); `## Installation`'s "first thing to
   run afterwards is `/vwf:doctor`" gains "on a new repo, `/vwf:init` first".
2. **`CLAUDE.md`** — `## Plugins` table row for `vwf` (names init) and
   `stackgen` (the three unconditional bundles, config tiers); `### Tasks`: add
   `plugins:shellcheck` to the list run in `plugins.yml` and pre-commit, and
   "thirteen rules" if U6 numbered the widened rule separately (else keep twelve
   and describe the widening); `### Traps worth knowing`: the shellcheck gate
   over pack task files. This file is dprint-formatted — run
   `pnpm exec
   dprint fmt --config dprint.json CLAUDE.md`.
3. **`.claude/docs/plugins.md`** — the two-plugin table: stackgen "the home of
   the repo toolchain and gate doctrine" stays true; add "and ships their config
   files; `/vwf:init` lays them down". `.claude/docs/repo-shape.md`: the mise
   task list and the checker rule summary.
4. **`.claude/skills/vwf-plugin/references/skills-and-agents.md`** — a row for
   `init` (user and model) in the skill index; the ordering-gates paragraph
   names init before setup. `.claude/skills/vwf-plugin/SKILL.md` if it lists the
   chain.
5. **`.claude/skills/stackgen-plugin/SKILL.md`** — the `config/` tier now
   includes gate, hygiene and provider files, `conf.d`, `pre-commit.d`; three
   unconditional bundles; the `repo-hygiene` kind; the shellcheck gate.
6. **`.claude/skills/plugin-authoring/references/checks.md`** — rule 11's
   description per U6 (`:79`); the `Gates` table (`:8-15`) gains
   `plugins:shellcheck`.
7. **`site/src/content/docs/plugins/vwf.md`** — `## Commands` table (~718): a
   row for `/vwf:init`; the "Five are user-only" sentence (~740) stays five
   (init is not user-only) — verify the count; a new `### /vwf:init` section
   before `### /vwf:setup` (~769) with the two pipelines, the three questions,
   the report; `### /vwf:setup`'s onboard narrative loses Tooling and gains the
   shape check; `### /vwf:readme` (~1474): `readme.md` default;
   `### git-workflow` (~1542): `code:merge:*`, `code:precommit` before staging,
   `setup:worktree`; `## A worked walkthrough` (~1654) and `## Tips` if they
   show the chain.
8. **`site/src/content/docs/plugins/stackgen.md`** — the config tier, the three
   unconditional bundles, `repo-hygiene`, the fragments, the new task names, the
   gate packs' config files, the merge and worktree task names.
9. **`site/src/content/docs/how-to/**`** —
   `brownfield/onboard-existing-
   codebase.md` `:79-80, 99, 176, 208, 349`;
   `brownfield/migrate-old-vwf-
   repo.md` `:14, 47, 93, 103, 147`;
   `greenfield/single-repo.md` `:151, 184`; `greenfield/multi-repo.md` `:39`;
   `greenfield/ui-with-design-tool.md` `:169`; and every page in `greenfield/`,
   `operate/` and `how-to/index.md` that says setup materializes mise or the
   gates: now `/vwf:init` does, and the greenfield pages open with it.
10. **`docs/memory/decisions/2026-09-05-vwf-init-and-the-repo-shape.md`** — one
    doc, five sections, one per reversal, in the form of
    `2026-08-29-devtools-survives-the-waves.md` (date, branch, what was decided,
    why, what it costs); it also records D1's placement argument and the rollout
    sequence (Parked). Mirror to mempalace (wing `claude-plugins`, room
    `decisions`) if the server is up; skip silently if not.

## Verification

- `mise run site:check` green (astro check, build, link checker over HTML and
  the markdown mirror).
- `pnpm exec dprint check --config dprint.json readme.md CLAUDE.md
  site/CLAUDE.md`
  clean.
- `mise run plugins:check` green (rule 12 scans `.md` repo-wide: no retired name
  stated as live).
- `grep -rn 'merge:develop\|merge:main\|worktree:init\|setup:pnpm' readme.md CLAUDE.md .claude site/src/content/docs`
  returns nothing, or only lines inside the decisions doc.
- Every passage in the reconciler's report is either edited or answered in
  `DECIDED:` with the reason it was not falsified.

## Guardrails

- Do not edit `plugins/**` (the units'), `plugin.json` or generated files
  (U10's).
- `docs/memory/**` and `docs/plans/archived/**` are historical; only the new
  decisions doc is written there.
- `readme.md`, `CLAUDE.md`, `site/CLAUDE.md` are dprint-formatted (tables
  re-pad); `site/src/content/docs/**` follows `site/CLAUDE.md`'s link rule (read
  it before editing).
- Write with Write/Edit; `cat` is `bat`.

## Commit

`docs: /vwf:init, the reopened config fence, the three unconditional bundles and the new task names`
— written by the orchestrator after the wave gate, not by the unit.
