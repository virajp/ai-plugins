---
type: repo-plan
title: Drift sweep — reconcile every tree's prose with the code
requires: []
---

# Plan — Drift sweep — reconcile every tree's prose with the code (2026-09-04)

## Status

**RUNNING** — started 2026-09-04, worktree `.worktrees/2026-09-04-drift-sweep`,
branch `2026-09-04-drift-sweep`

APPROVED 2026-09-04 by the user.

## Consent

| Action                                   | Granted |
| ---------------------------------------- | ------- |
| Merge to `develop` and push on green run | yes     |
| Release `vwf`                            | minor   |
| Release `stackgen`                       | minor   |
| Release installer                        | none    |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`.

## Goal

After this lands, every claim in `plugins/vwf`, `plugins/stackgen`, the
maintainer docs (`CLAUDE.md`, `installer/CLAUDE.md`, `.claude/**`) and the user
docs (`readme.md`, `docs/installer/`, `docs/plugins/`, `docs/how-to/`) matches
what the code and the tree do today, and `plugins:check` carries a twelfth rule
that fails the recurrence class — retired vocabulary stated as live.

The framing: a full drift scan on 2026-09-04 found every mechanical gate green
(checker, generated files, 233 tests, typecheck, format, lint) and 56 confirmed
prose findings across four surveys, plus three release-state gaps that are
operations rather than edits. No standing decision is reversed. The one finding
that is a recorded gap rather than drift — the unreachable `uv` and `ruff` packs
— stays with its gap note.

## Facts the survey established

**Versions and refs.** vwf `19.10.0`, stackgen `0.21.0`; marketplace refs and
tags agree; the dev marketplace is staged at the same versions. Root
`package.json` is `@virajp.dev/claude-plugins` `1.0.0`, published to npm by hand
on 2026-09-04; no `installer-v1.0.0` tag exists. `installer-v6.0.2` exists with
no GitHub Release. `sunset/` (`@askviraj/ai-plugins` `7.0.0`) is unpublished;
npm's latest is `6.0.2`, not deprecated.

**Gates that cover the trees.** `plugins:check` (eleven rules,
`scripts/src/check.ts`, validates `plugins/` only),
`plugins:marketplace
--check`, `plugins:inventory --check`,
`plugins:npm-normalize-test`, `vitest
run`, `tsc --noEmit` per package, dprint,
the linter. Pre-commit runs `plugins-check` (line 27) before
`plugins-marketplace` (42) and `plugins-inventory` (53); `plugins.yml` runs
marketplace, inventory, then check. vitest and tsc run only in `plugins.yml`.

**Authoritative sources the fixes align to.**

- Platform vocabulary: `plugins/vwf/assets/standard-flows.md:116-133` — six
  screen platforms `mobile | tablet | desktop | auto | site | webapp`; `web`
  retired at format 22.
- Axes: `plugins/vwf/assets/stack-adapter.md:162,229` —
  `project | backing |
  deploy | repo | design | cicd`. stackgen ships bundles
  on all six.
- UX gate: `plugins/vwf/assets/stack-adapter.md:325-334` — the repo's own
  unprefixed `ux-gate` skill;
  `plugins/stackgen/stacks/language/typescript/skills/ux-gate/SKILL.md:2`.
- Template payload:
  `plugins/stackgen/skills/stackgen-stack-template/SKILL.md:70-95`. Bundle
  frontmatter is exactly `name`, `axis`, `kind`, `components` (all 32 files in
  `plugins/stackgen/stacks/bundles/`). Facts live in `pack.yaml`.
- Harness capabilities: `plugins/vwf/assets/harness.md:12-21` — eight; the stamp
  schema at `plugins/vwf/assets/vwf-config.md:93-100` and the example at
  `harness.md:46-55` carry six. `goldens` and `test:load` are read by
  `plugins/vwf/skills/plan/references/delta-checks.md` and
  `plugins/vwf/assets/delivery-pipeline.md`.
- Categories: `plugins/stackgen/assets/taxonomy.md:86-87` — cloud-service is
  `compute / sql / document / queue / object-storage / cdn / access`.
- Composition order: `plugins/stackgen/assets/output-tree.md:133`, repeated at
  `plugins/stackgen/skills/stackgen-sync/SKILL.md:59`. Five packs ship a
  `config/` tree: flutter, pnpm, uv, ruff, mise.
- Service-lifecycle task: `stack:up` is used by eight packs and the mise task
  library; `setup:deps:*` is the closed package-manager verb table
  (`plugins/stackgen/stacks/toolchain-manager/mise/skills/mise/references/task-library.md:190-198`).
- Invocation states: `plugins/stackgen/assets/artifact-doctrine.md:44-48`; both
  language-bundle routers carry `user-invocable: false` plus `paths:`.
- Installer flags and behaviour: `installer/src/args.ts:78` (`--all`),
  `installer/src/install.ts:51,95,133-135,163-171` (never auto-updates),
  `installer/src/uninstall.test.ts:477` (legacy-receipt reader tests).
- Doctor's mise rule: `plugins/vwf/skills/doctor/SKILL.md:157-161` — blocking
  once a stack axis is pinned; `readme.md:64-66` states it correctly.
- Feedback kinds: `plugins/vwf/skills/feedback/SKILL.md:86-93` — six.
- Design-adapter halts: `plugins/vwf/assets/design-adapter.md:96-102` — three.
- Text-only design path:
  `plugins/vwf/skills/design-system/SKILL.md:63-66,74-77`.
- Role vocabulary collapse: format 22
  (`plugins/vwf/assets/templates/registry.yaml:23-27`,
  `plugins/vwf/skills/setup/references/format-lineage.md:43`).

**Docs that describe today's behaviour** (the docs units' list): `readme.md`,
`CLAUDE.md`, `installer/CLAUDE.md`, `.claude/docs/*.md`,
`.claude/skills/plugin-authoring/**`, `.claude/skills/vwf-plugin/**`,
`.claude/skills/stackgen-plugin/**`, `.claude/agents/target-verifier.md`,
`docs/installer/*.md`, `docs/plugins/*.md`, `docs/how-to/**`.

**Dependencies available.** None needed; every edit is prose, YAML, or a
TypeScript rule in `scripts/` using what `check.ts` already imports.

## Assumed decisions — confirm or override at review

| #  | Decision                                  | Ruling                                                                                                                                                                                                                                                                                                                 | Rejected                                                   | Unit           |
| -- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------- |
| 1  | Retired `web` platform token              | Replace with `site` / `webapp` per `standard-flows.md` at every live site; screens brief filenames become `site.md \| webapp.md`; example platform files title `— webapp`. Lineage and synonym-normalization rows are untouched.                                                                                       | leave synonyms                                             | U1, U2         |
| 2  | UX gate name                              | The unprefixed `ux-gate` per `stack-adapter.md:325-334`, at all five sites.                                                                                                                                                                                                                                            | re-prefix                                                  | U1, U2         |
| 3  | Axis count                                | Six everywhere, per `stack-adapter.md`'s enum.                                                                                                                                                                                                                                                                         | keep "four" as historical                                  | U1, U2         |
| 4  | Template shape in vwf (user-confirmed)    | vwf stops describing stackgen's template shape: delete the per-axis frontmatter blocks and the `stacks/project/<slug>.md` / `stacks/<axis>/<slug>.md` path claims; keep only the payload contract. Drop the "`plugins:check` enforces `axis:`" claim. Drop `private_plane` from both plugins.                          | rewrite to describe pack.yaml; keep private_plane on packs | U1, U3         |
| 5  | Harness capabilities (user-confirmed)     | Stamp schema and example gain `goldens` and `test:load`; Flutter's harness key renames `screenshots` → `goldens`, same task `test:golden`.                                                                                                                                                                             | drop the two capabilities; leave Flutter as screenshots    | U1, U3         |
| 6  | Firebase categories (user-confirmed)      | taxonomy's cloud-service list gains `identity` and `messaging`; `firebase-auth` sets `identity`, `firebase-messaging` sets `messaging`.                                                                                                                                                                                | relax the rule                                             | U3             |
| 7  | Composition order (user-confirmed)        | `toolchain-manager`, then `package-manager` / `language`, then `toolchain-gate`, then `app-framework` — in both files that state it.                                                                                                                                                                                   | gate before package-manager; a collision-forbidding rule   | U3             |
| 8  | `kinds.md:74` invocation ruling           | Doc follows the packs: "routers paths-scoped", matching the app-framework ruling at `kinds.md:683`.                                                                                                                                                                                                                    | flip both routers to model-invocable                       | U3             |
| 9  | Emulator-start task name                  | `stack:up` in flutter's `firebase-auth.md:49`.                                                                                                                                                                                                                                                                         | `setup:external:*`                                         | U3             |
| 10 | `pack-format.md:12-15` framing            | States the present: eight `toolchain-gate` packs, no curated plugins. Same at `stackgen-stack-template/SKILL.md:91`.                                                                                                                                                                                                   | keep the wave narrative                                    | U3             |
| 11 | Counts in prose (user-confirmed)          | Volatile counts (mempalace tool count, `/vwf:` command count) are removed; structural ones corrected (four repo gates, eight TypeScript bundles, "the other entry"); version examples become `X.Y.Z` placeholders.                                                                                                     | restate every number; drop every number                    | U2, U3, U6, U7 |
| 12 | Gate order (user-confirmed)               | `plugins-marketplace` and `plugins-inventory` move above `plugins-check` in pre-commit; docs say vitest and tsc are CI-only.                                                                                                                                                                                           | docs only; add vitest/tsc to pre-commit                    | U5, U7         |
| 13 | Vendored files (user-confirmed)           | Edited: dead links dropped from the two mempalace skills, the Cursor auto-registration claim and tool count dropped, the karpathy README's renderer note becomes a plain statement of where the vendored copy is used.                                                                                                 | leave untouched                                            | U2             |
| 14 | New gate (user-confirmed)                 | A twelfth `plugins:check` rule: a short retired-vocabulary list failing outside exemptions. Line-level exemption when the line carries `retired`, `migration`, `→`, `pre-22` or `format 2N`; `skills/setup/references/format-lineage.md` exempt whole. The unit tunes the patterns until the tree passes after wave 1. | file-only allowlist; no gate; gate plus release-skill step | U4             |
| 15 | `language-plugins.md`                     | Deleted; its reference dropped from `plugin-authoring/SKILL.md`. stackgen's `language-bundle` kind is the successor.                                                                                                                                                                                                   | mark historical                                            | U7             |
| 16 | Design tool in `docs/plugins/vwf.md`      | "The design tool", agnostic; Claude Design named only as an example where one helps.                                                                                                                                                                                                                                   | keep as the tool                                           | U6             |
| 17 | Doctor's mise rule in installer docs      | Conditional wording matching `readme.md:64-66`.                                                                                                                                                                                                                                                                        | change the readme                                          | U6             |
| 18 | Upgrade path in `migrate-old-vwf-repo.md` | `claude plugin marketplace update virajp-plugins` then `claude plugin update vwf`.                                                                                                                                                                                                                                     | make the installer update                                  | U6             |
| 19 | `setup/ai` task                           | Runs `pnpx @virajp.dev/claude-plugins --all` only.                                                                                                                                                                                                                                                                     | delete the task                                            | U5             |
| 20 | Small vwf contradictions                  | `memory.md` example seeds the seven protocol rooms; `runtime-settings.md` places the settings entity at `docs/blueprint/entities/settings/`; `execute-stages.md:91` says every screen surface, not "web".                                                                                                              | —                                                          | U1, U2         |
| 21 | `target-verifier.md`                      | Five claims rewritten to current reality; the "Receipt:" line in its output section dropped.                                                                                                                                                                                                                           | delete the agent                                           | U7             |
| 22 | `dependencies.md:17-20` spliced sentence  | Predicate restored from `git log -p` on the file.                                                                                                                                                                                                                                                                      | rewrite freely                                             | U7             |
| 23 | Installer release                         | None — no `installer/` source changes.                                                                                                                                                                                                                                                                                 | —                                                          | U8             |
| 24 | Model per unit                            | Inherit.                                                                                                                                                                                                                                                                                                               | —                                                          | all            |
| 25 | Release-state operations (user-confirmed) | Documented in the post-landing checklist below; the user runs them after the plan lands.                                                                                                                                                                                                                               | out of scope; skip                                         | —              |

## New dependencies

none

## Units

| Id | Wave | Unit file                                          | Owns                                                                                                                                                                               | Depends on | Status  | Commit   |
| -- | ---- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- | -------- |
| U1 | 1    | [01-vwf-assets.md](01-vwf-assets.md)               | `plugins/vwf/assets/**`                                                                                                                                                            | —          | green   | 47feef3a |
| U2 | 1    | [02-vwf-skills-agents.md](02-vwf-skills-agents.md) | `plugins/vwf/skills/**`, `plugins/vwf/agents/**`, `plugins/vwf/vendor/**`                                                                                                          | —          | green   | 16ea66ef |
| U3 | 1    | [03-stackgen.md](03-stackgen.md)                   | `plugins/stackgen/**` except `plugins/stackgen/stacks/inventory.md` and `plugins/stackgen/.claude-plugin/plugin.json`                                                              | —          | green   | 952b92f3 |
| U4 | 1    | [04-checker-rule.md](04-checker-rule.md)           | `scripts/src/check.ts`, `scripts/src/check.test.ts`                                                                                                                                | —          | green   | b2887eeb |
| U5 | 1    | [05-repo-tooling.md](05-repo-tooling.md)           | `.config/pre-commit-config.yaml`, `.config/mise/tasks/setup/ai`, `.config/mise/tasks/plugins/marketplace`, `.config/mise/tasks/plugins/release`, `.gitignore`, `vitest.config.mts` | —          | green   | 8ae7c29f |
| U6 | 2    | [06-docs-user.md](06-docs-user.md)                 | `readme.md`, `docs/installer/**`, `docs/plugins/**`, `docs/how-to/**`                                                                                                              | U1–U5      | green   | 6b53fe47 |
| U7 | 2    | [07-docs-maintainer.md](07-docs-maintainer.md)     | `CLAUDE.md`, `installer/CLAUDE.md`, `.claude/docs/**`, `.claude/skills/**`, `.claude/agents/**`                                                                                    | U1–U5      | green   | 3426114a |
| U8 | 3    | [08-gates-and-bump.md](08-gates-and-bump.md)       | `plugins/vwf/.claude-plugin/plugin.json`, `plugins/stackgen/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                 | U6, U7     | pending |          |

Status is one of `pending`, `running`, `green`, `failed`, `unresolved`,
`skipped`.

## Shared-file rule

| File                                                                      | Why it collides                                                                               | Owner   |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------- |
| `plugins/*/.claude-plugin/plugin.json`                                    | several units bumping one version is a lost update; stackgen's description fix rides the bump | U8 only |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md` | generated; regenerating mid-wave races                                                        | U8 only |
| `readme.md`, `docs/installer/**`, `docs/plugins/**`, `docs/how-to/**`     | n units editing one doc                                                                       | U6 only |
| `CLAUDE.md`, `installer/CLAUDE.md`, `.claude/**`                          | n units editing one doc                                                                       | U7 only |
| `plugins/vwf/assets/**`                                                   | U2's skills cite these assets; only U1 edits them                                             | U1 only |
| `docs/memory/**`, `docs/plans/**`                                         | historical record                                                                             | nobody  |

## Waves

- **Wave 1** — U1, U2, U3, U4, U5. Five disjoint trees. U4's new rule may fail
  on a site U1–U3 missed; the wave gate surfaces it and the finding loop routes
  the fix to the owning unit, which is the rule doing its job.
- **Wave 2** — U6, U7. The two docs units, split by audience on disjoint paths;
  each applies the `docs-reconciler` findings that fall in its tree plus every
  `DOCS FALSIFIED:` line wave 1 returned for its tree.
- **Wave 3** — U8. Bumps, generators, the full gate, `target-verifier`.

## Wave gate

`mise run plugins:check`, `mise run plugins:marketplace --check`,
`mise run plugins:inventory --check`, `pnpm vitest run`,
`pnpm exec tsc --noEmit -p installer` and `-p scripts`,
`mise run plugins:npm-normalize-test`, `mise run code:format` and
`mise run code:lint`, plus the wave review, plus every report read for
`UNRESOLVED:`. After wave 1 the gate includes the new twelfth rule, which must
pass on the whole `plugins/` tree.

Plan-specific greps, run by the orchestrator after wave 1 and again after wave
2, each expected to return only lineage, migration or synonym rows:

```sh
grep -rn '`web`' plugins/vwf --include='*.md' | grep -v 'format-lineage\|retired\|migration\|→'
grep -rn -- '-ux-gate' plugins/vwf
grep -rn 'four axes\|four stack\|four independent\|four menus\|four stack rounds' plugins/ docs/ readme.md CLAUDE.md .claude/
grep -rn 'stacks/project/\|assets/stacks/' plugins/vwf | grep -v 'format-lineage\|retired\|migration\|→'
grep -rn 'private_plane' plugins/
grep -rn 'Sixteen\|five repo gates\|twelve TypeScript\|33 MCP tools\|36 tools' readme.md docs/ plugins/ .claude/
```

## Gates the orchestrator keeps

- **`target-verifier`** in U8, since both plugins changed. Pass condition: both
  plugins install hermetically from the dev marketplace at their bumped
  versions; `claude plugin validate --strict` passes; in a scratch repo with a
  Flutter project pinned, `/vwf:doctor`'s harness check reads a stamp carrying
  `goldens` without reporting an unknown key.
- **Pre-commit dry run** after U5: `mise x -- pre-commit run --all-files` shows
  `plugins-marketplace` and `plugins-inventory` before `plugins-check`.

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

## Post-landing checklist

The user runs these by hand after the plan lands; none is a unit and
execute-plan never runs them.

1. Tag `installer-v1.0.0` on the commit that was published to npm as `1.0.0`
   (the `ops(release): installer 1.0.0` commit on `main`) and cut its GitHub
   Release per `.claude/skills/release/SKILL.md` §3. Pushing the tag triggers
   `release.yml`; since `1.0.0` already exists on npm the publish step will fail
   as a republish — run the workflow with the Trusted Publisher configured and
   accept that failure, or cut the tag without pushing it to CI.
2. Cut the GitHub Release for `installer-v6.0.2`, which has none.
3. Publish the sunset stub and deprecate the old name, per
   `.claude/docs/ci-and-releases.md`:

   ```sh
   cd sunset && npm publish --access public
   npm deprecate "@askviraj/ai-plugins@*" "Moved to @virajp.dev/claude-plugins"
   ```

## Out of scope

- **`docs/memory/**` and `docs/plans/archived/**`.** Historical records that
  mirror mempalace drawers; editing them falsifies the record. Their
  `ai-plugins` wing name and old paths are correct as written.
- **The unreachable `uv` and `ruff` packs.** A recorded gap
  (`docs/memory/gaps/2026-09-01-python-packs-authored-but-unreachable.md`) whose
  closing is a python `language-bundle` wave of its own.
- **`docs/plugins/mempalace.md` beyond its tool-count line.** Not surveyed as
  drifted otherwise.
- **`@askviraj/linter`, the receipt directory, the mempalace state directory,
  the mempalace wing name.** Different products or on-disk names the rename plan
  deliberately kept.
- **Renaming or reordering anything in `installer/src/`.** No installer
  behaviour was found drifted; only docs about it were.
- **A new gate for wrong counts.** The retired-vocabulary rule does not catch a
  wrong number; counts stay a review concern.

## Parked

none

## Run log

| Wave | Unit            | Model   | Round | Outcome      | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Commit                                       |
| ---- | --------------- | ------- | ----- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0    | preflight       | —       | 1     | green        | check, marketplace, inventory, npm-normalize, vitest 231 pass, tsc x2, format, lint all green on develop cc75f9f8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | —                                            |
| 1    | U3              | inherit | 1     | green        | 12 files. DECIDED: readme:16 past-tense left; claude-code-plugin.md:46 screenshots+goldens n/a left. GAP: inventory --check now fails on firebase category rows (U8 regenerates). GAP: readme:161 enumeration sums to 22 not 32, no total claimed. GAP: U4 rule flags 12 stackgen sites outside edit list (-ux-gate x6, web x2, assets/stacks x1, devtools x2, four axes x1), left for the loop                                                                                                                                                                                                                                                                                                                                                                                                                                          |                                              |
| 1    | U5              | inherit | 1     | green        | 6 files. DECIDED: hook blocks moved with their comments; vitest timeout reason rewritten from measurement; pre-commit needs `-c .config/pre-commit-config.yaml`. GAP: inventory and check fail on other units' in-flight work, assumed the wave gate's; order verified marketplace → inventory → check. GAP: pre-commit --all-files stripped trailing whitespace in one unidentified file outside its list. GAP: 43 check.test.ts failures are U4's live edit                                                                                                                                                                                                                                                                                                                                                                            |                                              |
| 1    | U1              | inherit | 1     | green        | 13 files. DECIDED: example flow H1s retitled with their titles; stack-vocabulary conventions paragraph rewritten off the deleted frontmatter; axis table gained design and cicd rows; two historical ux-gate sentences marked `retired` not deleted; memory.md room keywords invented, handoff row byte-copied. GAP: U4 rule still flags 13 vwf-assets lines ruling 1 keeps (7 vwf-config migration bullets with the token on a neighbour line, standard-flows:133 capital "Format 22", 4 sites using web as a project name) — left for U4's tuning. GAP: plan's web/ux-gate greps cannot return empty (4 project-name hits, lineage sentence, 2 `retired` sentences lacking the greps' excluded tokens). GAP: code:format flags only the plan index                                                                                     |                                              |
| 1    | U2              | inherit | 1     | green        | 18 files; check green, all four plan greps empty in its tree. DECIDED: platforms.md:55 reworded with `retired` on the line; three sites beyond the list fixed because the plan greps caught them (doctor:138, architecture:231, retired `invocation: both` in three import-* adapters and the karpathy README); stack-menu defer paragraph names the four deferrable rounds; axis table gained design/cicd; ux-reviewer "all three" → "every one". DOCS FALSIFIED: vwf-config.md:513 "all four axes" (U1's), stack-adapter.md:331 historical -ux-gate (U1/U4). GAP: architecture-writer.md:153 synonym row left per guardrail, later un-flagged; ~27 twelfth-rule hits outside its tree at the time                                                                                                                                      |                                              |
| 1    | U4              | inherit | 1     | green        | check.ts twelfth rule `checkRetiredVocabulary` (7 terms) + 25 fixture tests; tsc/lint clean. DECIDED: `web` fires only beside a backticked platform token or "token"; `<plugin>-ux-gate` placeholder excluded; `devtools` needs "plugin" without "uninstall"; exemption stems retire/migrat/dissolved/moved/→/pre-22/[Ff]ormat 2\d; scope is the line plus earlier lines of its paragraph. DOCS FALSIFIED: CLAUDE.md:54,130; repo-shape.md:69,141; plugin-authoring/references/checks.md:26; vwf-plugin/SKILL.md:41 ("eleven rules"). GAP: 7 live hits remain — U3: typescript-effect-cli.md:70, canvas-push.md:44, stacks/readme.md:153 (four stack axes), readme.md:66,74,148 (marker on the next line); U1: vwf-config.md:548 (marker on the next line). 2 vitest fails: corpus test on those 7, inventory.test on firebase rows (U8) |                                              |
| 1    | U1              | inherit | 2     | green        | mechanical re-dispatch for the gate's one vwf hit: vwf-config.md repo.stack migration paragraph opens with "still in this migration"; zero vwf findings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                              |
| 1    | U3              | inherit | 2     | green        | mechanical re-dispatch for the gate's six stackgen hits: effect-cli cites the npm-package bundle; canvas-push platform list six tokens; readme 66/74/148 carry retired/since-dissolved markers; readme:153 drops the count. DECIDED: canvas-push web → desktop synonym row kept. plugins:check passes on the whole tree                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                              |
| 1    | U4              | inherit | 2     | green        | mechanical re-dispatch: check.test.ts dprint-formatted; check suite 85 pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                                              |
| 1    | gate            | —       | 1     | green        | check, marketplace, npm-normalize, lint, tsc x2 green; format green after U4 round 2. Except: inventory --check and inventory.test.ts red on U3's firebase category rows, reserved for U8 by the shared-file rule. Plan greps: only lineage/migration/synonym rows in plugins/, plus wave-2 doc targets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                              |
| 1    | R1              | inherit | 1     | findings(17) | CONTRACT clean. RULINGS: U4 departed from #14 (paragraph-scope exemption, `dissolved`/`moved` added). U3: composition order still three-tier in materializer.md:57, pnpm/flutter/ruff conventions.md. U1: memory.md:166 planning room says docs/plans/; stack-vocabulary.md:121 fold. U2: fold at architecture/SKILL.md:234, flow-placement.md:14, import-screens/SKILL.md:32; stack-menu.md:19-20 claims a plugins' design/ and cicd/ directory (ruling 4). Docs unreported: vwf-plugin/references/assets.md:24-25, docs-tree.md:17, dependencies.md:14 (U7); docs/plugins/vwf.md:550,582, docs/plugins/stackgen.md:260 (U6)                                                                                                                                                                                                            |                                              |
| 1    | U4              | inherit | 3     | green        | review RULINGS fix: exemption is the flagged line alone; stems kept (dissolved/moved are pattern tuning); tests replaced; 5 live hits routed (readme.md:75 → U3; vwf-config.md:336,534,548,555 → U1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                                              |
| 1    | U1              | inherit | 3     | green        | review round 1: memory.md planning room → docs/memory/planning/; stack-vocabulary.md:121 refolded; vwf-config 336/534/548/555 carry `pre-22` on the line. DECIDED: 336 and 534 now 83/86 bytes, neighbours already past 80. Zero vwf findings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |                                              |
| 1    | U2              | inherit | 3     | green        | review round 1: three paragraphs refolded; stack-menu design/cicd rows name no directory; follow-up sent for the four original rows naming `project/` etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                              |
| 1    | U3              | inherit | 3     | green        | review round 1: four-tier composition order at materializer.md and pnpm/flutter/ruff conventions.md; readme:75 carries since-dissolved on the line. plugins:check passes on the whole tree                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                              |
| 1    | R1              | inherit | 2     | findings(2)  | CONTRACT clean, RULINGS clean. New residue from round 1: vwf-config.md:548 dangling ", that era" fragment (U1); materializer.md:60 orphan line "backwards and nothing" (U3). 17 → 2, converging                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |                                              |
| 1    | U1              | inherit | 4     | green        | review round 2: vwf-config.md:548 parenthetical closed, refolded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 47feef3a                                     |
| 1    | U3              | inherit | 4     | green        | review round 2: materializer.md paragraph refolded at 76                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 952b92f3                                     |
| 1    | R1              | inherit | 3     | pass         | FINDINGS 0, CONTRACT clean, RULINGS clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                              |
| 1    | gate            | —       | 2     | green        | check, marketplace, npm-normalize, lint, format, vitest 256 pass, tsc x2 green. Inventory check and inventory.test.ts stay red on U3's category rows until U8 regenerates; U3 committed with SKIP=plugins-inventory for that one hook. Pre-commit order verified marketplace → inventory → check (orchestrator gate for U5). DECIDED: U5 committed first because pre-commit refuses to run with its own config modified and unstaged; `chore` is not an allowed type so U5's line became `ops(tooling)`; subjects folded to one line under 72 with the rest in the body                                                                                                                                                                                                                                                                  | 8ae7c29f 47feef3a 16ea66ef 952b92f3 b2887eeb |
| 2    | docs-reconciler | inherit | 1     | findings(27) | over cc75f9f8..b2887eeb: 13 user-doc passages (docs/plugins/vwf.md axes, platforms, template shape; stackgen.md; how-to), 14 maintainer-doc passages (twelve rules, axes, platform list, pre-commit order) plus a duplication note; handed to U6/U7 as files with the wave-1 DOCS FALSIFIED lines                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |                                              |
| 2    | U6              | inherit | 1     | green        | 15 files: readme, 3 installer docs, mempalace/stackgen/vwf plugin docs, 7 how-to guides; six axes, seven platforms, payload-only template paragraph, design tool agnostic, conditional mise wording, marketplace-update upgrade path, six feedback kinds, three design halts. DECIDED: choosing-your-stack:24 "four templates" also fixed; vwf.md:905/916 Claude-Design-specific auth and /mcp halts rewritten; vwf.md:1114 `web` project name kept; vwf.md:556 historical "three axes" kept. GAP: format red only on U7's in-flight files and the plan index                                                                                                                                                                                                                                                                            |                                              |
| 2    | U7              | inherit | 1     | green        | 12 files: CLAUDE.md, repo-shape, checks.md (gates section, rule 12 documented from check.ts), plugin-authoring SKILL (language-plugins.md deleted, successor named), dependencies.md (six axes, predicate "built." restored from 69a61532), target-verifier.md (five claims, Receipt line dropped), dev-marketplace/plugins.md placeholders, vwf-plugin SKILL/assets/docs-tree. DECIDED: reconciler 13-14 superseded by the deletion; all version examples in dev-marketplace.md placeholders; vwf-v19.9.0 kept in ci-and-releases and release skill as a recorded incident; no bare pre-commit command found. GAP: "the eight rules that retired" left, assuming checks.md's retired table is the count                                                                                                                                 |                                              |
| 2    | R2              | inherit | 1     | findings(3)  | CONTRACT clean, RULINGS clean. U7: CLAUDE.md:120 and repo-shape.md:114 "first four run in pre-commit in the order listed" is false for npm-normalize; CLAUDE.md:12 still says "LSP servers" after U6 dropped it from the readme                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |                                              |
| 2    | gate            | —       | 1     | green        | check, marketplace, npm-normalize, lint, format, vitest 256 pass, tsc x2 green; inventory check still held for U8. Plan greps: vwf-config migration bullets, checks.md's own pattern table, four `web` project-name/lineage rows; no inbound link to the deleted language-plugins.md                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                                              |
| 2    | U7              | inherit | 2     | green        | review round 1: pre-commit ordering claim reworded in CLAUDE.md and repo-shape.md; "LSP servers" dropped from CLAUDE.md:12                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 3426114a                                     |
| 2    | R2              | inherit | 2     | pass         | FINDINGS 0, CONTRACT clean, RULINGS clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                              |
| 2    | commit          | —       | 1     | green        | U6 6b53fe47, U7 3426114a; pre-commit hooks passed on both                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 6b53fe47 3426114a                            |

## Launch

Run in a fresh session:

/execute-plan docs/plans/2026-09-04-drift-sweep
