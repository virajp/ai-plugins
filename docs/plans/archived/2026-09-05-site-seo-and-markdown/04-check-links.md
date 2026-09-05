# U4 — The link checker's markdown pass

- **Wave:** 2
- **Depends on:** U1 (the mirror must exist in `dist/` for the pass to have
  anything to check)
- **Owns:** `site/scripts/check-links.ts`. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** `site/scripts/check-links.ts` top to bottom;
  `.config/mise/tasks/site/check`; `site/src/lib/markdown.ts` (U1's link form,
  so the regex matches what is emitted).
- **Lazy-load:** one built mirror (`site/dist/plugins/vwf.md`) and
  `site/dist/llms.txt` after `mise run site:build`.

## Ruling

Decision 14: "`site/scripts/check-links.ts` gains a second pass after the HTML
pass: (a) every `dist/**/*.md`, `dist/llms.txt` and `dist/llms-full.txt` is read
and every `https://claude-plugins.virajp.dev/<path>` URL in it must resolve
through the existing `fileFor()` (a `#fragment` on a `.md` target is ignored, on
an `.html` target it is checked as today); (b) every HTML page under `dist/`
other than `index.html`, `404.html` and `brand/social-preview.html` must carry
exactly one `<link rel="alternate" type="text/markdown" href="…">` whose target
exists, except `plugins/index.html`, which must carry none. The summary line
grows to report the markdown counts. (User's choice.)"

## Edits

1. **`site/scripts/check-links.ts`**
   - Generalise `walk()` (`:19-30`) to take a predicate or an extension list, so
     it can collect `.md` files and the two `.txt` files as well as `.html`;
     keep the HTML pass byte-for-byte in behaviour.
   - Add a constant `SITE = "https://claude-plugins.virajp.dev"` and a markdown
     pass: for each `.md` file under `dist/` plus `dist/llms.txt` and
     `dist/llms-full.txt`, match every occurrence of `SITE + "/" + <path>`
     inside `](…)` link targets, strip the origin, split the fragment, and
     resolve through `fileFor()`. A fragment on a target that resolves to a
     `.md` file is ignored; on an `.html` file it goes through the existing
     `idsIn()` check. Report a miss as `<file>: <url>` like the HTML pass does.
   - Add the alternate-link pass over the HTML files already collected: for each
     page not in the exemption set, count
     `<link rel="alternate"
     type="text/markdown" href="…">` (attribute
     order as U3 emits it; match with a regex tolerant of attribute order),
     require exactly one whose `href` resolves through `fileFor()`; for
     `plugins/index.html` require zero. Report a miss with the page path.
   - Extend the summary line at `:126-128` to print the number of markdown files
     scanned and markdown links checked, and the number of alternate links
     verified.
   - Exit non-zero on any miss, as today.

## Verification

- `mise run site:check` green with U1 and U3 present in the worktree.
- Break-and-fix: temporarily rename `site/dist/plugins/mempalace.md`, run
  `pnpm exec tsx scripts/check-links.ts` from `site/`, confirm it reports the
  dangling URL from `plugins/vwf.md` and exits non-zero, then restore the file.
  Repeat by deleting the alternate link from one built page: it must report that
  page. Do not leave either mutation behind.
- The summary line names three markdown-pass counts and the HTML counts are
  unchanged from before the edit (1302 links / 496 fragments at the last
  archived run, or whatever the current build prints).

## Guardrails

- Do not change what the HTML pass accepts or rejects.
- Do not read `_headers`, `site.webmanifest` or any binary.
- `**/*.ts` is dprint-formatted and linted; run `pnpm exec dprint fmt` on the
  file.
- No new dependency; `node:fs` and `node:path` are all it uses today.
- `cat` is aliased to `bat` on this machine: use Read and Edit.

## Commit

`test(site): check the markdown mirror, llms files and alternate links` —
written by the orchestrator after the wave gate, not by the unit.
