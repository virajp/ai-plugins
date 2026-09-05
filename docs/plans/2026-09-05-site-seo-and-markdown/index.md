---
type: repo-plan
title: Site SEO, security headers and a markdown mirror for agents
requires: []
---

# Plan — Site SEO, security headers and a markdown mirror for agents (2026-09-05)

## Status

**RUNNING**

APPROVED 2026-09-05 by the user, after the self-review. RUNNING since
2026-09-05, worktree
`/Users/virajpatel/Projects/github.com/virajp/claude-plugins/.worktrees/2026-09-05-site-seo-and-markdown`,
branch `2026-09-05-site-seo-and-markdown`.

## Consent

| Action                                   | Granted |
| ---------------------------------------- | ------- |
| Merge to `develop` and push on green run | yes     |
| Release `vwf`                            | none    |
| Release `stackgen`                       | none    |
| Release installer                        | none    |
| Release site                             | minor   |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`. `site:release` is asked for separately.

## Goal

Crawlers, link previewers and AI agents get a complete, valid, secure read of
`https://claude-plugins.virajp.dev`, and an agent can fetch any manual page as
the authored markdown rather than the rendered HTML. Concretely, after this
lands: every docs page also exists at its source path with a `.md` suffix,
`/llms.txt` indexes them and `/llms-full.txt` concatenates them; the site
answers `/favicon.ico`, `/apple-touch-icon.png` and a web manifest; every
response carries HSTS, nosniff, a referrer policy, a permissions policy and a
Content Security Policy; the OpenGraph and Twitter cards are complete and each
page carries JSON-LD; and the font CSS ships only the latin subsets.

The framing that produced the plan: an audit on 2026-09-05 found the head tags,
sitemap, robots and canonical links already correct (Lighthouse mobile 99/100/
100/100 on the home page, W3C validator clean), but no ICO or touch icon, no
security headers, incomplete card tags, no structured data, 24 unused font
subset files, and no way for an agent to read the docs as markdown. The
Cloudflare-managed robots.txt that blocks ClaudeBot and others is a dashboard
setting, not a repo change, and is out of scope.

No reversal. The previous site plan's decision 11 named the font weights (Geist
Mono 300/400/500, Schibsted Grotesk 400/500/700); those weights stay, only the
non-latin subset files go.

## Facts the survey established

**Site shape.**

- `site/astro.config.ts:8` `site: "https://claude-plugins.virajp.dev"`, `:11`
  `output: "static"`, `:14` `trailingSlash: "always"`, `:15`
  `integrations: [sitemap()]`. No `build` key and no `vite` key exist, so
  `build.inlineStylesheets` is Astro's default `auto` and
  `vite.build.assetsInlineLimit` is Vite's default 4096.
- `site/src/layouts/Base.astro:14-17` props are `title` and `description` only;
  `:19` computes `canonical` from `Astro.url.pathname` and `Astro.site`; `:20`
  the social image URL; `:2-7` the six fontsource imports
  (`@fontsource/geist-mono/300.css`, `/400.css`, `/500.css`,
  `@fontsource/schibsted-grotesk/400.css`, `/500.css`, `/700.css`); `:26-42` the
  head: charset, viewport, title, description, canonical, the SVG icon link
  (`/brand/vwf-favicon.svg`), the sitemap link, `og:type`, `og:site_name`
  (`vwf`), `og:title`, `og:description`, `og:url`, `og:image`, `twitter:card`
  (`summary_large_image`), `twitter:title`, `twitter:description`,
  `twitter:image`.
- `site/src/layouts/Docs.astro:17-25` props `id?`, `title`, `description`,
  `headings?`, `hasMermaid?`, `searchable?`; `:35-46` computes `nav`, `here`
  (`{ section, group, entry }`), `prev`/`next`, `section`, `isSectionRoot`,
  `current`; `:52` passes `title={`${title} · vwf`}` to Base; `:103-111` the
  breadcrumb: `<a href="/plugins/">Docs</a>` / section label linked to
  `section.route` / group label unlinked (a group has no route, `nav.ts:19-23`)
  / `title`; `:146-176` the hoisted sidebar-and-copy `<script>` (not
  `is:inline`); `:177` `{hasMermaid && <script src="../scripts/mermaid.ts" />}`;
  `:180-370` the scoped `<style>`.
- `site/src/pages/index.astro:130-133` uses Base directly with the title
  `vwf: four phases from a vague idea to a reviewed release` and the description
  `An opinionated Claude Code plugin: Product, Blueprint, Plan,
  Execute. Asks one question at a time, then builds unattended.`;
  it has no script and no inline `style=` attribute.
  `site/src/pages/plugins/index.astro:
  14-18` uses Docs with
  `id="plugins/index"`, title `Plugins`. `site/src/pages/
  404.astro:8-12` uses
  Docs with no `id` and `searchable={false}`.
- `site/src/lib/routes.ts:13-18` `routeFor(id)`: strips a whole trailing
  `/index` segment, returns `/` for the root, else `/<stripped>/`.
- `site/src/content.config.ts:10-21`: one collection `docs`, `glob` loader,
  `generateId` keeps the source path minus `.md`, so an id is the source path
  (`plugins/vwf`, `how-to/index`). Schema: `title`, `description`, `order`.
  `entry.body` is the raw markdown without frontmatter (used at
  `[...slug].astro:25`); `entry.filePath` is exposed, relative to the project
  root.
- `site/src/nav.ts:40-56` the fixed section table: `plugins` → "Plugins",
  `how-to` → "Guides" (groups `greenfield` → "Starting fresh", `brownfield` →
  "Adopting vwf", `operate` → "Operating"), `installer` → "Installer";
  `buildNav(entries)` at the top of the file returns the sections in that order
  with entries sorted by frontmatter `order`; `:64` a section's route is
  `routeFor(`${key}/index`)`.
- `site/src/lib/remark-docs-links.ts:40-90` rewrites `link` nodes only at build
  time; it never runs on `entry.body`.
- `src/pages/` holds only `.astro` files; there is no endpoint in the repo to
  pattern on. Astro 6: an endpoint whose URL has a file extension is served
  without a trailing slash regardless of `trailingSlash`.
- The docs collection's links: 257 relative `.md` links (with or without
  `#fragment`), 28 same-page `#` anchors, 27 absolute `https://` URLs, one bare
  directory link (`site/src/content/docs/installer/index.md:95`,
  `](../plugins/)`), zero images, zero root-relative links, zero raw HTML.
- Built output (`site/dist/`, 23 HTML files): every docs page carries one inline
  `<script type="module">` (the Docs.astro block, 511 bytes) and one inline
  `<style>` (3705 bytes); `plugins/index.html` carries a second style;
  `index.html` carries neither. The mermaid script is emitted as
  `<script type="module" src="/_astro/...js">`.
- `site/src/components/Search.astro:8-9`: the Pagefind CSS link and
  `<script src="/pagefind/pagefind-component-ui.js" type="module" is:inline>` (a
  `src`, no body). Pagefind's runtime uses `fetch`, a worker from `/pagefind/`,
  and `WebAssembly.instantiateStreaming` with a fallback; zero `eval` or
  `new Function`. Its WASM files end in `.pagefind`; do not override their
  content type.
- `site/src/scripts/mermaid.ts:19` dynamic `import("mermaid")`, `:31`
  `securityLevel: "loose"`. Mermaid injects `<style>` elements and uses
  `insertRule`; zero `eval`/`new Function` across its dist.
- Shiki writes `style="color:…"` on every token span; `astro.config.ts:24-37`
  strips only the `<pre>` background. So `style-src` needs `'unsafe-inline'`.
- Font weights in use: 700 (`global.css:25`, `plugins/index.astro:47`), 500
  (`global.css:82,152,225`, `Docs.astro:199,320`, `index.astro:579`), 400
  (`Nav.astro:56`, `index.astro:448,513`, body default), **300
  (`Footer.astro:51`, the footer wordmark)**. Both fontsource packages ship
  per-subset files named `latin-<weight>.css`; the current build emits 36 font
  files, 24 of them non-latin subsets.
- `site/public/` holds `robots.txt` and `brand/` (8 files: the marks,
  `vwf-favicon.svg`, `social-preview.png` at 1280×640, `social-preview.html` the
  hand-render source, which loads Google Fonts and is served live at
  `/brand/social-preview.html`). No `_headers`, `_redirects`, ICO, PNG or
  manifest anywhere in the repo. `vwf-favicon.svg` is a 64×64
  `<rect
  rx="14" fill="#1e3f8f">` tile with white strokes.
- `site/wrangler.jsonc:12-17` assets block: `directory: "./dist"`,
  `not_found_handling: "404-page"`, no `html_handling` (default
  auto-trailing-slash), no Worker script. Workers Static Assets parses a
  `_headers` file at the assets root and never serves it; headers apply to
  static asset responses only.
- `pnpm-workspace.yaml:26-34` `allowBuilds`: `sharp: false`, `workerd: false`;
  `:41` `minimumReleaseAge: 600`. No rasterizer anywhere in the dependency tree.
  `sharp-cli` 6.1.0 and `png-to-ico` 3.0.2 exist on npm, each with a CLI `bin`.
- `site/package.json:3` version `1.0.0`; astro 6.4.8, @astrojs/sitemap 3.7.4,
  pagefind 1.5.2, mermaid 11.17.2, both fontsource packages 5.3.0, wrangler
  4.129.0, tsx 4.23.13.

**Gates covering `site/`.**

- `.config/mise/tasks/site/check:9-13`: `astro check` → `site:build` →
  `pnpm exec tsx scripts/check-links.ts`. `site:build` = `astro build` then
  `pagefind --site dist`. Nothing else touches `dist/` or `public/`.
- `site/scripts/check-links.ts:19-30` walks only `.html` files under `dist/`;
  `:91` one regex over `href`/`src` attributes; `:49-64` `fileFor()` resolves a
  path to `dist/<path>`, `dist/<path>/index.html` or `dist/<path>.html`; `:110`
  a `#fragment` on a non-`.html` target fails hard; `:126-128` prints counts.
  `.md`, `.txt`, `.webmanifest` and `_headers` in `dist/` are never opened.
- `.github/workflows/site.yml:50-78` job `build` runs `site:check` and, on a
  tag, uploads `site/dist` as an artifact; `:80-138` job `deploy` downloads that
  artifact and runs `wrangler deploy`. Deploy never rebuilds, so anything that
  must reach Cloudflare must be inside `dist/` at build time, i.e. under
  `site/public/`.
- `.config/pre-commit-config.yaml:115-134` the linter hook, `:132`
  `exclude:
  ^plugins/vwf/assets/(templates|examples)/|^site/public/brand/|\.sh$|\.astro$`.
  The comment at `:118-131` explains that any path the linter has no config for
  produces warnings that fail the run, so unlintable files must be kept out of
  the argument list. `:93-96` `check-added-large-files --maxkb=1024`.
- `dprint.json:27-46` includes `**/*.json`, `**/*.ts`, `**/*.css`, `**/*.html`,
  `**/*.astro`, `**/*.md`; excludes `site/dist/**`. `.txt`, `.webmanifest`,
  `.ico`, `.png` and an extensionless `_headers` are not formatted.
  `.config/linter.yaml:7-19` ignores `site/dist/**`, `site/.astro/**`,
  `site/**/*.astro`; `:60-65` a `site/**/*.css` block.
- `.config/mise/tasks/code/format:27` runs `sort-package-json` over every
  `package.json`, `site/package.json` included.
- `.config/mise/tasks/site/version:24-26` runs
  `pnpm version <level>
  --no-git-tag-version` in `site/`; `site:release`
  (`.../site/release`) requires `main`, a clean tree, no existing tag, runs
  `site:check`, tags `site-v<version>`.

**Docs describing today's behaviour.**

- `site/CLAUDE.md:31` (check-links row), `:32` (`public/brand/` row: "the marks,
  the favicon and `social-preview.png`"), `:33` (wrangler row), `:56-57` (plain
  `<img>`, no sharp), `:66-70` the tasks table, `:78-89` the release model,
  `:101-117` the traps (`:111-113` allowBuilds).
- `readme.md:2` the header image; `:150-196` the "Other tools" section,
  `:152-156` its framing paragraph.
- `CLAUDE.md:103` the tree line for `site/**`, `:151` `site:check`.
- `.claude/docs/repo-shape.md:188-196` the `site:*` task family.
- `.claude/docs/ci-and-releases.md:161-180` the `site.yml` description,
  `:236-241` the release ritual.
- `.claude/agents/docs-reconciler.md:39-50` lists the surfaces it reads;
  `.claude/docs/*.md` is not among them, so the docs unit names those files
  itself.
- `docs/memory/decisions/2026-09-05-website-on-workers-static-assets.md` the
  standing site decision; nothing in it is contradicted.

**Recall.** No mempalace drawer or decisions doc covers SEO, headers or a
markdown mirror. The previous site plan
(`docs/plans/archived/2026-09-05-website/`) parked "rendering
`social-preview.png` by a task" and "vitest for `site/`"; both stay parked. The
maintainer's other site (claude-status) ships a generated `_headers` giving
hashed assets an immutable year, the same mechanism decision 8 uses.

## Assumed decisions — confirm or override at review

| #  | Decision       | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Rejected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Unit                            |
| -- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1  | Mirror route   | Every docs collection entry is also emitted at `/<entry id>.md` — `/plugins/vwf.md`, `/how-to/index.md`, `/how-to/greenfield/single-repo.md` — by an endpoint `site/src/pages/[...path].md.ts` whose `getStaticPaths` sets `params.path = entry.id`. The generated `/plugins/` section index has no source file and gets no mirror.                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `/<route>index.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | U1                              |
| 2  | Mirror shape   | The mirror is `# <title>`, a blank line, then `entry.body`. No frontmatter, no description line. (User's choice.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Re-emitted YAML frontmatter; H1 plus description blockquote                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | U1                              |
| 3  | Links          | Every relative `.md` link in a mirror and in llms-full is rewritten to an absolute `https://claude-plugins.virajp.dev/<path>.md` URL, the `#fragment` kept; the bare directory link `../plugins/` becomes `https://claude-plugins.virajp.dev/plugins/`; absolute URLs and same-page `#` anchors pass through. Resolution is against the entry's own source path, exactly as `remark-docs-links.ts` does for HTML. (User's choice.)                                                                                                                                                                                                                                                                                                                                                                 | Relative links in the mirror, absolute only in llms-full                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | U1                              |
| 4  | llms.txt shape | `/llms.txt` follows llmstxt.org: `# vwf`; a blockquote carrying the landing description (the same string decision 11's WebSite uses); one sentence pointing at `/llms-full.txt` and noting every page also exists at its `.md` URL; then one `## <section label>` per nav section in nav order, each a list of `- [<title>](https://claude-plugins.virajp.dev/<id>.md): <description>` in nav entry order. `/llms-full.txt` is every mirror in the same order, each separated by a blank line, `---`, blank line. Neither includes the landing page copy. Both endpoints return `text/plain; charset=utf-8`; the mirror returns `text/markdown; charset=utf-8`.                                                                                                                                    | Including the landing copy; a JSON index                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | U1                              |
| 5  | Alternate link | Base gains an optional `markdown?: string` prop (a site-relative path such as `/plugins/vwf.md`); when set it emits `<link rel="alternate" type="text/markdown" href={markdown} title="Markdown" />`. Docs passes `markdown={`/${id}.md`}` only when `id` is set and the entry exists (not for the generated `/plugins/` index, not for the 404). The landing has none.                                                                                                                                                                                                                                                                                                                                                                                                                            | A visible "view as markdown" link (parked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | U1, U3                          |
| 6  | Icons          | A new mise task `site:icons` (`.config/mise/tasks/site/icons`) rasterizes `site/public/brand/vwf-favicon.svg` with one-off `pnpx` runs of `sharp-cli@6` and `png-to-ico@3` from a temp directory, never touching `package.json` or `pnpm-workspace.yaml`, writing `site/public/favicon.ico` (16, 32 and 48 px layers), `site/public/apple-touch-icon.png` (180 px, rendered from a temp copy of the SVG with `rx="14"` replaced by `rx="0"` so the tile is full-bleed: iOS masks the corners itself and paints transparency black), `site/public/icon-192.png` and `site/public/icon-512.png` (as drawn, transparent corners). The outputs are committed. (User's choice.)                                                                                                                         | Build-time generation; a rasterizer dependency in the repo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | U2                              |
| 7  | Manifest       | `site/public/site.webmanifest` (the extension keeps dprint's json plugin off it): `name` and `short_name` `vwf`, `start_url` `/`, `display` `browser`, `theme_color` `#1e3f8f`, `background_color` the page background token's value read from `site/src/styles/tokens.css`, `icons` the 192 and 512 PNGs with `type: image/png` and `purpose: any`.                                                                                                                                                                                                                                                                                                                                                                                                                                               | `manifest.json`; maskable variants                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | U2                              |
| 8  | Headers        | `site/public/_headers`, two rules. `/*`: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, `Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`. `/_astro/*`: `Cache-Control: public, max-age=31536000, immutable`. No exception for `/brand/social-preview.html`: it is a render source opened locally, not a page. | CSP by `<meta http-equiv>`; nonces (no runtime)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | U2                              |
| 9  | Build shape    | `site/astro.config.ts` gains `build: { inlineStylesheets: "never" }` and `vite: { build: { assetsInlineLimit: 0 } }` so the Docs.astro script and every stylesheet are emitted as files. The Docs.astro script block stays where it is. Only if the grep gate still finds an inline module script after the build does the unit move that block, verbatim, to `site/src/scripts/docs.ts` and reference it as `<script src="../scripts/docs.ts" />` like the mermaid line.                                                                                                                                                                                                                                                                                                                          | Moving the script up front                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | U3                              |
| 10 | Meta tags      | Base adds, in this order after the existing tags: `og:image:width` `1280`, `og:image:height` `640`, `og:image:alt` `The vwf mark and wordmark on blue`, `og:locale` `en_US`, `twitter:site` `@askviraj`, `<meta name="theme-color" content="#1e3f8f">`, `<link rel="icon" href="/favicon.ico" sizes="32x32">` beside the SVG icon link, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, `<link rel="manifest" href="/site.webmanifest">`. `og:site_name` stays `vwf` and the `· vwf` title suffix stays. (User's choice on the name.)                                                                                                                                                                                                                                                | Renaming the site to claude-plugins                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | U3                              |
| 11 | JSON-LD        | Base gains an optional `jsonLd?: object                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | object[]`prop and emits one`<script type="application/ld+json">`per object, serialised with`JSON.stringify`and every`<`replaced by the escape`\u003c`, via`set:html`. The landing passes a`WebSite`(`@context``https://schema.org`,`name``vwf`,`url`the site origin with trailing slash,`description`its own description). Docs passes two objects: a`TechArticle`(`headline`the bare title,`description`,`url`the canonical,`inLanguage``en`,`isPartOf``{ "@type": "WebSite", "name": "vwf", "url": <origin> }`) and a`BreadcrumbList`mirroring the rendered crumb: position 1`Docs`→`https://claude-plugins.virajp.dev/plugins/`, position 2 the section label → the section route, position 3 the bare title → the canonical. The group level is omitted because it has no URL. On the generated`/plugins/` index the list ends at position 2. The 404 page emits no JSON-LD. | A group crumb without an `item` |
| 12 | Fonts          | The six imports in Base become `@fontsource/geist-mono/latin-300.css`, `/latin-400.css`, `/latin-500.css`, `@fontsource/schibsted-grotesk/latin-400.css`, `/latin-500.css`, `/latin-700.css`. Weight 300 stays: `Footer.astro:51` uses it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Dropping a weight; keeping `latin-ext`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | U3                              |
| 13 | Pre-commit     | `.config/pre-commit-config.yaml:132`: the linter hook's exclude segment `^site/public/brand/` becomes `^site/public/`, and the comment above it names the new icons, manifest and `_headers` as the reason.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Per-file excludes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | U2                              |
| 14 | Gate delta     | `site/scripts/check-links.ts` gains a second pass after the HTML pass: (a) every `dist/**/*.md`, `dist/llms.txt` and `dist/llms-full.txt` is read and every `https://claude-plugins.virajp.dev/<path>` URL in it must resolve through the existing `fileFor()` (a `#fragment` on a `.md` target is ignored, on an `.html` target it is checked as today); (b) every HTML page under `dist/` other than `index.html`, `404.html` and `brand/social-preview.html` must carry exactly one `<link rel="alternate" type="text/markdown" href="…">` whose target exists, except `plugins/index.html`, which must carry none. The summary line grows to report the markdown counts. (User's choice.)                                                                                                      | Leaving the mirror unvalidated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | U4                              |
| 15 | Ordering       | Wave 1: U1 and U2 (disjoint: `site/src/{lib,pages}` new files versus `site/public/`, a mise task and pre-commit). Wave 2: U3 and U4 (layouts, landing, astro.config versus `scripts/check-links.ts`); U4 sits in wave 2 because its alternate-link check needs U3's head. Wave 3: U5 docs. Wave 4: U6 gates and bump.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | U4 in wave 1 (would fail the wave gate)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | all                             |
| 16 | Model          | Every unit inherits the session's model.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | all                             |

## New dependencies

None in the repo. `sharp-cli@6` and `png-to-ico@3` run once through `pnpx` from
a temp directory inside U2's `site:icons` task and are never added to any
`package.json` or to `pnpm-workspace.yaml`. Decision 12 of the previous site
plan (no `sharp` build) stands.

## Units

| Id | Wave | Unit file                                                    | Owns                                                                                                                                                                                                                                             | Depends on | Status  | Commit |
| -- | ---- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------- | ------ |
| U1 | 1    | [01-markdown-mirror.md](01-markdown-mirror.md)               | `site/src/lib/markdown.ts`, `site/src/pages/[...path].md.ts`, `site/src/pages/llms.txt.ts`, `site/src/pages/llms-full.txt.ts`                                                                                                                    | —          | green   |        |
| U2 | 1    | [02-icons-manifest-headers.md](02-icons-manifest-headers.md) | `.config/mise/tasks/site/icons`, `site/public/favicon.ico`, `site/public/apple-touch-icon.png`, `site/public/icon-192.png`, `site/public/icon-512.png`, `site/public/site.webmanifest`, `site/public/_headers`, `.config/pre-commit-config.yaml` | —          | green   |        |
| U3 | 2    | [03-head-and-build-shape.md](03-head-and-build-shape.md)     | `site/src/layouts/Base.astro`, `site/src/layouts/Docs.astro`, `site/src/pages/index.astro`, `site/astro.config.ts`, and only under decision 9's fallback `site/src/scripts/docs.ts`                                                              | U1         | pending |        |
| U4 | 2    | [04-check-links.md](04-check-links.md)                       | `site/scripts/check-links.ts`                                                                                                                                                                                                                    | U1         | pending |        |
| U5 | 3    | [05-docs.md](05-docs.md)                                     | `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/repo-shape.md`, `.claude/docs/ci-and-releases.md`, `site/src/content/docs/**`, `.claude/skills/*-plugin/**`, `docs/memory/decisions/**`                                                | all        | pending |        |
| U6 | 4    | [06-gates-and-bump.md](06-gates-and-bump.md)                 | `site/package.json`, `plugins/*/.claude-plugin/plugin.json`, generated files                                                                                                                                                                     | U5         | pending |        |

Status is one of `pending`, `running`, `green`, `failed`, `unresolved`,
`skipped`.

## Shared-file rule

| File                                                                                      | Why it collides                                                       | Owner                      |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------- |
| `site/package.json`                                                                       | the version bump                                                      | gates-and-bump unit only   |
| `plugins/*/.claude-plugin/plugin.json`                                                    | several units bumping one version is a lost update                    | gates-and-bump unit only   |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                 | generated; regenerating mid-wave races                                | gates-and-bump unit only   |
| `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `site/src/content/docs/**`, `.claude/docs/**` | n units editing one doc                                               | docs unit only             |
| `site/src/layouts/Base.astro`                                                             | U1's alternate link and U3's tags both land in the head               | U3 only; U1 never opens it |
| `site/src/layouts/Docs.astro`                                                             | the `markdown` prop and the JSON-LD both pass through the docs layout | U3 only                    |
| `site/astro.config.ts`                                                                    | the build-shape keys                                                  | U3 only                    |
| `site/public/robots.txt`                                                                  | unchanged by this plan                                                | nobody                     |

## Waves

- **Wave 1 — U1, U2.** U1 writes four new files under `site/src/lib` and
  `site/src/pages`; U2 writes under `site/public/`, one new mise task and one
  pre-commit line. Disjoint. The wave gate's `site:check` proves the endpoints
  build and that `public/` passes through to `dist/`; check-links is still the
  HTML-only version, so it passes.
- **Wave 2 — U3, U4.** U3 edits the two layouts, the landing and the Astro
  config; U4 edits `site/scripts/check-links.ts`. Disjoint. The wave gate now
  runs U4's extended checker against U3's head. The orchestrator's kept gate
  (CSP proof) runs after this wave.
- **Wave 3 — U5.** Docs alone.
- **Wave 4 — U6.** The bump and the full gate.

## Wave gate

`mise run plugins:check`, `mise run plugins:marketplace --check`,
`mise run plugins:inventory --check`, `pnpm vitest run`,
`pnpm exec tsc --noEmit -p installer` and `-p scripts`,
`mise run plugins:npm-normalize-test`, `mise run site:check`, plus the wave
review, plus every report read for `UNRESOLVED:`. This plan adds, from wave 2
on:

- **Inline-script grep.**
  `grep -rlE '<script type="module">' site/dist
  --include='*.html'` must
  return nothing, and `grep -rl '<style' site/dist
  --include='*.html'` must
  return only `brand/social-preview.html`.
- **W3C validator.** `site/dist/index.html` and
  `site/dist/plugins/vwf/index.html` posted to
  `https://validator.w3.org/nu/?out=json`
  (`Content-Type: text/html;
  charset=utf-8`, a `User-Agent` header set) must
  return zero messages, the audit's baseline.
- **Mirror spot check.** `site/dist/plugins/vwf.md` starts with `#` and contains
  no `](./` or `](../`; `site/dist/llms.txt` starts with `# vwf`;
  `site/dist/llms-full.txt` contains every `# <title>` once.
- **Headers pass-through.** `site/dist/_headers`, `site/dist/site.webmanifest`,
  `site/dist/favicon.ico`, `site/dist/apple-touch-icon.png`,
  `site/dist/icon-192.png` and `site/dist/icon-512.png` exist after
  `site:build`.

## Gates the orchestrator keeps

**CSP proof, after wave 2.** From `site/`, start
`pnpm exec wrangler dev
--port 8788` in the background (it serves `dist/` per
`wrangler.jsonc`).

1. `curl -sI http://localhost:8788/plugins/vwf/` must show
   `content-security-policy:` with the decision 8 value and
   `strict-transport-security:`. If `wrangler dev` does not emit them, the
   browser half below runs against a temp copy of `site/dist` in which every
   HTML file has `<meta http-equiv="Content-Security-Policy" content="…">`
   (decision 8's value minus `frame-ancestors` and `upgrade-insecure-requests`,
   which a meta tag cannot carry) injected after `<head>`, served by
   `pnpm exec wrangler dev --assets <copy>`; the `curl` finding is recorded as a
   GAP, not a block, because the deployed headers are Cloudflare's to apply.
2. Headless Brave
   (`$HOME/Applications/Brave Browser.app/Contents/MacOS/Brave
   Browser`,
   invoked through a `/tmp` wrapper script because the path carries a space)
   with
   `--headless=new --disable-gpu --enable-logging=stderr --v=0
   --virtual-time-budget=60000 --dump-dom`
   against `http://localhost:8788/how-to/greenfield/single-repo/` (a mermaid
   page) must produce a DOM containing `<svg` inside the article and a stderr
   log containing no line matching `Content Security Policy` or `Refused to`.
3. The same against `http://localhost:8788/plugins/vwf/` with a Pagefind query
   driven by `--run-all-compositor-stages-before-draw` is not scriptable
   headlessly; instead the proof is the log: load the page, and the stderr log
   must contain no `Refused to` line while
   `curl -s
   http://localhost:8788/pagefind/pagefind-entry.json` returns JSON
   (the index exists) and the DOM dump contains `<pagefind-modal`.
4. `curl -s -o /dev/null -w '%{http_code} %{content_type}'` for
   `/plugins/vwf.md` (`200 text/markdown`), `/llms.txt` (`200 text/plain`),
   `/favicon.ico` (`200 image/x-icon` or `image/vnd.microsoft.icon`),
   `/site.webmanifest` (`200`, an `application/manifest+json` or
   `application/
   json` type), `/apple-touch-icon.png` (`200 image/png`).

Pass is all four. A failure in 2 or 3 blocks the run at wave 2 with the log
excerpt in the run log.

**Icon eyeball, after wave 1.** The orchestrator reads
`site/public/apple-touch-icon.png` and `site/public/icon-512.png` with the Read
tool: the touch icon must be a full-bleed blue square with the white mark, the
512 icon the rounded tile. A wrong render is a U2 failure.

## Unit contract

Every unit prompt carries, in order: its ruling quoted from this file, its owned
paths plus "touch nothing outside this list", the facts section, the shared-file
rule, and the return block below. A unit never bumps a version, never runs a
generator, never edits a doc, never adds a dependency this file does not list,
never commits.

A unit returns exactly this block and nothing else — no file contents, no diff:

    CHANGED: <path> — <one line>            (one per file)
    DECIDED: <what> — <why>                 (choices made inside scope, or none)
    DOCS FALSIFIED: <path> — <passage>      (reported, never edited; or none)
    GAP: <what the plan left unspecified and the assumption taken>   (or none)
    UNRESOLVED: <the ruling needed>         (or none)

A `GAP:` is a hole in the plan the unit could proceed past on a stated
assumption; it is recorded and the run continues. An `UNRESOLVED:` is a ruling
the unit could not proceed without; it blocks the unit and its dependents.

## Out of scope

- **The Cloudflare-managed robots.txt.** The live `/robots.txt` is prefixed by
  Cloudflare with a Content-Signal block and `Disallow: /` for ClaudeBot,
  GPTBot, CCBot, Google-Extended, Applebot-Extended, Bytespider, Amazonbot and
  meta-externalagent. That is a zone setting (AI Crawl Control / managed
  robots.txt) the user flips in the dashboard; `site/public/robots.txt` is
  already correct and does not change.
- **Search Console and Bing Webmaster verification.** The user's accounts.
- **`/plugins/mempalace/` and `/plugins/karpathy-guidelines/`.** They document
  layers vendored into vwf and `vwf.md` links to them eight times; they stay as
  they are, by the user's choice.
- **Sitemap `lastmod`.** Not asked for.
- **Render-blocking CSS beyond the subset trim.** Preloading fonts or splitting
  `Base.*.css` further is polish the audit did not need.
- **Rewriting readme prose.** Only one sentence in "Other tools" (decision in
  U5) changes.
- **Plugin and installer changes.** No file under `plugins/` or `installer/src`
  changes; no `target-verifier` run is needed.
- **Cutting `site-v1.1.0`.** The user's, after the `main` merge, per
  `CLAUDE.md`. Post-landing checklist: on `main`, `mise run site:release`; watch
  the `site.yml` run; `gh release create site-v1.1.0` in the note format; then
  `curl -sI https://claude-plugins.virajp.dev/` to confirm the headers, open
  `https://claude-plugins.virajp.dev/llms.txt`, and re-run the Lighthouse and
  W3C checks against the live site.

## Parked

- **A visible "view as markdown" link** on docs pages, beside the breadcrumb or
  in the footer, once the mirror has been live for a while.
- **`site:icons --check`**, a freshness mode that re-renders into a temp
  directory and diffs against `site/public/`, so a changed SVG cannot ship stale
  icons; would join `site:check`.
- **The `.gitignore:45-46` comment** saying `site-v*` tags deploy from a fresh
  build: `site.yml` deploys the `build` job's artifact instead. A one-line
  comment fix for a later docs sweep.
- **Everything the previous site plan parked**: PR preview deployments,
  materialising `site/` through stackgen's Astro bundle, a `site` mempalace
  room, rendering `social-preview.png` by a task, `vitest` for `site/`.

## Run log

<written by execute-plan; empty at approval>

| Wave | Unit      | Model   | Round | Outcome           | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Commit |
| ---- | --------- | ------- | ----- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0    | preflight | —       | 1     | green             | plugins:check, marketplace --check, inventory --check, vitest (256 passed), tsc installer+scripts, npm-normalize-test, site:check — all green                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | —      |
| 1    | U1        | inherit | 1     | green             | 4 new files. DECIDED: orderedEntries reuses nav.ts's flatten(); llms-full pointer sentence built from site.origin; mirrorOf trims trailing blanks to one newline. DOCS FALSIFIED: site/CLAUDE.md:20-31 tree table + check-links row. GAP: unit file's verification said 20 docs files and a raw `grep -c '^# '` — there are 19, and code fences carry `#` lines; verified instead each of the 19 frontmatter titles appears exactly once as a `# <title>` line. site:check green, 19 mirrors, no plugins/index.md mirror, all mirror URLs resolve                                                                                                                                                                                                                                                                                                                                                                                       |        |
| 1    | U2        | inherit | 1     | green             | 8 files. DECIDED: the ICO is built through png-to-ico's library entry, not its CLI (the bin always appends an upscaled 256 px layer); package installed into a discarded temp dir. sharp-cli needs `--output`, so each size is staged as `<stem>.svg` and `--density 1200` makes every size a downscale. DOCS FALSIFIED: site/CLAUDE.md:32 (`public/brand/` row), site/CLAUDE.md:66-70 (tasks table lacks site:icons), .claude/docs/repo-shape.md:188-196 (site:\* family lacks site:icons). GAP: pnpm-lock.yaml drift left untouched — it was the orchestrator's worktree `setup:pnpm:install`, not the unit's; orchestrator restored it. GAP: pre-commit was run `--config .config/pre-commit-config.yaml` and scoped `--files` rather than `--all-files`, since U1 was writing concurrently; all hooks passed. site:icons exits 0, `file` reports 3 icons (16/32/48), site:check green, `wrangler deploy --dry-run` reads 225 assets |        |
| 1    | gate      | —       | 1     | green             | Icon eyeball: apple-touch-icon.png reads as a full-bleed blue square with the white mark; icon-512.png as the rounded tile. Both correct                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —      |
| 1    | R1        | inherit | 1     | findings(4)       | CONTRACT clean. RULINGS not clean — U2 departed from decision 6 (png-to-ico via a temp `pnpm add` + library call, not a `pnpx` run), reported as DECIDED, constraint held, output correct. Findings: CLAUDE.md:153 [U2] site task family omits `site:icons`, unreported; llms-full.txt.ts:16 [U1] join separator constant differs from the unit file's literal though the emitted output matches decision 4 exactly; site.webmanifest:11 [U2] icons carry a `sizes` field decision 7 did not name. Decisions 1,2,3,4,7,8,13 verified clean, CSP and Permissions-Policy byte for byte, `background_color` `#15161a` traced to `--ink`                                                                                                                                                                                                                                                                                                    | —      |
| 1    | U1        | inherit | 2     | green (no change) | llms-full.txt.ts:16 needed no tree change — R1 itself verified the emitted output matches decision 4 (blank, `---`, blank); the unit file's constant was wrong, not the code. Recorded as the correction U1 should have returned as DECIDED                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |        |
| 1    | U2        | inherit | 2     | green             | Decision 6 departure demonstrated, not asserted: the literal `pnpx png-to-ico@3 <16> <32> <48>` exits 0 but writes **4 layers (48/32/16/256)** — the package's `bin/cli.js` calls `pngToIco(argv._[0])`, dropping every argument after the first and upscaling to 256; `pnpm dlx --package=png-to-ico@3 node -e` fails `ERR_MODULE_NOT_FOUND`. The library entry's array branch is the only route to the ruling's 16/32/48. Mechanism kept, departure made legible in a call-site comment. `sizes` kept in the manifest — spec-optional, but it is how a browser reads decision 7's 192/512 pair for installability; orchestrator did not overrule. Adds `CLAUDE.md:153` to DOCS FALSIFIED. `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` all verified unmodified                                                                                                                                                             |        |
| 1    | R1        | inherit | 2     | findings(4)       | CONTRACT clean, RULINGS clean — the decision 6 departure is documented at `.config/mise/tasks/site/icons:42-50`. Count flat at 4, so the convergence guard stops the loop. Three findings (`site/CLAUDE.md:32`, `site/CLAUDE.md:66`, `.claude/docs/repo-shape.md:188`) are reviewer error — U2 *did* report all three as DOCS FALSIFIED in round 2; they carry to the docs unit either way. The fourth is real: `.config/pre-commit-config.yaml:129`'s new comment called `_headers` "served verbatim", but Workers parses it and never serves it. Verified independently by R1: ICO exactly 16/32/48, PNGs 512/192/180 with alpha, `_headers` and `site.webmanifest` match decisions 8 and 7 verbatim, 19 source docs → 19 mirrors, zero relative links survive, dprint clean                                                                                                                                                          | —      |
| 1    | U2        | inherit | 3     | green             | Mechanical fix, no ruling needed: corrected the `.config/pre-commit-config.yaml` comment's claim about `_headers` being served                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |        |

## Launch

Run in a fresh session:

/execute-plan docs/plans/2026-09-05-site-seo-and-markdown
