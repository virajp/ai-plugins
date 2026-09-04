---
type: repo-plan
title: The website — site/ on Astro, deployed by site-v tags
requires: []
---

# Plan — The website (2026-09-05)

## Status

**APPROVED**

APPROVED 2026-09-05 by the user, after the interview, one revision (the release
model) and the self-review.

## Consent

| Action                                   | Granted                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Merge to `develop` and push on green run | yes                                                                             |
| Release `vwf`                            | none                                                                            |
| Release `stackgen`                       | none                                                                            |
| Release installer                        | none                                                                            |
| Release site                             | 1.0.0 — first release, standalone, cut by the user with `mise run site:release` |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`. The site's first tag is the user's to cut after
the `main` merge; this plan tags nothing.

## Goal

After this lands, `https://claude-plugins.virajp.dev` serves a designed landing
page and the full user manual — the vwf and stackgen manuals, the how-to guides
and the installer reference — built from the same markdown the repo ships, so
nobody has to read the docs on GitHub. The site is a third releasable project
beside the plugins and the installer: it lives under `site/`, is versioned in
`site/package.json`, and deploys only when a `site-v<version>` tag is cut from
`main`, the same shape as `installer-v*`.

The framing: the user asked for a TypeScript static site under `site/` for
Cloudflare, designed from the Claude Design project's logo direction ("2A ·
Blueprint") with the `taste-skill`. The design phase ran interactively before
this plan: a design-system page and three option pairs were authored, a
composite was chosen, and the result sits in the Claude Design project
`bb1f0a69-4c72-4f0e-91fd-186a963b568b` ("claude-plugins (site)") as
`Site Design System.dc.html`, `Site - Landing.dc.html` and
`Site - Docs.dc.html`, with a gitignored working copy in
`docs/scratchpad/site-design/`.

**One reversal, of the request's own framing rather than of a repo decision:**
the request said Cloudflare Pages. Cloudflare's best-practices page now says new
static sites should use Workers Static Assets, and Astro's deploy guide targets
Workers; the user chose Workers Static Assets. Recorded as
`docs/memory/decisions/2026-09-05-website-on-workers-static-assets.md` by U4.

## Facts the survey established

**The moving trees.** 19 markdown files: `docs/plugins/` (4: `vwf.md` 117 KB /
1917 lines, `stackgen.md`, `mempalace.md`, `karpathy-guidelines.md`; no
`index.md`), `docs/how-to/` (`index.md` plus `greenfield/` 5, `brownfield/` 2,
`operate/` 3), `docs/installer/` (`index.md`, `usage.md`, `targets.md`,
`internals.md`). `docs/assets/` holds 8 files: `social-preview.html` (render
source), `social-preview.png`, `vwf-favicon.svg`, `vwf-mark-blue.svg`,
`vwf-mark-ink.svg`, `vwf-mark-white.svg`, `vwf-mark-small-blue.svg`,
`vwf-mark-small-white.svg`. Only `social-preview.png` is referenced anywhere
(`readme.md:2`); the marks are the site's brand set. Nothing under the trees is
generated. `docs/memory/**` and `docs/plans/**` stay where they are.

**Content shape.** No file has YAML frontmatter; every file opens with exactly
one H1 on line 1 and descends without level skips. 313 relative links: 142 into
`docs/plugins/**`, 96 into `docs/how-to/**`, 20 into `docs/installer/**`, 28
same-page anchors, 15 external. All anchors are GFM-slug-clean (zero broken,
zero duplicates, verified with github-slugger rules); ~60 cross-links target
command headings that slug by deletion (`### /vwf:architecture` →
`#vwfarchitecture`) or numbered stage headings
(`#9-vwfverify-and-the-release-freeze`). **Exactly 12 links escape the four
trees** and must become absolute GitHub URLs: `docs/plugins/vwf.md:9` and
`:1907` → `../../readme.md`; `docs/plugins/karpathy-guidelines.md:49` →
`../../readme.md#other-tools` and `:90` → `../../readme.md`;
`docs/plugins/mempalace.md:381` → `../../readme.md`;
`docs/plugins/stackgen.md:82` → `../../plugins/stackgen/stacks/inventory.md`;
`docs/installer/internals.md:4` and `:161` → `../../installer/CLAUDE.md`, `:71`
and `:159` → `../../.claude/docs/installer/receipts.md`, `:95` and `:160` →
`../../.claude/docs/installer/packaging.md`. One bare directory link:
`docs/installer/index.md:91` → `../plugins/`. Trap: `../../plugins/` means
`docs/plugins/` from `docs/how-to/x/` but repo-root `plugins/` from
`docs/plugins/stackgen.md`; the same for `../../installer/`. Never
string-rewrite those prefixes. Two mermaid fences, both in `docs/plugins/vwf.md`
(`:262-296`, `:1295-1303`), using Mermaid 11 syntax (`e1@{ animate: true }`,
`:::class`, `classDef`, `<br/>` in labels). Fence languages: `text` 63, `sh` 31,
`yaml` 2, `mermaid` 2, `json` 2, `toml` 1. No footnotes, task lists, alerts,
HTML blocks, images, reference-style links or tables wider than 5 columns.
Blockquotes as callouts in `docs/installer/internals.md:3-8` and
`docs/how-to/operate/choosing-your-stack.md`.

**Inbound references from outside the trees** (11 files, 48 lines, none of them
build machinery). Real links: `readme.md:2`
(`<img src="docs/assets/social-preview.png" width="640">`),
`readme.md:27, 29, 67, 82, 203, 208, 210, 217, 247, 261, 314, 315, 316, 317, 339`
(links into `docs/plugins/*.md`, `docs/how-to/index.md`, `docs/installer/` and
its three pages, `plugins/stackgen/stacks/inventory.md`; `:82` carries
`#caveats`). Prose naming the trees: `CLAUDE.md:7, 72, 194`;
`installer/CLAUDE.md:5, 214`; `.claude/agents/docs-reconciler.md:6, 20, 43-47`;
`.claude/skills/vwf-plugin/SKILL.md:43, 159, 161`;
`.claude/skills/stackgen-plugin/SKILL.md:41, 135`;
`.claude/skills/plugin-authoring/SKILL.md:108, 110`;
`.claude/skills/release/SKILL.md:180`; `.claude/skills/create-plan/SKILL.md:51`;
`.claude/docs/repo-shape.md:83`; `mempalace.yaml:12, 18, 83, 88, 103` (prose
only — room routing is keyword-based on path parts, `plugins`, `installer`,
`how-to`/`guides`, so `site/src/content/docs/plugins/...` still routes; an
unclaimed `site` part is walked past like `docs` is today). Tooling: only
`.config/pre-commit-config.yaml:129`, the linter hook's
`exclude: ^plugins/vwf/assets/(templates|examples)/|^docs/assets/|\.sh$` (the
comment at `:126-128` explains the HTML rewrite fights dprint's). Nothing under
`plugins/vwf/` or `plugins/stackgen/` names a docs path.

**Gates today.** `docs/**` is dprint-formatted (`dprint.json:26-45` includes
`**/*.md`, `**/*.html`, `**/*.json`, `**/*.yaml`; `:5-15` excludes only
`plugins/**/*.md`, `**/.astro/` and build dirs; markdown `textWrap: "always"` at
`:58-71`). `**/*.astro` is **not** in the includes, though the markup plugin
config at `:72-92` already carries `astro.scriptIndent` / `astro.styleIndent`.
pre-commit (`.config/pre-commit-config.yaml`): plugin hooks scoped to
`^plugins/` and `^.claude-plugin/`; `formatter` `:106-111`; `linter` `:115-131`;
`check-added-large-files` (>1 MB) `:94`; `no-commit-to-branch` on `main`
`:74-75`. Mise tasks: no task globs `docs/**`; families `code:*` (`format`,
`lint`, `sec`, `all`, …), `plugins:*` (`check`, `marketplace`, `inventory`,
`local`, `npm-normalize-test`, `release`), `i:*` (`build`, `publish`, `release`,
`test`, `version`), `setup:*`. `.github/workflows/plugins.yml` runs every step
on every push to `main`/`develop` and every PR with no path filter (`:21-25`);
`release.yml` triggers only on `push.tags: installer-v*` and `workflow_dispatch`
(`:24-28`), verifies the tag matches `package.json` and is an ancestor of `main`
(`:62-80`); its trigger surface must stay untouched
(`.claude/docs/ci-and-releases.md:118-120`). Formatting and linting are not in
CI (dprint lives in the dev mise env only).

**Workspace shape.** `pnpm-workspace.yaml:10-12` lists `installer`, `scripts`;
`allowBuilds: {esbuild: true}` (`:19-23`); `minimumReleaseAge: 600` (10 hours,
`:30`), which blocks any package version published less than 10 hours ago.
`tsconfig.base.json`: `strict`, `module: Preserve`, `moduleResolution: bundler`,
`types: ["node"]`, `noEmit: true` with `composite: true`,
`verbatimModuleSyntax`, `noUncheckedIndexedAccess`,
`allowImportingTsExtensions`; `installer/tsconfig.json` and
`scripts/tsconfig.json` extend it with `rootDir`, `outDir`, `@/*` paths.
`eslint.config.mjs` re-exports `@askviraj/linter/auto`; tuning is
`.config/linter.yaml` (`ignores` at `:7-12` lists `**/archived/**`, `bin/**`).
`vitest.config.mts` has no projects, include
`{installer,scripts}/src/**/*.test.ts`. `.gitignore` has `installer/dist/`,
`scripts/dist/`, `*.tsbuildinfo`, `bin/`, `docs/scratchpad/`,
`.dev-marketplace/` and no site entry; `.graphifyignore` lists `.claude-plugin/`
and `docs/memory/`. Root `package.json` `files: ["bin"]`, so nothing in `site/`
can reach the npm tarball. `.config/mise.toml` pins `node = latest`,
`pnpm = latest`; `MISE_ENV=ci` adds nothing but `node.gpg_verify = false`. The
installer's release tasks are the model for the site's:
`.config/mise/tasks/i/version` (`pnpm version <level> --no-git-tag-version`, no
tag) and `.config/mise/tasks/i/release` (clean tree, on `main`, fetch tags,
refuse an existing tag, `mise run i:test`, annotated tag, `--ci` stops there,
else push `main` then the tag and `gh run watch` the workflow run).

**Prior art.** No `site/`, CNAME or Pages workflow ever existed in git history.
stackgen ships a `typescript-astro-react` bundle
(`plugins/stackgen/stacks/inventory.md:99`) and a `cloud-provider/cloudflare`
pack; both are stackgen content, never used by this repo itself.
`claude-status.virajp.dev` already exists on the domain (`readme.md:142`), so
the `virajp.dev` zone is presumed on the user's Cloudflare account — confirmed
by the user at first deploy, not by this plan.

**Framework facts (Context7, 2026-09-05; every unit re-verifies before adding a
package).** Astro's current major is 6 (6.3.x); it requires Node ≥ 22.12.
Content collections use `glob({ pattern, base })` from `astro/loaders` in
`src/content.config.ts`; `base` may point anywhere, `generateId` customises ids,
`render(entry)` yields `<Content />` and `headings` for an outline. Astro 6
changed heading-id generation to **keep trailing hyphens, matching GitHub**
(`experimental.headingIdCompat` removed), so the docs' GFM slugs render
unchanged with the default pipeline. `markdown.remarkPlugins` / `rehypePlugins`
accept unified plugins. A `src/pages/404.astro` builds to `404.html`.
`@astrojs/sitemap` needs `site` set in the config. Cloudflare Workers Static
Assets: `wrangler.jsonc` with `name`, `compatibility_date`,
`assets: { directory: "./dist", not_found_handling: "404-page" }`, no Worker
script for a purely static site; custom domain via
`routes: [{ pattern: "claude-plugins.virajp.dev", custom_domain: true }]`;
deploy is `wrangler deploy`; in CI `cloudflare/wrangler-action` v4 with
`apiToken` and `accountId` (the Astro docs pin it by commit,
`ebbaa1584979971c8614a24965b4405ff95890e0`). Pagefind indexes a built directory
(`pagefind --site dist`) and ships a default UI plus a JS API.

**Design input.** Tokens (dark only): ink `#15161A` page, `#1B1D23` raised,
`#22252D` code/inputs, hairline `#2B2F39`, border `#3A3F4B`; paper `#F4F5F8`,
mist `#B9BDC9`, muted `#7D8392`; blueprint `#1E3F8F` fills, `#2A52B8` hover,
`#7AA0F2` text/links on ink (7.1:1). Type: Schibsted Grotesk for everything
read; Geist Mono only for the wordmark, commands, paths, versions and table
headers; wordmark Geist Mono 300 at +0.02em, always lowercase. Scale 56 / 40 /
32 / 22 / 17 / 14 / 13 code / 12 labels. Radius 0 everywhere; the app-icon tile
is the one rounded shape. Spacing 4px base; landing section gap 112, docs 48.
Layout 1440 max, 64px gutters; docs 280 sidebar / 800 article / 220 outline.
Devices: 24px dot grid (white 12% on ink, 26% on blueprint), dimension rule (1px
line, 12px end ticks), the construction drawing of the mark. Rules: no em-dashes
anywhere on the site; at most one small uppercase label per three sections;
hairlines organise content, never decorate; the construction drawing is the only
illustration. The composite landing is A's blue-sheet hero with the construction
drawing and B's headline and subtext, C's phases rail, C's install split, C's
bento (vwf on blueprint, stackgen on raised ink), C's 2×2 hairline caveats grid,
B's guides table of contents, C's three-column footer. The docs page is option
C: tinted sidebar with node markers for the current item, breadcrumb, article
with a left-rule heading style, titled code blocks with a copy affordance, boxed
table, callout, boxed previous/next, and an "On this page" outline. Copy is in
the mockups and is already em-dash free.

## Assumed decisions — confirm or override at review

| #  | Decision            | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Rejected                                                                    | Unit   |
| -- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| 1  | Host                | Cloudflare Workers Static Assets: `site/wrangler.jsonc` with `assets.directory: "./dist"`, `not_found_handling: "404-page"`, custom-domain route `claude-plugins.virajp.dev`, no Worker script.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Cloudflare Pages                                                            | U1     |
| 2  | Release and deploy  | The site is a third releasable project. Version in `site/package.json` (starts `1.0.0`). `mise run site:version [--minor\|--major]` bumps on `develop`, no tag. `mise run site:release [--ci]` mirrors `i:release`: clean tree, on `main`, refuses an existing tag, runs `mise run site:check`, cuts annotated `site-v<version>`, pushes `main` then the tag, watches the run. `.github/workflows/site.yml` has a `build` job on PRs and pushes to `develop`/`main` touching `site/**`, and a `deploy` job only on `push.tags: site-v*` that verifies the tag matches `site/package.json` and is an ancestor of `main`, builds, and runs `wrangler deploy`. A merge to `main` ships nothing until a tag is cut. | dashboard git integration; deploy on push to `main`; build in `plugins.yml` | U3, U4 |
| 3  | Content home        | `git mv docs/plugins docs/how-to docs/installer` → `site/src/content/docs/{plugins,how-to,installer}`; `git mv docs/assets` → `site/public/brand/` (8 files verbatim).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `site/docs/`, `site/content/`, `site/src/assets/`                           | U2     |
| 4  | URLs                | Mirror the tree with no docs prefix: `/plugins/vwf/`, `/how-to/greenfield/single-repo/`, `/installer/usage/`. `index.md` is its section's route (`/how-to/`, `/installer/`); `/plugins/` gets a generated section index listing its entries. Trailing slash, one route per file.                                                                                                                                                                                                                                                                                                                                                                                                                                | `/docs/...` prefix; designed slugs                                          | U1     |
| 5  | Link rewriting      | A remark plugin in `site/src/lib/remark-docs-links.ts` resolves every relative link (`.md` with optional `#anchor`, or a bare directory) against the source file, maps it to a route by rule 4, and **fails the build** on a link that resolves outside `site/src/content/docs/`. Absolute URLs and same-page anchors pass through.                                                                                                                                                                                                                                                                                                                                                                             | hand-editing 313 links; a slug map                                          | U1     |
| 6  | Escaping links      | The 12 links that leave the trees become absolute `https://github.com/virajp/claude-plugins/blob/main/<path>` URLs with their anchors kept (`readme.md#other-tools`). `internals.md` ships. `docs/installer/index.md:91`'s bare `../plugins/` stays a directory link and resolves to `/plugins/`.                                                                                                                                                                                                                                                                                                                                                                                                               | excluding `internals.md`; site landing as readme substitute                 | U2     |
| 7  | Frontmatter         | Every one of the 19 files gains YAML frontmatter `title` (the H1 text), `description` (one sentence, from the file's opening paragraph), `order` (integer, per the section index's curated order); the H1 line and the blank line after it are removed. Group labels and section order live in `site/src/nav.ts`: Plugins (vwf, stackgen, mempalace, karpathy-guidelines), Guides (Starting fresh, Adopting vwf, Operating), Installer (index, usage, targets, internals).                                                                                                                                                                                                                                      | derive title from H1; `slug` keys                                           | U2, U1 |
| 8  | Heading ids         | Astro 6 default (GitHub-compatible, trailing hyphens kept). No custom rehype-slug, no `headingIdCompat`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | v5-compat plugin                                                            | U1     |
| 9  | Mermaid             | Client-side, lazy: the docs page layout includes `site/src/scripts/mermaid.ts` only when the rendered HTML contains a `language-mermaid` block; it imports `mermaid` from node_modules, initialises with `theme: "dark"` and `securityLevel: "loose"` (labels use `<br/>`), and renders each block. Fences stay as-is in markdown for GitHub.                                                                                                                                                                                                                                                                                                                                                                   | rehype-mermaid (needs Playwright); committed SVGs                           | U1     |
| 10 | Search              | Pagefind CLI as a postbuild step (`pagefind --site dist`), the docs layout mounting Pagefind's UI in the nav search slot, styled through its CSS variables to the tokens. Landing excluded from the index (`data-pagefind-ignore` on the landing body).                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `astro-pagefind` integration; no search                                     | U1     |
| 11 | Fonts               | `@fontsource/geist-mono` (300, 400, 500) and `@fontsource/schibsted-grotesk` (400, 500, 700), imported in the base layout; self-hosted, no network at build, no Google Fonts `<link>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Astro fonts API google provider; Google Fonts link                          | U1     |
| 12 | Images              | Plain `<img>` from `public/brand/`; no `astro:assets`, no `<Image>`, so no `sharp` and no `allowBuilds` change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `<Image>` + sharp                                                           | U1     |
| 13 | readme              | The 15 links into the moved trees become `https://claude-plugins.virajp.dev/<route>` (with anchors, e.g. `/plugins/vwf/#caveats`); `readme.md:247` (inventory) stays an in-repo link; the header image becomes `https://claude-plugins.virajp.dev/brand/social-preview.png`. Nothing else in the readme changes.                                                                                                                                                                                                                                                                                                                                                                                                | in-repo paths; keeping the image in-repo                                    | U4     |
| 14 | Landing             | Hand-authored `site/src/pages/index.astro` from the composite mockup, copy verbatim, dark only, an explicit single-column collapse under 768px per section, CTAs "Get started" (→ `/how-to/`) and "GitHub". No JS on the landing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | derived from readme; light mode                                             | U1     |
| 15 | Local gates         | `.config/mise/tasks/site/{dev,build,check,version,release}`. `site:build` = `astro build` then `pagefind --site dist`. `site:check` = `astro check`, `site:build`, then `pnpm --filter site exec tsx scripts/check-links.ts` (every internal `href` in `dist/**/*.html` resolves to a built file, every `#fragment` to an `id` in its target). `site:check` joins the wave gate.                                                                                                                                                                                                                                                                                                                                | build in `plugins.yml`; no link checker                                     | U3, U1 |
| 16 | Formatting and lint | `**/*.astro` added to `dprint.json` includes; `site/dist/**`, `site/.astro/**` and `site/**/*.astro` added to `.config/linter.yaml` ignores; `.gitignore` gains `site/dist/` and `site/.astro/`; `.graphifyignore` gains `site/dist/`; the pre-commit linter exclude `^docs/assets/` becomes `^site/public/brand/`. Moved markdown stays dprint-formatted.                                                                                                                                                                                                                                                                                                                                                      | leaving `.astro` unformatted                                                | U3     |
| 17 | Site home           | `site/CLAUDE.md`, the installer precedent (a tree that is not shipped carries its context in place), plus a row in the three-homes table in `CLAUDE.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `.claude/skills/site/`                                                      | U4     |
| 18 | mempalace           | Prose updates only in `mempalace.yaml`; no `site` room.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | a `site` room                                                               | U4     |
| 19 | Ordering            | Wave 1 is tooling alone so `pnpm install` in wave 2 sees `site` in the workspace; wave 2 runs the scaffold and the docs move together on disjoint paths; the build is proven at the wave-2 gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | one wave; scaffold first                                                    | all    |
| 20 | tsconfig            | `site/tsconfig.json` extends `astro/tsconfigs/strict` only, not `tsconfig.base.json` (the base's `composite`+`noEmit`, `types: ["node"]` and `allowImportingTsExtensions` conflict with Astro's). `astro check` is the site's type gate; the site is **not** added to `vitest.config.mts` or the root `tsc` lines.                                                                                                                                                                                                                                                                                                                                                                                              | extending the base                                                          | U1     |
| 21 | Release note        | Every `site-v<version>` tag carries a GitHub Release in the release skill's note format, like `installer-v*`. In-sync releases cut plugin, installer and site tags from one `main` merge in that order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | tags without notes                                                          | U4     |
| 22 | Design source       | Units read the design from `docs/scratchpad/site-design/` on this machine (`Site - Landing.dc.html`, `Site - Docs.dc.html`, `Site Design System.dc.html`, `shots/*.png`); if absent, fetch the same three files from the Claude Design project `bb1f0a69-4c72-4f0e-91fd-186a963b568b` with `DesignSync get_file`. The `.dc.html` files are self-contained HTML: the `<helmet>` block is the head, `assets/` paths map to `/brand/`.                                                                                                                                                                                                                                                                             | copying the design into the plan folder                                     | U1     |

## New dependencies

All added by U1, in `site/package.json` only, each version checked against
Context7 and the 10-hour `minimumReleaseAge` cooldown at unit time:

- `astro` 6.x — the framework; preferred over VitePress and Next static export
  at the interview.
- `@astrojs/check` and `typescript` (dev) — `astro check`.
- `@astrojs/sitemap` — `sitemap-index.xml`; nothing existing does this.
- `pagefind` (dev) — static search index; preferred over `astro-pagefind`.
- `mermaid` — client-side diagram rendering; preferred over `rehype-mermaid`.
- `unist-util-visit` — the link-rewriting remark plugin; Astro ships remark,
  this is the one helper it does not re-export.
- `@fontsource/geist-mono`, `@fontsource/schibsted-grotesk` — self-hosted fonts;
  preferred over Astro's font providers and a Google Fonts link.
- `wrangler` (dev) — pinned locally so `wrangler.jsonc` validates with the same
  version CI deploys with.
- `tsx` (dev) — runs `scripts/check-links.ts`; preferred over compiling it.

No root `package.json` change. No `allowBuilds` change (decision 12). The
workspace entry is U3's.

## Units

| Id | Wave | Unit file                          | Owns                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Depends on | Status  | Commit |
| -- | ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------- | ------ |
| U3 | 1    | [03-tooling.md](03-tooling.md)     | `pnpm-workspace.yaml`, `.gitignore`, `.graphifyignore`, `dprint.json`, `.config/linter.yaml`, `.config/pre-commit-config.yaml`, `.config/mise/tasks/site/**`, `.github/workflows/site.yml`                                                                                                                                                                                                                                                                         | —          | pending |        |
| U1 | 2    | [01-scaffold.md](01-scaffold.md)   | `site/**` **except** `site/src/content/docs/**`, `site/public/brand/**` and `site/CLAUDE.md`; `pnpm-lock.yaml`                                                                                                                                                                                                                                                                                                                                                     | U3         | pending |        |
| U2 | 2    | [02-docs-move.md](02-docs-move.md) | `docs/plugins/**`, `docs/how-to/**`, `docs/installer/**`, `docs/assets/**` (moved away), `site/src/content/docs/**`, `site/public/brand/**` (moved to)                                                                                                                                                                                                                                                                                                             | U3         | pending |        |
| U4 | 3    | [04-docs.md](04-docs.md)           | `readme.md`, `CLAUDE.md`, `installer/CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`, `.claude/agents/docs-reconciler.md`, `.claude/skills/vwf-plugin/SKILL.md`, `.claude/skills/stackgen-plugin/SKILL.md`, `.claude/skills/plugin-authoring/SKILL.md`, `.claude/skills/release/SKILL.md`, `.claude/skills/create-plan/SKILL.md`, `.claude/skills/execute-plan/SKILL.md`, `mempalace.yaml`, `docs/memory/decisions/2026-09-05-website-on-workers-static-assets.md` | U1, U2     | pending |        |
| U5 | 4    | [05-gates.md](05-gates.md)         | `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md` (regenerated, expected unchanged)                                                                                                                                                                                                                                                                                                                                                        | U4         | pending |        |

## Shared-file rule

| File                                                                                                 | Why it collides                                                            | Owner                               |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| `plugins/*/.claude-plugin/plugin.json`                                                               | no version changes in this plan; nobody touches them                       | U5 only, and U5 leaves them alone   |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                            | generated; regenerating mid-wave races                                     | U5 only                             |
| `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`, `.claude/skills/**`, `mempalace.yaml` | n units editing one doc                                                    | U4 only                             |
| `pnpm-lock.yaml`                                                                                     | `pnpm install` rewrites it; U3 changes the workspace, U1 adds the packages | U1 (U3 must not run `pnpm install`) |
| `site/package.json`                                                                                  | U1 creates it; U3's tasks and workflow name its scripts by string only     | U1                                  |
| `site/src/content/docs/**`, `site/public/brand/**`                                                   | U2 moves them in; U1's loader and layouts read them by path only           | U2                                  |
| `site/src/nav.ts`                                                                                    | U1 writes it; U2's `order` values must agree with its group order          | U1 (U2 reads it, never edits)       |
| `.config/pre-commit-config.yaml`                                                                     | U3 re-points one exclude; nobody else                                      | U3                                  |

## Waves

- **Wave 1 — U3.** Repo tooling alone: the workspace entry, ignores, dprint,
  linter, pre-commit, the five mise tasks and `site.yml`. Nothing under `site/`
  exists yet; the tasks and workflow reference it by name. Safe alone by
  construction.
- **Wave 2 — U1, U2.** The Astro scaffold and the docs move. Disjoint by the
  shared-file rule: U1 owns `site/**` minus the content and brand trees; U2 owns
  exactly those plus the source trees under `docs/`. U1 runs `pnpm install` (the
  only lockfile writer); U2 adds no package. The build is proven at this wave's
  gate, when both halves exist.
- **Wave 3 — U4.** Docs, after the `docs-reconciler` pass over the wave 1–2
  diff, plus every `DOCS FALSIFIED:` line returned, plus the survey's inbound
  reference list, plus the release doctrine for the third tag family.
- **Wave 4 — U5.** Gates: generators (expected no-op), the full gate,
  `mise run site:check`, and the orchestrator's render check.

## Wave gate

`mise run plugins:check`, `mise run plugins:marketplace --check`,
`mise run plugins:inventory --check`, `pnpm vitest run`,
`pnpm exec tsc --noEmit -p installer` and `-p scripts`,
`mise run plugins:npm-normalize-test`, plus the wave review, plus every report
read for `UNRESOLVED:`.

**From wave 2 on, also:** `pnpm install --frozen-lockfile` succeeds at the root,
and `mise run site:check` is green (`astro check` clean, `astro build` clean
with zero link-rewrite errors, Pagefind indexes ≥ 19 pages, `check-links.ts`
reports zero broken hrefs and zero missing fragments).

**From wave 1 on, also:** `mise run code:format` reports nothing under the
plan's owned paths (dprint now includes `**/*.astro`; the moved markdown is
still in scope), and
`pre-commit run --all-files -c .config/pre-commit-config.yaml` is green.

## Gates the orchestrator keeps

- **Render check (after wave 2 and again at U5).** Render `site/dist/index.html`
  and `site/dist/plugins/vwf/index.html` with Brave headless
  (`"$HOME/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,3600 --screenshot=<png> file://…`,
  served via `pnpm --filter site exec astro preview` if `file://` breaks
  absolute paths) and read the PNGs. Pass: the landing shows, top to bottom, the
  nav, the blue-sheet hero with the construction drawing, the phases rail, the
  install split, the bento, the 2×2 caveats grid, the guides table and the
  three-column footer, matching
  `docs/scratchpad/site-design/shots/Site_-_Landing.png` in structure; the docs
  page shows the tinted sidebar with the current-item marker, breadcrumb,
  article with the prerequisites table rendered as a table, both mermaid blocks
  rendered as SVG (not raw text), and the outline. No em-dash appears in either
  screenshot's text (`grep -c '—' dist/**/*.html` is 0 outside code blocks
  quoting repo content).
- **Anchor spot-check (after wave 2).**
  `grep -c 'id="vwfarchitecture"' site/dist/plugins/vwf/index.html` is 1, and
  the how-to page that links `../../plugins/vwf.md#vwfarchitecture` now links
  `/plugins/vwf/#vwfarchitecture`.
- **Workflow shape (after wave 1).** `release.yml` is byte-identical to
  `develop`; `site.yml`'s `deploy` job has `if: github.ref_type == 'tag'` and
  the two verification steps mirroring `release.yml:62-80`.
- **Wrangler config (after wave 2).**
  `pnpm --filter site exec wrangler deploy --dry-run` parses `wrangler.jsonc`
  without error (no account needed for a dry run; if it demands auth, the pass
  condition is that the error is about auth and not about the config).

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

- **Rewriting readme prose.** Only its links and header image change (decision
  13). The readme stays the GitHub surface; the landing page is not a readme
  substitute.
- **Landing copy beyond the mockup.** The composite's copy is the copy.
- **Light mode.** Dark only, by the user's choice at the design phase.
- **`docs/memory/**` and `docs/plans/**`.** Historical records and vwf's own
  trees; they stay where `mempalace.yaml` and the plan skills expect them.
- **Plugin and installer changes.** No file under `plugins/` or `installer/src`
  changes; no version bumps; no `target-verifier` run is needed.
- **Cutting `site-v1.0.0`.** The user's, after the `main` merge, per
  `CLAUDE.md`'s rule to ask before a release task. Post-landing checklist:
  1. Add `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit, Zone: DNS edit for the
     custom domain) and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.
  2. Confirm `virajp.dev` is a zone on that account (it hosts
     `claude-status.virajp.dev` today).
  3. On `main`, `mise run site:release`; watch the `site.yml` run; then
     `gh release create site-v1.0.0` in the note format.
  4. Open `https://claude-plugins.virajp.dev/` and the readme on GitHub: the
     header image resolves only after this deploy.

## Parked

- **PR preview deployments** via `wrangler versions upload` on pull requests,
  once the first deploy exists and the token scope is known.
- **Materialising `site/` through stackgen's `typescript-astro-react` bundle**
  so the repo dogfoods its own packs; would replace U1's hand-written config
  with a pack landing and needs the bundle checked against Astro 6 first.
- **A `site` mempalace room**, if the site's own docs (`site/CLAUDE.md`) grow
  enough to deserve routing.
- **Rendering `social-preview.png` by a task** from `social-preview.html` (today
  hand-rendered; the brand set moves verbatim).
- **`vitest` for `site/`** (a unit test for `remark-docs-links.ts` and
  `check-links.ts`) — the build and the link checker cover them for now; a later
  plan can widen `vitest.config.mts`.

## Run log

| Wave | Unit | Model | Round | Outcome | Detail | Commit |
| ---- | ---- | ----- | ----- | ------- | ------ | ------ |

## Launch

Run in a fresh session:

/execute-plan docs/plans/2026-09-05-website
