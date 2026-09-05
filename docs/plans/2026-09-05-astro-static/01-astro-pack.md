# U1 — The `framework/astro` pack, carrying both output modes

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/stacks/framework/astro/**` — everything under it
  is new. Touch nothing outside this list.
- **Model:** inherit
- **Read first:** `plugins/stackgen/stacks/framework/effect/**` top to bottom —
  the only framework pack, and the model for every file here: `pack.yaml`
  fields, `conventions.md` in the "layers on top of the language baseline"
  voice, the paths-scoped `user-invocable: false` skill, one reference per
  topic; `plugins/stackgen/assets/kinds.md:49-135` (the `language-bundle` bar,
  topic 2, and the framework ruling at `:120-135` — selection-neutral,
  usage-opinionated, cited, dependencies get no reference, one seam per
  framework); `plugins/stackgen/assets/pack-format.md` for the `pack.yaml`
  fields; `plugins/stackgen/stacks/language/typescript/conventions.md` so the
  seam with the baseline is stated once, not restated.
- **Lazy-load:** `site/astro.config.ts`, `site/package.json` and
  `.config/mise/tasks/site/{build,dev,check}` in this repo — the maintainer's
  proven static specimen, read-only, for the four facts D9 names and the
  build/pagefind shape. Cite facts and reasons; never the repo name, the domain,
  or a path.
  `plugins/stackgen/stacks/bundles/typescript-astro-
  react.md:19-58` for what
  the SSR bundle already decides, so the pack's server-output doctrine agrees
  with it rather than contradicting it.

## Ruling

D2: "Ship a real framework/astro pack": the second framework pack in the tree,
redeeming `framework/astro@generated`.

D3: "One pack, both modes, two bundles": the pack's doctrine covers
`output:
'static'` and `output: 'server'` + adapter and says when each is the
answer.

D5: "Framework pack conventions, as a named fact": `framework/astro`'s
`conventions.md` and its Framework-doctrine reference state, under a fixed
heading, that the build output is `./dist` (Astro's `outDir` default) and a
deploy pack may rely on it; the Workers pack's `./dist` cites that heading.

D8 *(assumed)*: `category: meta-framework`; the skill is `user-invocable:
false`
and paths-scoped to `**/*.astro`, `**/astro.config.*` and `**/src/content/**`.

D9 *(assumed)*: this repo's `site/` is the cited static specimen for the four
config facts.

D13 *(assumed)*: six references — `framework-doctrine.md`, `static-output.md`,
`server-output.md`, `content-and-routing.md`, `build-output.md`, `testing.md`.

## Edits

1. **`pack.yaml`** — `name: Astro`; a `summary` in the Effect pack's register (a
   content-first web framework that owns the build: file routes, content
   collections, islands only where interactivity demands it, and one config key
   — `output` — that decides whether the build is a directory of files or a
   server); `version: 0.1.0`; `type: framework`; `category: meta-framework`;
   `kind: language-bundle`; `axis: project`; the topic-2 comment the Effect pack
   carries; `harness: n/a`.
2. **`conventions.md`** — the component's prose, copied verbatim into the
   template payload. Carries, in this order: the seam with the TypeScript
   baseline (Astro layers on it; `strict` stays; the baseline's rules apply to
   every `.ts` the site holds); **the two output modes as one decision** —
   `output: 'static'` is the default and prerenders every page with no adapter,
   `output: 'server'` renders on demand and needs an adapter, and per-route
   `prerender` flips a single page either way; when each is the answer (a
   content site with no per-request data is static; anything reading a request,
   a session or a datastore at request time is server — and a site that "needs
   one dynamic page" is static with one `prerender =
   false` route and an
   adapter, not server); **the named dist fact under a fixed heading
   `## Build output`** — the build writes `./dist` (Astro's `outDir` default)
   and a deploy pack may rely on that path; a repo that changes `outDir` has
   changed the contract and must change its deploy config with it; islands
   doctrine (zero JavaScript by default; an islands integration is added only
   where interactivity demands it, and which one is the bundle's call, not this
   pack's); the four specimen facts as reasons (D9): `site:` must be set or
   sitemap and canonicals silently degrade, `trailingSlash` is chosen to match
   the host's `html_handling`, and a CSP with no inline allowance forces
   `build.inlineStylesheets: "never"` and `vite.build.assetsInlineLimit: 0`;
   what this pack does not decide (the islands framework, the UI kit, the deploy
   target, the content of `astro.config`'s `site`).
3. **`skills/astro/SKILL.md`** — the router. Frontmatter in the Effect skill's
   exact shape: `name: astro`, `version: 0.1.0`, `category:
   development`,
   `description` (auto-applies when editing an Astro project's pages, config or
   content), `license: MIT`, `user-invocable: false`,
   `allowed-tools: Read Grep Glob Edit Write Bash`, `paths:` with the three
   globs from D8. Body: the reference table and when to read each; no doctrine
   of its own.
4. **`skills/astro/references/framework-doctrine.md`** — topic 2, the one
   artifact the bar owes: what Astro is for, the mode decision in full, the
   routing model, and the seam with the language pack. Every opinion cited in
   the ruling's precedence: detection (the specimen) → Astro's own docs
   (Context7 `/withastro/docs`) → the catalog.
5. **`references/static-output.md`** — `output: 'static'`: the build is a
   directory, no adapter, `404.html` for the host's not-found handling, sitemap
   and canonicals from `site:`, trailing-slash policy versus the host, a search
   index built over `dist/` after the build (the specimen uses pagefind; name
   the shape, not the package, unless citing it), and what a static site never
   needs (middleware at request time, an adapter, server endpoints).
6. **`references/server-output.md`** — `output: 'server'`: an adapter is
   mandatory, which adapter is the deploy bundle's call, SSR endpoints under
   `src/pages/*.ts`, per-route cache policy in middleware, `prerender = true`
   for the pages that do not need the server. Must agree with
   `typescript-astro-react.md:19-58`'s decisions; where the bundle decides more
   (Effect `AppLayer`, proxy endpoints), this reference cites the bundle rather
   than restating it.
7. **`references/content-and-routing.md`** — file routes, content collections
   and their schemas, markdown and remark/rehype plugins as build-time
   transforms, `src/` layout (`pages/`, `layouts/`, `components/`, `content/`,
   `lib/`).
8. **`references/build-output.md`** — the named dist fact, restated under the
   same `## Build output` heading as `conventions.md` so a deploy pack can cite
   either; `outDir`; what lands in `dist/` per mode (files only, or files plus
   the adapter's server entry); the rule that a search index or any post-build
   step writes **into** `dist/`, never beside it.
9. **`references/testing.md`** — Vitest as the runner; `astro check` as the type
   gate over `.astro` files; a node environment when there are no islands,
   jsdom + Testing Library when there are; the scoped include (`lib/`,
   `components/`, endpoints) and why `.astro` shells are excluded. Leave the
   coverage threshold to the repo.

## Verification

- `mise run plugins:check` exits 0 with the pack discovered (the skill count
  rises by one).
- `python3 -c "import yaml,sys; d=yaml.safe_load(open('plugins/stackgen/
  stacks/framework/astro/skills/astro/SKILL.md').read().split('---')[1]);
  assert d['user-invocable'] is False and d['paths']"`
  passes.
- `ls skills/astro/references/ | wc -l` = 6.
- `grep -n "^## Build output" conventions.md skills/astro/references/build-
  output.md`
  hits both, and `grep -n "./dist"` hits under each.
- `grep -rn "95octane\|virajp\|claude-plugins" .` inside the pack is empty.
- `mise run plugins:inventory --check` is expected to be red until the
  orchestrator regenerates; say so, do not run the generator.

## Guardrails

- Do not edit any bundle (U2's), any asset, `site/` (read-only specimen), or the
  Effect or TypeScript packs.
- Dependencies get no reference (framework ruling): no `@astrojs/react`, no
  Tailwind, no pagefind reference. Name a shape; cite a package only as a fact.
- Do not decide the islands framework, the UI kit or the deploy target.
- `plugins/**/*.md` is not dprint-formatted; match the surrounding fold width by
  hand. `cat` is aliased to `bat` — Write/Edit only. Strict-YAML frontmatter: a
  malformed one drops the skill silently.

## Commit

`feat(stackgen): add the astro framework pack — both output modes, and the build-output contract as a named fact`
— written by the orchestrator after the wave gate, not by the unit.
