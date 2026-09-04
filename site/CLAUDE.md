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
GitHub and the site read one authored tree.

## The tree

| Path                              | Is                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/docs/`               | the authored manual — `plugins/`, `how-to/`, `installer/` — the one content collection, declared in `src/content.config.ts`                                                        |
| `src/pages/index.astro`           | the hand-authored landing page, copy verbatim from the design mockup, no JS                                                                                                        |
| `src/pages/[...slug].astro`       | one route per manual page; `src/pages/plugins/index.astro` is the generated section index (the other two sections have their own `index.md`)                                       |
| `src/lib/routes.ts`               | the route rule — the tree mirrored with no `docs` prefix, trailing slash, a section's `index.md` as the section's route. Both the pages and the link plugin call it, so they agree |
| `src/lib/remark-docs-links.ts`    | the link rule — rewrites every relative `.md` (or bare directory) link to its route at build time and **fails the build** on one that leaves the collection                        |
| `src/nav.ts`                      | the sidebar model: three sections in a fixed order, entries sorted by frontmatter `order`                                                                                          |
| `src/layouts/`, `src/components/` | `Base` and `Docs` layouts; nav, Pagefind search (its Component UI modal), footer and the mark                                                                                      |
| `src/styles/`                     | `tokens.css` defines the design tokens, `global.css` consumes them                                                                                                                 |
| `src/scripts/mermaid.ts`          | client-side Mermaid, loaded only on a page whose markdown source contains a `` ```mermaid `` fence (`[...slug].astro` tests the entry body, not the rendered HTML)                 |
| `scripts/check-links.ts`          | the gate — every internal `href` and `src` in `dist/**/*.html` resolves to a built file, every `#fragment` to an `id` in its target                                                |
| `public/brand/`                   | the brand set, served verbatim at `/brand/` — the marks, the favicon and `social-preview.png` (the readme's header image)                                                          |
| `wrangler.jsonc`                  | the Workers Static Assets config; credentials never live here                                                                                                                      |

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
- **Plain `<img>` from `public/brand/`.** No `astro:assets`, no `<Image>`, so no
  `sharp` build — `pnpm-workspace.yaml` denies it explicitly.
- `pnpx`, never `npx`, in anything written here.

## Tasks

All under `.config/mise/tasks/site/`, all run from this directory:

| Task           | Does                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `site:dev`     | `astro dev`                                                                                                                                    |
| `site:build`   | `astro build`, then `pagefind --site dist` (the search index, written into `dist/pagefind/`)                                                   |
| `site:check`   | the gate: `astro check`, `site:build`, then `scripts/check-links.ts`. What `site.yml` and `site:release` run                                   |
| `site:version` | `pnpm version <level> --no-git-tag-version` in `site/`; commit `site/package.json` by hand                                                     |
| `site:release` | on `main` only: clean tree, refuses an existing tag, runs `site:check`, cuts `site-v<version>`, pushes `main` then the tag, watches `site.yml` |

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
- `**/*.astro` is dprint-formatted through the markup plugin and excluded from
  the linter and its pre-commit argument list; `site/**/*.css` has its own
  linter config block. `src/content/docs/**/*.md` is dprint-formatted like the
  rest of the repo's markdown.
