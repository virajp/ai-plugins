# U2 — Move the user docs and brand assets under `site/`

- **Wave:** 2
- **Depends on:** U3
- **Owns:** `docs/plugins/**`, `docs/how-to/**`, `docs/installer/**`,
  `docs/assets/**` (moved away, the directories left absent),
  `site/src/content/docs/**` and `site/public/brand/**` (moved to). Touch
  nothing outside this list.
- **Model:** inherit
- **Read first:** `docs/plans/2026-09-05-website/index.md` (Facts, especially
  the 12 escaping links and the link trap), then every moved file's first 15
  lines and each of the 12 named lines.
- **Lazy-load:** `docs/how-to/index.md` and `docs/installer/index.md` in full
  (they define the curated order the `order` values must follow);
  `site/src/nav.ts` if U1 has landed it (read only).

## Ruling

Decision 3: "`git mv docs/plugins docs/how-to docs/installer` →
`site/src/content/docs/{plugins,how-to,installer}`; `git mv docs/assets` →
`site/public/brand/` (8 files verbatim)."

Decision 6: "The 12 links that leave the trees become absolute
`https://github.com/virajp/claude-plugins/blob/main/<path>` URLs with their
anchors kept (`readme.md#other-tools`). `internals.md` ships.
`docs/installer/index.md:91`'s bare `../plugins/` stays a directory link and
resolves to `/plugins/`."

Decision 7 (the half this unit owns): "Every one of the 19 files gains YAML
frontmatter `title` (the H1 text), `description` (one sentence, from the file's
opening paragraph), `order` (integer, per the section index's curated order);
the H1 line and the blank line after it are removed."

Facts: "No file has YAML frontmatter; every file opens with exactly one H1 on
line 1." "Exactly 12 links escape the four trees" (the list in index.md). "Trap:
`../../plugins/` means `docs/plugins/` from `docs/how-to/x/` but repo-root
`plugins/` from `docs/plugins/stackgen.md`; the same for `../../installer/`.
Never string-rewrite those prefixes."

## Edits

1. **Move.** `mkdir -p site/src/content site/public`, then
   `git mv docs/plugins site/src/content/docs/plugins`,
   `git mv docs/how-to site/src/content/docs/how-to`,
   `git mv docs/installer site/src/content/docs/installer`,
   `git mv docs/assets site/public/brand`. Verify with `git status --short` that
   every entry is a rename (`R`), not a delete plus add, and that `docs/` now
   holds only `memory/`, `plans/` and the gitignored `scratchpad/`.
2. **Frontmatter, 19 files.** For each `.md` under `site/src/content/docs/`,
   replace line 1 (`# <title>`) and the blank line after it with:

   ```yaml
   ---
   title: "<the H1 text, verbatim>"
   description: "<one sentence from the opening paragraph, no em-dash, no trailing period repeated>"
   order: <n>
   ---
   ```

   Titles containing a colon or quotes are double-quoted YAML strings; the
   frontmatter is strict YAML (a bad one drops the entry silently in Astro's
   loader, so run the build). The vwf manual's title is `vwf plugin`; keep every
   H1 text as-is even where it carries an em-dash
   (`The installer CLI —
   usage` → title `"The installer CLI — usage"` is
   **not** acceptable on the site: rewrite that one title to
   `"The installer CLI: usage"` and say so in `DECIDED:`; check every other
   title for `—` and `–` and treat them the same way).

   `order` values: **plugins** vwf 1, stackgen 2, mempalace 3,
   karpathy-guidelines 4. **how-to** index 0; greenfield: single-repo 1,
   ui-with-design-tool 2, api-only-service 3, cli-product 4, multi-repo 5;
   brownfield: onboard-existing-codebase 1, migrate-old-vwf-repo 2; operate:
   choosing-your-stack 1, production-feedback-loop 2, sessions-and-handoff 3
   (these follow `docs/how-to/index.md`'s own listing order). **installer**
   index 0, usage 1, targets 2, internals 3 (per
   `docs/installer/index.md:29-31`).
3. **The 12 escaping links**, each edited at its named line and nowhere else, to
   `https://github.com/virajp/claude-plugins/blob/main/…`:
   - `plugins/vwf.md:9` and `:1907` — `readme.md`
   - `plugins/karpathy-guidelines.md:49` — `readme.md#other-tools`; `:90` —
     `readme.md`
   - `plugins/mempalace.md:381` — `readme.md`
   - `plugins/stackgen.md:82` — `plugins/stackgen/stacks/inventory.md`
   - `installer/internals.md:4` and `:161` — `installer/CLAUDE.md`; `:71` and
     `:159` — `.claude/docs/installer/receipts.md`; `:95` and `:160` —
     `.claude/docs/installer/packaging.md`

   Line numbers shift by the frontmatter edit (+3 net: 4 lines added, 2 removed,
   so a former line N is now N+2); locate by content, not by number. Leave every
   other relative link untouched: the remark plugin (U1) rewrites them at build.
   Leave `installer/index.md`'s `../plugins/` as it is.
4. **Assets** move verbatim; do not rename `vwf-favicon.svg` to `favicon.svg`
   (U1 links `/brand/vwf-favicon.svg`). Do not re-render `social-preview.png`.
5. **dprint.** The moved markdown is still in dprint's scope; run
   `mise run code:format --fix` (or the task's fix flag as it is spelled) on the
   moved tree only and confirm the only diffs are the frontmatter lines.

## Verification

- `git status --short | grep -c '^R'` is 27 (19 markdown files + 8 assets) and
  `git status --short | grep -c '^D'` is 0.
- `grep -L '^---$' site/src/content/docs/**/*.md` prints nothing (every file has
  frontmatter); `grep -c '^# ' <file>` is 0 for each of the 19 files outside
  fenced blocks (the survey noted `#` lines inside `sh`/`yaml` fences at
  `installer/usage.md`, `plugins/stackgen.md`, `plugins/vwf.md`; those stay).
- `grep -rn 'readme\.md\|installer/CLAUDE\.md\|\.claude/docs/installer\|stacks/inventory\.md' site/src/content/docs/`
  shows exactly 12 hits, all beginning
  `https://github.com/virajp/claude-plugins/blob/main/`.
- `grep -rn '\.\./\.\./readme\|\.\./\.\./\.claude\|\.\./\.\./installer/CLAUDE' site/src/content/docs/`
  prints nothing.
- `grep -rn -- '—\|–' site/src/content/docs/**/*.md | grep -c '^[^:]*:[0-9]*:title:'`
  is 0 (no em-dash or en-dash in any `title:`).
- `ls site/public/brand/ | wc -l` is 8.
- `mise run code:format` reports nothing under `site/src/content/docs/`.
- If U1's scaffold is present in the worktree, `mise run site:build` completes
  with zero `remark-docs-links` errors; if not, report `GAP:` and let the wave
  gate prove it.

## Guardrails

- Only the 12 named links change; every other link in the 313 is the remark
  plugin's. A rewrite of `../../plugins/` or `../../installer/` by pattern is
  the trap the Facts section names.
- Do not edit `readme.md`, `CLAUDE.md`, or anything outside the owned paths; the
  inbound references are U4's.
- Do not touch `docs/memory/**`, `docs/plans/**` or `docs/scratchpad/**`.
- Do not create `site/src/nav.ts`, any layout, or any page; U1 owns them.
- Strict YAML: quote titles and descriptions; no tabs; a `:` in an unquoted
  scalar breaks the file.
- `cat` is aliased to `bat`; use Write/Edit, never a heredoc.
- Byte-move with `git mv`; never delete and recreate.

## Commit

`refactor: move the user docs and brand assets under site/ with frontmatter and absolute escaping links`
— written by the orchestrator after the wave gate, not by the unit.
