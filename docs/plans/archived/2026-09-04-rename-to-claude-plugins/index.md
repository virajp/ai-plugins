---
type: repo-plan
title: Rename the repo to claude-plugins and the installer to
  @virajp.dev/claude-plugins
requires: []
---

# Plan — Rename the repo to claude-plugins and the installer to @virajp.dev/claude-plugins (2026-09-04)

## Status

**COMPLETE** — 2026-09-04. Commits on `2026-09-04-rename-to-claude-plugins`:
84ff0531, 20ee0d53, c8bb3fdd, a847d1a9, 176d5201, 13139f78, d02982fa, c99f0241,
99d59a8e, plus this archival commit. Real-install verifier: marketplace add,
dry-run and removal pass; `plugin install` blocked by tags never cut on `main`
(inherited, see run log wave 3).

APPROVED 2026-09-04 by the user, after the interview and the self-review.

## Consent

| Action                                   | Granted                                             |
| ---------------------------------------- | --------------------------------------------------- |
| Merge to `develop` and push on green run | yes                                                 |
| Release `vwf`                            | none                                                |
| Release `stackgen`                       | minor                                               |
| Release installer                        | yes — `1.0.0`, the first release under the new name |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`. The installer's first publish under the new name
is **manual** (see *Post-landing manual sequence*), because npm cannot bind a
Trusted Publisher to a package that does not exist yet.

## Goal

After this lands the toolkit lives at `github.com/virajp/claude-plugins`, its
installer is published as `@virajp.dev/claude-plugins` at version `1.0.0` with
the command `claude-plugins`, every reference in the tree that named the old
repo or the old package names the new one, and the old package
`@askviraj/ai-plugins` is sunset: it stays on npm, but running it prints a
stderr pointer to the new package and exits `1`. The marketplace name
`virajp-plugins` does not change, so no existing install is disturbed.

**Reversal, named as one.** The installer doctrine (`installer/CLAUDE.md`,
`.claude/docs/installer/packaging.md`, `docs/installer/internals.md`,
`tsup.config.ts`'s comment, and the archived plan
`docs/plans/archived/02-rename-installer.md`) says *the artifact is
`installer.mjs`; the command is `ai-plugins`; the bin key is never renamed
because it is what users invoke and what the Trusted Publisher is bound to*.
That decision is overturned: the bin key becomes `claude-plugins` because the
package and repo are renamed and a command that matches neither is worse than a
one-time command change. The Trusted-Publisher half of the rationale was also
wrong — npm binds the publisher to the **package name**, not the bin key. The
docs unit writes the decisions doc.

## Facts the survey established

**The GitHub rename happens before the run.** The user renames
`virajp/ai-plugins` → `virajp/claude-plugins` on GitHub first. GitHub redirects
git fetches and the marketplace's `git-subdir` URL from the old path, so
existing users keep working throughout. Server-side rulesets
(`protected-branches`, `release-tags`) survive a rename; nothing in the tree
re-creates them. Preflight: `gh repo view --json name -q .name` must print
`claude-plugins`, else halt; then
`git remote set-url origin
git@github.com:virajp/claude-plugins.git` in the main
checkout.

**Where the old names live, and which are load-bearing.**

- Installer runtime constants: `installer/src/context.ts:162` `PACKAGE_NAME`
  (drives `packageRoot()` at `installer/src/index.ts:319-361`, which matches
  `parsed.name === PACKAGE_NAME` walking up — a mismatch with the manifest makes
  the published bundle throw at `index.ts:332`); `installer/src/install.ts:44`
  `MARKETPLACE_SOURCE = "virajp/ai-plugins"`; `installer/src/version.ts:32-35`
  the npm-registry and raw.githubusercontent URLs;
  `installer/src/version.ts:198` and `installer/src/report.ts:143` user-visible
  name literals; `installer/src/args.ts:160,169` help text;
  `installer/src/index.ts:13` comment and `:323` `AI_PLUGINS_SOURCE_DIR`.
- Root `package.json`: `:2` name, `:4` description, `:21`
  `repository: github:virajp/ai-plugins` (provenance ties the publish to this
  repo), `:26` bin key `ai-plugins`. `installer/package.json:2,5` and
  `scripts/package.json:2` carry the private workspace names `@ai-plugins/*`;
  nothing else references those names.
- Marketplace generator: `scripts/src/marketplace.ts:191` `REPO_URL` is the
  single hard-coded source of every published `source.url`; the generator reads
  no git remote and no `package.json` on purpose (`--check` must work offline).
  `entry()` at `:271-273` passes `plugin.json`'s `repository` through verbatim;
  only vwf declares one (`plugins/vwf/.claude-plugin/plugin.json:9`). `--check`
  is a byte-exact compare of the regenerated manifest against the committed one.
- Shipped pack:
  `plugins/stackgen/stacks/toolchain-manager/mise/config/.config/mise/tasks/setup/ai:24`
  lists `"virajp/ai-plugins"` and `:35` derives the update name as
  `${marketplace##*/}` → `ai-plugins`, which is not the marketplace name, so
  `claude plugin marketplace update` there already no-ops under `|| true`.
- Repo config: `.config/mise/tasks/i/publish:29,35,37` and `i/release:120`
  banners; `i/test:80-81` asserts the dry-run output contains
  `claude plugin marketplace add virajp/ai-plugins`; `i/test:106` seeds a legacy
  receipt under `.config/ai-plugins/receipts` (an on-disk name that stays);
  `.config/mise/tasks/setup/ai:12` the `pnpx` line;
  `.github/workflows/release.yml:3,74,115,116` (`:115` is a live `npm view`
  idempotence probe that skips the publish when the version is already on npm);
  `.config/git-conventional-commits.yaml:27,28,32` URLs;
  `.config/claude-status.json:3`; `.config/mise.dev.toml:31-33`;
  `mempalace.yaml:86` prose.
- Tests asserting old strings: `installer/src/args.test.ts:133`,
  `report.test.ts:89`, `version.test.ts:151-153`, `install.test.ts:154,226,261`,
  `github.test.ts:76` (fixture URL, header assertion only);
  `scripts/src/marketplace.test.ts:81,143`; `marketplace.test.ts:41` compares
  `buildManifest()` against the committed file, so a `REPO_URL` change fails it
  until the manifest is regenerated.
- `.config/mise/tasks/i/version` accepts only a bump level; `1.0.0` from `6.0.2`
  needs `pnpm version 1.0.0 --no-git-tag-version` directly.
- Existing tags: `installer-v6.0.2` is the latest installer tag; the old
  unprefixed `v1.x` family exists but `installer-v1.0.0` does not.
- `@virajp.dev/claude-plugins` does not exist on npm (404 on 2026-09-04);
  `@askviraj/ai-plugins` latest is `6.0.2`.

**What stays untouched, and why.** The marketplace name `virajp-plugins`
(`scripts/src/marketplace.ts:155`, `scripts/src/check.ts:57`,
`installer/src/context.ts:165`, `.config/mise/tasks/plugins/local:45`, and every
`vwf@virajp-plugins` in docs) — it is keyed into every existing install's
dependency edge and cache path. On-disk names on user machines: the receipts dir
`<config>/ai-plugins/receipts` (`installer/src/index.ts:368`,
`uninstall.ts:503-508`), the payload path `~/.local/share/virajp/ai-plugins/`,
the mempalace state dir `$XDG_STATE_HOME/ai-plugins/mempalace`
(`plugins/vwf/hooks/mempalace-checkpoint.sh:26`), and the mempalace wing
`ai-plugins` (`mempalace.yaml:28`). Historical records: `docs/memory/**` and
`docs/plans/archived/**`. Generated: `bin/`, `.dev-marketplace/`,
`graphify-out/`. Unrelated products that share the `virajp` namespace:
`@askviraj/linter` (eslint config, stackgen packs, `.config/linter.yaml`,
`pre-commit-config.yaml`) and `virajp/tap/claude-status` /
`virajp/claude-status`.

**Gates covering the trees.** `pnpm vitest run` (installer and scripts suites),
`pnpm exec tsc --noEmit -p installer` and `-p scripts`, `mise run plugins:check`
(eleven rules; none names a GitHub URL or the npm package, only rule 2 names the
marketplace, which does not change), `mise run plugins:marketplace --check`,
`mise run plugins:inventory --check`, `mise run plugins:npm-normalize-test`,
`mise run i:build` (tsup, asserts `bin/installer.mjs`, smoke `--help`,
`pnpm pack --dry-run`), `mise run i:test` (hermetic E2E under `E2E_HOME`).

**Docs that describe today's behaviour.** `readme.md`, `CLAUDE.md`,
`installer/CLAUDE.md`, `docs/installer/{index,usage,targets,internals}.md`,
`docs/plugins/{vwf,stackgen,karpathy-guidelines}.md`,
`docs/how-to/greenfield/*.md`,
`docs/how-to/brownfield/onboard-existing-codebase.md`,
`.claude/docs/{ci-and-releases,plugins,dev-marketplace}.md`,
`.claude/docs/installer/packaging.md`, `.claude/skills/release/SKILL.md:140`,
`.claude/agents/target-verifier.md`.

**Dependencies already available.** Root: `jsonc-parser`, `write-file-atomic`
(runtime), `tsup`, `typescript`, `vitest`, `yaml`, `sort-package-json`. The
sunset stub needs none.

## Assumed decisions — confirm or override at review

| #  | Decision                        | Ruling                                                                                                                                                                  | Rejected                                                                 | Unit         |
| -- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------ |
| 1  | Command name (reversal)         | The bin key becomes `claude-plugins`                                                                                                                                    | Keep `ai-plugins` under the new package                                  | U1           |
| 2  | Marketplace name                | `virajp-plugins` stays                                                                                                                                                  | Rename it too; every existing install would need re-adding               | none         |
| 3  | Sunset stub form                | A standalone package under `sunset/`: `package.json`, one dependency-free `ai-plugins.mjs`, a `readme.md` saying the package moved. Not a workspace member, no build    | A runtime branch in the real installer; a throwaway dir outside the repo | U4           |
| 4  | Sunset stub version             | `7.0.0` of `@askviraj/ai-plugins`                                                                                                                                       | `6.1.0`; any bump above 6.0.2 works, major says "breaking"               | U4           |
| 5  | Stub behaviour                  | Ignores every argument; writes the pointer to stderr, nothing to stdout; exits `1`                                                                                      | Exit 0; honouring `--help`                                               | U4           |
| 6  | Stub publish path               | Manual `npm publish` by the user from `sunset/`, after the new package's first release is live, plus `npm deprecate`                                                    | Re-pointing the old Trusted Publisher and adding a `sunset.yml` workflow | none         |
| 7  | New package version             | `1.0.0`, a fresh start; the bump unit runs `pnpm version 1.0.0 --no-git-tag-version` directly                                                                           | `7.0.0` continuing the line; extending `i:version` with a set flag       | U7           |
| 8  | `setup/ai` pack shape           | Explicit `source\|name` pairs — `virajp/claude-plugins\|virajp-plugins` — replacing the basename derivation; the `\|\| true` stays                                      | Path-only edit, parking the no-op                                        | U3           |
| 9  | Internal names                  | `@claude-plugins/installer`, `@claude-plugins/scripts`, `--name 'claude-plugins'` in `mise.dev.toml`, `CLAUDE_PLUGINS_SOURCE_DIR`, `projectName: virajp/claude-plugins` | Leave them and allowlist them in the grep                                | U1, U2, U5   |
| 10 | Root `package.json` ownership   | U1 edits `name`, `description`, `repository`, `bin`; U7 edits `version` only                                                                                            | One unit for all fields                                                  | U1, U7       |
| 11 | Generated manifest after wave 1 | The orchestrator runs `mise run plugins:marketplace` after wave 1 and before its gate, because U2 changes the generator's inputs                                        | Deferring regeneration to U7, which would fail the wave-1 gate           | orchestrator |
| 12 | GitHub rename timing            | Done by the user before the run; preflight halts if `gh repo view` still reports `ai-plugins`, then sets the local `origin` URL                                         | Run first and rename after; the run renaming via `gh repo rename`        | preflight    |
| 13 | Wave gate additions             | `mise run i:build` and `mise run i:test` join the standard gate                                                                                                         | Vitest alone; the E2E asserts strings this plan changes                  | all          |
| 14 | On-disk names                   | Receipts dir, payload path, mempalace state dir and wing all stay                                                                                                       | Renaming them, which strands existing state on user machines             | none         |

## New dependencies

none. The sunset stub is plain Node with no imports beyond `node:process`.

## Units

| Id | Wave | Unit file                                                            | Owns                                                                                                                                                                                                                                                                          | Depends on | Status | Commit |
| -- | ---- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------ |
| U1 | 1    | [01-installer-source.md](01-installer-source.md)                     | `installer/src/**`, `installer/package.json`, root `package.json` (`name`, `description`, `repository`, `bin` only), `tsup.config.ts`                                                                                                                                         | —          | green  | 84ff05 |
| U2 | 1    | [02-generator-and-vwf-manifest.md](02-generator-and-vwf-manifest.md) | `scripts/src/marketplace.ts`, `scripts/src/marketplace.test.ts`, `scripts/package.json`, `plugins/vwf/.claude-plugin/plugin.json` (`repository` field only)                                                                                                                   | —          | green  | 20ee0d |
| U3 | 1    | [03-stackgen-setup-ai-pack.md](03-stackgen-setup-ai-pack.md)         | `plugins/stackgen/stacks/toolchain-manager/mise/config/.config/mise/tasks/setup/ai`                                                                                                                                                                                           | —          | green  | c8bb3f |
| U4 | 1    | [04-sunset-stub.md](04-sunset-stub.md)                               | `sunset/**`                                                                                                                                                                                                                                                                   | —          | green  | a847d1 |
| U5 | 1    | [05-repo-config.md](05-repo-config.md)                               | `.config/mise/tasks/i/publish`, `.config/mise/tasks/i/release`, `.config/mise/tasks/i/test`, `.config/mise/tasks/setup/ai`, `.config/mise.dev.toml`, `.config/claude-status.json`, `.config/git-conventional-commits.yaml`, `.github/workflows/release.yml`, `mempalace.yaml` | —          | green  | 176d52 |
| U6 | 2    | [06-docs.md](06-docs.md)                                             | `readme.md`, `CLAUDE.md`, `installer/CLAUDE.md`, `docs/**` except `docs/memory/**` and `docs/plans/**`, `.claude/docs/**`, `.claude/skills/**`, `.claude/agents/**`, `docs/memory/decisions/2026-09-04-installer-command-follows-the-package.md`                              | all wave 1 | green  | d02982 |
| U7 | 3    | [07-gates-and-bump.md](07-gates-and-bump.md)                         | root `package.json` (`version` only), `plugins/stackgen/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                                                                                                                | U6         | green  | 99d59a |

Status is one of `pending`, `running`, `green`, `failed`, `unresolved`,
`skipped`.

## Shared-file rule

| File                                                                      | Why it collides                                               | Owner                                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| root `package.json`                                                       | U1 changes identity fields; U7 sets the version               | U1 for `name`/`description`/`repository`/`bin`; U7 for `version` only |
| `plugins/vwf/.claude-plugin/plugin.json`                                  | U2 changes `repository`; the bump unit normally owns versions | U2 for `repository` only; nobody bumps vwf this plan                  |
| `plugins/stackgen/.claude-plugin/plugin.json`                             | one version bump                                              | U7 only                                                               |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md` | generated; regenerating mid-wave races                        | orchestrator after wave 1 (manifest only); U7 at the end              |
| `readme.md`, `CLAUDE.md`, `installer/CLAUDE.md`, `docs/**`, `.claude/**`  | n units editing one doc                                       | U6 only                                                               |
| `.config/mise/tasks/i/test`                                               | asserts strings U1 changes                                    | U5 only; U1 reports the new strings in its return block               |

## Waves

- **Wave 1 — U1, U2, U3, U4, U5.** Five disjoint path sets; no unit reads
  another's output. The E2E in `i/test` asserts strings U1 changes and U5
  rewrites the assertion, so the gate is meaningful only once both land, which
  is the wave boundary. After wave 1 and before its gate, the orchestrator runs
  `mise run plugins:marketplace` (decision 11).
- **Wave 2 — U6.** Docs, after the code diff is final.
- **Wave 3 — U7.** Versions, generators, full gate, real-install proof.

## Wave gate

`mise run plugins:check`, `mise run plugins:marketplace --check`,
`mise run plugins:inventory --check`, `pnpm vitest run`,
`pnpm exec tsc --noEmit -p installer` and `-p scripts`,
`mise run plugins:npm-normalize-test`, **`mise run i:build`**,
**`mise run i:test`**, plus the wave review, plus every report read for
`UNRESOLVED:`.

## Gates the orchestrator keeps

- **Preflight.** `gh repo view --json name -q .name` prints `claude-plugins`;
  otherwise halt with *"rename the GitHub repo first"*. Then set the local
  remote: `git remote set-url origin git@github.com:virajp/claude-plugins.git`
  and confirm `git fetch origin` succeeds.
- **Sunset stub smoke** (after wave 1): `node sunset/ai-plugins.mjs --all` exits
  `1`, writes nothing to stdout, and stderr contains both
  `@virajp.dev/claude-plugins` and `github.com/virajp/claude-plugins`.
  `cd sunset && npm pack --dry-run` lists exactly `package.json`,
  `ai-plugins.mjs`, `readme.md`.
- **Rename grep** (after wave 2):
  `grep -rn "ai-plugins" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=bin --exclude-dir=.dev-marketplace --exclude-dir=graphify-out .`
  returns hits only under `docs/memory/`, `docs/plans/`, `sunset/`,
  `mempalace.yaml:28` (the wing), and lines that are the on-disk names
  (`ai-plugins/receipts`, `share/virajp/ai-plugins`, `ai-plugins/mempalace`) or
  the receipts-dir E2E seed. Any other hit is a missed reference and goes back
  to the owning unit. `grep -rn "askviraj/ai-plugins"` with the same excludes
  returns hits only under `docs/memory/`, `docs/plans/`, `sunset/`, and passages
  that deliberately name the old package as sunset (readme,
  `docs/installer/index.md`, the decisions doc).
- **`target-verifier`** (in U7): a hermetic `CLAUDE_CONFIG_DIR` run proving
  `claude plugin marketplace add virajp/claude-plugins` registers
  `virajp-plugins` and `claude plugin install vwf@virajp-plugins` lands, and
  that `node bin/installer.mjs --user vwf --dry-run` names those two commands.
  Pass condition: both land, and the uninstall path leaves nothing behind.

## Post-landing manual sequence

Owned by the user, in this order, after execute-plan stops before the `main`
merge:

1. Merge `develop` → `main` and push.
2. `mise run i:build && mise run i:publish` — the **first, manual** publish of
   `@virajp.dev/claude-plugins@1.0.0` under the user's npm login. npm cannot
   configure Trusted Publishing for a package that does not exist yet.
3. On npmjs.com → the new package → Settings → Trusted publishing: add
   `virajp/claude-plugins` + `release.yml`.
4. `mise run i:release` — tags `installer-v1.0.0`; `release.yml` finds `1.0.0`
   already on npm and skips the publish, which proves the workflow wiring.
5. `mise run plugins:release` for stackgen (minor).
6. `cd sunset && npm publish --access public` — `@askviraj/ai-plugins@7.0.0`.
7. `npm deprecate "@askviraj/ai-plugins@*" "Moved to @virajp.dev/claude-plugins — run: pnpx @virajp.dev/claude-plugins"`.

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

- **Renaming the marketplace `virajp-plugins`.** It is keyed into every existing
  install; the user chose to keep it.
- **On-disk names on user machines** — receipts dir, payload path, mempalace
  state dir, mempalace wing. Renaming strands existing state; a migration would
  be its own plan.
- **`docs/memory/**` and `docs/plans/archived/**`.** Historical records that
  mirror mempalace drawers; editing them falsifies the record.
- **The local checkout folder** `~/Projects/github.com/virajp/ai-plugins`. The
  user's to rename afterwards; note it moves this repo's Claude Code
  project-memory directory, which is keyed on the path.
- **`@askviraj/linter`, `virajp/tap/claude-status`, `virajp/claude-status`.**
  Different products in the same namespace.
- **A vwf release.** Only its `repository` URL changes; GitHub redirects the old
  one; it ships with the next vwf release.
- **`graphify-out/`.** Generated artifact.
- **Renaming the `installer-v*` tag family or removing old `v*` tags.** Not
  asked for.

## Parked

none

## Run log

| Wave | Unit            | Model   | Round | Outcome     | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Commit |
| ---- | --------------- | ------- | ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0    | preflight       | —       | 1     | green       | `gh repo view` reports `claude-plugins`; origin already `git@github.com:virajp/claude-plugins.git`, fetch ok; all nine gate lines green on `develop` (65db1a97)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | —      |
| 1    | U2              | inherit | 1     | green       | 4 files; DOCS FALSIFIED `.claude/docs/plugins.md:76` (worked-example source.url); byte-identical manifest test red until the orchestrator regenerates (decision 11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 20ee0d |
| 1    | U3              | inherit | 1     | green       | 1 file; DECIDED loop vars `row`/`source`/`name` as the plan's snippet spells them; DECIDED print format `- <source> (<name>)`; no docs falsified                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | c8bb3f |
| 1    | U4              | inherit | 1     | green       | 3 new files under `sunset/`; DECIDED a four-line header comment in `ai-plugins.mjs`; smoke passed (exit 1, empty stdout, both names on stderr, pack lists exactly 3 files)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | a847d1 |
| 1    | U5              | inherit | 1     | green       | 9 files; `release.yml` diff is 4 lines, trigger surface untouched; GAP: `i:test` red only on `marketplace.test.ts:41` pending the orchestrator's regeneration (decision 11), every E2E assertion passes                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 176d52 |
| 1    | U1              | inherit | 1     | green       | 14 files; DECIDED description prefixed not rewritten, index.ts override comment shortened, temp-dir prefixes kept; DOCS FALSIFIED `installer/CLAUDE.md:1,11,16,44`, `.claude/docs/installer/packaging.md:48` (`AI_PLUGINS_SOURCE_DIR` → `CLAUDE_PLUGINS_SOURCE_DIR`); GAP `config.test.ts` `AI_PLUGINS_USAGE_DIR` is fixture data, left; GAP manifest test red pending regeneration                                                                                                                                                                                                                                                                         | 84ff05 |
| 1    | orchestrator    | —       | 1     | green       | ran `plugins:marketplace` (decision 11): manifest diff is 3 source.url lines; sunset smoke gate passed (exit 1, 0 stdout bytes, both names on stderr, pack lists exactly `ai-plugins.mjs`, `package.json`, `readme.md`)                                                                                                                                                                                                                                                                                                                                                                                                                                     | —      |
| 1    | R1              | inherit | 1     | findings(2) | CONTRACT clean, RULINGS clean. (a) `tsup.config.ts:10` `@ai-plugins/schema`, tmpdir prefixes `ai-plugins-*` in five test files, `AI_PLUGINS_USAGE_DIR` fixture in `config.test.ts` sit outside the rename-grep allowlist — U1/U2 unit files explicitly permit them, so recorded as GAP: assumption is that internal identifiers that name neither the repo nor the package are allowlisted; (b) `installer/src/index.ts:320` comment hard-wrapped — looped to U1                                                                                                                                                                                            | —      |
| 1    | U1              | inherit | 2     | green       | `index.ts` comment rejoined and re-folded; dprint, installer suite and tsc clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 84ff05 |
| 1    | R1              | inherit | 2     | pass        | FINDINGS 0, CONTRACT clean, RULINGS clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | —      |
| 1    | gate            | —       | 1     | green       | all eleven lines green (233 tests, `i:build` packs `@virajp.dev/claude-plugins`, `i:test` E2E asserts the new marketplace string); no `UNRESOLVED:` in any report                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | —      |
| 1    | commit          | —       | 1     | green       | 5 unit commits; U2 and U4 needed a second commit after the dprint hook reflowed one line each; DECIDED `chore` → `ops` for U5 (and U7) since the conventional-commits config allows only ops/docs/merge/feat/fix/refactor                                                                                                                                                                                                                                                                                                                                                                                                                                   | 13139f |
| 2    | docs-reconciler | inherit | 1     | findings    | 3 doctrine passages (bin key/Trusted Publisher) to rewrite, 1 stale Trusted-Publisher setup passage in `ci-and-releases.md`, plus mechanical token swaps across readme/docs/.claude; full report at `/tmp/docs-reconciler-wave1.md` passed to U6                                                                                                                                                                                                                                                                                                                                                                                                            | —      |
| 2    | U6              | inherit | 1     | green       | 16 files incl. the new decisions doc; every wave-1 DOCS FALSIFIED applied; DECIDED stackgen.md, target-verifier.md, stackgen-plugin/vwf-plugin skills untouched (no false passage), task-library.md row skipped (under plugins/**, outside Owns, marked optional); GAP verification grep hits only the plan folder quoting the overturned doctrine; GAP dprint reports only index.md, which the orchestrator owns                                                                                                                                                                                                                                           | d02982 |
| 2    | grep gate       | —       | 1     | green       | no missed reference. Beyond the literal allowlist: deliberate sunset passages in `CLAUDE.md:91`, `installer/CLAUDE.md:49`, `.claude/docs/ci-and-releases.md:177,184`; the receipts-dir parent name in `.claude/docs/installer/receipts.md:140` and `installer/src/uninstall.ts:503,508`; the internal identifiers recorded as GAP at R1 round 1                                                                                                                                                                                                                                                                                                             | —      |
| 2    | R2              | inherit | 1     | findings(1) | CONTRACT clean, RULINGS clean. `installer/CLAUDE.md:47` doctrine rewrite appends an unrequested fourth sunset clause — looped to U6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | —      |
| 2    | gate            | —       | 1     | green       | all eleven lines green (233 tests); dprint reports only the plan index, which the commit hook re-pads                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | —      |
| 2    | U6              | inherit | 2     | green       | `installer/CLAUDE.md` passage trimmed to the reconciler wording; sunset fact now on the three reconciler surfaces plus the one sentence edit 4 asks for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | d02982 |
| 2    | R2              | inherit | 2     | pass        | FINDINGS 0, CONTRACT clean, RULINGS clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | —      |
| 3    | U7              | inherit | 1     | green       | installer 6.0.2 → 1.0.0, stackgen 0.20.0 → 0.21.0, manifest regenerated (inventory byte-identical); DECIDED `--version` exit 1 on the expected npm 404 is the designed path; all eleven gate lines pass, `i:build` packs `@virajp.dev/claude-plugins@1.0.0`; GAP target-verifier: marketplace add, dry-run and marketplace remove PASS, `plugin install vwf` FAILS on `Remote branch vwf-v19.9.1 not found` — INHERITED: orchestrator confirmed via `git ls-remote` that `main` pins vwf-v19.9.1/stackgen-v0.19.0 but the newest tags are vwf-v19.9.0/stackgen-v0.18.0, so no plugin is installable from `main` today; needs `plugins:release` post-landing | 99d59a |
| 3    | R3              | inherit | 1     | pass        | FINDINGS 0, CONTRACT clean, RULINGS clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | —      |
| 3    | gate            | —       | 1     | green       | all eleven lines green (233 tests); root package is `@virajp.dev/claude-plugins 1.0.0` with bin `claude-plugins`; stackgen 0.21.0, vwf 19.10.0 untouched                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | —      |

## Launch

Run in a fresh session:

/execute-plan docs/plans/2026-09-04-rename-to-claude-plugins
