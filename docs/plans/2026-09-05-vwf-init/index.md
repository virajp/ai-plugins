---
type: repo-plan
title: /vwf:init — bootstrap or reshape a repo from stackgen's repo packs
requires: []
---

# Plan — /vwf:init — bootstrap or reshape a repo from stackgen's repo packs (2026-09-05)

## Status

**APPROVED**

APPROVED 2026-09-05 by the user, after the self-review.

## Consent

| Action                                   | Granted |
| ---------------------------------------- | ------- |
| Merge to `develop` and push on green run | yes     |
| Release `vwf`                            | minor   |
| Release `stackgen`                       | major   |
| Release installer                        | none    |
| Release site                             | patch   |

Releases are intent: execute-plan stops once before the `main` merge and the
tags and asks, per `CLAUDE.md`. `site:release` is asked for separately.

## Goal

After this lands, `/vwf:init` bootstraps a brand-new repo, or reshapes an
existing one, to the maintainer's standard layout: a sectioned `.gitignore`, a
lowercase `readme.md`, every tool config under `.config/`, a five-file mise
split (`mise.toml`, `mise.dev.toml`, `mise.ci.toml`, `mise.test.toml`, and a
gitignored `mise.local.toml`), a file-based task library grouped `setup:*`,
`code:*` and `p:<project>:*` with a shared `_scripts/helpers` that colours and
separates output, pre-commit with the full hook set and conventional commits
wired for release notes, doppler (default) or fnox for secrets, gitleaks and
grype configured, and `.editorconfig`, `.gitattributes`, a Renovate config,
`SECURITY.md` and a chosen `LICENSE`. Every file init lays down comes from a
stackgen pack; init itself names no technology. `/vwf:setup` stops doing repo
tooling and offers init when the shape is missing.

The framing: the request asked for a vwf skill carrying this doctrine, but the
2026-09-01 devtools-dissolution decision already placed mise and the four gates
in stackgen's unconditional `mise` and `repo-gates` bundles, `/vwf:setup` has a
hard rule never to write them by hand, and checker rule 10 bans vwf prose from
naming mise, dprint, doppler or gitleaks. So init is a thin, stack-agnostic
orchestrator and the payloads are stackgen's. The user chose this over a vwf-
resident doctrine (which would reverse the dissolution and need a rule-10
exemption) and over a `/stackgen:init` (which would leave no `/vwf:init`).

Five **reversals** of standing decisions, each confirmed by the user and each
getting a `docs/memory/decisions/` doc from the docs unit:

1. **The charter fence opens for gate config files.** `output-tree.md:145-152`,
   `materializer.md:64-73`, `pack-format.md:47-53` and
   `stackgen-stack-template/SKILL.md:118-120` say nothing writes `dprint.json`,
   `.config/pre-commit-config.yaml` or a gate's config. Now the dprint,
   pre-commit, gitleaks, grype, doppler and fnox packs ship `config/` trees.
   `package.json` and CI workflows stay fenced.
2. **`/vwf:readme` creates `readme.md`**, not `README.md`, when no readme
   exists. Existing casing is still preserved.
3. **`merge:develop` / `merge:main` become `code:merge:develop` /
   `code:merge:main`.** vwf's git-workflow skill (`SKILL.md:30-31`,
   `references/landing.md:21,34,46`) moves with it.
4. **`worktree:init` becomes `setup:worktree`** in the mise pack.
5. **The mise pack's three-file split becomes five** (`conventions.md:12-15`,
   `config-files.md`).

## Facts the survey established

**This repo.**

- vwf is `19.11.0`, stackgen `0.22.0`, site `1.1.1`. No `.config/vwf.yaml`
  exists here despite the 2026-08-23 onboarding decision.
- vwf skills are auto-discovered at `plugins/vwf/skills/<name>/SKILL.md`; no
  registration, no `commands/` dir. Invocation modes:
  `disable-model-invocation: false` (user and model), `user-invocable: false` +
  `paths:` (model only), `disable-model-invocation: true` (user only — removed
  from the model's context, so no other skill can invoke it and the failure is
  silent). `.claude/skills/vwf-plugin/SKILL.md:102-124`.
- `/vwf:setup` is user-only (`setup/SKILL.md:11`). Its hard rule at
  `SKILL.md:55-58`: mise config and repo gates are materialized by the stack
  adapter at fixed slugs `mise` and `repo-gates`; setup never writes them and
  never writes a README. The Tooling step is
  `references/onboard-pipeline.md:
  23-38`, its deferral rule `:63-87`, the
  code path repeats it at `:157-180`. Setup also appends gitignore lines for the
  memory tree (`references/memory-tree.md:9`).
- `/vwf:readme` (`readme/SKILL.md`, 113 lines): line 23-24 preserves existing
  casing, else creates `README.md`; eight fixed sections; already detects mise
  and prefers `setup:*` tasks (`:68-76`).
- `/vwf:git-workflow` hardcodes `merge:develop` / `merge:main` at
  `SKILL.md:30-31` and `references/landing.md:21,34,46`;
  `references/worktree-setup.md` names `worktree:init`.
- `/vwf:doctor` checks only harness capabilities (`dev`, `e2e_local`, …) by task
  name (`doctor/references/harness-and-memory.md:8-16`); `setup:all`,
  `code:all`, `code:merge:*` are not capabilities and are never checked.
- Checker: `scripts/src/check.ts`, twelve rules
  (`.claude/skills/plugin-authoring/references/checks.md:28-87`). Rule 4
  strict-YAML frontmatter drops a skill silently. Rule 10
  (`checkVwfIsTechnologyFree`, `check.ts:838`; `TOOL_TOKENS` at `:614`,
  exceptions `:669`, `ENUMERATION_PEERS` `:703`, 100-char window `:691`) bans a
  vwf skill from prescribing a tool by name unless a peer token sits within 100
  characters; setup's existing "fixed slugs `mise` and `repo-gates`" wording
  passes it today. Rule 11 (`checkPackTaskModes`, `check.ts:269`,
  `PACK_MISE_TASKS` `:255`) asserts exec bits on
  `stacks/*/*/config/.config/mise/tasks/**` and nothing else about `config/`.
  Rule 12 retired-vocabulary needs a `RETIRED_LINE_EXEMPT` marker on any line
  naming history (`checks.md:169-175`). Tests: `scripts/src/check.test.ts`.
- Gates run in `.github/workflows/plugins.yml` (`plugins:inventory --check`
  `:56`, `plugins:check` `:59`) and `.config/pre-commit-config.yaml` (`:48`,
  `:55`), order marketplace → inventory → check. This repo's dev tools are
  `.config/mise.dev.toml` (doppler, pre-commit, dprint, taplo, gitleaks, grype,
  jq, python, uv; `[shell_alias]` at `:29`). Its tasks live in
  `.config/mise/tasks/{code,setup,i,site,plugins}/`. Its own `.config/` is a
  **pre-contract** reference: `setup:pnpm:*` (retired by the pack), `_helpers`
  not `helpers`, no `setup:worktree`, `setup:doppler` fully commented out.
- `plugins/**/*.md` is **not** dprint-formatted (match fold width by hand);
  `readme.md`, `CLAUDE.md`, `site/CLAUDE.md` are. `cat` is aliased to `bat`;
  write files with Write/Edit, never heredocs. A pre-commit config that is
  modified but unstaged aborts every commit, so the unit owning it commits
  first.

**stackgen today.**

- Component kinds are in `plugins/stackgen/assets/taxonomy.md:21-73`; the `repo`
  axis roots three kinds — `repo-gate` (`kinds.md:261`), `toolchain-manager`
  (`kinds.md:335`), `workspace`. Gate packs carry `kind: repo-gate` in
  `pack.yaml` and live under `stacks/toolchain-gate/`.
- Two unconditional bundles: `stacks/bundles/mise.md`,
  `stacks/bundles/
  repo-gates.md` (`unconditional: true`;
  `stackgen-stack-menu/SKILL.md:25-35` skips them; setup fetches them by fixed
  slug).
- The only pack with a full `config/` tree is `stacks/toolchain-manager/mise/`:
  `config/.config/{mise.toml,mise.dev.toml,mise.ci.toml}`,
  `config/.config/mise/tasks/_scripts/{helpers,placeholder}`,
  `tasks/code/{all,format,git-config,lint,precommit,sec,worktrees}`,
  `tasks/setup/{ai,all,mise,precommit,secrets,deps/all,deps/install}`,
  `tasks/worktree/init`. `lint`, `sec`, `secrets`, `deps/install` are
  `#PLACEHOLDER` slots that print and exit 0. Doctrine: `conventions.md`,
  `skills/mise/references/task-library.md` (helper table `:48-100`, `code/*`
  `:102`, slots `:129`, `setup/*` `:150`, `setup/deps/*` `:178`,
  `setup/external/*` `:210`, `worktree/init` `:226`, retired names `:197`),
  `references/config-files.md`, `pack.yaml` (version `0.1.0`).
- Task overlays exist in `package-manager/pnpm/config/` (`code/format`,
  `code/lint`, `setup/deps/{audit,cleanup,install,outdated}`),
  `package-manager/uv/config/`
  (`setup/deps/{cleanup,install,outdated,
  upgrade}`),
  `toolchain-gate/ruff/config/` (`code/{format,lint}`),
  `app-framework/flutter/config/` (`code/{format,lint}`,
  `setup/deps/{cleanup,install,outdated}`). Precedence: toolchain-manager, then
  package-manager / language, then app-framework; later wins; recorded per file
  in the lockfile (`output-tree.md:101-152`).
- `toolchain-gate/{dprint,gitleaks,grype,pre-commit}/` and
  `capability-provider/{doppler,fnox}/` ship `pack.yaml`, `conventions.md`,
  `skills/<name>/` and (fnox) `hooks/fnox-ciphertext-guard.sh`; **no
  `config/`**. `toolchain-gate/eslint/skills/eslint/SKILL.md:85` is the only
  mention of `.config/linter.yaml`. `stacks/bundles/{doppler,fnox}.md` exist.
- `skills/stackgen-sync/` is the consent-gated re-sync diff for materialized
  packs; `skills/stackgen-stack-template/references/materializer.md` is where an
  implementer meets the fence; `references/generator.md` is the uncovered- tail
  generator.
- Nothing writes `.gitignore`, `.editorconfig`, `.gitattributes`, `LICENSE`,
  `SECURITY.md`, a Renovate config, `.config/git-conventional-commits.yaml`,
  `.config/gitleaks.toml`, `.config/grype.yaml`, `.config/dprint.json` or
  `.config/pre-commit-config.yaml` today. The dissolution plan's §J lists "Gate
  packs owning their config files" as new capability and "this repo's own
  `.config/mise/tasks/`" as still deferred.

**The maintainer's repos (the conventions being reproduced).**

- Canonical sources: `~/Projects/github.com/virajp/claude-status` for
  `_scripts/{_helpers,_checks,_merge}`, `code:merge:{develop,main}`, the
  154-line pre-commit config, gitleaks with `[extend] useDefault = true`, grype
  `--fail-on medium`, the commented `git-conventional-commits.yaml` with a
  `changelog:` block, `.gitattributes`, `MISE_ENV: ci` in workflows;
  `~/Projects/github.com/95octane/95octane` for `worktree:init`, `setup:all`
  with `--all/--backend/--frontend/--devops` recursion into submodules,
  `setup:doppler`, `.tools/docker-compose.yaml` via `setup:deps:start`, the
  108-line `_helpers`, `code:worktrees` across submodules, `mise.test.toml`
  ("deltas only — `MISE_ENV=dev,test`"), `[tasks.init]` chmod;
  `~/Projects/github.com/virajp/virajp.dev` for the mise overlay banner comments
  and per-env `[env]`; `~/Projects/github.com/virajp/linter` for the `p:*` and
  `setup:pnpm:*` namespaces; `~/Projects/github.com/virajp/
  macos-setup` for
  `print_header` with the separator baked in and `print_subheader`.
- Every repo sources helpers as
  `source "${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/_helpers"`; flags
  read as `${usage_<name>:-false}`; `#MISE description=`, `#MISE hide=`,
  `#MISE depends=`; pre-commit installed with
  `--config .config/pre-commit-config.yaml --all --install-hooks --overwrite`
  after `git config --local --unset-all core.hooksPath || true`;
  `default_install_hook_types: [pre-commit, commit-msg]`; global
  `exclude: ^graphify-out/`; local hooks call `mise x -- mise run <task>`.
- Divergences the plan settles: `_helpers` vs `helpers`; separators caller-side
  vs baked; bash vs zsh; `[shell_alias]` base vs dev; `p:` overloaded (packages,
  pulumi, project tasks); `setup:pnpm:*` vs `setup:deps:*`; gitleaks
  `useDefault` missing in 3 of 4 repos; `mise.local.toml` gitignored in one repo
  only; doppler scoped imperatively per directory with bare key names, no
  `doppler.yaml`, no `<REPO>_` prefix in use; fnox nowhere.

**Tool facts (Context7 / official docs, 2026-09-05).**

- mise loads, per directory, `mise.local.toml` > `mise.toml` >
  `.config/mise.toml` > `.config/mise/config.toml` >
  `.config/mise/conf.d/*.toml`; env files `.config/mise.{env}.toml` and `.local`
  variants via `MISE_ENV` (comma list, last wins); `.config/mise/
  tasks/` is a
  default task dir; `[shell_alias]` needs `mise activate`;
  `[settings] minimum_release_age = "10h"` (default 24h) filters fuzzy
  resolution; `[settings] lockfile = true` maintains `mise.lock`,
  `locked = true` / `MISE_LOCKED=1` makes `mise install` strict in CI;
  `[hooks] postinstall` exists; `[env] _.file/_.source/{redact,required}`; no
  native doppler directive.
- Doppler honours `DOPPLER_PROJECT` / `DOPPLER_CONFIG` from the environment;
  `doppler setup --no-interactive --project X --config Y --scope <dir>` needs no
  repo file; names are `[A-Z0-9_]`.
- fnox searches `fnox.toml` from cwd upward; `--config` bypasses directory
  recursion and local overrides; `fnox.local.toml` is the gitignored override;
  keychain provider
  `{ type = "keychain", service = "fnox", prefix = "global/"
  }`.
- dprint does not discover `.config/dprint.json`; `--config` (or `-c`) on every
  call.
- pre-commit `install -c <path>` bakes the path into the hook script; `run`
  still needs `-c`; `core.hooksPath` set makes install refuse; hooks v6.0.0 ids
  listed in U2; gitleaks ships `gitleaks-system`; grype ships no hook;
  git-conventional-commits ships `conventional-commits` for `commit-msg`; its
  schema uses `featureCommitTypes` (not `releaseCommitTypes`), YAML with
  comments is supported, `changelog --release <v>` generates notes.
- gitleaks precedence `--config` > `GITLEAKS_CONFIG` >
  `<target>/.gitleaks.toml`; `[extend] useDefault = true` keeps the ~170
  built-ins. grype reads `.grype.yaml` or `GRYPE_CONFIG`; `fail-on-severity`,
  `ignore:` rules.

## Assumed decisions — confirm or override at review

User rulings are quoted; rows marked *(assumed)* were made by the planner and
are the review surface.

| #  | Decision                        | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Rejected                                                                                                | Unit         |
| -- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| 1  | Home of the doctrine            | "vwf:init thin, stackgen owns payloads": `/vwf:init` is a stack-agnostic orchestrator; the mise pack, the gate packs, the hygiene pack and the secrets packs ship every file. The charter fence reopens **explicitly** for gate, doppler and fnox config files.                                                                                                                                                                                                | everything in `vwf/skills/init` (reverses the dissolution, needs a rule-10 exemption); `/stackgen:init` | U1–U8        |
| 2  | Scope                           | "Two plans: packs+init, then this repo": this plan ships packs and the skill; reshaping `claude-plugins` itself is plan 2, `requires:` this one, written only after the greenfield run on the new website repo.                                                                                                                                                                                                                                                | one plan; three plans                                                                                   | Parked       |
| 3  | Hygiene additions               | All four in: `.editorconfig` + `.gitattributes`; shellcheck + shfmt hooks (actionlint only when `.github/workflows` exists); `LICENSE` + `SECURITY.md` asked per repo; Renovate config at `.config/renovate.json`.                                                                                                                                                                                                                                             | any subset                                                                                              | U3, U2, U7   |
| 4  | CI workflow                     | "No, out of scope": init writes `mise.ci.toml` and the lockfile policy; no workflow file. The CI part of the charter fence stays.                                                                                                                                                                                                                                                                                                                              | one `ci.yml` gate workflow                                                                              | Out of scope |
| 5  | init ↔ setup                    | "`init` is to setup the base repo, `setup` is to setup `vwf`." Setup's Tooling step (both paths) moves wholesale into init; setup's memory-tree gitignore lines become appends to init's sectioned file. Everything else setup does stays.                                                                                                                                                                                                                     | setup keeps its slug fetch; init as a setup mode                                                        | U7, U8       |
| 6  | Setup on a missing shape        | "Offer to run init, then continue": setup detects the shape (the stack adapter's lockfile lists all three unconditional slugs); if absent it offers `/vwf:init`; a decline is a recorded deferral as today. init is therefore user- **and** model-invocable (`disable-model-invocation: false`).                                                                                                                                                               | halt; never check                                                                                       | U7, U8       |
| 7  | Existing repo                   | "Survey, plan, one consent, then apply": init diffs the repo against the shape, shows one plan (moves, creates, renames, fragment merges), applies on one yes, never edits app code, `package.json` or CI workflows.                                                                                                                                                                                                                                           | per-file consent; report only                                                                           | U7           |
| 8  | Helper library                  | "`_scripts/helpers`, one file + optional siblings": every task sources `${MISE_PROJECT_ROOT}/.config/mise/tasks/_scripts/helpers`; repo-specific libraries sit beside it (`_scripts/checks`, `_scripts/merge`, `_scripts/<name>.env`). No second underscore.                                                                                                                                                                                                   | `_scripts/_helpers`; a `helpers/` directory                                                             | U1, U4       |
| 9  | Separators                      | "Baked into print_header / print_subheader": `print_header` emits a full-width `=` line then the title; `print_subheader` a `-` line then the title. Single-step tasks call neither. `line_sep <char>` stays public for the rare direct use.                                                                                                                                                                                                                   | caller-side `line_sep`                                                                                  | U1           |
| 10 | Task language                   | Bash (`#!/usr/bin/env bash`, `set -euo pipefail`, shellcheck-clean) for every shipped task; zsh task files on an existing repo are flagged in init's plan for rewrite, with zsh-only syntax reported rather than auto-translated. "Ship helpers.mjs, python ad hoc": `_scripts/helpers.mjs` mirrors the bash print API; no `helpers.py`.                                                                                                                       | zsh; bash-only helpers; three helper libraries                                                          | U1, U7       |
| 11 | `[shell_alias]` placement       | "mise.dev.toml": `setup = "mise run setup:all"`, `precommit = "mise run code:precommit"`, `worktrees = "mise run code:worktrees"`, plus one `setup-<project-id> = "mise run setup:all --<project-id>"` per member. CI never loads them.                                                                                                                                                                                                                        | `mise.toml`                                                                                             | U1           |
| 12 | `p:` segment                    | "Registry id, else directory name; single repo uses its own name": `.config/vwf.yaml`'s registry ids when present, else the sub-project directory, else the repo name (`p:claude-status:build`). Existing `p:` groups meaning something else are renamed by init on an existing repo.                                                                                                                                                                          | directory always; `p:app:*` for single repos                                                            | U1, U7       |
| 13 | `setup:all` flags               | "`--all` plus `--<project-id>` per member": flags are generated from registry ids or submodule names; short forms live in `[shell_alias]`. Without members, `setup:all` takes no flags.                                                                                                                                                                                                                                                                        | hand-picked short flags                                                                                 | U1, U7       |
| 14 | Pre-commit before staging       | "Run pre-checks before you even stage the files so that it doesn't need dedicated commit and folds inside the same commit": `code:precommit` runs pre-commit over the working tree's changed files (staged + unstaged, `--diff-filter=d`) **before** staging; git-workflow's commit sequence is `mise run code:precommit` → stage → commit. The merge tasks' pre-check runs `pre-commit run --all-files` as a safety net and **fails** if it changed anything. | committing or amending fixups at merge time; failing without guidance                                   | U1, U8       |
| 15 | Merge pre-checks                | `code:merge:develop <branch>`: source is a local branch, not `main`/`develop`; no untracked, no uncommitted; pre-commit safety net (D14); hop to the main worktree; `git merge --no-ff`; `git push --follow-tags`; return. A conflict leaves the tree mid-merge on purpose. `code:merge:main`: source must be `develop`; `develop` has no unpushed commits; same sequence. Predicates in `_scripts/checks`, the shared body in `_scripts/merge`.               | —                                                                                                       | U1           |
| 16 | Secrets                         | Doppler default: `DOPPLER_PROJECT` and `DOPPLER_CONFIG = "local"` in the environment, one Doppler project per repo, one config `local`, key names `<REPO>_<KEY>` with `GLB_<KEY>` for shared values, documented in the doppler pack's conventions and as a comment block beside the env keys. fnox alternative: "Root fnox.toml, accepted exception", keychain provider with `prefix = "global/"`, `fnox.local.toml` gitignored.                               | `.config/fnox.toml` with `--config` everywhere                                                          | U3           |
| 17 | dprint                          | "`.config/dprint.json`, --config everywhere": the pre-commit hook and `code:format` pass `--config .config/dprint.json`; init writes the editor pointer, whose exact setting name U2 verifies against the extension docs. Submodules get their own copy, not a symlink.                                                                                                                                                                                        | root `dprint.json`                                                                                      | U2, U1       |
| 18 | `.gitignore`                    | "Hygiene pack base + init appends stack sections from github/gitignore": the pack ships the sectioned base (macOS, AI tooling, mise local files, env and secret files, worktrees, scratchpad); init fetches the templates for the detected stack from `github/gitignore` at run time and appends each as its own `# ==== <Name> ====` section, never duplicating one already present.                                                                          | per-pack fragments; one base only                                                                       | U3, U7       |
| 19 | Commit types                    | "The proposed ten only": `feat`, `fix`, `perf`, `refactor`, `revert` (in release notes); `test`, `ops`, `docs`, `merge`, `wip` (never). `ops` absorbs build/ci/chore/deps/config/release; `docs` absorbs blueprint and spec; `refactor` absorbs style. Each type carries a comment; scopes carry the sub-project; `changelog:` block with headlines, `commitIgnoreRegexPattern: '^[wW][iI][pP]\b'`, `featureCommitTypes: [feat]`.                              | + `blueprint`; + `security`                                                                             | U2           |
| 20 | Hook fragments                  | "Packs ship `.config/pre-commit.d/<pack>.yaml` fragments; init merges": the pre-commit pack ships the base config; pnpm, uv/ruff, flutter and eslint packs ship one fragment each; init concatenates every fragment present into `.config/pre-commit-config.yaml` between marker comments, re-runnable.                                                                                                                                                        | language packs overwriting the whole file; documented-only                                              | U2, U4, U7   |
| 21 | readme stub                     | "H1 repo name + one-line brief, then name /vwf:readme": two lines from the two things init asks; init ends by printing that `/vwf:readme` fills the rest. An existing `README.md` is `git mv`'d to `readme.md`, content untouched.                                                                                                                                                                                                                             | stub + Local Development; no readme                                                                     | U7, U8       |
| 22 | `code:ai`                       | "in greenfield `init` will add the bare minimum plugins, like `vwf` and some dependencies. In brownfield, stackgen will edit the task if needed": the pack's `code:ai` registers the marketplace and runs the installer CLI for `vwf` (which pulls `stackgen`) at user or repo scope, then `claude plugin autoremove`; a stack pack may overlay it.                                                                                                            | settings.json as source; env list; user-scope only                                                      | U1           |
| 23 | shellcheck gate here            | "Yes: a `plugins:shellcheck` task in plugins.yml and pre-commit": shellcheck (with `-x`) over `plugins/**/config/.config/mise/tasks/**` and every `_scripts/*` without an extension; shfmt `-d` too. Tools added to this repo's `mise.dev.toml`.                                                                                                                                                                                                               | not this plan                                                                                           | U6           |
| 24 | Orchestrator verification       | "Scratch-repo run of the materialized shape": see *Gates the orchestrator keeps*.                                                                                                                                                                                                                                                                                                                                                                              | + target-verifier; repo gate only                                                                       | orchestrator |
| 25 | Landing / release               | Merge and push on green: yes. stackgen major, vwf minor, site patch.                                                                                                                                                                                                                                                                                                                                                                                           | —                                                                                                       | U10          |
| 26 | Doppler project name (assumed)  | Defaults to the repo directory's basename (`basename "$MISE_PROJECT_ROOT"`), overridable by `DOPPLER_PROJECT` in `mise.local.toml`. init elicits nothing tool-specific.                                                                                                                                                                                                                                                                                        | init asks (puts a tool name in vwf prose)                                                               | U3           |
| 27 | Secrets env fragment (assumed)  | The secrets packs ship `.config/mise/conf.d/<provider>.toml` (mise auto-loads `conf.d/*.toml`), carrying `[env]` defaults (`DOPPLER_CONFIG = "local"`, `DOPPLER_PROJECT` via the `{{ exec() }}` basename template or a documented literal) and nothing else, so `mise.toml` stays provider-free.                                                                                                                                                               | init editing `mise.toml`                                                                                | U3, U1       |
| 28 | `p:` scaffolding (assumed)      | Packs cannot know project names, so init creates `p/<id>/_default` as a `#PLACEHOLDER` slot per project that prints "no project tasks yet" and exits 0; real `p:` tasks are authored per repo (by hand or by stackgen's generator). `task-library.md` carries one worked example (`p/site/{dev,build}`).                                                                                                                                                       | placeholder dir renamed by the materializer                                                             | U1, U7       |
| 29 | Hygiene kind (assumed)          | New component kind `repo-hygiene` (fourth `repo`-axis kind beside `repo-gate`, `toolchain-manager`, `workspace`), one pack `stacks/repo-hygiene/repo-hygiene/`, one unconditional bundle `stacks/bundles/repo-hygiene.md`, fetched by the fixed slug `repo-hygiene`. Bar in `kinds.md`: ignore set, editor and attribute defaults, licensing and security contact, dependency updates.                                                                         | folding into `repo-gates`                                                                               | U3, U5       |
| 30 | LICENSE (assumed)               | init asks MIT, Apache-2.0 or none; the hygiene pack ships both texts under `config/_licenses/{MIT,Apache-2.0}.txt` (outside the copied tree; init copies the chosen one to `LICENSE` with the year and holder filled).                                                                                                                                                                                                                                         | fetching from a website                                                                                 | U3, U7       |
| 31 | `mise.test.toml` (assumed)      | Shipped with a banner "deltas only — layer on dev: `MISE_ENV=dev,test`" and an empty `[env]`; `mise.local.toml` is never shipped, only gitignored and documented in `mise.toml`'s banner.                                                                                                                                                                                                                                                                      | omitting the test file                                                                                  | U1           |
| 32 | Legacy-name table (assumed)     | `task-library.md` gains a *Legacy names* table (`worktree:init` → `setup:worktree`, `merge:*` → `code:merge:*`, `setup:pnpm:*`/`setup:uv:*`/`setup:app:*` → `setup:deps:*`, `setup:ai` → `code:ai`, `setup:doppler` → `setup:secrets`, `setup:deps:{start,stop,pull,update}` → `setup:external:*`). init reads it to rename tasks on an existing repo, so vwf prose names no tool.                                                                             | init carrying the table                                                                                 | U1, U7       |
| 33 | Fragment markers (assumed)      | `# >>> pre-commit.d/<name>.yaml` … `# <<< pre-commit.d/<name>.yaml`, one pair per fragment, appended under `repos:`; a re-run replaces between the markers.                                                                                                                                                                                                                                                                                                    | one-shot append                                                                                         | U7           |
| 34 | `setup:all` order (assumed)     | `setup:mise` → `setup:secrets` → `setup:external:start` → `setup:deps:all` (cleanup → install → upgrade → outdated → audit) → `setup:precommit` → `code:ai` → members per flag. `setup:mise` also runs `dprint config update` and the linter `--init` when present. `setup:worktree` = submodule init → `mise install` → `setup:secrets` → `setup:deps:install --frozen`.                                                                                      | 95octane's order                                                                                        | U1           |
| 35 | stackgen version (assumed)      | `0.22.0` → `1.0.0` for "major". Say so at review if `0.23.0` (0.x convention) is preferred.                                                                                                                                                                                                                                                                                                                                                                    | `0.23.0`                                                                                                | U10          |
| 36 | Generator awareness (assumed)   | `pack-format.md` documents the `config/`, `conf.d` and `pre-commit.d` tiers so a generated pack *may* ship them; teaching `generator.md` to emit them is parked.                                                                                                                                                                                                                                                                                               | changing the generator now                                                                              | U5, Parked   |
| 37 | Fixed root exceptions (assumed) | Files allowed at the repo root by the hygiene doctrine and the checker allowlist: `.gitignore`, `.editorconfig`, `.gitattributes`, `LICENSE`, `SECURITY.md`, `readme.md`, `CLAUDE.md`, `fnox.toml`, `eslint.config.mjs` (the linter's shim), language-mandated manifests and lockfiles. Everything else lives under `.config/`.                                                                                                                                | —                                                                                                       | U3, U6       |

## New dependencies

- **shellcheck**, **shfmt**, **actionlint** — mise tools. In this repo's
  `.config/mise.dev.toml` (U6) for the new gate; in the mise pack's
  `mise.dev.toml` (U1) for every repo init shapes. Preferred over
  `koalaman/shellcheck-precommit` (docker) and over no shell gate.
- **Renovate** — a config file only (`.config/renovate.json`, U3); nothing
  installed. Preferred over Dependabot, which has no mise manager.
- **github/gitignore at run time** — `/vwf:init` fetches
  `https://raw.githubusercontent.com/github/gitignore/main/<Name>.gitignore`
  when appending stack sections (U7). A network read, nothing installed; init
  prints the skipped section names when offline.
- No npm package, no new Context7 library, no new agent.

## Units

| Id  | Wave | Unit file                                                                  | Owns                                                                                                                                                                                                                            | Depends on | Status  | Commit |
| --- | ---- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- | ------ |
| U1  | 1    | [01-mise-pack.md](01-mise-pack.md)                                         | `plugins/stackgen/stacks/toolchain-manager/mise/**`                                                                                                                                                                             | —          | pending |        |
| U2  | 1    | [02-gate-packs.md](02-gate-packs.md)                                       | `plugins/stackgen/stacks/toolchain-gate/{dprint,pre-commit,gitleaks,grype}/**`                                                                                                                                                  | —          | pending |        |
| U3  | 1    | [03-hygiene-and-secrets-packs.md](03-hygiene-and-secrets-packs.md)         | `plugins/stackgen/stacks/repo-hygiene/**`, `plugins/stackgen/stacks/capability-provider/{doppler,fnox}/**`                                                                                                                      | —          | pending |        |
| U4  | 1    | [04-language-overlays.md](04-language-overlays.md)                         | `plugins/stackgen/stacks/package-manager/{pnpm,uv}/config/**`, `plugins/stackgen/stacks/toolchain-gate/{ruff,eslint}/config/**`, `plugins/stackgen/stacks/app-framework/flutter/config/**`                                      | —          | pending |        |
| U5  | 1    | [05-stackgen-charter.md](05-stackgen-charter.md)                           | `plugins/stackgen/assets/**`, `plugins/stackgen/skills/stackgen-stack-template/**`, `plugins/stackgen/skills/stackgen-stack-menu/**`, `plugins/stackgen/skills/stackgen-sync/**`, `plugins/stackgen/stacks/bundles/**`          | —          | pending |        |
| U6  | 1    | [06-repo-gates.md](06-repo-gates.md)                                       | `scripts/src/check.ts`, `scripts/src/check.test.ts`, `.config/mise/tasks/plugins/shellcheck`, `.config/mise.dev.toml`, `.config/pre-commit-config.yaml`, `.github/workflows/plugins.yml`                                        | —          | pending |        |
| U7  | 2    | [07-vwf-init.md](07-vwf-init.md)                                           | `plugins/vwf/skills/init/**`                                                                                                                                                                                                    | U1, U3, U5 | pending |        |
| U8  | 2    | [08-vwf-setup-readme-git-workflow.md](08-vwf-setup-readme-git-workflow.md) | `plugins/vwf/skills/setup/**`, `plugins/vwf/skills/readme/**`, `plugins/vwf/skills/git-workflow/**`                                                                                                                             | U1         | pending |        |
| U9  | 3    | [09-docs.md](09-docs.md)                                                   | `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `.claude/docs/**`, `.claude/skills/vwf-plugin/**`, `.claude/skills/stackgen-plugin/**`, `.claude/skills/plugin-authoring/**`, `site/src/content/docs/**`, `docs/memory/decisions/*` | all        | pending |        |
| U10 | 4    | [10-gates-and-bump.md](10-gates-and-bump.md)                               | `plugins/*/.claude-plugin/plugin.json`, `site/package.json`, `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                                                                                          | U9         | pending |        |

Status is one of `pending`, `running`, `green`, `failed`, `unresolved`,
`skipped`.

## Shared-file rule

| File                                                                                                           | Why it collides                                             | Owner                                                       |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `plugins/*/.claude-plugin/plugin.json`, `site/package.json`                                                    | several units bumping one version is a lost update          | U10 only                                                    |
| `.claude-plugin/marketplace.json`, `plugins/stackgen/stacks/inventory.md`                                      | generated; regenerating mid-wave races                      | U10 only                                                    |
| `readme.md`, `CLAUDE.md`, `site/CLAUDE.md`, `site/src/content/docs/**`, `.claude/docs/**`, `.claude/skills/**` | n units editing one doc                                     | U9 only                                                     |
| `plugins/stackgen/stacks/bundles/{mise,repo-gates}.md`                                                         | U1/U2 would describe their pack; U5 owns bundle prose       | U5 only                                                     |
| `plugins/stackgen/stacks/toolchain-gate/{ruff,eslint}/**`                                                      | U2 owns four gate packs, U4 owns these two packs' `config/` | U4 for `config/**`, U2 never touches ruff/eslint            |
| `plugins/stackgen/stacks/toolchain-manager/mise/config/.config/mise/tasks/setup/secrets`                       | U3's providers overlay it; the slot itself is U1's          | U1 (slot), U3 (overlay files under the provider packs only) |
| `plugins/vwf/skills/setup/references/onboard-pipeline.md`                                                      | U7 must read it, U8 rewrites it                             | U8 only                                                     |
| `.config/pre-commit-config.yaml` (this repo)                                                                   | pre-commit refuses to run while its own config is unstaged  | U6, committed **first** in wave 1                           |

## Waves

- **Wave 1 — U1, U2, U3, U4, U5, U6.** Six disjoint trees: the mise pack; the
  four gate packs; the hygiene and secrets packs; the language overlays; the
  stackgen assets, adapter skills and bundles; this repo's checker and gate
  wiring. Only U6 touches anything outside `plugins/stackgen/`. The orchestrator
  commits U6 before the other five so pre-commit has a staged config.
- **Wave 2 — U7, U8.** `plugins/vwf/skills/init/` versus
  `plugins/vwf/skills/{setup,readme,git-workflow}/`; disjoint. Both read wave
  1's committed contract (task names, slugs, legacy table).
- **Wave 3 — U9.** Docs and decisions, from the `docs-reconciler` findings plus
  every `DOCS FALSIFIED:` line.
- **Wave 4 — U10.** Versions, generators, full gate, `target-verifier`.

## Wave gate

`mise run plugins:marketplace --check`, `mise run plugins:inventory --check`,
`mise run plugins:check`, `mise run plugins:shellcheck` (from wave 1 on, once U6
lands), `pnpm vitest run`, `pnpm exec tsc --noEmit -p installer` and
`-p scripts`, `mise run plugins:npm-normalize-test`, `mise run site:check` from
wave 3 on (U9 owns `site/src/content/docs/**`), plus the wave review, plus every
report read for `UNRESOLVED:`.

Plan-specific lines:

- `mise run plugins:check` reports **zero** rule-10 findings for
  `plugins/vwf/skills/init/**` and `plugins/vwf/skills/setup/**` after wave 2.
- Every file under `plugins/stackgen/stacks/*/*/config/.config/mise/tasks/**` is
  executable (rule 11) and starts with `#!/usr/bin/env bash`.
- Every `plugins/stackgen/stacks/*/*/config/.config/pre-commit.d/*.yaml` parses
  as YAML with a top-level `repos:` list (U6's rule).
- `grep -rn 'worktree:init\|merge:develop\|merge:main\|setup:pnpm' plugins/`
  returns only lines in the legacy-name table or lines carrying
  `RETIRED_LINE_EXEMPT`-style history markers.

## Gates the orchestrator keeps

**The scratch-repo run** (D24), after wave 2 is green and before wave 3:

1. `git init` a temp repo; copy the `config/` trees of the mise pack, the four
   gate packs, the hygiene pack and the doppler pack exactly as the materializer
   would (toolchain-manager first, then gates, then hygiene, then the provider;
   later file wins), then merge every `pre-commit.d/*.yaml` fragment present
   into `.config/pre-commit-config.yaml` the way U7 specifies, and create
   `p/scratch/_default` per D28.
2. `MISE_ENV=dev mise tasks` lists every name in U1's *Mandatory task set*
   table, and `mise tasks` output groups read `setup:*`, `code:*`, `p:*` only.
3. `MISE_ENV=dev mise run setup:all` completes with exit 0 on a repo that has
   chosen no stack: every slot prints its placeholder notice, `setup:secrets`
   with the doppler overlay prints the project name it would scope and skips
   when `doppler` is not logged in, `setup:precommit` installs hooks from
   `.config/pre-commit-config.yaml`.
4. `pre-commit run --config .config/pre-commit-config.yaml --all-files` passes
   on the materialized tree, and `shellcheck -x` over `.config/mise/tasks/**`
   and `_scripts/*` is clean.
5. `mise run code:merge:main` from a branch named `feature/x` exits non-zero
   with the "only from develop" message before touching git;
   `mise run
   code:merge:develop main` refuses likewise.

Pass = all five. A failure is a wave-2 finding routed to the owning unit (U1 for
tasks and helpers, U2 for hook config, U3 for hygiene or secrets, U7 for the
merge procedure), not a GAP.

**`target-verifier`** runs inside U10 as usual, proving `/vwf:init` is
discovered by a hermetic `claude plugin install` and the marketplace still
resolves both plugins.

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

- **A CI workflow file.** The user declined (D4); `mise.ci.toml` and the
  lockfile policy are the CI surface. The charter's CI fence stays.
- **Reshaping this repo's own `.config/`.** Plan 2 (D2), after the greenfield
  run. This plan changes this repo's tooling only where the new gate needs it
  (U6).
- **A `/vwf:doctor` finding for repo shape.** Not asked; doctor keeps checking
  harness capabilities only. Parked.
- **The python language bundle** that would make `uv` and `ruff` reachable. Its
  own wave
  (`docs/memory/gaps/2026-09-01-python-packs-authored-but-
  unreachable.md`).
  U4 still updates their overlays so they are correct when reached.
- **Making the task runner pickable.** `mise run` stays hardcoded in vwf
  (dissolution plan §J).
- **Writing `package.json`, `tsconfig`, or any language manifest.** The fence
  holds for everything but gate and provider configs.
- **Teaching the generator to emit the new tiers.** Documented as allowed, not
  implemented (D36).
- **Migrating the maintainer's other repos** (claude-status, linter, macos-
  setup, 95octane). Each is a `/vwf:init` run on that repo, by the user.

## Parked

- **Rollout sequence, per the user (2026-09-05):** (1) release stackgen and vwf,
  then `claude plugin marketplace update virajp-plugins` and
  `claude plugin update` on the maintainer's machine — or run the working tree
  earlier through `.dev-marketplace/` per `.claude/docs/dev-marketplace.md`; (2)
  **greenfield test**: the user runs `/vwf:init` on a new, empty repo for their
  website; (3) **brownfield test**: plan 2 runs `/vwf:init` on `claude-plugins`
  itself, `requires: [docs/plans/2026-09-05-vwf-init]`, written only after (2)
  has produced results. Plan 2 also closes the dissolution plan's deferred item
  "this repo's own `.config/mise/tasks/`", adopts Renovate here, and retires
  `setup:pnpm:*`, `i:*`, `site:*`, `plugins:*` into `p:installer:*`, `p:site:*`,
  `p:plugins:*` per D12.
- **A `/vwf:doctor` repo-shape finding**: a non-blocking degradation when the
  lockfile lacks any of the three unconditional slugs or a mandatory task name
  is missing from `mise tasks`.
- **Generator support for `config/`, `conf.d` and `pre-commit.d`** (D36).
- **The `p:` worked examples per stack**: once real repos have `p:` tasks,
  language and app-framework packs may ship `p/_example/` doctrine; not now.
- **`mise [hooks] postinstall = "mise run setup:precommit"`** as an alternative
  to running `setup:precommit` from `setup:all`; a follow-up once the hook's
  behaviour under `MISE_ENV=ci` is checked.

## Run log

<written by execute-plan; empty at approval>

| Wave | Unit | Model | Round | Outcome | Detail | Commit |
| ---- | ---- | ----- | ----- | ------- | ------ | ------ |

## Launch

Run in a fresh session:

/execute-plan docs/plans/2026-09-05-vwf-init
