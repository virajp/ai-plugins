# U1 — The markdown mirror, llms.txt and llms-full.txt

- **Wave:** 1
- **Depends on:** —
- **Owns:** `site/src/lib/markdown.ts`, `site/src/pages/[...path].md.ts`,
  `site/src/pages/llms.txt.ts`, `site/src/pages/llms-full.txt.ts`. Touch nothing
  outside this list. Never open `site/src/layouts/Base.astro` or `Docs.astro`:
  the alternate link is U3's.
- **Model:** inherit
- **Read first:** `site/src/lib/routes.ts`, `site/src/content.config.ts`,
  `site/src/pages/[...slug].astro`, `site/src/nav.ts`,
  `site/src/lib/remark-docs-links.ts`, `site/astro.config.ts`, and
  `site/src/pages/index.astro:130-133` (the landing description, decision 4
  reuses it).
- **Lazy-load:** `site/src/content/docs/installer/index.md:95` (the one bare
  directory link), any two docs pages to see the link forms, and the Astro
  endpoint docs through Context7 (`resolve-library-id` "Astro" → `query-docs`
  "static file endpoints with getStaticPaths in a static build").

## Ruling

Decision 1: "Every docs collection entry is also emitted at `/<entry id>.md` —
`/plugins/vwf.md`, `/how-to/index.md`, `/how-to/greenfield/single-repo.md` — by
an endpoint `site/src/pages/[...path].md.ts` whose `getStaticPaths` sets
`params.path = entry.id`. The generated `/plugins/` section index has no source
file and gets no mirror."

Decision 2: "The mirror is `# <title>`, a blank line, then `entry.body`. No
frontmatter, no description line. (User's choice.)"

Decision 3: "Every relative `.md` link in a mirror and in llms-full is rewritten
to an absolute `https://claude-plugins.virajp.dev/<path>.md` URL, the
`#fragment` kept; the bare directory link `../plugins/` becomes
`https://claude-plugins.virajp.dev/plugins/`; absolute URLs and same-page `#`
anchors pass through. Resolution is against the entry's own source path, exactly
as `remark-docs-links.ts` does for HTML. (User's choice.)"

Decision 4: "`/llms.txt` follows llmstxt.org: `# vwf`; a blockquote carrying the
landing description (the same string decision 11's WebSite uses); one sentence
pointing at `/llms-full.txt` and noting every page also exists at its `.md` URL;
then one `## <section label>` per nav section in nav order, each a list of
`- [<title>](https://claude-plugins.virajp.dev/<id>.md): <description>` in nav
entry order. `/llms-full.txt` is every mirror in the same order, each separated
by a blank line, `---`, blank line. Neither includes the landing page copy. Both
endpoints return `text/plain; charset=utf-8`; the mirror returns
`text/markdown; charset=utf-8`."

Decision 5, U1's half: the helper exports `markdownPathFor(id)` returning
`/${id}.md`, which U3 imports for the alternate link. U1 emits no HTML.

## Edits

1. **`site/src/lib/markdown.ts`** (new). Exports:
   - `markdownPathFor(id: string): string` — `/${id}.md`.
   - `markdownUrlFor(id: string, site: URL): string` — the absolute form.
   - `rewriteLinks(body: string, id: string, site: URL): string` — the decision
     3 rewrite. Match every markdown link target of the form `](<target>)` where
     `<target>` does not start with a scheme (`/^[a-z][a-z0-9+.-]*:/i`), `/` or
     `#`. Split an optional `#fragment`. Resolve the path against the directory
     of the entry's source (`posix.dirname(id)`), normalise `.`/`..` with
     `node:path/posix`. If the resolved path ends in `.md`, the target becomes
     `${site.origin}/<resolved without .md>.md` plus the fragment; if it ends in
     `/` (a bare directory), it becomes
     `${site.origin}${routeFor(<resolved
     without the slash> + "/index")}`;
     anything else throws with the id and the target, so a new link form fails
     the build loudly, the same posture as `remark-docs-links.ts`. Do not touch
     link text, code spans or absolute URLs. Reference-style definitions do not
     occur in the docs (survey: zero); a regex over `](…)` is sufficient.
   - `mirrorOf(entry, site: URL): string` — `# ${entry.data.title}\n\n` +
     `rewriteLinks(entry.body ?? "", entry.id, site)`, ending in exactly one
     newline.
   - `orderedEntries(entries): entry[]` — the collection in nav order: call
     `buildNav(entries)` from `../nav.ts` and flatten sections → groups →
     entries in the order it yields them; every entry in the collection must
     appear exactly once (assert, throw otherwise). Read `nav.ts` for the shape
     of a section and a group before writing this; do not modify it.
2. **`site/src/pages/[...path].md.ts`** (new).
   `export const prerender =
   true` is implicit in static output; do not add
   an adapter. `getStaticPaths` maps `getCollection("docs")` to
   `{ params: { path: entry.id }, props: {
   entry } }`. `GET({ props, site })`
   returns
   `new Response(mirrorOf(props.entry, site), { headers: { "Content-Type":
   "text/markdown; charset=utf-8" } })`.
   `site` is `Astro.site` on the endpoint context; throw if undefined.
3. **`site/src/pages/llms.txt.ts`** (new). `GET({ site })` builds the decision 4
   document. The H1 is `# vwf`. The blockquote is the landing description quoted
   verbatim from `site/src/pages/index.astro:130-133`:
   `> An opinionated Claude Code plugin: Product, Blueprint, Plan, Execute.
   Asks one question at a time, then builds unattended.`
   Then the sentence:
   `The whole manual in one file: https://claude-plugins.virajp.dev/llms-full.txt.
   Every page below also exists at its .md URL.`
   Then per section from `buildNav`, `## <section.label>` and the entry list.
   Sections with groups list their groups' entries in group order without a
   group heading. Return `text/plain; charset=utf-8`.
4. **`site/src/pages/llms-full.txt.ts`** (new). `GET({ site })` joins
   `orderedEntries(...).map(e => mirrorOf(e, site))` with `\n\n---\n\n`,
   trailing newline. Return `text/plain; charset=utf-8`.

## Verification

- `mise run site:check` green (astro check, build, pagefind, the HTML link
  checker as it is in wave 1).
- After the build: `site/dist/plugins/vwf.md`, `site/dist/how-to/index.md`,
  `site/dist/installer/usage.md`, `site/dist/llms.txt`,
  `site/dist/llms-full.txt` exist; `site/dist/plugins.md` and
  `site/dist/plugins/index.md` do not.
- `head -1 site/dist/plugins/vwf.md` is `#` + the page title;
  `grep -c '](\./\|](\.\./' site/dist/plugins/vwf.md` is 0;
  `grep -c 'https://claude-plugins.virajp.dev/plugins/mempalace.md' site/dist/plugins/vwf.md`
  is at least 1;
  `grep -c 'https://claude-plugins.virajp.dev/plugins/'
  site/dist/installer/index.md`
  is at least 1 (the bare directory link).
- `grep -c '^# ' site/dist/llms-full.txt` equals the number of files under
  `site/src/content/docs/` (currently 20); `grep -c '^## ' site/dist/llms.txt`
  is 3.
- Every URL in `site/dist/llms.txt` that ends in `.md` maps to an existing file
  under `site/dist/` (a shell loop; U4 automates this in wave 2).
- `curl`-free: `pnpm exec astro preview` is not needed; the files on disk are
  the proof.

## Guardrails

- Do not edit `site/src/lib/remark-docs-links.ts`, `routes.ts` or `nav.ts`;
  import from them.
- Do not add a dependency: `node:path/posix` and the collection API are all that
  is needed.
- `**/*.ts` is dprint-formatted (line width 80) and linted; write to that width
  and run `pnpm exec dprint fmt` on the four files.
- Endpoints with a file extension are served without a trailing slash in Astro 6
  whatever `trailingSlash` says; do not add a slash anywhere and do not change
  `astro.config.ts` (U3's).
- `cat` is aliased to `bat` on this machine: use the Write tool, never a
  heredoc, to create files.

## Commit

`feat(site): mirror every docs page as markdown, with llms.txt and llms-full.txt`
— written by the orchestrator after the wave gate, not by the unit.
