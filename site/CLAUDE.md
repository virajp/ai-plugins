# site/ — the website at `claude-plugins.virajp.dev`

The maintainer's context for this tree. The repo-wide rules, the branch model
and the release ritual are the root [`CLAUDE.md`](../CLAUDE.md); the tag
families and the workflows are
[`.claude/docs/ci-and-releases.md`](../.claude/docs/ci-and-releases.md).

## What it is

An **Astro 6** static site (`output: "static"`, every route prerendered into
`dist/`), served by **Cloudflare Workers Static Assets** with no Worker script:
`wrangler.jsonc` names the `dist/` directory, a `404-page` fallback and the
custom-domain route, and `wrangler deploy` uploads the tree. It publishes the
landing page and the user manual — the vwf and stackgen references, the how-to
guides and the installer reference — from the same markdown the repo ships, so
GitHub and the site read one authored tree. Every manual page is also served as
that authored markdown at `/<id>.md`, indexed by `/llms.txt`, so an agent never
has to parse the rendered HTML.

## The tree

| Path                                        | Is                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/docs/`                         | the authored manual — `plugins/`, `how-to/`, `installer/` — the one content collection, declared in `src/content.config.ts`                                                                                                                                                                                                                                                                                                                                                 |
| `src/pages/index.astro`                     | the hand-authored landing page, copy verbatim from the design mockup, no client JS, one `WebSite` JSON-LD block                                                                                                                                                                                                                                                                                                                                                             |
| `src/pages/[...slug].astro`                 | one route per manual page; `src/pages/plugins/index.astro` is the generated section index (the other two sections have their own `index.md`)                                                                                                                                                                                                                                                                                                                                |
| `src/pages/[...path].md.ts`                 | the markdown mirror — one endpoint per collection entry, so a page at `/<id>/` also exists at `/<id>.md`. An extension route never takes a trailing slash, whatever `trailingSlash` says. The generated `/plugins/` index has no source entry and gets no mirror                                                                                                                                                                                                            |
| `src/pages/llms.txt.ts`, `llms-full.txt.ts` | the agent index and the whole manual in one file, both `text/plain` — `llms.txt` is the llmstxt.org shape (one `##` per nav section, each entry linked at its `.md` URL), `llms-full.txt` every mirror concatenated in the same order                                                                                                                                                                                                                                       |
| `src/lib/routes.ts`                         | the route rule — the tree mirrored with no `docs` prefix, trailing slash, a section's `index.md` as the section's route. Both the pages and the link plugin call it, so they agree                                                                                                                                                                                                                                                                                          |
| `src/lib/remark-docs-links.ts`              | the link rule — rewrites every relative `.md` (or bare directory) link to its route at build time and **fails the build** on one that leaves the collection                                                                                                                                                                                                                                                                                                                 |
| `src/lib/markdown.ts`                       | the mirror helper the three endpoints share — `# <title>`, a blank line, then the authored body, with every relative link made an absolute `.md` URL, because a fetched `.md` has no base to resolve against                                                                                                                                                                                                                                                                |
| `src/nav.ts`                                | the sidebar model: three sections in a fixed order, entries sorted by frontmatter `order`                                                                                                                                                                                                                                                                                                                                                                                   |
| `src/layouts/`, `src/components/`           | `Base` and `Docs` layouts; nav, Pagefind search (its Component UI modal), footer and the mark. `Base` owns the whole head — canonical, the icon and manifest links, the full OpenGraph and Twitter card set — and two optional props: `markdown`, the page's mirror emitted as a `rel="alternate"` link, and `jsonLd`. `Docs` passes both, its objects being a `TechArticle` and a `BreadcrumbList` mirroring the rendered crumb                                            |
| `src/styles/`                               | `tokens.css` defines the design tokens, `global.css` consumes them                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/scripts/mermaid.ts`                    | client-side Mermaid, loaded only on a page whose markdown source contains a `` ```mermaid `` fence (`[...slug].astro` tests the entry body, not the rendered HTML)                                                                                                                                                                                                                                                                                                          |
| `scripts/check-links.ts`                    | the gate, in two passes. HTML: every internal `href` and `src` in `dist/**/*.html` resolves to a built file, every `#fragment` to an `id` in its target. Markdown: every absolute site URL in `dist/**/*.md`, `llms.txt` and `llms-full.txt` resolves the same way, and every docs page carries exactly one markdown alternate link, pointing at a file that exists                                                                                                         |
| `public/brand/`                             | the brand set, served verbatim at `/brand/` — the marks, `vwf-favicon.svg` (also the source `site:icons` rasterizes from) and `social-preview.png` (the readme's header image)                                                                                                                                                                                                                                                                                              |
| `public/` (root)                            | `robots.txt`; the rasterized favicon set `site:icons` writes and this repo commits (`favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`); `site.webmanifest`; and `_headers`, the Workers Static Assets headers file — HSTS, nosniff, frame denial, the referrer and permissions policies, the CSP, and the immutable cache rule for `/_astro/*`. Cloudflare parses `_headers` and never serves it. The linter's pre-commit exclude covers the whole tree |
| `wrangler.jsonc`                            | the Workers Static Assets config; credentials never live here                                                                                                                                                                                                                                                                                                                                                                                                               |

## Rules

- **Frontmatter is strict YAML** — `title`, `description`, `order` (integer),
  all required by the collection schema. A missing or mistyped key fails
  `astro build` loudly with `InvalidContentEntryDataError`, naming the file and
  the offending field, so nothing reaches the link checker; a YAML syntax error
  fails the same way. Add the three keys before writing the body.
- **Relative `.md` links only inside the collection.** Anything that must point
  outside it — the readme, `installer/CLAUDE.md`, the stackgen inventory — is an
  absolute `https://github.com/virajp/claude-plugins/blob/main/<path>` URL with
  its anchor kept. The remark plugin throws on a relative link that escapes,
  naming the file, line and href.
- **Never add a slug plugin.** Astro 6's default heading ids keep trailing
  hyphens and match GitHub's, so the manual's ~60 cross-links to command
  headings (`#vwfarchitecture`) resolve unchanged. A custom `rehype-slug` or
  `headingIdCompat` breaks them.
- **Design rules**, from the design system: dark only, radius 0 everywhere (the
  app-icon tile is the one rounded shape), Geist Mono is semantic (the wordmark,
  commands, paths, versions and table headers — never body text), and **no
  em-dashes anywhere on the site's own copy**. The moved markdown keeps its
  em-dashes; the rule binds `.astro` files and the landing copy.
- **Nothing inline may reach the built HTML.** The CSP in `public/_headers`
  allows scripts from `'self'` only (plus `'wasm-unsafe-eval'`, which is
  Pagefind's WASM), so no built page may carry an inline `<script>`. Authoring
  one in a `.astro` file is fine: a plain `<script>` block is hoisted to a file
  by Astro — `Docs.astro`'s copy-button block is exactly that — and
  `assetsInlineLimit: 0` is what stops Vite putting it back. What the CSP
  forbids is inline script **content**, not the `is:inline` directive: a
  `<script>` carrying a body must reach the browser as a file, so `is:inline` on
  one of those is the mistake — it defeats the hoist and leaves the body in the
  HTML. A `src=`-only script carries no body and is safe either way;
  `Search.astro`'s Pagefind loader is exactly that, `src=` plus `is:inline`. A
  script with enough substance to want its own module goes in `src/scripts/` and
  is referenced by `src`, like `mermaid.ts`. Styles are `'self' 'unsafe-inline'`
  — the inline allowance exists for Shiki's per-token `style=` colours and
  mermaid's injected `<style>` elements, not as licence to hand-write one. The
  JSON-LD blocks are `is:inline` data, not executable script. The exact policy
  string lives in `_headers` and nowhere else.
- **Base's head is the only place for a meta tag.** A page never writes one; it
  passes `title` and `description`, and where it has them the two optional props
  `markdown` (its mirror path) and `jsonLd` (one schema.org object or several).
  Anything a page needs in the head becomes a `Base` prop.
- **Latin subsets only.** The six fontsource imports in `Base` are
  `latin-<weight>.css` — Geist Mono 300/400/500, Schibsted Grotesk 400/500/700 —
  because the site is English-only and the full packages ship two dozen subset
  files nothing renders. Adding a weight means adding its `latin-<weight>.css`
  import, never the bare `<weight>.css`.
- **Plain `<img>` from `public/brand/`.** No `astro:assets`, no `<Image>`, so no
  `sharp` build — `pnpm-workspace.yaml` denies it explicitly. The one rasterizer
  is `site:icons`, which shells out to a one-off `pnpx sharp-cli` from a temp
  directory and commits its PNGs; nothing rasterizes at build time and nothing
  enters the workspace.
- `pnpx`, never `npx`, in anything written here.

## Tasks

All under `.config/mise/tasks/site/`, all run from this directory:

| Task           | Does                                                                                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site:dev`     | `astro dev`                                                                                                                                                                                                                                                                                                                                 |
| `site:build`   | `astro build`, then `pagefind --site dist` (the search index, written into `dist/pagefind/`)                                                                                                                                                                                                                                                |
| `site:check`   | the gate: `astro check`, `site:build`, then `scripts/check-links.ts` over both the HTML and the markdown mirror. What `site.yml` and `site:release` run                                                                                                                                                                                     |
| `site:icons`   | rasterizes the favicon set — `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` — from `public/brand/vwf-favicon.svg`, through one-off `pnpx` runs of `sharp-cli` and `png-to-ico` in a temp directory. The outputs are committed, so this runs **by hand when the mark changes**, never in `site:check` and never in CI |
| `site:version` | `pnpm version <level> --no-git-tag-version` in `site/`; commit `site/package.json` by hand                                                                                                                                                                                                                                                  |
| `site:release` | on `main` only: clean tree, refuses an existing tag, runs `site:check`, cuts `site-v<version>`, pushes `main` then the tag, watches `site.yml`                                                                                                                                                                                              |

None of them runs in `plugins.yml` or in pre-commit. `astro check` is the site's
type gate; the site is **not** in `vitest.config.mts` or the root `tsc` lines,
and `tsconfig.json` extends `astro/tsconfigs/strict` rather than
`tsconfig.base.json`, whose `composite` + `noEmit`, `types: ["node"]` and
`allowImportingTsExtensions` conflict with Astro's.

## The release model

The version lives in `site/package.json` (starts `1.0.0`). Bump on `develop`
with `site:version`, commit, merge to `main`, then `site:release` there.
`.github/workflows/site.yml` has two jobs: `build` gates every PR and push
touching `site/**`, and `deploy` runs **only on a pushed `site-v*` tag**, after
verifying the tag matches the package version and is reachable from `main` — the
same two checks `release.yml` makes. **A merge to `main` ships nothing until a
tag is cut.** The deploy needs the repository secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. Every `site-v*` tag carries a GitHub Release in the
release skill's note format — run `/release`, and **ask the user before
`site:release`**.

## The design source

The design was authored in the Claude Design project
`bb1f0a69-4c72-4f0e-91fd-186a963b568b` ("claude-plugins (site)") as
`Site Design System.dc.html`, `Site - Landing.dc.html` and
`Site - Docs.dc.html`; the maintainer's machine keeps a gitignored working copy
under `docs/scratchpad/site-design/`. The landing is the composite chosen there,
copy verbatim; the docs page is its option C. Tokens are in
`src/styles/tokens.css`.

## Traps

- **The 10-hour dependency cooldown.** `pnpm-workspace.yaml`'s
  `minimumReleaseAge` blocks any package version published less than 600 minutes
  ago, so a freshly released Astro or Wrangler is not installable until the
  window passes. Check the age before bumping.
- **Astro 6 heading ids already match GitHub** — see Rules. The temptation to
  add a slug plugin is the trap.
- **`site/CLAUDE.md` is outside the collection** (`src/content/docs/`), so it
  never becomes a page; keep it that way.
- **Dependency builds are denied, not allowed.** `sharp` (via astro) and
  `workerd` (via wrangler) are `false` in `allowBuilds`; without those entries
  pnpm 11 fails the install with `ERR_PNPM_IGNORED_BUILDS`.
- **`astro.config.ts`'s `inlineStylesheets: "never"` and `assetsInlineLimit: 0`
  exist for the CSP alone.** They are what stop Astro inlining a small
  stylesheet and Vite inlining the hoisted `Docs.astro` script. Remove either
  and every local check still passes — `astro check`, the link checker, the W3C
  validator all read a page that looks fine — while the deployed page drops its
  styles or its sidebar, because Cloudflare applies a CSP the local build never
  sees.
- **`_headers` must live in `public/`.** `site.yml`'s `deploy` job ships the
  `build` job's artifact and never rebuilds, so anything that must reach
  Cloudflare has to be inside `dist/` at build time, and `public/` is the only
  route there.
- **Do not touch the `.pagefind` content type.** The two WASM binaries
  Pagefind's runtime streams — `wasm.en.pagefind` and `wasm.unknown.pagefind` —
  carry that extension; overriding the type in `_headers` or in wrangler breaks
  search with no build error. The index itself is under other extensions:
  `index/*.pf_index` and `fragment/*.pf_fragment` sit in subdirectories, while
  the single `pagefind.en_<hash>.pf_meta` sits in `dist/pagefind/` beside the
  two binaries.
- **A `#fragment` on a `.md` link is skipped, not failed.** The markdown mirror
  has no ids to resolve against, so the markdown pass resolves the file and
  leaves the fragment alone — `check-links.ts` gates that check on the target
  ending `.html`, and `markdown.ts` emits such links deliberately. Only the HTML
  pass, where every target is a page, fails a fragment that resolves to nothing.
- **The manifest is `site.webmanifest`, not `manifest.json`.** The extension
  keeps dprint's json plugin off it. Renaming it puts the file back under a
  formatter that will reflow it.
- **The linter's pre-commit exclude is the whole of `^site/public/`**, not just
  `brand/`: the linter has no config for an ICO, a PNG or an extensionless
  `_headers`, and any path it has no config for produces warnings that fail the
  run.
- `**/*.astro` is dprint-formatted through the markup plugin and excluded from
  the linter and its pre-commit argument list; `site/**/*.css` has its own
  linter config block. `src/content/docs/**/*.md` is dprint-formatted like the
  rest of the repo's markdown.
