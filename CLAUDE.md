# CLAUDE.md

## Rules

- ALWAYS ask user before running `i:release` task
- **Docs ship with the change.** Any change to plugin behavior must reconcile
  `readme.md`, this file, and `docs/` in the same commit — stale docs are more
  harmful than no docs

## vwf workflow

This repo uses the **vwf** Product → Blueprint → Plan → Execute workflow — the
one it ships. Docs live under `docs/blueprint/` (the desired state) and
`docs/plans/` (the diffs to apply).

**Order:** `/vwf:setup` → `/vwf:product` → `/vwf:architecture` →
`/vwf:blueprint` (a full-product sweep — `plan` halts until its coverage stamp
reads complete) → `/vwf:plan <slice>` → `/vwf:execute` → `/vwf:archive`. Then
`/vwf:verify production` and `/vwf:feedback` route what production says back
into product/blueprint/plan.

`/vwf:design-system` runs in its **text-only Terminal UX** mode here: the
registry declares no screen platform (`plugin` has no screens, `cli` is a
terminal surface), so there is no canvas, no mockups and no `docs/scratchpad/`
render tree. `/vwf:screens` and `/vwf:mockups` do not apply to this product.

**The blueprint is a code-independent contract.** It records only decisions that
have more than one reasonable answer *and* are true regardless of how the code
is written today. Reuse-vs-build, file placement, step ordering, and library
choices are `plan`'s job — not the blueprint's.

**Docs:**

- `docs/blueprint/product.md` — problem, users, measurable goals (every flow
  `Serves:` one), slice priority.
- `docs/blueprint/architecture.md` — system shape + machine-readable Project
  Registry (`registry.yaml`).
- `docs/blueprint/conventions.md` — cross-cutting decisions.
- `docs/blueprint/environment.md` — per-project inventory of env vars + secrets,
  no values.
- `docs/blueprint/flows/<project>/<NNN>-<flow>/index.md` — one folder per flow,
  the **primary** blueprint unit. No `<platform>.md` files here: neither project
  declares a screen platform. `flows/index.md` is the catalog.
- `docs/blueprint/entities/<entity>/` — `index.md` (lifecycle, relationships,
  invariants) + `schema.yaml`. `entities/index.md` is the catalog + ER diagram.
- `docs/blueprint/apis/` — per-project API contracts; empty while neither
  project publishes one.

**The blueprint is an OKF bundle** — every doc is a typed concept (YAML
frontmatter) and relationships are markdown links, so any OKF-aware tool can
render it and graphify can ingest it.

Re-run `/vwf:setup` after upgrading vwf to migrate the docs to the latest
format.

## What This Repo Is

A multi-agent plugin toolkit (`virajp-plugins`) containing LSP servers, MCP
servers, and `vwf` — a full Product → Blueprint → Plan → Execute workflow plugin
(with post-deploy verify + production-feedback intake).

The repo also ships a small **installer CLI** (`@askviraj/ai-plugins`), which
sequences Claude's own plugin commands and wires graphify — see The installer
CLI.

### Where the detail lives

`CLAUDE.md` is the map. Each row below is loaded **on demand** — follow the link
when you need more than the summary here. The `.claude/skills/` rows also
auto-apply the moment you edit the tree they govern; `release` is `/release`.

| Read                                       | For                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [`.claude/docs/repo-shape.md`][repo]       | the one authored tree, what the installer writes, the mise tasks, the traps                   |
| [`.claude/docs/plugins.md`][plug]          | the full plugin inventory, the native manifest shape, the generated marketplace manifest      |
| [`.claude/docs/installer-cli.md`][cli]     | the `@askviraj/ai-plugins` shape a maintainer needs — flags, receipts, the source map         |
| [`.claude/docs/ci-and-releases.md`][ci]    | the mise environments, the branch model, the two tag families, the workflows, the rituals     |
| [`.claude/docs/dev-marketplace.md`][dev]   | running the plugins you are editing — setup, the refresh loop, and why `update` is not it     |
| [`.claude/skills/vwf-plugin/`][vwf]        | vwf's own shape — skills, agents, assets, the docs tree it maintains, its dependencies        |
| [`.claude/skills/plugin-authoring/`][auth] | the eleven checker rules, the invocation frontmatter, the plugin-root trap, dprint exclusions |
| [`.claude/skills/installer-cli/`][icli]    | the receipt kinds, the interactive uninstall, the packaging traps                             |
| [`.claude/skills/release/`][rel]           | the release ritual, the note format, the CI facts that make a failed publish legible          |

[repo]: .claude/docs/repo-shape.md
[plug]: .claude/docs/plugins.md
[cli]: .claude/docs/installer-cli.md
[ci]: .claude/docs/ci-and-releases.md
[dev]: .claude/docs/dev-marketplace.md
[vwf]: .claude/skills/vwf-plugin/SKILL.md
[auth]: .claude/skills/plugin-authoring/SKILL.md
[icli]: .claude/skills/installer-cli/SKILL.md
[rel]: .claude/skills/release/SKILL.md

The user-facing docs are a different tree and a different audience: `readme.md`,
`docs/cli/`, `docs/plugins/`, `docs/how-to/`.

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

cli/src/**                 installer source (TypeScript)
  ↓  tsup
bin/installer.mjs          gitignored build output — the published entrypoint
scripts/src/**             repo tooling: the generator and the checker
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

Run locally via pre-commit **and** in `plugins.yml` (never in `release.yml`,
which is the installer's and whose trigger surface must stay untouched):

- **`plugins:marketplace`** — generates **both** marketplace manifests from the
  2 plugin manifests, plus the `.dev-marketplace/plugins/` staging directory the
  dev sources resolve into; **`--check`** fails if the committed file differs,
  or if that path is the retired symlink.
- **`plugins:check`** — validates the authored tree, eleven rules.
- **`plugins:npm-normalize-test`** — table-tests the `npm-normalize.sh` hook
  through the system sed, for both package managers.
- **`vitest run`** — the `scripts/` and `cli/` suites.
- **`tsc --noEmit`** per TypeScript project — `cli/` and `scripts/`.

What each rule asserts, and what the checker deliberately no longer checks, is
in [`repo-shape.md`][repo].

### Traps worth knowing

- **Only the published manifest is committed.** `.dev-marketplace/`, `bin/` and
  the per-package `dist/` are gitignored. The published manifest is meant to be
  diffed in review; a bundle diff is noise, and a second committed file
  declaring the marketplace name `virajp-plugins` is a footgun on the branch
  users read. So `plugins:marketplace --check` reports an **absent** dev
  manifest as not applicable — the normal state in CI and in a fresh clone — and
  a **present but stale** one as a failure.
- **`claude plugin marketplace add` needs a path that looks like one.**
  `add .dev-marketplace` is rejected with *"Invalid marketplace source format"*;
  `add ./.dev-marketplace` works. The leading `./` is not optional.
- `CLAUDE.md` and `readme.md` **are** dprint-formatted, so widening one table
  cell re-pads every row. `plugins/**/*.md` is **not** formatted — match the
  surrounding fold width by hand.
- The authoring traps — strict-YAML frontmatter dropping a skill silently, the
  dprint exclusion, and `${CLAUDE_PLUGIN_ROOT}` naming only its own plugin — are
  in `.claude/skills/plugin-authoring/`.

## Plugins

Two plugins ship. Each row's linked doc is authoritative; the cells are an
index.

| Plugin     | Is                                                                                                                                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`      | The flagship: the Product → Blueprint → Plan → Execute workflow, its subagents, the guarded `rtk` hook, the two mempalace auto-save hooks, and two MCP servers. Names **no** technology. → [`vwf-plugin`][vwf]                                                                            |
| `stackgen` | The principles-driven stack materializer — 38 packs and 32 bundles across eleven kinds for the covered path, a Context7-researched generator for the uncovered tail, and the repo's own toolchain manager and gates since `devtools` dissolved into it. A vwf dep. → [`plugins.md`][plug] |

Full inventory, the native manifest shape, and the generated marketplace
manifest: [`.claude/docs/plugins.md`][plug]. Authoring doctrine: the
[`plugin-authoring`][auth] skill, which auto-applies under `plugins/`.

## The vwf Plugin

`vwf` is a full Product → Blueprint → Plan → Execute workflow — slash-invocable
workflow skills, auto-applying doctrine skills, the subagents they delegate to,
and the shared doctrine in `assets/`. It ships **no** stack templates and names
no technology; what each axis offers comes from a stack plugin behind the
stack-adapter contract.

It depends on exactly one plugin, `stackgen`, resolved from this marketplace.
`devtools` was the other until it dissolved into stackgen. `mempalace` and
`andrej-karpathy-skills` are **vendored** rather than depended on; `markdown`
and `context7` were **absorbed**.

The workflow runs `setup` → `product` → `architecture` → `design-system` →
`blueprint` → `plan` → `execute`, with `verify` and `feedback` closing the loop.
**Everything up to `blueprint` is done in full before planning** — `plan`
hard-halts on a partial coverage stamp.

The skill and agent tables, the assets map, the `docs/blueprint/` tree, the two
format stamps, the ordering gates and the dependency reasoning are the
[`vwf-plugin`][vwf] skill, which auto-applies under `plugins/vwf/`.

## The installer CLI

`@askviraj/ai-plugins`, run as `pnpx @askviraj/ai-plugins …`, does three things:
**plugin installs as a thin wrapper** (`--all` / `--user <name>` /
`--project <name>` drive Claude's own `plugin marketplace add` +
`plugin install`), **graphify's wiring**, and **`--uninstall`**. It never edits
Claude's settings itself, and writes **no receipt** — both install paths belong
to a tool that keeps its own records, and those records are what `--uninstall`
reads live.

**`cli/` is the source; `bin/` is the tsup output, is gitignored, and is what
npm publishes.** The statusline is a separate package (`claude-status`), not a
plugin and not installed here.

The flag surface, the legacy-receipt reader, the GitHub token rule and the
source map are [`.claude/docs/installer-cli.md`][cli]; the authoring discipline
is the [`installer-cli`][icli] skill, which auto-applies under `cli/`. The
user-facing reference is `docs/cli/`.

## CI & Releases

**`develop` takes the work; `main` is what users read** — Claude resolves the
marketplace against the default branch, so `main` stays default and PRs target
`develop`. `main` is merge-only, enforced by pre-commit locally and a ruleset
remotely. Neither release task commits: both tag what has already landed.

Every plugin is pinned to its own tag in the marketplace manifest, which is what
decouples **merged** from **released**. Two tag families, both namespaced:

| Tag                    | Releases               | Triggers                     |
| ---------------------- | ---------------------- | ---------------------------- |
| `<name>-v<version>`    | one plugin             | nothing — refs resolve to it |
| `installer-v<version>` | `@askviraj/ai-plugins` | `release.yml` → npm publish  |

A tracked plugin version is always plain `X.Y.Z` — `plugins:check` fails one
carrying build metadata. The `X.Y.Z+N` the authoring machine runs between
releases exists only in the gitignored staged copies `mise run plugins:local`
writes, so `claude plugin update` sees each edit without a commit.

**Ask the user before running `plugins:release` or `i:release`.**

The mise environment split, the three workflows and why `deps-update.yml`
dispatches rather than calls `release.yml`, the supply-chain settings and the
one-time npm setup are [`.claude/docs/ci-and-releases.md`][ci]. The release
ritual itself is the [`release`][rel] skill — run `/release`.

## Hooks

Hooks are authored directly as each plugin's `hooks/hooks.json`, in Claude's own
format, with the scripts beside it. What ships as a plugin hook today is vwf's
only: the guarded `rtk` Bash hook, and the two mempalace auto-save hooks (`Stop`
and `PreCompact`).

**Two scripts ship that are not plugin hooks**, both stackgen pack payloads
copied into the target repo rather than discovered here: the
`capability-provider/fnox` pack's git pre-commit gate, and the
`package-manager/pnpm` pack's npm→pnpm/bun normalizer (`PreToolUse` on `Bash`,
via `updatedInput`), which used to be a `typescript` plugin hook and moved with
the package manager it rewrites for. `plugins:check`'s hook rule reads only a
plugin's own `hooks/hooks.json`, so it sees neither script nor its executable
bit; `plugins:npm-normalize-test` is what covers the normalizer instead.

Three rules that bite: hook scripts must be portable to macOS **BSD `sed`** (no
`\s`, no `\b`); **plugin hooks are never written to `settings.json`** — they are
auto-discovered from `hooks/hooks.json`, so verify them with `/hooks`; and **a
script's verdict shape is decided by its event**, not by convention.
`hookSpecificOutput.permissionDecision` is `PreToolUse`-only — `Stop` and
`PreCompact` deny with the top-level `decision`/`reason`, and Claude rejects the
whole verdict if a `hookSpecificOutput` arrives without a matching
`hookEventName`. That shipped in the mempalace checkpoint hook, where a rejected
verdict reads exactly like a hook that decided to stay quiet.

> Details, including why the mempalace hooks are reimplemented rather than
> vendored: `plugins/stackgen/assets/artifact-doctrine.md` §4 (the host rules,
> which apply to a generated hook and a plugin's alike) and
> `.claude/skills/plugin-authoring/` (ours).

## Adding a Plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json` with `name`, `version`
   (what an install pins to; plain `X.Y.Z`, bumped to ship changes) and
   `description`.
2. Run `mise run plugins:marketplace` and stage the result.

There is no second place to register it: the marketplace manifest is generated
from the manifests, so step 2 *is* the registration.

## Adding a vwf Skill

Create `plugins/vwf/skills/<name>/SKILL.md` — no other registration is needed
(auto-discovered). Then pick the invocation mode per the policy below.

### Invocation policy

Claude spells this with two independent booleans, and the useful states are
three:

| State              | Frontmatter                        | For                      |
| ------------------ | ---------------------------------- | ------------------------ |
| user **and** model | `disable-model-invocation: false`  | anything delegated to    |
| model only         | `user-invocable: false` + `paths:` | auto-applying doctrine   |
| user only          | `disable-model-invocation: true`   | the user owns the timing |

It is **not cosmetic**: a user-only skill is removed from the model's context
entirely, so it **cannot be invoked by another skill**, and the failure is
**silent** — the caller simply cannot see it. The rule: model-invocable when
anything delegates to it, user-only when nothing does.

Cross-plugin skill-name uniqueness is no longer required — Claude scopes a skill
to its plugin. The `<plugin>-` prefix on adapter skill names is readability now,
not correctness, and `prefixSkillNames` is gone.

> The host rules behind this — the three states and the silent failure — are
> `plugins/stackgen/assets/artifact-doctrine.md` §2. The per-skill rulings and
> the two contracts the checker enforces are
> `.claude/skills/plugin-authoring/references/checks.md`.

## Installation (end-user)

```sh
# The wrapper: registers the marketplace and installs in one run
pnpx @askviraj/ai-plugins --all                      # vwf (+ stackgen) at user scope
pnpx @askviraj/ai-plugins --project <plugin-name>    # into this repo

# Or Claude's own commands directly — the same thing, unsequenced
claude plugin marketplace add --scope user virajp/ai-plugins
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
