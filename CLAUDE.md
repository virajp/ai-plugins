# CLAUDE.md

## Rules

- ALWAYS ask user before running an `i:release`, `plugins:release` or
  `site:release` task
- **Docs ship with the change.** Any change to plugin behavior must reconcile
  `readme.md`, this file, and the manual under `site/src/content/docs/` in the
  same commit — stale docs are more harmful than no docs

## What This Repo Is

A multi-agent plugin toolkit (`virajp-plugins`) containing MCP servers and `vwf`
— a full Product → Blueprint → Plan → Execute workflow plugin (with post-deploy
verify + production-feedback intake).

The repo also ships a small **installer CLI** (`@virajp.dev/claude-plugins`),
which sequences Claude's own plugin commands and wires graphify — see The
installer CLI.

It also ships the **website** (`site/`) — the Astro build of the user manual,
published at `https://claude-plugins.virajp.dev` — see Four projects, four
homes.

### Four projects, four homes

This file is the repo-wide map. Each project carries its own context, rules and
traps, loaded the moment you work in its tree — **look there first**, and put a
project-specific fact there, not here:

| Project            | Context lives in                        | Loads when                         |
| ------------------ | --------------------------------------- | ---------------------------------- |
| `installer/`       | [`installer/CLAUDE.md`][icl]            | Claude reads or edits `installer/` |
| `plugins/vwf/`     | [`.claude/skills/vwf-plugin/`][vwf]     | editing `plugins/vwf/**`           |
| `plugins/stackgen` | [`.claude/skills/stackgen-plugin/`][sg] | editing `plugins/stackgen/**`      |
| `site/`            | [`site/CLAUDE.md`][scl]                 | Claude reads or edits `site/`      |

The two plugin homes are path-scoped skills rather than nested CLAUDE.md files
on purpose: `plugins/<name>/` is the installed shape, so a file there ships to
every user and is scanned by `plugins:check`'s prose rules. The installer and
site trees are not shipped (npm publishes `bin/` alone, and the site deploys
only its build output), so their context can sit in place.

### Where the detail lives

Each row below is loaded **on demand** — follow the link when you need more than
the summary here. The `.claude/skills/` rows also auto-apply the moment you edit
the tree they govern; `release`, `create-plan` and `execute-plan` are slash
commands — a change to this repo is planned with `/create-plan` and run, in a
fresh session, with `/execute-plan <folder>`.

| Read                                       | For                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [`.claude/docs/repo-shape.md`][repo]       | the one authored tree, what the installer writes, the mise tasks, the traps                   |
| [`.claude/docs/plugins.md`][plug]          | the full plugin inventory, the native manifest shape, the generated marketplace manifest      |
| [`.claude/docs/ci-and-releases.md`][ci]    | the mise environments, the branch model, the three tag families, the workflows, the rituals   |
| [`.claude/docs/dev-marketplace.md`][dev]   | running the plugins you are editing — setup, the refresh loop, and why `update` is not it     |
| [`installer/CLAUDE.md`][icl]               | the installer — flags, the read-only receipt path, the interactive uninstall, testing         |
| [`site/CLAUDE.md`][scl]                    | the website — the tree, the link rule, the gate, the release model, the design source, traps  |
| [`.claude/skills/vwf-plugin/`][vwf]        | vwf's own shape — skills, agents, assets, hooks, adding a skill, the docs tree it maintains   |
| [`.claude/skills/stackgen-plugin/`][sg]    | stackgen's own shape — the dispatch rule, packs and bundles, where output lands, consent      |
| [`.claude/skills/plugin-authoring/`][auth] | the twelve checker rules, the invocation frontmatter, the plugin-root trap, dprint exclusions |
| [`.claude/skills/release/`][rel]           | the release ritual, the note format, the CI facts that make a failed publish legible          |
| [`.claude/skills/create-plan/`][cp]        | planning a repo change — the survey, the one-question-at-a-time interview, the plan folder    |
| [`.claude/skills/execute-plan/`][ep]       | running an approved plan autonomously — waves, review, the gate, resume, landing, release     |

[repo]: .claude/docs/repo-shape.md
[plug]: .claude/docs/plugins.md
[ci]: .claude/docs/ci-and-releases.md
[dev]: .claude/docs/dev-marketplace.md
[icl]: installer/CLAUDE.md
[scl]: site/CLAUDE.md
[vwf]: .claude/skills/vwf-plugin/SKILL.md
[sg]: .claude/skills/stackgen-plugin/SKILL.md
[auth]: .claude/skills/plugin-authoring/SKILL.md
[rel]: .claude/skills/release/SKILL.md
[cp]: .claude/skills/create-plan/SKILL.md
[ep]: .claude/skills/execute-plan/SKILL.md

The user-facing docs are a different tree and a different audience: `readme.md`,
and `site/src/content/docs/{installer,plugins,how-to}/`, published as the
website at `https://claude-plugins.virajp.dev`.

### One authored tree

Plugins are **authored natively for Claude Code**, once, and installed by
Claude's own plugin commands. What you edit is exactly what a user gets:

```text
plugins/<plugin>/          the authored source, and the installed shape
  .claude-plugin/plugin.json   the manifest
  skills/ agents/ hooks/ assets/ stacks/ vendor/
  ↓  scripts/src/marketplace.ts
.claude-plugin/marketplace.json    generated at the repo root, committed
.dev-marketplace/                  generated too — the authoring machine's, gitignored

installer/src/**                 installer source (TypeScript)
  ↓  tsup
bin/installer.mjs          gitignored build output — the published entrypoint
scripts/src/**             repo tooling: the generator and the checker
sunset/**                  the retired @askviraj/ai-plugins stub — standalone, never built, published by hand once
site/**                    the website (Astro) — src/content/docs/ is the user manual
  ↓  astro build + pagefind
site/dist/                 gitignored build output — deployed on a site-v* tag
```

**Two files are generated**, both projections of the same 2 plugin manifests and
differing in exactly one field per entry — `source`:

| File                                               | Is                                                                                                                                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude-plugin/marketplace.json`                  | **published** — what users read from `main`. `git-subdir` at a per-plugin tag, so a merge ships nothing until `plugins:release` cuts it                                                                           |
| `.dev-marketplace/.claude-plugin/marketplace.json` | **local authoring only**, gitignored and never published. Repo-relative sources into `.dev-marketplace/plugins/`, the staged copies `plugins:local` writes under `X.Y.Z+N`, so this machine runs the working tree |

The dev marketplace is what lets the toolkit be **used before it is published**
— without it, the author runs the last release and a plugin edited today reaches
nobody, including them. Both declare the **same marketplace `name`**, which is
load-bearing: a plugin's `dependencies` edge names its marketplace by name, so
vwf installed from a differently-named one would send its `stackgen` edge back
to the tagged marketplace and fail on a tag that does not exist yet. A machine
registers one or the other, never both. Setup and the refresh loop are
[`.claude/docs/dev-marketplace.md`](.claude/docs/dev-marketplace.md).

Note the three neighbours that read confusingly: `.claude-plugin/` is the
published manifest, `.dev-marketplace/` is the local one, and `.claude/` is this
repo's own skills, docs, agents and worktrees. None of them is `plugins/`.

The template layer and the four render trees this replaced, and the receipts the
installer no longer writes, are in [`repo-shape.md`][repo].

### Tasks

Run in `plugins.yml` (never in `release.yml`, which is the installer's and whose
trigger surface must stay untouched, and never in `site.yml`, which is the
website's); the first four also run locally via pre-commit, with marketplace,
inventory and check in that order — freshness before validity:

- **`plugins:marketplace`** — generates **both** marketplace manifests from the
  2 plugin manifests, plus the `.dev-marketplace/plugins/` staging directory the
  dev sources resolve into; **`--check`** fails if the committed file differs,
  or if that path is the retired symlink.
- **`plugins:inventory`** — generates `plugins/stackgen/stacks/inventory.md`
  from the stacks tree, so no pack, bundle or kind count is ever typed by hand;
  **`--check`** fails if the committed file differs.
- **`plugins:check`** — validates the authored tree, twelve rules.
- **`plugins:npm-normalize-test`** — table-tests the `npm-normalize.sh` hook
  through the system sed, for both package managers.
- **`vitest run`** — the `scripts/` and `installer/` suites.
- **`tsc --noEmit`** per TypeScript project — `installer/` and `scripts/`.
- **`site:check`** — the website's gate: `astro check`, `site:build` (Astro plus
  the pagefind index), then the link checker over `site/dist/**/*.html` and the
  markdown mirror it also emits (`dist/**/*.md`, `llms.txt`, `llms-full.txt`,
  plus each page's markdown alternate link). Runs in `site.yml`, not
  `plugins.yml`, and not in pre-commit. Beside it: **`site:dev`**,
  **`site:build`**, **`site:icons`** (rasterizes the committed favicon set, by
  hand when the mark changes), **`site:version`** and **`site:release`**.

What each rule asserts, and what the checker deliberately no longer checks, is
in [`repo-shape.md`][repo].

### Traps worth knowing

- **Only the published manifest is committed.** `.dev-marketplace/`, `bin/`,
  `site/dist/`, `site/.astro/` and the per-package `dist/` are gitignored. The
  published manifest is meant to be diffed in review; a bundle diff is noise,
  and a second committed file declaring the marketplace name `virajp-plugins` is
  a footgun on the branch users read. So `plugins:marketplace --check` reports
  an **absent** dev manifest as not applicable — the normal state in CI and in a
  fresh clone — and a **present but stale** one as a failure.
- **`claude plugin marketplace add` needs a path that looks like one.**
  `add .dev-marketplace` is rejected with *"Invalid marketplace source format"*;
  `add ./.dev-marketplace` works. The leading `./` is not optional.
- `CLAUDE.md`, `installer/CLAUDE.md`, `site/CLAUDE.md` and `readme.md` **are**
  dprint-formatted, so widening one table cell re-pads every row.
  `plugins/**/*.md` is **not** formatted — match the surrounding fold width by
  hand. `**/*.astro` **is** dprint's, via the markup plugin, and is excluded
  from the linter and from its pre-commit argument list: the linter has no Astro
  parser.
- The authoring traps — strict-YAML frontmatter dropping a skill silently, the
  dprint exclusion, and `${CLAUDE_PLUGIN_ROOT}` naming only its own plugin — are
  in `.claude/skills/plugin-authoring/`.

## Plugins

Two plugins ship. Each row's linked home is authoritative; the cells are an
index.

| Plugin     | Is                                                                                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`      | The flagship: the Product → Blueprint → Plan → Execute workflow, its subagents, the guarded `rtk` hook, the two mempalace auto-save hooks, and two MCP servers. Names **no** technology. Depends on `stackgen` alone. → [`vwf-plugin`][vwf]         |
| `stackgen` | The principles-driven stack materializer — shipped packs for the covered path, a Context7-researched generator for the uncovered tail, and the repo's own toolchain manager and gates since `devtools` dissolved into it. → [`stackgen-plugin`][sg] |

Full inventory, the native manifest shape, and the generated marketplace
manifest: [`.claude/docs/plugins.md`][plug]. Authoring doctrine that applies to
both — the checker rules, the two mise gates, the hook rules, the traps — is the
[`plugin-authoring`][auth] skill, which auto-applies under `plugins/`.

The workflow runs `setup` → `product` → `architecture` → `design-system` →
`blueprint` → `plan` → `execute`, with `verify` and `feedback` closing the loop.
**Everything up to `blueprint` is done in full before planning** — `plan`
hard-halts on a partial coverage stamp. The ordering gates, the skill and agent
tables, how to add a skill and pick its invocation mode, and the dependency
reasoning are the [`vwf-plugin`][vwf] skill.

## The installer CLI

`@virajp.dev/claude-plugins`, run as `pnpx @virajp.dev/claude-plugins …`, does
three things: **plugin installs as a thin wrapper** that sequences Claude's own
marketplace registration and plugin install commands, **graphify's wiring**, and
**`--uninstall`**. It never edits Claude's settings itself and writes **no
receipt**. `installer/` is the source; `bin/` is the tsup output, is gitignored,
and is what npm publishes. The statusline is a separate package
(`claude-status`), not a plugin and not installed here.

Everything else — the flag surface, the legacy-receipt reader, the interactive
uninstall, the GitHub token rule, testing — is [`installer/CLAUDE.md`][icl]; the
user-facing reference is `site/src/content/docs/installer/`, published at
`https://claude-plugins.virajp.dev/installer/`.

## CI & Releases

**`develop` takes the work; `main` is what users read** — Claude resolves the
marketplace against the default branch, so `main` stays default and PRs target
`develop`. `main` is merge-only, enforced by pre-commit locally and a ruleset
remotely. No release task commits: all three tag what has already landed.

Every plugin is pinned to its own tag in the marketplace manifest, which is what
decouples **merged** from **released**. Three tag families, all namespaced:

| Tag                    | Releases                     | Triggers                       |
| ---------------------- | ---------------------------- | ------------------------------ |
| `<name>-v<version>`    | one plugin                   | nothing — refs resolve to it   |
| `installer-v<version>` | `@virajp.dev/claude-plugins` | `release.yml` → npm publish    |
| `site-v<version>`      | the website                  | `site.yml` → `wrangler deploy` |

A tracked plugin version is always plain `X.Y.Z` — `plugins:check` fails one
carrying build metadata. The `X.Y.Z+N` the authoring machine runs between
releases exists only in the gitignored staged copies `mise run plugins:local`
writes, so `claude plugin update` sees each edit without a commit.

**Ask the user before running `plugins:release`, `i:release` or
`site:release`.**

The mise environment split, the four workflows and why `deps-update.yml`
dispatches rather than calls `release.yml`, the supply-chain settings and the
one-time npm setup are [`.claude/docs/ci-and-releases.md`][ci]. The release
ritual itself is the [`release`][rel] skill — run `/release`.

## Hooks

What ships as a plugin hook today is vwf's only — the guarded `rtk` Bash hook
and the two mempalace auto-save hooks — and is the [`vwf-plugin`][vwf] skill's.
Two more scripts ship as **stackgen pack payloads** copied into a target repo
rather than discovered here, covered by the [`stackgen-plugin`][sg] skill. The
three host rules that bite any hook — BSD `sed`, never in `settings.json`, the
per-event verdict shape — are the [`plugin-authoring`][auth] skill's.

## Adding a Plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json` with `name`, `version`
   (what an install pins to; plain `X.Y.Z`, bumped to ship changes) and
   `description`.
2. Run `mise run plugins:marketplace` and stage the result.
3. Give it a home: a path-scoped skill under `.claude/skills/<name>-plugin/`,
   and a row in the two tables above.

There is no second place to register it: the marketplace manifest is generated
from the manifests, so step 2 *is* the registration.

## Installation (end-user)

```sh
# The wrapper: registers the marketplace and installs in one run
pnpx @virajp.dev/claude-plugins --all                      # vwf (+ stackgen) at user scope
pnpx @virajp.dev/claude-plugins --project <plugin-name>    # into this repo

# Or Claude's own commands directly — the same thing, unsequenced
claude plugin marketplace add --scope user virajp/claude-plugins
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `vwf`, `stackgen`. Every one of them is authored here —
no name on this list is re-listed from another repo. (The statusline is not
among them and is not a plugin — it is a separate package,
`brew install virajp/tap/claude-status`.)

Installing `vwf` pulls in its dependency (`stackgen`) automatically from the
same `virajp-plugins` marketplace — no other marketplace needs to be registered.
`mempalace` is not a name here at all — its memory layer ships inside `vwf`, and
`devtools` is not one either — its toolchain and gate doctrine ships inside
`stackgen`. **A machine that installed `devtools` before it dissolved must
uninstall it by hand** (`claude plugin uninstall devtools`): an update simply
stops listing it as a dependency, leaving it enabled and its stale skills
shadowing the stackgen packs they moved into. The reasoning is
[`dependencies.md`](.claude/skills/vwf-plugin/references/dependencies.md).

Upgrading is `claude plugin marketplace update virajp-plugins` then
`claude plugin update <name>`. The **manifest** is served from this repo's
`main`, which `plugins.yml` validates on every push; each plugin's **content**
comes from the `<name>-v<version>` tag that manifest pins it to. So a merge to
`main` no longer reaches users — only a tag does, which is what
`mise run plugins:release` cuts. The `marketplace update` step is what picks up
new refs, and it is not optional: without it `plugin update` re-reads the same
pins and finds nothing.

**Nothing is gated at install time**, so the first thing to run afterwards is
`/vwf:doctor` — it is what reports a missing required binary, as a **blocking**
finding.

For **other agents** there is no marketplace and no rendered tree: point the
tool at this repo and ask it to adapt the plugin. `readme.md`'s "Other tools"
section carries the prompts and states plainly what is and is not promised.
