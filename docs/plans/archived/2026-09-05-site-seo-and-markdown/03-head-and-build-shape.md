# U3 — The head tags, JSON-LD, fonts, the alternate link and the build shape

- **Wave:** 2
- **Depends on:** U1 (imports `markdownPathFor` from `site/src/lib/markdown.ts`)
- **Owns:** `site/src/layouts/Base.astro`, `site/src/layouts/Docs.astro`,
  `site/src/pages/index.astro`, `site/astro.config.ts`; and only under decision
  9's fallback, `site/src/scripts/docs.ts` (new). Touch nothing outside this
  list.
- **Model:** inherit
- **Read first:** every owned file top to bottom; `site/src/lib/markdown.ts`
  (U1's exports); `site/src/nav.ts` (section shape); `site/src/lib/routes.ts`;
  `site/src/components/Footer.astro:51` (why weight 300 stays).
- **Lazy-load:** Astro's configuration reference through Context7
  (`resolve-library-id` "Astro" → `query-docs` "build.inlineStylesheets and vite
  build assetsInlineLimit"), `site/dist/**/*.html` after a build for the grep
  gate, schema.org `TechArticle` and `BreadcrumbList` field names if unsure.

## Ruling

Decision 5, U3's half: "Base gains an optional `markdown?: string` prop (a
site-relative path such as `/plugins/vwf.md`); when set it emits
`<link rel="alternate" type="text/markdown" href={markdown} title="Markdown" />`.
Docs passes `markdown={`/${id}.md`}` only when `id` is set and the entry exists
(not for the generated `/plugins/` index, not for the 404). The landing has
none."

Decision 9: "`site/astro.config.ts` gains
`build: { inlineStylesheets:
"never" }` and
`vite: { build: { assetsInlineLimit: 0 } }` so the Docs.astro script and every
stylesheet are emitted as files. The Docs.astro script block stays where it is.
Only if the grep gate still finds an inline module script after the build does
the unit move that block, verbatim, to `site/src/scripts/docs.ts` and reference
it as `<script src="../scripts/docs.ts" />` like the mermaid line."

Decision 10: "Base adds, in this order after the existing tags: `og:image:width`
`1280`, `og:image:height` `640`, `og:image:alt`
`The vwf mark
and wordmark on blue`, `og:locale` `en_US`, `twitter:site`
`@askviraj`, `<meta name="theme-color" content="#1e3f8f">`,
`<link rel="icon" href="/favicon.ico" sizes="32x32">` beside the SVG icon link,
`<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
`<link rel="manifest" href="/site.webmanifest">`. `og:site_name` stays `vwf` and
the `· vwf` title suffix stays. (User's choice on the name.)"

Decision 11: "Base gains an optional `jsonLd?: object | object[]` prop and emits
one `<script type="application/ld+json">` per object, serialised with
`JSON.stringify` and every `<` replaced by the escape `\u003c`, via `set:html`.
The landing passes a `WebSite` (`@context` `https://schema.org`, `name` `vwf`,
`url` the site origin with trailing slash, `description` its own description).
Docs passes two objects: a `TechArticle` (`headline` the bare title,
`description`, `url` the canonical, `inLanguage` `en`, `isPartOf`
`{ "@type": "WebSite", "name": "vwf", "url": <origin> }`) and a `BreadcrumbList`
mirroring the rendered crumb: position 1 `Docs` →
`https://claude-plugins.virajp.dev/plugins/`, position 2 the section label → the
section route, position 3 the bare title → the canonical. The group level is
omitted because it has no URL. On the generated `/plugins/` index the list ends
at position 2. The 404 page emits no JSON-LD."

Decision 12: "The six imports in Base become
`@fontsource/geist-mono/latin-300.css`, `/latin-400.css`, `/latin-500.css`,
`@fontsource/schibsted-grotesk/latin-400.css`, `/latin-500.css`,
`/latin-700.css`. Weight 300 stays: `Footer.astro:51` uses it."

## Edits

1. **`site/astro.config.ts`** — add, with a two-line comment each in the file's
   existing voice: `build: { inlineStylesheets: "never" }` (the CSP's
   `style-src 'self'` needs every stylesheet as a file) and
   `vite: { build: { assetsInlineLimit: 0 } }` (the hoisted Docs script must be
   a file for `script-src 'self'`). Nothing else changes.
2. **`site/src/layouts/Base.astro`**
   - Imports `:2-7` → the six `latin-<weight>.css` paths of decision 12.
   - Props: add `markdown?: string` and `jsonLd?: object | object[]`;
     destructure with defaults.
   - Head, after the existing `twitter:image` line, the decision 10 tags in
     order; the `/favicon.ico` link goes directly after the existing SVG icon
     link at `:31`, the apple-touch-icon and manifest links after it.
   - Add
     `{markdown && <link rel="alternate" type="text/markdown" href={markdown} title="Markdown" />}`
     after the sitemap link.
   - JSON-LD: normalise `jsonLd` to an array; for each object render
     `<script type="application/ld+json" set:html={JSON.stringify(obj).replace(/</g, "\\u003c")} />`.
     Astro treats `<script>` with `set:html` as raw; if Astro tries to bundle
     it, add `is:inline`.
   - Keep the file's comment style; expand the top comment by one sentence
     naming the two new props.
3. **`site/src/layouts/Docs.astro`**
   - Import `markdownPathFor` from `../lib/markdown.ts`.
   - Compute `const markdown = here?.entry ? markdownPathFor(id!) : undefined;`
     (the generated `/plugins/` index has `here` with no `entry`; the 404 has no
     `id`). Pass `markdown={markdown}` to Base.
   - Compute the decision 11 objects only when `id` is set: the `TechArticle`
     with `headline: title`,
     `url: new URL(Astro.url.pathname, Astro.site).href`, and the
     `BreadcrumbList` from `section` and `title`; when `isSectionRoot`, the list
     has two items. Pass `jsonLd={[article, crumbs]}`; pass nothing when `id` is
     unset. Position 1's URL is the literal `/plugins/` route the crumb at
     `:104` links, made absolute with `Astro.site`; position 2 is
     `section.route` made absolute; position 3 is the canonical.
   - The script block at `:146-176` stays. After the first build, if the grep
     gate below still reports an inline module script, move the block's body
     verbatim into `site/src/scripts/docs.ts` (a plain module, top-level code as
     it is, with a two-line header comment like `mermaid.ts`'s) and replace the
     block with `<script src="../scripts/docs.ts" />`. Report that as
     `DECIDED:`.
4. **`site/src/pages/index.astro`** — pass
   `jsonLd={{ "@context":
   "https://schema.org", "@type": "WebSite", name: "vwf", url: Astro.site!.href,
   description: <the existing description string, by reference to the same
   constant if one exists, else the literal> }}`
   to Base. No other change; no `markdown` prop.

## Verification

- `mise run site:check` green (this now includes U4's extended checker in the
  same wave; if U4 is not yet merged in the worktree when you run it, the HTML
  pass alone must be green).
- `grep -rlE '<script type="module">' site/dist --include='*.html'` returns
  nothing.
- `grep -rl '<style' site/dist --include='*.html'` returns only
  `site/dist/brand/social-preview.html`.
- `grep -c 'application/ld+json' site/dist/index.html` is 1;
  `site/dist/plugins/vwf/index.html` is 2; `site/dist/plugins/index.html` is 2
  with a two-item breadcrumb; `site/dist/404.html` is 0.
- `grep -c 'rel="alternate" type="text/markdown"' site/dist/plugins/vwf/index.html`
  is 1 with `href="/plugins/vwf.md"`; `site/dist/index.html`,
  `site/dist/404.html` and `site/dist/plugins/index.html` have 0.
- `grep -o 'twitter:site" content="[^"]*"' site/dist/index.html` shows
  `@askviraj`; `og:image:width`, `og:image:height`, `og:image:alt`, `og:locale`,
  `theme-color`, `rel="manifest"`, `rel="apple-touch-icon"` and
  `href="/favicon.ico"` each appear once in `site/dist/index.html`.
- `ls site/dist/_astro/*.woff2 | wc -l` is 12 (six faces, latin only), down from
  36; no file name contains `cyrillic`, `latin-ext`, `symbols2` or `vietnamese`.
- Every JSON-LD block parses: extract each with a small `node -e` script and
  `JSON.parse` it.
- W3C: post `site/dist/index.html` and `site/dist/plugins/vwf/index.html` to
  `https://validator.w3.org/nu/?out=json` with
  `Content-Type: text/html;
  charset=utf-8` and a `User-Agent`; zero messages
  each.

## Guardrails

- Do not touch `site/src/components/**`, `site/src/styles/**`,
  `site/src/nav.ts`, `site/src/lib/**`, `site/src/pages/[...slug].astro`,
  `site/src/pages/plugins/index.astro` or `site/src/pages/404.astro`.
- `**/*.astro` is dprint-formatted through the markup plugin; run
  `pnpm exec dprint fmt` on the edited files. No em-dashes in any string you add
  to a `.astro` file (site rule).
- Do not change the `· vwf` title suffix, `og:site_name`, or any existing tag
  value.
- Do not add `sharp`, `astro:assets` or any integration.
- `cat` is aliased to `bat` on this machine: use Read and Edit, not shell
  redirection, for file changes.

## Commit

`feat(site): complete the card tags, add JSON-LD and the markdown alternate, trim fonts to latin, externalise scripts and styles`
— written by the orchestrator after the wave gate, not by the unit.
