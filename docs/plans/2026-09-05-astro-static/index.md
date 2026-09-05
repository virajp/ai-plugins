---
type: repo-plan
title: Astro on the project axis — a real framework pack carrying both output
  modes, and two static bundles
requires: [ docs/plans/2026-09-05-cloudflare-workers-static ]
---

# Plan — Astro on the project axis — a real framework pack carrying both output modes, and two static bundles (2026-09-05)

## Status

**APPROVED**

APPROVED 2026-09-05 by the user, after the self-review.

## Consent

| Action                                   | Granted |
| ---------------------------------------- | ------- |
| Merge to `develop` and push on green run | yes     |
| Release `vwf`                            | none    |
| Release `stackgen`                       | none    |
| Release installer                        | none    |
| Release site                             | none    |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`. **No release is consented here**, so the final
unit runs gates only and moves no version; the new bundles reach the
maintainer's machine through the dev marketplace
(`.claude/docs/dev-marketplace.md`) until a later stackgen tag carries them.

## Goal

After this lands, the stack menu offers three project-axis bundles for platform
`site`, all pinning one real `framework/astro` pack: `typescript-astro-react`
(the existing SSR · React bundle, re-pinned from `framework/astro@generated` to
`@0.1.0`), `typescript-astro-static` (new: no islands framework, zero JavaScript
by default) and `typescript-astro-static-react` (new: static output with React
islands). The pack's doctrine covers both output modes — `output: 'static'`,
Astro's default, needing no adapter, and `output: 'server'` with an adapter —
and states when each is the answer. It states the build-output contract as a
**named fact** in its conventions: the build output is `./dist`, and a deploy
pack may rely on it — which is what the Workers Static Assets pack's
`assets.directory` cites.

**Framing.** The greenfield `/vwf:init` → `/vwf:architecture` run on the user's
website repo (Astro, static, one page, no React) found that the only
`platforms: [site]` bundle is named "Astro (SSR)", with both framework
components `@generated`. The user ruled that Astro has two modes and stackgen
must support both. The taxonomy supports a sibling bundle, not a mode — no
output-mode key exists in the bundle frontmatter, and SSR is load-bearing in
that bundle's body (the Node adapter, an Effect `AppLayer`, same-origin proxy
endpoints) — on the precedent `typescript-effect-cli` /
`typescript-parseargs-
cli` already set: two bundles, one platform, differing by
what frameworks are present.

**Not a reversal.**
`docs/memory/decisions/2026-08-17-north-star-two-
plugins.md:14-15` rules that a
closed stack menu must not force the maintainer's choices
(Effect/Hono/Astro/Refine) on users. This plan adds one cited pack beside the
generator's open entry and removes nothing; the `generate:` block still ships on
every menu answer.

**This plan stands on the Workers plan.** The static bundles name
`cloudflare-workers-static` as the deploy pairing they were built for, the dist
fact is what that pack's `./dist` cites, and the manual describes the two
together. `requires:` is set accordingly.

## Facts the survey established

**This repo.**

- stackgen will be `1.1.0` once the required plan lands; vwf `19.12.0`.
- `stacks/bundles/typescript-astro-react.md:1-16`:
  `name: TypeScript · Astro
  (SSR) · React`, `axis: project`,
  `kind: language-bundle`, `platforms:
  [site]`, components
  `language/typescript@0.1.0`, `package-manager/pnpm@
  0.1.0`,
  `toolchain-gate/tsconfig@0.1.0`, `toolchain-gate/eslint@0.1.0`,
  `framework/astro@generated`, `framework/react@generated`,
  `framework/
  effect@0.1.0`. Body (`:19-58`) decides `output: "server"` on
  `@astrojs/
  node` standalone, React islands via `@astrojs/react`,
  shadcn/Radix/Tailwind, a shared Effect `AppLayer`, server-side datastore reads
  through the common package's layers, same-origin SSR proxy endpoints,
  per-route cache middleware, OTel via Effect, Vitest + jsdom at 100 % on a
  scoped include.
- SSR there is prose, not a field: the bundle frontmatter schema
  (`assets/pack-format.md:144-152`) is `axis`, `kind`, `platforms`, `artifact`
  (deploy only), `unconditional`, `components`. No `output`/`ssg`/`static`
  vocabulary exists in `assets/` or `bundles/`.
- `stacks/framework/` contains exactly one directory, `effect/`. Every other
  `framework/*` ref in the tree is `@generated`: `astro`, `react`, `hono`,
  `temporal`, `refine`, `pulumi`.
- Every `axis: project` bundle and its platforms: `typescript-effect`
  `[packages]`; `typescript-effect-cli` `[cli]`; `typescript-parseargs-cli`
  `[cli]` (no framework); `typescript-effect-hono` `[service]`;
  `typescript-effect-temporal` `[worker]`; `typescript-hono-refine`
  `[service,
  webapp]`; `typescript-astro-react` `[site]`; `typescript-pulumi`
  `[iac]`; `dart-flutter` `[mobile, tablet, desktop, webapp]` (kind
  `app-framework`); `claude-code-plugin` `[plugin]`.
- The `language-bundle` kind (`assets/kinds.md:49-135`): composition is a
  `language` plus its `package-manager`, `framework` and `toolchain-gate`
  components; framework components are optional (topic 2 is conditional on
  detection, `:66-67`). Twelve-topic bar at `:79-113`; topic 2 is **one artifact
  per `framework` component** — a framework pack owes exactly one
  Framework-doctrine reference. The framework ruling (`:120-135`):
  selection-neutral, usage-opinionated, every opinion cited in precedence
  detection → the framework's own docs → catalog; **dependencies get no
  reference**; one seam per framework, no per-pair integration references.
- The model pack, `stacks/framework/effect/`: `pack.yaml` (`name`, `summary`,
  `version: 0.1.0`, `type: framework`, `category: meta-framework`,
  `kind:
  language-bundle`, `axis: project`, `harness: n/a`), `conventions.md`
  (prose, copied verbatim into the template payload), `skills/effect/SKILL.md`
  (frontmatter `name`, `version`, `category: development`, `description`,
  `license`, **`user-invocable: false`**, `allowed-tools`, **`paths:`** globs)
  and `skills/effect/references/{effect,effect-runtime,testing}.md`. No
  `config/` tier. Framework categories (`taxonomy.md:93`): `meta-framework` /
  `ui-library` / `cli` / `iac` / `workflow-sdk`.
- `@generated` at pin time (`pack-format.md:172-177`) is a first-class outcome:
  covered components land verbatim, uncovered ones run the generation pipeline
  on first fetch, and the lockfile records which was which.
- `platforms: [site]` is **vwf's** vocabulary
  (`plugins/vwf/assets/standard-
  flows.md:130`, "Browser-delivered content
  surface", split from `web` at format 22); a template's `platforms:` must cover
  every platform the project declares (`stack-adapter.md:182`). A project-axis
  bundle **cannot** name a deploy bundle in frontmatter — `artifact:` is
  deploy-only and the axes are pinned independently (`stack-adapter.md:87`,
  `vwf-config.md:77,371`). Body prose may name a pairing, as
  `cloudflare-zero-trust.md:26-32` does.
- The build-output ↔ `assets.directory` seam is claimed by neither bar: the
  deploy-target bar puts "what gets built, from what" on the deploy side
  (`kinds.md:876-880`) while fencing that kind off from the language's build
  commands (`:854-856`); no project-axis bundle emits a build-directory fact.
- Gates. `scripts/src/check.ts` asserts nothing on `platforms:` or on
  `@generated` refs; the only rules reaching a bundle are the retired-terms
  prose scan (`:983`), whose live traps for a site bundle are a backticked `web`
  on a line that also carries another platform token or the word "token"
  (`:1091-1095`) and the literal `stacks/project/` (`:1101`). A doctrine-only
  framework pack ships no `config/` tier and trips rule 11 nowhere.
  `scripts/src/inventory.ts:146-176` requires each bundle's `name`, `kind`,
  `axis` and a non-empty `components:`; `:78-88` rejects a `kind` no `kinds.md`
  heading defines; it counts packs by `type` (`:120-144`) and bundles by `kind`
  (`:183-200`), stores component refs verbatim (`:161-165`), and **never
  resolves a ref to a directory or checks its version** — a ref naming a version
  the pack does not declare is caught by nothing. A new pack or bundle makes
  `stacks/inventory.md` stale.
- This repo's own `site/` is the static specimen: `site/astro.config.ts` has
  `output: "static"` (`:11`), `site: "https://claude-plugins.virajp.dev"` (`:9`
  — what `@astrojs/sitemap` and canonicals derive from; without it a static site
  silently emits no sitemap), `trailingSlash: "always"` (`:13`, because
  Cloudflare's default `html_handling` redirects the bare form),
  `build.inlineStylesheets: "never"` (`:17`) and
  `vite.build.assetsInlineLimit:
  0` (`:23`) — both forced by a CSP with no
  inline allowance — `integrations: [sitemap()]` (`:27`),
  `markdown.remarkPlugins:
  [remarkDocsLinks]` (`:29-31`, a local plugin).
  `site/package.json`: `astro
  ^6.4.8`, `@astrojs/sitemap`, `@astrojs/check`,
  `pagefind`, `wrangler
  ^4.129.0`, **no React**. Tasks in
  `.config/mise/tasks/site/`: `build` = `astro build` then
  `pagefind --site dist`; `dev` = `astro dev`; `check` = `astro check` →
  `site:build` → the link checker; all `#MISE dir="{{
  config_root }}/site"`
  via `pnpm exec`.
- `plugins/**/*.md` is not dprint-formatted (match fold width by hand);
  `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `site/src/content/docs/**` are.
  `cat` is aliased to `bat`; write with Write/Edit.

**Tool facts (Context7, `/withastro/docs`, 2026-09-05).**

- `output` defaults to `'static'`: every page prerendered, a completely static
  site, no adapter needed. `'server'` renders every page on demand and needs an
  adapter integration.
- `outDir` defaults to `./dist`.
- `export const prerender = false` on a page opts that route into on-demand
  rendering while the rest stays static — and needs an adapter;
  `prerender =
  true` under `'server'` is the inverse.
- Cloudflare's own docs (the required plan's facts) treat an assets-only Worker
  as first-class for exactly this output.

## Assumed decisions — confirm or override at review

User rulings are quoted; rows marked *(assumed)* were made by the planner and
are the review surface.

| #  | Decision                       | Ruling                                                                                                                                                                                                                                                                                                    | Rejected                                                                          | Unit   |
| -- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| 1  | Shape                          | A sibling bundle per mode, not a mode field — the frontmatter has no output-mode key, SSR is load-bearing in the existing body, and `typescript-effect-cli` / `typescript-parseargs-cli` is the precedent.                                                                                                | renaming the SSR bundle; a mode key; a per-project setting                        | U2     |
| 2  | Pack                           | "Ship a real framework/astro pack": the second framework pack in the tree, redeeming `framework/astro@generated`.                                                                                                                                                                                         | keep `@generated`; fold `framework/react` in too                                  | U1, U2 |
| 3  | Modes                          | "One pack, both modes, two bundles": the pack's doctrine covers `output: 'static'` and `output: 'server'` + adapter and says when each is the answer; the SSR bundle re-pins `framework/astro@0.1.0`; both static bundles pin the same pack.                                                              | two packs; SSR bundle left on `@generated`                                        | U1, U2 |
| 4  | React                          | "Two static bundles, with and without": `typescript-astro-static` carries no islands framework; `typescript-astro-static-react` carries `framework/react@generated`.                                                                                                                                      | no React; React only                                                              | U2     |
| 5  | dist seam                      | "Framework pack conventions, as a named fact": `framework/astro`'s `conventions.md` and its Framework-doctrine reference state, under a fixed heading, that the build output is `./dist` (Astro's `outDir` default) and a deploy pack may rely on it; the Workers pack's `./dist` cites that heading.     | a `build_output:` payload field (reaches into vwf); leave it with the deploy pack | U1     |
| 6  | Slugs *(assumed)*              | `typescript-astro-static` ("TypeScript · Astro (static)") and `typescript-astro-static-react` ("TypeScript · Astro (static) · React"); `typescript-astro-react` keeps its name — "(SSR)" is accurate now a sibling exists.                                                                                | `typescript-astro-ssg`; renaming the SSR bundle                                   | U2     |
| 7  | Composition *(assumed)*        | Static: `language/typescript@0.1.0`, `package-manager/pnpm@0.1.0`, `toolchain-gate/tsconfig@0.1.0`, `toolchain-gate/eslint@0.1.0`, `framework/astro@0.1.0`. Static · React adds `framework/react@generated`. Neither carries `framework/effect` — it exists in the SSR bundle for the server `AppLayer`.  | Effect in the static bundles                                                      | U2     |
| 8  | Category and scope *(assumed)* | `category: meta-framework` (Astro owns the build, as Effect owns composition); the skill is `user-invocable: false` and paths-scoped to `**/*.astro`, `**/astro.config.*` and `**/src/content/**`.                                                                                                        | `ui-library`; model-invocable                                                     | U1     |
| 9  | Specimen *(assumed)*           | This repo's `site/` is the cited static specimen for the four config facts: `output`, `trailingSlash: "always"` and why, the CSP-forced `inlineStylesheets: "never"` + `assetsInlineLimit: 0`, and `site:` for sitemap and canonicals. Cited as facts and reasons, never as paths or the domain.          | uncited doctrine                                                                  | U1     |
| 10 | Testing *(assumed)*            | Static: Vitest, node environment, no jsdom — there are no islands to mount. Static · React: the SSR bundle's Vitest + jsdom + Testing Library for the islands. The SSR bundle's 100 %-coverage rule is **not** copied; each static bundle states its scoped include and leaves the threshold to the repo. | the 100 % rule verbatim                                                           | U2     |
| 11 | SSR body *(assumed)*           | The SSR bundle's body keeps its decisions but **cites** the pack for what Astro is and how output modes work, rather than restating them; the one-line "SSR is not a published API" ruling stays.                                                                                                         | leaving the body untouched                                                        | U2     |
| 12 | Deploy pairing *(assumed)*     | Each static bundle's body names `cloudflare-workers-static` as the deploy pairing it was built for, in the same voice `cloudflare-zero-trust.md:26-32` names its pairing, and states the artifact is a directory of files at `./dist` per the pack's named fact. Frontmatter names no deploy slug.        | naming it in frontmatter (the axes are independent)                               | U2     |
| 13 | References *(assumed)*         | `skills/astro/references/`: `framework-doctrine.md` (topic 2, the one owed artifact — both modes and the mode choice), `static-output.md`, `server-output.md`, `content-and-routing.md`, `build-output.md` (the named dist fact), `testing.md`. Six.                                                      | a single reference; per-integration references                                    | U1     |
| 14 | Release                        | "No release yet" for stackgen; "No site release." The final unit runs gates and generators and moves no version.                                                                                                                                                                                          | minor; patch                                                                      | U4     |

## New dependencies

None. Context7's `/withastro/docs` is the citation source and is already
available; the pack pins nothing — a repo's manifest carries `astro`, and the
manifest is fenced.

## Units

| Id | Wave | Unit file                                  | Owns                                                                                                                                                                                                                            | Depends on | Status  | Commit |
| -- | ---- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- | ------ |
| U1 | 1    | [01-astro-pack.md](01-astro-pack.md)       | `plugins/stackgen/stacks/framework/astro/**`                                                                                                                                                                                    | —          | pending |        |
| U2 | 1    | [02-astro-bundles.md](02-astro-bundles.md) | `plugins/stackgen/stacks/bundles/typescript-astro-react.md`, `plugins/stackgen/stacks/bundles/typescript-astro-static.md`, `plugins/stackgen/stacks/bundles/typescript-astro-static-react.md`                                   | —          | pending |        |
| U3 | 2    | [03-docs.md](03-docs.md)                   | `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`, `.claude/skills/stackgen-plugin/**`, `.claude/skills/plugin-authoring/**`, `.claude/skills/vwf-plugin/**`, `site/src/content/docs/**`, `docs/memory/decisions/*` | U1, U2     | pending |        |
| U4 | 3    | [04-gates.md](04-gates.md)                 | `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md` (generated; no version file moves)                                                                                                                    | U3         | pending |        |

Status is one of `pending`, `running`, `green`, `failed`, `unresolved`,
`skipped`.

## Shared-file rule

| File                                                                                                                                      | Why it collides                                   | Owner                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| `plugins/*/.claude-plugin/plugin.json`, `site/package.json`                                                                               | no release is consented; nothing may bump them    | nobody — untouched this plan                 |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                                                                 | generated; regenerating mid-wave races            | U4 only (see Waves for the inventory caveat) |
| `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `site/src/content/docs/**`, `.claude/docs/**`, `.claude/skills/**`, `docs/memory/decisions/*` | n units editing one doc                           | U3 only                                      |
| `plugins/stackgen/stacks/framework/astro/pack.yaml`                                                                                       | U2's refs name the version U1 declares            | U1 only; U2 reads it, never edits it         |
| `plugins/stackgen/stacks/bundles/*.md` other than the three named                                                                         | untouched — the Workers plan owns its own bundles | nobody                                       |

## Waves

- **Wave 1 — U1, U2.** Two disjoint trees: the new pack directory and three
  bundle files. U2's component refs name `framework/astro@0.1.0`, the version
  U1's `pack.yaml` declares; U2 reads that file and never edits it. As the
  previous two runs established, this repo's repo-wide pre-commit hooks may
  force wave 1 into one commit rather than two; that is acceptable and is
  recorded.
- **Wave 2 — U3.** Docs and the decision doc, from the `docs-reconciler`
  findings plus every `DOCS FALSIFIED:` line.
- **Wave 3 — U4.** Generators, full gate, `target-verifier`. No version moves.

**Inventory caveat.** This repo's pre-commit runs `plugins:inventory --check`,
and a new pack plus two new bundles make the generated inventory stale, so no
wave-1 commit can land until it is regenerated. The previous two runs resolved
this by letting the orchestrator run `plugins:inventory` at the wave-1 commit;
the same ruling applies. U4 re-runs it.

## Wave gate

`mise run plugins:marketplace --check`, `mise run plugins:inventory --check`,
`mise run plugins:check`, `mise run plugins:shellcheck`, `pnpm vitest run`,
`pnpm exec tsc --noEmit -p installer` and `-p scripts`,
`mise run plugins:npm-normalize-test`, `mise run site:check` from wave 2 on,
plus the wave review, plus every report read for `UNRESOLVED:`.

Plan-specific lines:

- `grep -c "framework/astro@generated" plugins/stackgen/stacks/bundles/*.md`
  totals **0** after wave 1; `grep -l "framework/astro@0.1.0"` over the same
  glob returns exactly the three Astro bundles.
- `grep -n "platforms" -A1 plugins/stackgen/stacks/bundles/typescript-astro-
  *.md`
  shows `- site` under all three.
- `grep -n "unconditional" plugins/stackgen/stacks/bundles/typescript-astro-
  *.md`
  is empty.
- The three Astro bundles trip neither retired-terms trap: no backticked `web`
  beside another platform token, no literal `stacks/project/`.
- `plugins/stackgen/stacks/framework/astro/skills/astro/SKILL.md` parses as
  strict YAML frontmatter with `user-invocable: false` and a non-empty `paths:`
  list.

## Gates the orchestrator keeps

Project-axis packs ship no `config/` tier, so there is no scratch
materialization. Instead, after wave 1 and before wave 2:

1. **The menu source.**
   `grep -l "^- site" plugins/stackgen/stacks/bundles/
   *.md` (or the
   equivalent YAML read) returns exactly three files, none carrying
   `unconditional:` — the menu will offer all three.
2. **Every component ref resolves.** For each `components:` line across the
   three Astro bundles, either the ref ends in `@generated` or
   `plugins/stackgen/stacks/<type>/<slug>/pack.yaml` exists **and** declares the
   named version. This is the check `inventory.ts` does not do (`:161-165`), so
   the orchestrator does it by hand; a mismatch is a wave-1 finding for U2 (a
   wrong ref) or U1 (a wrong version), not a GAP.
3. **The specimen facts are true.** The four D9 facts the pack cites grep true
   against `site/astro.config.ts`: `output: "static"`,
   `trailingSlash:
   "always"`, `inlineStylesheets: "never"`,
   `assetsInlineLimit: 0`.
4. **The dist fact is citable.**
   `grep -n "./dist" plugins/stackgen/stacks/
   framework/astro/conventions.md`
   hits a line under a fixed heading, and the same heading text appears in
   `skills/astro/references/build-output.md`.
5. `mise run plugins:check` and `mise run plugins:inventory --check` exit 0 from
   the worktree.

Pass = all five.

**`target-verifier`** runs inside U4: a hermetic install of the working tree's
dev marketplace shows `stackgen` at the version `plugin.json` carries (unchanged
by this plan), the installed tree contains `stacks/framework/astro/pack.yaml`
and all three Astro bundles, and uninstall leaves only Claude's own cache.

## Unit contract

Every unit prompt carries, in order: its ruling quoted from this file, its owned
paths plus "touch nothing outside this list", the facts section, the shared-file
rule, and the return block below. A unit never bumps a version, never runs a
generator, never edits a doc, never adds a dependency this file does not list,
never commits.

A unit returns exactly this block and nothing else — no file contents, no diff.
Keep `CHANGED:` entries to a bare path and six words: the mailbox truncates long
reports, and the orchestrator reads the file list from git.

    CHANGED: <path> — <one line>            (one per file)
    DECIDED: <what> — <why>                 (choices made inside scope, or none)
    DOCS FALSIFIED: <path> — <passage>      (reported, never edited; or none)
    GAP: <what the plan left unspecified and the assumption taken>   (or none)
    UNRESOLVED: <the ruling needed>         (or none)

A `GAP:` is a hole in the plan the unit could proceed past on a stated
assumption; it is recorded and the run continues. An `UNRESOLVED:` is a ruling
the unit could not proceed without; it blocks the unit and its dependents.

## Out of scope

- **A `framework/react` pack.** Declined at review ("fold react in too" was
  rejected); both React bundles keep `framework/react@generated`.
- **An output-mode field on bundles or a per-project setting.** The taxonomy
  supports a sibling bundle (D1).
- **A `build_output:` payload field.** The shape E3 recommended, but it changes
  the template payload vwf parses — a vwf plan, parked.
- **Any vwf file.** `platforms: [site]` is already vwf's vocabulary; nothing on
  the vwf side changes.
- **Any release.** Consent is none for every project.
- **Touching `site/`.** It is the cited specimen, read-only.
- **A scratch Astro project** (`pnpm create astro`) as an orchestrator gate —
  network, tooling and a manifest the pack must not write.

## Parked

- **`framework/react` as a real pack** — now referenced `@generated` from two
  bundles (`typescript-astro-react`, `typescript-astro-static-react`) plus
  `typescript-hono-refine`. Same shape as this plan's U1.
- **`build_output:` as a template-payload field** the framework pack declares
  and the deploy pack reads at pin time — the `harness:` shape. Needs vwf's
  `stack-adapter.md` payload contract to gain a key, so it is a vwf plan.
- **A `plugins:check` rule that resolves component refs**: every
  `<type>/<slug>@<version>` in a bundle either is `@generated` or names an
  existing pack directory declaring that version. `inventory.ts:161-165` stores
  refs verbatim today; this plan's orchestrator gate 2 does the check by hand. A
  gate delta for a later plan.
- **The five `/vwf:init` defects** from the first real run, unchanged from the
  Workers plan's Parked list: `p:` ids break on a dot in the repo name; a
  main-only repo cannot run its own merge tasks; the shipped
  `no-commit-to-branch` forbids init's own first commit; `setup:worktree` writes
  an untracked `mise.dev.lock` the merge tasks refuse; `commitScopes` names a
  registry that cannot exist yet. Plus the `cat`→`bat` heredoc corruption
  hitting a real user.

## Run log

<written by execute-plan; empty at approval>

| Wave | Unit | Model | Round | Outcome | Detail | Commit |
| ---- | ---- | ----- | ----- | ------- | ------ | ------ |

## Launch

Run in a fresh session:

/execute-plan docs/plans/2026-09-05-astro-static
