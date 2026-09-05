# U5 — Docs

- **Wave:** 3
- **Depends on:** U1, U2, U3, U4
- **Owns:** `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`,
  `.claude/docs/repo-shape.md`, `.claude/docs/ci-and-releases.md`,
  `site/src/content/docs/**`, `.claude/skills/*-plugin/**`,
  `docs/memory/decisions/**`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** the `docs-reconciler` report the orchestrator passes in; every
  `DOCS FALSIFIED:` line from U1 to U4; then `site/CLAUDE.md` top to bottom,
  `readme.md:150-196`, `.claude/docs/repo-shape.md:188-196`,
  `.claude/docs/ci-and-releases.md:161-180`, `CLAUDE.md:95-110` and `:140-160`.
- **Lazy-load:** the run's diff (`git diff develop...HEAD --stat` in the
  worktree) to confirm what changed before describing it.

## Ruling

From the interview: "The readme's 'Other tools' section: yes, one sentence in
the framing paragraph: the full manual is available to agents as markdown at
https://claude-plugins.virajp.dev/llms.txt. The prompts themselves stay as they
are."

From "Out of scope": "Rewriting readme prose. Only one sentence in 'Other tools'
changes."

From `CLAUDE.md`: "Docs ship with the change. Any change to plugin behavior must
reconcile `readme.md`, this file, and the manual under `site/src/content/docs/`
in the same commit."

No reversal was confirmed in the interview, so no `docs/memory/decisions/` doc
is written by this unit.

## Edits

Apply the `docs-reconciler` findings and the `DOCS FALSIFIED:` lines first, then
make sure each of the following is true; where a finding already covered one, do
not edit twice.

1. **`readme.md:152-156`** — one sentence added to the framing paragraph of
   "Other tools": the whole manual is available to agents as markdown, index at
   `https://claude-plugins.virajp.dev/llms.txt`, every page at its `.md` URL. No
   other readme change.
2. **`site/CLAUDE.md`**
   - Tree table: the `public/brand/` row (`:32`) now says the brand set (marks,
     SVG favicon, social preview and its render source); a new row for the root
     of `public/`: `robots.txt`, the rasterized favicon set (`favicon.ico`,
     `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, produced by
     `site:icons` and committed), `site.webmanifest`, and `_headers` (the
     Workers Static Assets headers file: HSTS, nosniff, the referrer and
     permissions policies, the CSP, and the immutable cache rule for
     `/_astro/*`). A new row for `src/lib/markdown.ts` (the mirror helper:
     `# title` plus the body, relative links made absolute `.md` URLs) and for
     the three endpoints under `src/pages/` (`[...path].md.ts`, `llms.txt.ts`,
     `llms-full.txt.ts`), stating the route rule: a page at `/<id>/` also exists
     at `/<id>.md`, extension routes never take a trailing slash. The
     `scripts/check-links.ts` row (`:31`) gains the markdown pass and the
     alternate-link check.
   - Rules: a new rule that the CSP is `script-src 'self' 'wasm-unsafe-eval'`
     and `style-src 'self' 'unsafe-inline'`, so `astro.config.ts` keeps
     `inlineStylesheets: "never"` and `assetsInlineLimit: 0`, no script may be
     inline, and any new client script goes in `src/scripts/` and is referenced
     by `src`; Pagefind's WASM is why `wasm-unsafe-eval` is there, Shiki's token
     colours and mermaid's injected styles are why `unsafe-inline` is. A rule
     that Base's head is the one place for meta tags, and that `markdown` and
     `jsonLd` are the props a layout passes. A line under the fonts rule (`:52`)
     that the imports are the latin subsets only, weights 300/400/500 mono and
     400/500/700 sans, and that adding a weight means adding its
     `latin-<weight>.css` import.
   - Tasks table: a `site:icons` row (rasterizes the favicon set from
     `public/brand/vwf-favicon.svg` through one-off `pnpx` runs of `sharp-cli`
     and `png-to-ico`; outputs committed; re-run when the SVG changes; not part
     of `site:check`).
   - Traps: `_headers` must sit in `public/` because the deploy job ships the
     `build` job's artifact and never rebuilds; the `.pagefind` WASM files must
     keep their default content type; a `#fragment` on a `.md` link fails the
     checker by design; `site.webmanifest` is named so dprint's json plugin
     leaves it alone; the linter's pre-commit exclude is `^site/public/` because
     the linter has no config for binaries or the headers file.
   - The release model paragraph (`:78-89`): the version line reads `1.1.0`
     after U6; do not write the number here if U6 has not run yet, say "the
     version in `site/package.json`".
3. **`CLAUDE.md`** — the tree line for `site/**` (`:103`) and the `site:check`
   sentence (`:151`) only if the reconciler finds them falsified (the link
   checker's scope grew); the Tasks bullet for `site:check` gains "and the
   markdown mirror" in its link-checker clause. Add `site:icons` to the "Beside
   it" list of site tasks in the same bullet.
4. **`.claude/docs/repo-shape.md:188-196`** — the `site:*` family gains
   `site:icons` and the link checker's markdown pass.
5. **`.claude/docs/ci-and-releases.md:161-180`** — one sentence: the `_headers`
   file rides inside the artifact, which is why it lives in `site/public/`.
6. **`site/src/content/docs/**`** — nothing in the manual describes the site
   itself; edit only what the reconciler names.

## Verification

- `pnpm exec dprint check` green over the edited files (`CLAUDE.md`,
  `site/CLAUDE.md`, `readme.md` and the `.claude/docs/*.md` are
  dprint-formatted; widening a table cell re-pads every row, so run
  `pnpm exec dprint fmt` on them).
- `grep -c 'llms.txt' readme.md` is 1;
  `grep -c 'site:icons' site/CLAUDE.md
  CLAUDE.md .claude/docs/repo-shape.md`
  is at least 1 each.
- `grep -n '_headers' site/CLAUDE.md .claude/docs/ci-and-releases.md` hits both.
- No em-dash is introduced into `site/src/pages/*.astro` or
  `site/src/layouts/*.astro` (this unit does not own them; the check is that
  nothing outside the owned list changed: `git status --porcelain` shows only
  owned paths).
- `mise run site:check` still green (the manual may have been edited).

## Guardrails

- Do not edit any `.astro`, `.ts`, `public/` or task file; report anything those
  need as `DOCS FALSIFIED:` is not applicable here, so as `GAP:`.
- Do not write the site version number anywhere; U6 owns it.
- Keep every fact in exactly one place: the CSP's value lives in
  `site/public/_headers`, so the docs describe it and do not repeat the whole
  policy string.
- Match the surrounding voice and the 80-column fold; no em-dashes in
  `site/CLAUDE.md` additions beyond what its existing lines already use.
- `cat` is aliased to `bat` on this machine: use Read and Edit.

## Commit

`docs(site): describe the markdown mirror, the favicon set, the headers file and the icons task`
— written by the orchestrator after the wave gate, not by the unit.
