# U1 — The Astro site under `site/`

- **Wave:** 2
- **Depends on:** U3
- **Owns:** `site/**` **except** `site/src/content/docs/**`,
  `site/public/brand/**` and `site/CLAUDE.md`; `pnpm-lock.yaml`. Touch nothing
  outside this list.
- **Model:** inherit
- **Read first:** `docs/plans/2026-09-05-website/index.md` (Facts and Assumed
  decisions in full), the design files named in decision 22, and
  `pnpm-workspace.yaml` as U3 left it.
- **Lazy-load:** `dprint.json` (so `.astro` output formats cleanly on the first
  try), `.config/mise/tasks/site/*` (the scripts this unit must satisfy by
  name), `site/src/content/docs/**` as U2 lands it (the loader's base; read a
  few files, never edit).

## Ruling

Decision 1: "Cloudflare Workers Static Assets: `site/wrangler.jsonc` with
`assets.directory: "./dist"`, `not_found_handling: "404-page"`, custom-domain
route `claude-plugins.virajp.dev`, no Worker script."

Decision 4: "Mirror the tree with no docs prefix: `/plugins/vwf/`,
`/how-to/greenfield/single-repo/`, `/installer/usage/`. `index.md` is its
section's route (`/how-to/`, `/installer/`); `/plugins/` gets a generated
section index listing its entries. Trailing slash, one route per file."

Decision 5: "A remark plugin in `site/src/lib/remark-docs-links.ts` resolves
every relative link (`.md` with optional `#anchor`, or a bare directory) against
the source file, maps it to a route by rule 4, and **fails the build** on a link
that resolves outside `site/src/content/docs/`. Absolute URLs and same-page
anchors pass through."

Decision 7 (the half this unit owns): "Group labels and section order live in
`site/src/nav.ts`: Plugins (vwf, stackgen, mempalace, karpathy-guidelines),
Guides (Starting fresh, Adopting vwf, Operating), Installer (index, usage,
targets, internals)."

Decision 8: "Astro 6 default (GitHub-compatible, trailing hyphens kept). No
custom rehype-slug, no `headingIdCompat`."

Decision 9: "Client-side, lazy: the docs page layout includes
`site/src/scripts/mermaid.ts` only when the rendered HTML contains a
`language-mermaid` block; it imports `mermaid` from node_modules, initialises
with `theme: "dark"` and `securityLevel: "loose"` (labels use `<br/>`), and
renders each block. Fences stay as-is in markdown for GitHub."

Decision 10: "Pagefind CLI as a postbuild step (`pagefind --site dist`), the
docs layout mounting Pagefind's UI in the nav search slot, styled through its
CSS variables to the tokens. Landing excluded from the index
(`data-pagefind-ignore` on the landing body)."

Decision 11: "`@fontsource/geist-mono` (300, 400, 500) and
`@fontsource/schibsted-grotesk` (400, 500, 700), imported in the base layout;
self-hosted, no network at build, no Google Fonts `<link>`."

Decision 12: "Plain `<img>` from `public/brand/`; no `astro:assets`, no
`<Image>`, so no `sharp` and no `allowBuilds` change."

Decision 14: "Hand-authored `site/src/pages/index.astro` from the composite
mockup, copy verbatim, dark only, an explicit single-column collapse under 768px
per section, CTAs "Get started" (→ `/how-to/`) and "GitHub". No JS on the
landing."

Decision 15 (the half this unit owns): the link checker
`site/scripts/check-links.ts` — "every internal `href` in `dist/**/*.html`
resolves to a built file, every `#fragment` to an `id` in its target".

Decision 20: "`site/tsconfig.json` extends `astro/tsconfigs/strict` only, not
`tsconfig.base.json` … `astro check` is the site's type gate; the site is
**not** added to `vitest.config.mts` or the root `tsc` lines."

Decision 22: "Units read the design from `docs/scratchpad/site-design/` on this
machine (`Site - Landing.dc.html`, `Site - Docs.dc.html`,
`Site Design System.dc.html`, `shots/*.png`); if absent, fetch the same three
files from the Claude Design project `bb1f0a69-4c72-4f0e-91fd-186a963b568b` with
`DesignSync get_file`. The `.dc.html` files are self-contained HTML: the
`<helmet>` block is the head, `assets/` paths map to `/brand/`."

New dependencies (index.md): `astro` 6.x, `@astrojs/check`, `typescript`,
`@astrojs/sitemap`, `pagefind`, `mermaid`, `unist-util-visit`,
`@fontsource/geist-mono`, `@fontsource/schibsted-grotesk`, `wrangler`, `tsx`.
Nothing else. Verify each with Context7 before adding; if the newest version is
younger than 10 hours, `minimumReleaseAge` will refuse it — pin the previous
version and say so in `DECIDED:`.

## Edits

1. **`site/package.json`** — `name: "site"`, `version: "1.0.0"`,
   `private: true`, `type: "module"`, scripts `dev`, `build` (`astro build`),
   `check` (`astro check`), `preview`, and the dependencies above split
   dev/runtime as listed. No `packageManager` field (the root's mise config owns
   pnpm). Run `pnpm install` from the repo root once; commit nothing.
2. **`site/tsconfig.json`** —
   `{"extends": "astro/tsconfigs/strict", "include": [".astro/types.d.ts", "**/*"], "exclude": ["dist"]}`
   plus `compilerOptions.paths` `@/*` → `./src/*` to match the two sibling
   packages' habit.
3. **`site/astro.config.ts`** — `site: "https://claude-plugins.virajp.dev"`,
   `output: "static"` (the default; state it), `trailingSlash: "always"`,
   `integrations: [sitemap()]`,
   `markdown: { remarkPlugins: [remarkDocsLinks], shikiConfig: { theme: <one dark theme close to the tokens, e.g. "github-dark-default"> } }`.
   Rule 8: no rehype-slug override.
4. **`site/wrangler.jsonc`** — `name: "claude-plugins-site"`,
   `compatibility_date` = the date the unit runs,
   `assets: { directory: "./dist", not_found_handling: "404-page" }`,
   `routes: [{ pattern: "claude-plugins.virajp.dev", custom_domain: true }]`. No
   `main`, no bindings. Comment that the token and account id come from
   `site.yml`'s secrets.
5. **`site/src/content.config.ts`** — one collection `docs`:
   `glob({ pattern: "**/*.md", base: "./src/content/docs" })`, schema
   `{ title: z.string(), description: z.string(), order: z.number().int() }`.
   Ids are the file path without `.md` (`plugins/vwf`, `how-to/index`,
   `how-to/greenfield/single-repo`).
6. **`site/src/lib/routes.ts`** — one pure function `routeFor(id)`: strip a
   trailing `/index`, return `/${id}/`; `how-to/index` → `/how-to/`,
   `plugins/vwf` → `/plugins/vwf/`. Both the page and the remark plugin call it.
7. **`site/src/lib/remark-docs-links.ts`** — a unified plugin. For each `link`
   node whose `url` is not absolute (`/^[a-z]+:/i` or leading `/` or `#`): split
   off the fragment; resolve the path against the current file (`file.path`); if
   it ends in `.md`, strip it; if it is a directory (exists, or ends in `/`),
   map to the section route; compute the id relative to `src/content/docs`; if
   the resolved path is outside that base, throw with the source file, line and
   the offending href. Rewrite `url` to `routeFor(id)` plus the fragment. Use
   `unist-util-visit`.
8. **`site/src/nav.ts`** — the sidebar model: three sections in order, Plugins /
   Guides / Installer, each with its route root and, for Guides, three groups
   (`greenfield` → "Starting fresh", `brownfield` → "Adopting vwf", `operate` →
   "Operating"). Entries are pulled from the collection at build time and sorted
   by `order`; `index.md` entries render as the section or group link, not as a
   child. Export a helper that returns previous/next for a given id in this
   order.
9. **`site/src/styles/tokens.css`** — the design-system tokens as CSS custom
   properties exactly as the Facts section lists them, the type scale, radius 0,
   the dot-grid and dimension-rule utilities. `site/src/styles/global.css` —
   reset, body, links, code, tables, callout, and the Pagefind UI variable
   overrides.
10. **`site/src/layouts/Base.astro`** — `<html lang="en">`, meta charset and
    viewport, `<title>`, description, canonical, Open Graph and Twitter card
    tags pointing at `/brand/social-preview.png`, favicon
    `/brand/vwf-favicon.svg`, the two fontsource imports, the two stylesheets,
    and a `<slot />`. **`site/src/layouts/Docs.astro`** — the option C docs
    chrome: nav (brand mark and wordmark, Pagefind search slot, Docs / Guides /
    Installer / GitHub with the current section marked), the tinted sidebar from
    `nav.ts` with the current-item node marker, breadcrumb, article slot, "On
    this page" outline from `headings` (depth 2 and 3), boxed previous/next, and
    the conditional mermaid script. Sidebar becomes a top disclosure under
    1024px; outline hidden under 1280px.
11. **`site/src/components/`** — `Nav.astro`, `Footer.astro` (three columns),
    `Mark.astro` (the construction drawing SVG from the mockup, inline),
    `Search.astro` (Pagefind UI mount), `CodeBlock` handling via a small
    rehype-free approach: a client-less "copy" affordance is out of scope on the
    landing (no JS); on docs pages a 20-line inline script adds the copy button
    to `pre` blocks.
12. **`site/src/pages/index.astro`** — the composite landing, section by section
    from `Site - Landing.dc.html`: nav; blue-sheet hero with B's headline "Four
    phases from a vague idea to a reviewed release." and subtext, CTAs "Get
    started" → `/how-to/` and "GitHub" →
    `https://github.com/virajp/claude-plugins`, the construction drawing with
    its three annotations; the phases rail; the install split; the bento; the
    2×2 caveats grid; the guides table of contents (links to the real routes);
    the three-column footer. `data-pagefind-ignore` on `<main>`. Each
    multi-column section declares its `< 768px` collapse in its own `<style>`.
13. **`site/src/pages/[...slug].astro`** — `getStaticPaths` from the `docs`
    collection using `routeFor`; renders `Docs.astro` with `<Content />`,
    `headings`, breadcrumb from the id, previous/next from `nav.ts`.
    **`site/src/pages/plugins/index.astro`** — the generated section index
    (decision 4): title "Plugins", the four entries with their descriptions.
    **`site/src/pages/404.astro`** — on the docs chrome, one sentence and a link
    home.
14. **`site/src/scripts/mermaid.ts`** — dynamic `import("mermaid")`,
    `initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose", themeVariables: { background: "#15161A", primaryColor: "#1E3F8F", primaryTextColor: "#F4F5F8", lineColor: "#B9BDC9", fontFamily: "Schibsted Grotesk, system-ui, sans-serif" } })`,
    then `run({ nodes })` over `pre > code.language-mermaid` after unwrapping
    each into a `<div class="mermaid">` with the fence text. Included by
    `Docs.astro` only when the rendered `Content` HTML contains
    `language-mermaid` (render to a string first, or check `entry.body`).
15. **`site/scripts/check-links.ts`** — walk `dist/**/*.html`; for every `href`
    and `src` that is site-internal (starts with `/` or is relative), resolve to
    a file under `dist` (`/x/` → `dist/x/index.html`; `/x` → `dist/x` or
    `dist/x/index.html`; assets as-is); for a `#fragment`, parse the target file
    for `id="<fragment>"`. Print every failure as `<file>: <href>` and exit 1 on
    any; print the counts on success. Use only Node built-ins plus a tiny
    regex-based attribute scan (no HTML parser dependency).
16. **`site/public/`** — `robots.txt` allowing everything and naming the
    sitemap; nothing else (`brand/` is U2's).
17. **`site/.gitignore`** — none; the root `.gitignore` covers `site/dist/` and
    `site/.astro/` (U3). Do not add one.

## Verification

- From the repo root: `pnpm install --frozen-lockfile` succeeds (after this
  unit's own `pnpm install` wrote the lockfile).
- `mise run site:check` is green: `astro check` reports 0 errors; `astro build`
  completes with **zero** throws from `remark-docs-links` (if U2's tree is not
  yet in place when this unit runs, build against an empty collection and say so
  in `GAP:`; the wave gate reruns with both halves); Pagefind reports the page
  count; `check-links.ts` exits 0.
- `ls site/dist/plugins/vwf/index.html site/dist/how-to/index.html site/dist/installer/usage/index.html site/dist/404.html site/dist/sitemap-index.xml site/dist/pagefind/pagefind.js`
  all exist.
- `grep -c 'fonts.googleapis' site/dist/index.html` is 0;
  `grep -c '—' site/src/pages/index.astro` is 0.
- `mise run code:format` reports nothing under `site/`.
- `pnpm --filter site exec wrangler deploy --dry-run` parses the config (an auth
  error is acceptable; a config error is not).

## Guardrails

- Do not create or edit anything under `site/src/content/docs/` or
  `site/public/brand/`; U2 owns them. Read them freely.
- Do not write `site/CLAUDE.md`; U4 owns it.
- Do not add a package this plan does not list; if one seems necessary, return
  `UNRESOLVED:` naming it and why.
- Do not extend `tsconfig.base.json` (decision 20).
- No Google Fonts `<link>`, no `<Image>`, no `sharp`, no rehype-slug override.
- Use `pnpx`, never `npx`, in any script or doc string.
- `cat` is aliased to `bat`; write files with the Write tool. The
  `npm-normalize` hook rewrites `npm` after a pipe in Bash input to `pnpm`; keep
  package-manager strings out of heredocs.
- Copy from the mockup, do not redesign: the section order, layout families and
  copy are decided. Em-dashes are banned in every visible string.
- The mockup's `<helmet>` block is the head; its `assets/x.svg` paths are
  `/brand/x.svg` here, and `assets/favicon.svg` is `/brand/vwf-favicon.svg`.

## Commit

`feat: add the website under site/ on Astro with the docs collection, search, mermaid and the link gate`
— written by the orchestrator after the wave gate, not by the unit.
