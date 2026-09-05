---
type: repo-plan
title: Cloudflare Workers Static Assets — a static-hosting deploy stack for
  stackgen
requires: []
---

# Plan — Cloudflare Workers Static Assets — a static-hosting deploy stack for stackgen (2026-09-05)

## Status

**COMPLETE** — 2026-09-05. Ran in worktree
`.worktrees/2026-09-05-cloudflare-workers-static` on branch
`2026-09-05-cloudflare-workers-static`. Every unit green, in three commits:

| Commit     | Is                                                                               |
| ---------- | -------------------------------------------------------------------------------- |
| `1a30d456` | wave 1 — U1–U5, the category, the doctrine, the pack, the bundle and the checker |
| `50008365` | wave 2 — U6, the docs and the two decision docs                                  |
| `074fb92b` | wave 3 — U7, stackgen `1.1.0` and the site `1.1.3`                               |

APPROVED 2026-09-05 by the user, after the self-review.

## Consent

| Action                                   | Granted |
| ---------------------------------------- | ------- |
| Merge to `develop` and push on green run | yes     |
| Release `vwf`                            | none    |
| Release `stackgen`                       | minor   |
| Release installer                        | none    |
| Release site                             | patch   |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`. `site:release` is asked for separately; note
site `1.1.2` is bumped and merged but never released, so the `1.1.3` tag ships
both.

## Goal

After this lands, `/vwf:architecture` can pin a static-hosting deploy target for
a project on platform `site`: the stack menu offers a
`cloudflare-workers-static` bundle composing the existing
`cloud-provider/cloudflare` with a new `cloud-service/workers-static-assets`
pack. The pack ships judgment for an assets-only Worker (no `main` script), a
root `wrangler.jsonc` with marked positions for the project name and route, and
a `p/<id>/deploy` task overlay that runs `wrangler deploy`. A new
`cloud-service` category, `static-hosting`, carries the same three-topic
extension `compute` does — artifact, pipeline, health — because a deploy stack
has to say what it publishes, how it gets there and how you know it is up
whether or not a container is involved.

**Framing.** The greenfield `/vwf:init` test on the user's new website repo ran
clean; the halt came one command later, in `/vwf:architecture`'s deploy round,
where a `site` project must pin at least one deploy slug and nothing on the axis
had a directory of files as its artifact. The user ruled that Cloudflare has
many services and stackgen covers them per service, so this is one new service
pack in the shape `cloudflare-zero-trust` already established — not an extension
of that bundle, and not a `deploy-target` pack.

**This redeems a written reservation, not a blank.** Both
`stacks/bundles/cloudflare-zero-trust.md:34-39` and
`stacks/cloud-provider/cloudflare/conventions.md:5-13` state that Workers,
Pages, R2, D1, KV, Durable Objects, Queues, Images and Stream are "planned under
their own effort and are **not** offered here". Workers Static Assets leaves
that list in this plan; the rest stay on it, and Workers-with-a-script joins it
by name. A decision doc records the reversal.

Two doctrine widenings, both confirmed by the user, ride with the pack:
`wrangler.jsonc` joins the **root allowlist** established on 2026-09-05 (rather
than living under `.config/` with `--config` everywhere, the dprint precedent),
and `cloud-provider`/`cloud-service` components — absent from the composition
order until now, because no cloud pack shipped a `config/` tree — land **last**,
after `capability-provider`.

## Facts the survey established

**This repo.**

- stackgen is `1.0.0`, vwf `19.12.0`, site `1.1.2` (unreleased). `develop` is at
  `eb14138f`; `main` at `1c53a5ad` carries the same tree.
- The only Cloudflare coverage is `stacks/cloud-provider/cloudflare/` (v0.1.0,
  no `axis:`), `stacks/cloud-service/zero-trust-access/` (v0.1.0,
  `type:
  cloud-service`, `category: access`, `kind: cloud-provider`,
  `axis: deploy`, `artifact: n/a`) and
  `stacks/bundles/cloudflare-zero-trust.md`. No Workers, Pages, R2, D1, KV,
  Durable Objects, Queues, Images or Stream pack exists.
- `assets/kinds.md:827-899` defines `deploy-target` as one component standing
  alone for a target that belongs to **no** cloud; `:831-834`,
  `taxonomy.md:
  77-79` and the reviewer check at `:1019-1023` fence a cloud's
  targets out of it. A Cloudflare target is therefore `cloud-service` under
  `cloud-provider`, exactly `cloudflare-zero-trust`'s and `gcp-cloud-run`'s
  shape.
- `cloud-service` categories are a closed list at `taxonomy.md:94-95`: `compute`
  / `sql` / `document` / `queue` / `object-storage` / `cdn` / `access` /
  `identity` / `messaging`. `taxonomy.md:118-125` records that `cdn`,
  `secrets-manager` and `access` have no capability token and leave `capability`
  unset.
- The `cloud-provider` kind (`kinds.md:186-259`): four provider topics, five
  service topics for every `cloud-service` component, "plus a three-topic
  extension where the service's category is `compute`" (`:193-194`) — 6
  Artifact, 7 Pipeline, 8 Health (`:252-259`). Axis line `:198-200`: "a
  `compute` service is a deploy target, as is anything else that fronts the
  deployment". `:211`: everything model-invocable, nothing paths-scoped.
- Pack anatomy (`zero-trust-access/`): `pack.yaml` (`name`, `summary`,
  `version`, `type`, `category`, `kind`, `axis`, `artifact`, `harness:` map),
  `conventions.md` (copied verbatim into the template payload —
  `materializer.md:26-29`), `skills/<name>/SKILL.md` (frontmatter `name`,
  `version`, `category`, `description`, `license`, `allowed-tools`) plus one
  `references/*.md` per bar topic (five today). **No `cloud-provider`,
  `cloud-service` or `deploy-target` pack ships a `config/` tree**; the thirteen
  that do are repo- or project-axis.
- Bundle file (`pack-format.md:144-154`): frontmatter `name`, `axis`, `kind`,
  `platforms` (project axis only), `artifact` (deploy axis only), optional
  `unconditional: true`, `components:` as `<type>/<slug>@<version>` refs. The
  menu lists every non-unconditional bundle
  (`stackgen-stack-menu/SKILL.md:24-45`). `artifact:` tokens in use:
  `container-image`, `npm-package`, `n/a`; vwf holds no closed list
  (`stack-adapter.md:225-238`).
- Composition order (`output-tree.md:173-178`): `toolchain-manager` →
  `toolchain-gate` → `repo-hygiene` → `package-manager`/`language` →
  `app-framework` → `capability-provider`; later wins; cloud components absent.
  Restated at `materializer.md` (composition-order paragraph).
- Root allowlist (`output-tree.md:142-150`, restated `materializer.md:57-68`,
  hygiene `conventions.md:26-27`, enforced by `plugins:check` rule 11 in
  `scripts/src/check.ts` ~`:300-312` with tests in `check.test.ts`):
  `.gitignore`, `.editorconfig`, `.gitattributes`, `LICENSE`, `SECURITY.md`,
  `readme.md`, `CLAUDE.md`, `fnox.toml`, `eslint.config.mjs`, and
  language-mandated manifests and lockfiles. A `config/` tree landing any other
  root path is a pack authoring error the materializer refuses.
- The charter fence (`output-tree.md:202-214`) keeps exactly four things
  outside: language manifests, **CI workflow files**, editor settings,
  `CLAUDE.md`. A pack states which task CI must run and never writes the
  workflow.
- `plugins:check` rule 11 (`checkPackConfigTier`) asserts on `config/`: task
  exec bit and `#!/usr/bin/env bash`, hook exec bit and shebang, the root
  allowlist, and `pre-commit.d/*.yaml` parsing with `repos:`.
  `plugins:shellcheck` runs
  `shellcheck -x -s bash -P <pack>/config -e SC2034
  -e SC2154` and
  `shfmt -d -i 2 -ci` over every pack task file.
  `plugins/*/
  stacks/*/*/config/` is excluded from this repo's dprint —
  payload is formatted by the shipped config, never this repo's.
- The mise pack's `p/<id>/_default` slot is created by `/vwf:init` per project
  (D28 of the previous plan); overlays source
  `${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/helpers` with a
  `# shellcheck source=/dev/null` directive on its own line, use
  `#MISE
  description=`, `#MISE dir="{{ config_root }}"`, `#USAGE flag`,
  `print_header` / `print_subheader` (separators baked in). Model:
  `package-manager/pnpm/
  config/.config/mise/tasks/code/format`.
- Secrets naming (`assets/contracts/secrets.md`): `<REPO>_<KEY>` per repo,
  `GLB_<KEY>` for values shared across repos.
- vwf side: `deploy_template` is a **list** (`stack-adapter.md:92-96`), written
  by architecture's orchestrator to `.config/vwf.yaml` as
  `projects.<name>.stack.deploy_template: [ <slug> ]` — the slug only; the
  registry records nothing about deploy. `stack-menu.md:36-41` requires a `site`
  project to pin at least one slug. `cloudflare-zero-trust.md:26-32` says it
  "composes with a hosting pin rather than replacing one", so the new bundle
  pairs with it. Rule 10's `TOOL_TOKENS` (`check.ts:749-794`) contains none of
  `cloudflare`, `wrangler`, `workers`, and the rule scans only `plugins/vwf/**`
  — this plan touches no vwf file.

**The test repo (`virajp.dev`, reported by its own session).**

- `/vwf:init` completed: 57 files in one commit. Secrets slot deferred, no
  LICENSE, no SECURITY.md (private repo). Hosting was never asked.
- `/vwf:architecture` halted in derivation mode at the deploy round for project
  `site` (role frontend, platforms `[site]`). Offered: generate, defer as
  `unresolved`, or pin `container-generic`. Nothing written.
- Intent: Astro, static output, one page; no manifest or framework yet. The only
  project-axis bundle with `platforms: [site]` is `typescript-astro-react`,
  named "Astro (SSR)", both framework components `@generated` — parked below.

**Prior art — this repo's own site (2026-09-05 decision).**

- `site/wrangler.jsonc`: no `main`,
  `"$schema": "node_modules/wrangler/
  config-schema.json"`,
  `compatibility_date`, `assets.directory: ./dist`,
  `assets.not_found_handling: "404-page"`, one `routes[]` entry with
  `custom_domain: true`. Credentials never in the file.
- `.github/workflows/site.yml` deploys on a `site-v*` tag via
  `cloudflare/wrangler-action` with `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` from repository secrets, using the wrangler pinned in
  `site/package.json`.

**Tool facts (Context7, `/websites/developers_cloudflare_workers`,
2026-09-05).**

- An assets-only Worker is first-class:
  `{ "name", "assets": { "directory" },
  "compatibility_date" }` and nothing
  else deploys with `wrangler deploy`.
- `assets.not_found_handling`: `"404-page"` serves `404.html` with a 404;
  `"single-page-application"` serves `index.html` for unknown routes.
- `assets.run_worker_first` (bool or path globs) and `assets.binding` matter
  only when a Worker script fronts the assets — out of scope here.
- Serving from a subpath needs Wrangler ≥ 3.98.0 and a `route`;
  `wrangler
  deploy --assets <dir>` is the no-config CLI form; `--temporary` (≥
  4.102.0) deploys to a claimable preview account before auth exists.
- Wrangler reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the
  environment; `wrangler login` is the interactive alternative.

## Assumed decisions — confirm or override at review

User rulings are quoted; rows marked *(assumed)* were made by the planner and
are the review surface.

| #  | Decision          | Ruling                                                                                                                                                                                                                                                                                                                             | Rejected                                                                               | Unit       |
| -- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- |
| 1  | Kind              | `cloud-service` under `cloud-provider`, composed with the existing `cloud-provider/cloudflare` unchanged — `kinds.md:831-834` fences a cloud's targets out of `deploy-target`. "Doesn't change the shape. CloudFlare have many services and stackgen doesn't cover them all."                                                      | a `deploy-target` pack; extending `cloudflare-zero-trust`                              | U3, U4     |
| 2  | Scope             | "Static assets now, SSR as its own pack later": an assets-only Worker with no `main`; Workers-with-a-script is added by name to the reserved list.                                                                                                                                                                                 | one pack covering both; assets + optional script                                       | U3, U4     |
| 3  | Category          | "Add a new category": `static-hosting`, appended to the closed list at `taxonomy.md:94-95`.                                                                                                                                                                                                                                        | `compute`; `cdn`                                                                       | U1, U3     |
| 4  | Category bar      | "Same three as compute": `kinds.md:193-194` and `:252` gate the extension on `compute` **or** `static-hosting`; topics 6–8 are Artifact, Pipeline, Health.                                                                                                                                                                         | artifact and pipeline only; a bespoke static-hosting bar                               | U1, U3     |
| 5  | Config path       | "Add `wrangler.jsonc` to the root allowlist": the pack ships `config/wrangler.jsonc` at the repo root, and the allowlist gains it in every place that carries it — `output-tree.md`, `materializer.md`, hygiene `conventions.md`, `check.ts` and its test.                                                                         | `.config/wrangler.jsonc` with `--config` everywhere (the D17 precedent); document only | U2, U3, U5 |
| 6  | Composition order | "Last, after capability-provider": `cloud-provider` then `cloud-service` components land after every other type, so a deploy target's file wins over anything a language or provider pack guessed.                                                                                                                                 | before `capability-provider`; undefined order                                          | U2         |
| 7  | Deploy task       | "A p:<project>:deploy overlay": the pack ships `config/.config/mise/tasks/p/_project/deploy`, a marked-position directory that `/vwf:architecture` (or the materializer) renames to the project id; it runs `wrangler deploy` and the pack names it as the task CI must run. No workflow file.                                     | mirror `site:release`; document the command only                                       | U3         |
| 8  | Marked positions  | "Ship it with marked positions": `wrangler.jsonc` ships real values for `$schema`, `compatibility_date`, `assets.directory` (`./dist`) and `assets.not_found_handling` (`"404-page"`); `name` and the `routes[].pattern` are marked slots the pinning command fills, in the same comment form the mise pack uses for member flags. | derive every value; ship a complete config                                             | U3         |
| 9  | Artifact token    | *(assumed)* `artifact: static-assets` on both `pack.yaml` and the bundle — the vocabulary is open, and `n/a` would say the bundle publishes nothing, which is the zero-trust case, not this one.                                                                                                                                   | reuse `n/a`; `directory`                                                               | U3, U4     |
| 10 | Credentials       | *(assumed)* Documented as `GLB_CLOUDFLARE_API_TOKEN` and `GLB_CLOUDFLARE_ACCOUNT_ID` — account-wide values shared across repos, so `GLB_` per `contracts/secrets.md`; the task reads them from the environment the secrets provider supplies and never from a file.                                                                | `<REPO>_` prefix; `wrangler login` as the documented path                              | U3         |
| 11 | Capability        | *(assumed)* `capability` left unset with the same comment shape `zero-trust-access` uses: `static-hosting` realizes no vwf token today, and minting one is vwf's move.                                                                                                                                                             | minting a token here                                                                   | U3         |
| 12 | Health mechanism  | *(assumed)* The `harness.health` mechanism is an HTTP probe of the deployed origin's `/` (and a known 404 path returning 404, proving `not_found_handling` landed); `task: n/a` because the platform serves files or does not — there is no process to be unhealthy.                                                               | a shipped `p:<id>:health` task; declaring health n/a                                   | U3         |
| 13 | Bundle slug       | *(assumed)* `cloudflare-workers-static`, name "Cloudflare Workers Static Assets", `axis: deploy`, `kind: cloud-provider`, `artifact: static-assets`, components `cloud-provider/cloudflare@0.1.0` and `cloud-service/workers-static-assets@0.1.0`. Not `unconditional`.                                                            | `cloudflare-workers`; `cloudflare-static-site`                                         | U4         |
| 14 | Provider pack     | *(assumed)* `cloud-provider/cloudflare` stays at `0.1.0` and its doctrine is untouched; only the reservation paragraph in its `conventions.md` changes. The bundle records the version the pack carries.                                                                                                                           | bumping the provider to `0.2.0`                                                        | U4         |
| 15 | Tool pin          | *(assumed)* The pack pins nothing in mise: wrangler is a project dependency the language manifest carries (as `site/package.json` does here), and the manifest is fenced. The task calls the manifest's wrangler via the package manager (`pnpm exec wrangler`, with a `pnpx`/`npx` fallback documented).                          | `[tools] wrangler` in a `conf.d/` fragment                                             | U3         |
| 16 | stackgen version  | `1.0.0` → `1.1.0` for "minor": new pack, new bundle, new category, all additive.                                                                                                                                                                                                                                                   | `1.0.1`; `2.0.0`                                                                       | U7         |
| 17 | Reviewer check    | *(assumed)* `kinds.md`'s per-kind reviewer section gains one clause for `cloud-provider`: a `static-hosting` service whose artifact is not a directory of files, or that ships a Worker script, is a gap.                                                                                                                          | no reviewer change                                                                     | U1         |

## New dependencies

- **wrangler** — not a dependency of this repo, and not pinned by the pack
  (D15): a target repo's language manifest carries it, and the manifest is
  fenced. Named here so no unit adds it to `mise.dev.toml` or a `conf.d/`
  fragment.
- No npm package, no new Context7 library, no new agent. Context7's
  `/websites/developers_cloudflare_workers` is the citation source and is
  already available.

## Units

| Id | Wave | Unit file                                                            | Owns                                                                                                                                                                                                                            | Depends on | Status | Commit   |
| -- | ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------- |
| U1 | 1    | [01-taxonomy-and-kinds.md](01-taxonomy-and-kinds.md)                 | `plugins/stackgen/assets/taxonomy.md`, `plugins/stackgen/assets/kinds.md`                                                                                                                                                       | —          | green  | 1a30d456 |
| U2 | 1    | [02-allowlist-and-composition.md](02-allowlist-and-composition.md)   | `plugins/stackgen/assets/output-tree.md`, `plugins/stackgen/skills/stackgen-stack-template/references/materializer.md`                                                                                                          | —          | green  | 1a30d456 |
| U3 | 1    | [03-workers-static-assets-pack.md](03-workers-static-assets-pack.md) | `plugins/stackgen/stacks/cloud-service/workers-static-assets/**`                                                                                                                                                                | —          | green  | 1a30d456 |
| U4 | 1    | [04-bundle-and-reservation.md](04-bundle-and-reservation.md)         | `plugins/stackgen/stacks/bundles/**`, `plugins/stackgen/stacks/cloud-provider/cloudflare/conventions.md`                                                                                                                        | —          | green  | 1a30d456 |
| U5 | 1    | [05-checker-allowlist.md](05-checker-allowlist.md)                   | `scripts/src/check.ts`, `scripts/src/check.test.ts`, `plugins/stackgen/stacks/repo-hygiene/repo-hygiene/conventions.md`                                                                                                         | —          | green  | 1a30d456 |
| U6 | 2    | [06-docs.md](06-docs.md)                                             | `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`, `.claude/skills/stackgen-plugin/**`, `.claude/skills/plugin-authoring/**`, `.claude/skills/vwf-plugin/**`, `site/src/content/docs/**`, `docs/memory/decisions/*` | all        | green  | 50008365 |
| U7 | 3    | [07-gates-and-bump.md](07-gates-and-bump.md)                         | `plugins/*/.claude-plugin/plugin.json`, `site/package.json`, `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                                                                                          | U6         | green  | 074fb92b |

Status is one of `pending`, `running`, `green`, `failed`, `unresolved`,
`skipped`.

## Shared-file rule

| File                                                                                                                                      | Why it collides                                                      | Owner                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `plugins/*/.claude-plugin/plugin.json`, `site/package.json`                                                                               | several units bumping one version is a lost update                   | U7 only                                                        |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                                                                 | generated; regenerating mid-wave races                               | U7 only (see Waves for the inventory caveat)                   |
| `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `site/src/content/docs/**`, `.claude/docs/**`, `.claude/skills/**`, `docs/memory/decisions/*` | n units editing one doc                                              | U6 only                                                        |
| `plugins/stackgen/assets/{taxonomy,kinds}.md`                                                                                             | U3 declares the category U1 defines                                  | U1 only; U3 never edits assets                                 |
| `plugins/stackgen/assets/output-tree.md`, `materializer.md`                                                                               | U5 widens the checker's allowlist, U2 widens the doctrine's          | U2 only; U5 never edits assets                                 |
| `plugins/stackgen/stacks/repo-hygiene/repo-hygiene/conventions.md`                                                                        | carries the allowlist prose; closest to the checker that enforces it | U5 only                                                        |
| `plugins/stackgen/stacks/cloud-provider/cloudflare/**`                                                                                    | U3 cites the provider doctrine, U4 edits its reservation paragraph   | U4 for `conventions.md` only; nothing else in the pack changes |
| `plugins/stackgen/stacks/bundles/cloudflare-zero-trust.md`                                                                                | reservation paragraph and the "composes with a hosting pin" passage  | U4 only                                                        |

## Waves

- **Wave 1 — U1, U2, U3, U4, U5.** Five disjoint trees: the taxonomy and kind
  definitions; the output-tree doctrine and the materializer; the new pack; the
  bundles and the provider's reservation paragraph; the checker and the hygiene
  prose. U3's `pack.yaml` names the category U1 adds and ships a root file U5
  allowlists, but no two units write one file. **The orchestrator commits U5
  before U3** so `plugins:check` accepts the payload — and, as the previous run
  established, this repo's repo-wide pre-commit hooks may force wave 1 into one
  or two commits rather than five; that is acceptable and is recorded, not
  worked around with `--no-verify`.
- **Wave 2 — U6.** Docs and the decision doc, from the `docs-reconciler`
  findings plus every `DOCS FALSIFIED:` line.
- **Wave 3 — U7.** Versions, generators, full gate, `target-verifier`.

**Inventory caveat.** This repo's pre-commit runs `plugins:inventory --check`,
so no wave-1 commit can land while the generated inventory is stale — and the
new pack, bundle and category make it stale. The previous run resolved this by
letting the orchestrator run `plugins:inventory` at the wave-1 commit; the same
ruling applies here. U7 re-runs it with the version bumps.

## Wave gate

`mise run plugins:marketplace --check`, `mise run plugins:inventory --check`,
`mise run plugins:check`, `mise run plugins:shellcheck`, `pnpm vitest run`,
`pnpm exec tsc --noEmit -p installer` and `-p scripts`,
`mise run plugins:npm-normalize-test`, `mise run site:check` from wave 2 on,
plus the wave review, plus every report read for `UNRESOLVED:`.

Plan-specific lines:

- `mise run plugins:check` reports the new pack's `config/wrangler.jsonc` as
  **accepted** at the root — the allowlist widening is what makes wave 1 pass.
- `grep -rn "not offered" plugins/stackgen/stacks/cloud-provider/cloudflare
  plugins/stackgen/stacks/bundles/cloudflare-zero-trust.md`
  returns only lines whose reserved list no longer contains "Workers" as a bare
  word — Workers Static Assets is offered; Workers-with-a-script is named as
  reserved.
- `grep -rn "static-hosting" plugins/stackgen/assets/` hits `taxonomy.md` (the
  category list) and `kinds.md` (the extension condition, the axis line, the
  reviewer clause) — at least three files' worth of lines.
- `grep -rln "wrangler.jsonc" plugins/stackgen/assets/output-tree.md
  plugins/stackgen/skills/stackgen-stack-template/references/materializer.md
  plugins/stackgen/stacks/repo-hygiene/repo-hygiene/conventions.md
  scripts/src/check.ts`
  returns all four.
- Every
  `plugins/stackgen/stacks/cloud-service/workers-static-assets/config/
  .config/mise/tasks/**`
  file is executable and starts with `#!/usr/bin/env bash`.

## Gates the orchestrator keeps

**The scratch materialization**, after wave 1 is green and before wave 2:

1. Compose into a temp git repo, in the documented order, the `config/` trees of
   `toolchain-manager/mise`, the four `toolchain-gate` packs,
   `repo-hygiene/repo-hygiene` and `cloud-service/workers-static-assets` — the
   cloud pack **last** per D6 — skipping `_`-prefixed entries.
2. `wrangler.jsonc` lands at the repo root, parses as JSONC (strip comments,
   then `python3 -c "import json"`), carries `assets.directory`,
   `assets.not_found_handling: "404-page"` and a `compatibility_date`, and its
   two marked positions (`name`, the route pattern) are intact and clearly
   marked.
3. The deploy task lands under `.config/mise/tasks/p/`, is executable, and is
   clean under
   `shellcheck -x -s bash -P .config/mise/tasks/_scripts -e SC2034
   -e SC2154`
   and `shfmt -d -i 2 -ci`.
4. With the marked positions filled by hand (`name: scratch`, the route removed)
   and no credentials in the environment,
   `MISE_ENV=dev mise run
   p:scratch:deploy` exits **non-zero with a clear
   message naming the two environment variables it needs**, before invoking
   wrangler — never a wrangler auth stack trace.
5. `mise run plugins:check` from the worktree reports the pack accepted, and a
   dry read of `stacks/bundles/cloudflare-workers-static.md`'s frontmatter shows
   no `unconditional:` key — the menu must offer it.

Pass = all five. A failure is a wave-1 finding routed to the owning unit (U3 for
the pack and task, U5 for the checker, U2 for the order), not a GAP.

**`target-verifier`** runs inside U7 as usual: a hermetic install shows
`stackgen@1.1.0`, the installed stackgen tree contains
`stacks/cloud-service/workers-static-assets/config/wrangler.jsonc` and
`stacks/bundles/cloudflare-workers-static.md`, and uninstall leaves only
Claude's own cache.

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

- **A Worker script fronting the assets** (`main`, `run_worker_first`,
  `assets.binding`). D2: SSR is its own pack, later, and joins the reserved list
  by name.
- **Any other Cloudflare service** — Pages, R2, D1, KV, Durable Objects, Queues,
  Images, Stream. The reservation stands for all of them.
- **A CI workflow file.** The charter fence keeps it outside; the pack names the
  task CI must run.
- **Any vwf file.** The change stays inside stackgen; rule 10 is never in play.
  `architecture.md`'s "Hosting & Deployment" prose stays vendor-free as it is.
- **Pinning wrangler in mise.** D15: it is a manifest dependency and the
  manifest is fenced.
- **The `typescript-astro-react` bundle's SSR/SSG mismatch.** Parked as the next
  plan.
- **The five `/vwf:init` defects the test run found.** Parked as the plan after
  that.

## Parked

Two follow-on plans, in this order, each `requires:` the one before:

1. **Astro static output on the project axis.** The only `platforms: [site]`
   bundle is `typescript-astro-react`, named "Astro (SSR)", with
   `framework/astro@generated` and `framework/react@generated`. The user's repo
   is SSG with no React. Needs: an SSG-shaped Astro entry (or a mode on the
   existing bundle), real framework packs or an explicit generated path, and the
   pairing with `cloudflare-workers-static` stated. Plan
   `docs/plans/<date>-astro-static`.
2. **The `/vwf:init` defects from the first real run** (repo `virajp.dev`,
   2026-09-05), all reported by that repo's session:
   - **`p:` ids break on a dot.** `new-repo.md` §7 names a single-project repo
     by "the repo's own name"; `virajp.dev` → mise read `.dev` as an extension
     and collapsed `p:virajp.dev:_default` to `p:virajv`. Init must slugify
     (dots → dashes) or the spec must say so. Highest value.
   - **A main-only repo cannot run its own merge tasks.** §1 leaves an existing
     `main` alone and creates no `develop`; `code:merge:main` refuses any source
     but `develop`, so neither merge task can run. Create `develop` when absent,
     or document the main-only path.
   - **The shipped gate forbids what the bootstrap does.**
     `no-commit-to-branch
     --branch main` ships in the pre-commit config;
     init's own first commit goes to `main`, and works only because hooks are
     not installed yet.
   - **`setup:worktree` writes an untracked `.config/mise.dev.lock`** that the
     merge tasks then refuse as a dirty tree. Either commit it as part of setup
     or the merge predicate must tolerate it.
   - **`commitScopes` names a source that cannot exist yet** — "filled by
     /vwf:init from the project registry", but init runs before architecture.
   - Also reported: the `cat`→`bat` heredoc corruption silently damaged two
     files that session wrote; any pack or skill instructing a heredoc write
     hits it. Already a documented trap here; now a user-visible one.

- **Workers-with-a-script (SSR on Workers)** — reserved by name in the same
  paragraph that reserves Pages, R2, D1, KV, Durable Objects, Queues, Images and
  Stream.
- **A vwf capability token for `static-hosting`** — `taxonomy.md:118-125`
  already records that some categories have none; minting is vwf's move.
- **A `p:<id>:preview` task** (`wrangler versions upload` / preview URLs) —
  useful, not asked for.

## Run log

<written by execute-plan; empty at approval>

| Wave | Unit              | Model   | Round | Outcome     | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Commit   |
| ---- | ----------------- | ------- | ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 2    | U6                | inherit | 1     | green       | four site passages, the plugin-authoring checks reference, `stackgen-plugin/SKILL.md`, a dated addendum on the charter-fence decision doc, and a new decision doc for the reservation reversal. DECIDED: the manual names no bundles outside `choosing-your-stack.md`, so the new bundle is introduced there rather than manufacturing a bundle list; `stackgen-plugin/SKILL.md`'s "Five kinds of entry" was a stale exhaustive list — widened to six; the charter-fence fix is an addendum leaving the original decision's text intact. `site:check` and `plugins:check` both exit 0. No DOCS FALSIFIED, no GAP, no UNRESOLVED                                                                                                                                                                                                                                                         |          |
| 1    | commit            | —       | 1     | green       | wave 1 landed as **one** commit `1a30d456`, not five: this repo's pre-commit stashes unstaged work, so a per-unit commit runs `plugins:check` against a tree where the new pack, its category and the widened allowlist are not all present at once — the first attempt (U1 alone) failed exactly that way. The plan's Waves section allows one or two commits and forbids `--no-verify`. `plugins:inventory` re-run before staging, per the inventory caveat                                                                                                                                                                                                                                                                                                                                                                                                                           | 1a30d456 |
| 2    | docs-reconciler   | —       | 1     | findings(4) | `site/src/content/docs/plugins/stackgen.md` ×3 (the kind row's `compute`-only extension, the three no-token categories, the "two things no pack can know" passage) and `how-to/operate/choosing-your-stack.md:61` (managed deploy alternatives). Confirmed already correct: `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/{repo-shape,plugins,ci-and-releases}.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |          |
| 1    | U2                | inherit | 3     | green       | `pack-format.md`'s leading-underscore sentence now carries both meanings — the top-of-tier skip and the nested `p/_project/` marked position that is copied and renamed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |          |
| 1    | gate              | —       | 1     | green       | all gate lines pass; `plugins:inventory` re-run at the wave commit per the plan's inventory caveat (its `--check` and `inventory.test.ts` then green). Plan-specific lines: the only surviving "not offered" sentence reserves a Worker *script*, not Workers; `static-hosting` hits `kinds.md` (5), `taxonomy.md` (2), `output-tree.md` (1); `wrangler.jsonc` in all four files; the one task file is 755 with the bash shebang                                                                                                                                                                                                                                                                                                                                                                                                                                                        |          |
| 1    | orchestrator gate | —       | 1     | green       | scratch materialization into a temp repo, cloud pack last: `wrangler.jsonc` lands at the root, parses as JSONC (comments + trailing commas stripped) with `assets.directory`, `not_found_handling: 404-page`, a `compatibility_date`, no `main`, and both marked positions intact; the task lands under `.config/mise/tasks/p/`, 755, clean under `shellcheck -x` and `shfmt -d -i 2 -ci`; renamed to `p/scratch/` it lists as `p:scratch:deploy` and, with no credentials, exits 1 naming both variables before invoking wrangler; the bundle carries no `unconditional:` key                                                                                                                                                                                                                                                                                                          |          |
| 1    | R1                | inherit | 2     | findings(1) | CONTRACT clean, RULINGS clean. Round-1 findings all closed or resolved (1 was the gate procedure, 3 ruled kept). One new, unowned: `plugins/stackgen/assets/pack-format.md:47` — the leading-underscore sentence now covers only one of two meanings, since `p/_project/` is an underscore-marked position that *is* copied. Routed to U2 as a mechanical follow-up                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |          |
| 1    | U4                | inherit | 3     | green       | provider skill's frontmatter `description` widened to cover hosting as well as fronting; same six keys, same `>-` folded scalar, `yaml.safe_load` clean, `plugins:check` still counts 33 skills                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |          |
| 1    | U4                | inherit | 2     | green       | orchestrator ruled the D14 departure kept, not reverted — a sentence the reversal made false is doctrine kept true, not doctrine changed; Owns extended by the seven unowned falsified files. Corrected the provider skill, its cost-doctrine and local-development-map, `zero-trust-access`'s conventions and pick-and-trade, `bundles/fnox.md` + `doppler.md`'s "provider is last" sentence, and `stacks/readme.md`'s Wave E list (new pack recorded as a later arrival, not backdated). Round-1 GAP closed: bundle ref `@0.1.0` matches the pack's `version:`. One more falsified passage reported: the provider skill's frontmatter `description`                                                                                                                                                                                                                                   |          |
| 1    | U2                | inherit | 2     | green       | materializer gains a fourth copy rule — `p/_project/` renamed to the pinned project's id on copy, slugified (a dot becomes a dash), placed beside the `config/_<name>/` skip rule and explicitly distinguished from it; the lockfile records the landed path. `stackgen-sync/SKILL.md`'s order enumeration now ends with the cloud types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |          |
| 1    | U5                | inherit | 2     | green       | allowlist paragraph re-folded to ≤77 columns, wording unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |          |
| 1    | R1                | inherit | 1     | findings(5) | CONTRACT clean. RULINGS: U4 departed from D14 (edited two passages beyond the reservation paragraph — self-reported). Findings: `wrangler.jsonc` trailing commas are valid JSONC, the *gate* needs a comma strip (orchestrator's, no unit action); `materializer.md:85` never teaches the `p/_project/` → project-id rename, so a real materialization lands an inert task (→ U2); `cloudflare/conventions.md:14` D14 departure (→ U4); `stacks/readme.md:177-186` packs wave-log omits the new component and category, unowned (→ U4); `repo-hygiene/conventions.md:28` allowlist line folds at 81 cols against ≤77 (→ U5)                                                                                                                                                                                                                                                             |          |
| 1    | U3                | inherit | 1     | green       | pack written: `pack.yaml`, `conventions.md`, `config/wrangler.jsonc`, the `p/_project/deploy` overlay (755, credential guard), skill + 8 bar references. DECIDED: `--dry-run` exempt from the credential guard; `have_task` defined locally (matching `setup/mise`); project id read from the directory name so the `_project` rename is the only edit; `"name": "PLACEHOLDER"` fails at first deploy rather than publishing; cost-shape cites the provider's seats-vs-requests carve-out; identity-shape recommends creating the custom domain by hand to avoid a zone-scoped token. DOCS FALSIFIED (5, none owned by a wave-1 unit): `cloud-provider/cloudflare/skills/cloudflare/SKILL.md`, its `references/cost-doctrine.md` and `references/local-development-map.md`, `cloud-service/zero-trust-access/conventions.md`, its `references/pick-and-trade.md`. No GAP, no UNRESOLVED |          |
| 1    | U2                | inherit | 1     | green       | `wrangler.jsonc` allowlisted and cloud types placed last in both `output-tree.md` and `materializer.md`. DECIDED: allowlist rationale phrased as the `eslint.config.mjs` exception; the "provider goes last" paragraph rewritten, not deleted (secrets overlay still outranks language packs; only the deploy target moves after it). DOCS FALSIFIED (6): `stackgen-sync/SKILL.md:62-64`, `bundles/fnox.md:51`, `bundles/doppler.md:40`, `site/src/content/docs/plugins/stackgen.md:484-491`, `.claude/skills/plugin-authoring/references/checks.md:96`, `docs/memory/decisions/2026-09-05-charter-fence-opens-for-gate-configs.md:35`. GAP: `stackgen-sync/SKILL.md` is on no unit's Owns list — left unedited, orchestrator to route                                                                                                                                                  |          |
| 1    | U4                | inherit | 1     | green       | new `bundles/cloudflare-workers-static.md` (D13 frontmatter, no `unconditional:`); reservation narrowed in `cloudflare-zero-trust.md` and the provider's `conventions.md`. DECIDED: frontmatter key order follows the sibling bundles, not `pack-format.md`'s listing; edited two passages beyond the named reservation paragraph its own change falsified. GAP: plan named only two reservation sites, missed the provider's "not where the product runs" paragraph and closing pointer — corrected under the same ownership. GAP: `workers-static-assets@0.1.0` ref unverified when it ran (U3 had not written `pack.yaml`) — re-checked at the wave gate. No UNRESOLVED                                                                                                                                                                                                              |          |
| 1    | U1                | inherit | 1     | green       | `static-hosting` added to the category list (fourth no-token category) and to `kinds.md`'s extension condition, axis line, topic 6 and reviewer clause. DECIDED: reviewer clause reads "ships a server-side script fronting them" — `kinds.md` names no vendor anywhere; extension heading renamed "Compute-category extension" → "Deploy-target extension" (referenced nowhere else). No DOCS FALSIFIED, no GAP, no UNRESOLVED                                                                                                                                                                                                                                                                                                                                                                                                                                                         |          |
| 1    | U5                | inherit | 1     | green       | allowlist gains `wrangler.jsonc` in `check.ts`, its test (pass fixture + `netlify.toml` negative) and the hygiene prose. DECIDED: appended after `readme.md` keeping ASCII sort; negative fixture is a deploy config the root still refuses. DOCS FALSIFIED: `.claude/skills/plugin-authoring/references/checks.md` ~:105 lists eight allowlist files, omits `wrangler.jsonc`. No GAP, no UNRESOLVED                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |          |
| 0    | preflight         | —       | 1     | green       | all nine gate lines pass on `develop` (`plugins:check`, marketplace/inventory `--check`, shellcheck, 264 vitest, both tsc, npm-normalize, site:check); `setup:pnpm:install`'s audit step fails on an inherited astro advisory (GHSA-7pw4-f3q4-r2p2) — install itself completed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —        |

## Launch

Run in a fresh session:

/execute-plan docs/plans/2026-09-05-cloudflare-workers-static
