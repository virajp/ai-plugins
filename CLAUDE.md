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

### One authored tree

Plugins are **authored natively for Claude Code**, once, and installed by
Claude's own plugin commands. What you edit is exactly what a user gets:

```text
plugins/<plugin>/          the authored source, and the installed shape
  .claude-plugin/plugin.json   the manifest
  skills/ agents/ hooks/ assets/ stacks/ vendor/
  ↓  scripts/src/marketplace.ts
.claude-plugin/marketplace.json    generated at the repo root, committed

cli/src/**                 installer source (TypeScript)
  ↓  tsup
bin/installer.mjs          gitignored build output — the published entrypoint
scripts/src/**             repo tooling: the generator and the checker
```

**One file is generated**: the marketplace manifest, a projection of the 8
plugin manifests. It lives at the repo **root**, not under `plugins/`, because
every `source` inside it resolves relative to the marketplace root — which is
where Claude looks when this repo is added. It is committed so what users
install is inspectable and diffable, and `plugins:marketplace --check` asserts
it matches a fresh generation.

Note the two neighbours that read confusingly: `.claude-plugin/` is that
generated manifest, while `.claude/` is this repo's own skills, agents and
worktrees. Neither is `plugins/`.

> **Authoring one:** the ten checker rules, the invocation frontmatter, the
> plugin-root trap and the dprint exclusion live in
> `.claude/skills/plugin-authoring/`, which auto-applies while you edit
> `plugins/`.

**This replaced a template layer and four render trees**, and the shape of what
went is worth knowing, because a fair amount of this file used to describe it.
Plugins were authored target-agnostically in `templates/` with Eta helpers, a
`renderer/` package rendered them into committed `claude/`, `cursor/`, `ohmypi/`
and `opencode/` trees, `schema/` held the neutral contract, and the CLI
installed from those trees through four adapters. It was the repo's single
largest complexity bill, paid for support that was limited anyway — the coverage
report conceded 17–18 dropped and 20–30 degraded features on the flat targets
every build. Other agents are now served by [a documented prompt](./readme.md),
not a bespoke render. Do not reconstruct any of it from this paragraph; git has
it.

### Installing, and the receipts nothing writes

The CLI installs plugins as a **thin wrapper** — `--all` / `--user <name>` /
`--project <name>` drive `claude plugin marketplace add` and
`claude plugin install`, reading this repo's `main`, and Claude's own commands
work just as well directly. It also wires graphify, and removes whatever the
toolkit put on the machine.

**Nothing it does writes a receipt.** Both install paths belong to another tool
— `claude` for plugins, `graphify` for its own wiring — and each keeps its own
records, which is what `--uninstall` reads live.

What survives is the **reader**, and it is load-bearing rather than vestigial: a
machine that installed an earlier version still carries receipts recording what
was there *before* that install, and `--uninstall` replays them so the user gets
their own state back rather than a deletion. What it can still meet are the
retired render targets' receipts — `claude.json`, `cursor.json`, `ohmypi.json`
and `opencode.json` among them. Nothing this CLI does adds to that pile, and
**it deletes only what it wrote** — which, since it writes nothing, means it
deletes nothing a receipt or another tool does not account for.

> **Working on it:** the receipt entry kinds, the interactive uninstall and the
> packaging traps are in `.claude/skills/installer-cli/`, which auto-applies
> while you edit `cli/`.

### Tasks

Run locally via pre-commit **and** in `plugins.yml` (never in `release.yml`,
which is the installer's and whose trigger surface must stay untouched — npm
allows one Trusted Publisher and validates the entry-point filename):

- **`plugins:marketplace`** — generates `.claude-plugin/marketplace.json` from
  the 7 `plugins/*/.claude-plugin/plugin.json` manifests, mapping `keywords` →
  `tags` and supplying what no manifest holds: the marketplace header, and the
  per-entry `category`, `strict` and `source`. **`--check`** regenerates in
  memory and fails if the committed file differs. That mode is the only guard on
  a file that is generated **and** committed — a manifest edited without a
  regenerate is invisible to every other check, and the committed manifest keeps
  advertising the old version. It is what `plugins:render-clean` narrowed down
  to.
- **`plugins:check`** — validates the authored tree. Ten rules: manifest
  name↔dir; dependencies resolving within the marketplace; hook scripts existing
  and executable; **strict-YAML frontmatter**; relative links under
  `assets/examples/**`; **root-relative reference resolution** (every such
  reference resolves inside the plugin that wrote it); **agent cross-reference
  resolution** in both directions (every role-shaped `` `token` `` in a plugin's
  own prose names a real agent, and every declared agent is referenced at least
  once — the two directions cover each other on a rename); the vwf
  design-adapter contract (all **three** import skills present and
  model-invocable); the vwf **stack-adapter** contract (both
  `<plugin>-stack-menu` and `<plugin>-stack-template` present and
  model-invocable on every plugin keyworded `vwf-stack-adapter` — since the Wave
  C retirement that is `stackgen`, `gcp` and `cloudflare` only); and the
  **technology-free vwf** guard.

  Two of those are worth the extra sentence. The technology-free guard bans vwf
  naming a concrete technology **only where the mention prescribes**, which is
  subtler than it sounds — and it reads the manifest's `mcpServers` invocations
  beside the prose, where the bar is not "names no tool" (a manifest must name
  something executable) but that the runner is **overridable**. And the
  plugin-root rule caught a defect that had shipped in all four render trees for
  months: `${CLAUDE_PLUGIN_ROOT}` names only its *own* plugin, so `typescript`
  pointing at vwf's `delivery-pipeline.md` resolved to nothing at runtime. Both
  are in `.claude/skills/plugin-authoring/references/checks.md`, along with the
  eight rules that retired.
- **`typescript:test`** — table-tests the `typescript` `npm-normalize.sh` hook
  through the system sed (the BSD-sed portability guarantee), for **both**
  package managers: each table runs in a temp dir seeded with the lockfile that
  selects pnpm or bun, so resolution is exercised alongside the rewrite. It runs
  against `plugins/typescript/hooks/`, which is now both the source and what
  ships. The hook lives in the **language** plugin, not in `vwf`: a JS/TS
  rewrite has no business in a language-agnostic workflow plugin.
- **`vitest run`** — the `scripts/` and `cli/` suites.
- **`tsc --noEmit`** per TypeScript project — `cli/` and `scripts/`. Nothing
  emits, so `tsc` is only ever a checker, and there are no project references to
  walk.

`plugins:check` is deliberately much smaller than the checker it replaced, and
smaller again than the Python task before that. Whole families of assertion
became *unrepresentable* rather than merely unchecked — the two dependency lists
kept identical by hand, marketplace registration in both directions, skill
`name:`/`description:`/`model:` shape, and everything that existed to compare
four render trees. What remains is what no format and no type can state.

Plugin/skill version numbers are **not** cross-checked — they are independent by
design (a plugin may hold skills versioned on their own cadence).

### Traps worth knowing

- **The generated marketplace manifest is committed; `bin/` and the per-package
  `dist/` are gitignored.** The manifest is meant to be diffed in review; a
  bundle diff is noise.
- `CLAUDE.md` and `readme.md` **are** dprint-formatted, so widening one table
  cell re-pads every row. `plugins/**/*.md` is **not** formatted — match the
  surrounding fold width by hand.
- The authoring traps — strict-YAML frontmatter dropping a skill silently, the
  dprint exclusion, and `${CLAUDE_PLUGIN_ROOT}` naming only its own plugin — are
  in `.claude/skills/plugin-authoring/`.

## Plugins

| Plugin       | Source               | What it provides                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`        | `plugins/vwf`        | Skills (slash-invocable workflow skills + auto-applying doctrine skills, incl. the absorbed `documentation-standards` + `readme` and the vendored `mempalace` + `mempalace-recall` + `karpathy-guidelines`), subagents, the guarded `rtk` Bash hook plus the two mempalace auto-save hooks, and **two** MCP servers — mempalace over **HTTP** (see The memory layer: vendored skills, vwf's server) and the absorbed Context7 docs server over stdio. Names **no** technology: no stack templates, no language list                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `typescript` | `plugins/typescript` | The **TypeScript language plugin** — one plugin per toolchain (this one owns the Node/TS ecosystem), covering `typescript` and `javascript`. A `typescript` router skill (lean SKILL.md → on-demand standards/vitest/build references, single-package and monorepo) plus an `effect` router skill (effect/effect-runtime/testing references, folded back in — a framework is not a plugin boundary), `package-json`, `pnpm`, `tsconfig`, `lint-format`, the TypeScript/JavaScript language server, the npm→pnpm/bun normalizing hook, **Its stack adapter retired in Wave C**: all twelve TypeScript templates are now stackgen bundles, both `cli` answers and all three `repo` answers included, so this plugin no longer offers a menu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `flutter`    | `plugins/flutter`    | Opinionated Flutter skills — `dart` & `swift` router skills (lean SKILL.md → on-demand topic references) plus `kotlin`, `pubspec`, `analysis-options`, `internationalization` + bundled Dart, Kotlin & Swift (SourceKit) language servers. **Its stack adapter retired in Wave C** — `dart-flutter` is a stackgen bundle now, and the app-framework pack carries the Dart/Kotlin/Swift judgment. Self-contained (no cross-marketplace deps)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `devtools`   | `plugins/devtools`   | The **developer-machine toolchain** — the mise skill (the `.config/` three-file `MISE_ENV` split, tool/env placement, file-based tasks, node-gpg workaround) + `/devtools:scaffold` and the repo-level gates: `dprint`, `eslint`, `gitleaks`, `grype`, `pre-commit`. **Its stack adapter retired in Wave C**, **its `docker` skill in Wave D** and **its `doppler` skill with the `secrets-manager` packs** — `container-generic` is a stackgen bundle, the deploy artifact is stackgen's `deploy-target/container-image` pack, the local stack is stackgen's harness contract, and secrets are a user-picked provider on the backing axis behind stackgen's `contracts/secrets.md`. It now holds **no** secrets doctrine at all. A **vwf dep**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `cloudflare` | `plugins/cloudflare` | Cloudflare stack plugin for vwf — **scope deliberately parked at Zero Trust Access**: a private plane in front of a project that must not be publicly reachable, whichever cloud hosts it. Workers, Pages, R2, D1, KV, Durable Objects, Queues, Images and Stream are **not** offered and arrive under their own dedicated plan; the menu states what it does not cover rather than coming back quietly short.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `gcp`        | `plugins/gcp`        | Google Cloud stack plugin for vwf — the judgment an SDK reference cannot give: which service to pick and when it stops being the answer, how each bills, which have local emulators, least-privilege IAM. Ships `firebase`/`cloud-sql` (backing) and `cloud-run`/`gke` (deploy) plus `gcp-cost`, `gcp-iam`, `gcp-local-stack`. Observability is OTLP only — GCP services are sinks, never SDKs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `stackgen`   | `plugins/stackgen`   | The **principles-driven stack materializer** — implements the stack-adapter contract with a dispatch rule that runs **per component** (closed types/categories in `assets/taxonomy.md`; a bundle is a recorded composition of component refs, never a directory): a component a shipped **pack** covers is copied verbatim; an uncovered one is **generated** (per-topic Context7 research → vwf's principles catalog → the `stackgen-skill-reviewer` gate, capped at four rounds), with one consent and one landing per bundle. Both paths land **directly in the repo's committed `.claude/` tree** — output closed to skills/agents/hooks/rules (never MCP or LSP config), shaped by the **kind vocabulary** (`assets/kinds.md` — each kind a closed topic bar, one artifact per topic, **lazily hung and never line-capped** — a large artifact is decomposed into a router skill plus on-demand references, never trimmed), recorded in `.claude/stackgen/lock.yaml`; `settings.json` is never edited without separate explicit consent, CLAUDE.md is vwf's (the materializer recommends `/vwf:setup`); re-sync is explicit and lockfile-diffed via the user-only `stackgen-sync`. **Waves A–D landed 23 packs and 25 bundles across nine kinds**, most of whose doctrine still ships from its curated plugin too, since a pack is the destination the no-skill-lost rule needs *before* retirement, not a replacement on landing. **Wave D added two kinds — `deploy-target` and `design-tool`** — the first being one component standing alone, no second half — and its `container-image` pack is the first whose source skill was deleted in the same commit, because the pack plus the new `contracts/local-stack.md` **harness** contract carry everything `devtools:docker` said — and the `secrets-manager` packs are the second, `doppler` plus `contracts/secrets.md` carrying everything `devtools:doppler` said, and the extended `ci-system/github-actions` pack the third, plus the new `contracts/release-trigger.md`, the first to retire not a skill but a **whole plugin**: `cicd` was exactly one kind wearing a manifest. Wave D also **dissolved the `claude-code` plugin**, splitting its doctrine: plugin *structure* is the authoring repo's own and is not distributed, while the host rules deciding whether a skill/agent/hook is **valid at all** became `assets/artifact-doctrine.md` — an asset the generator writes against and the reviewer gates on (a ninth check), never materialized, applying to every run whatever the stack. Until the remaining waves land, the curated plugins are the covered path and stackgen's value is the uncovered tail |

## Plugin Structure

Every plugin is a directory under `plugins/` with a `.claude-plugin/plugin.json`
— Claude Code's native manifest. Minimal form:

```json
{
  "$schema": "https://www.schemastore.org/claude-code-plugin-manifest.json",
  "name": "<plugin-name>",
  "version": "0.1.0",
  "description": "<one line>"
}
```

The `$schema` line is what gives an editor the field list, and that schema is
authoritative for the shape — there is no zod copy of it in this repo any more.

A manifest declares **no install-time eligibility at all** — no scope, no opt-in
flag, and no `requires`. Scope is whichever `--scope` the user passes to
`claude plugin install`; there is no default set to be in or out of. `requires`
was a hard install gate the retired CLI enforced over the dependency-expanded
set; a missing binary now surfaces as a `/vwf:doctor` **blocking** finding
instead, which is the trade taken on the grounds that doctor already halts
`setup` and `execute` on it.

Skills, agents, and hooks are **auto-discovered by directory convention** and
are never listed in the manifest:

- `skills/<name>/SKILL.md` → skills. This repo has **no `commands/` dirs**:
  former commands are skills, so one artifact serves both invocation paths.
- `agents/<name>.md` → subagents
- `hooks/hooks.json` → hooks, with their scripts beside them

Optional manifest blocks: `lspServers`, `mcpServers`, `dependencies`, `author`,
`repository`, `keywords`.

> Field by field, including the cross-marketplace dependency rules:
> `.claude/skills/plugin-authoring/references/structure.md`.

### The marketplace manifest

One file, `.claude-plugin/marketplace.json`, at the repo **root** — generated by
`plugins:marketplace` from the 7 plugin manifests, with `source` set to
`./plugins/<name>`. Root rather than under `plugins/`, because every source
resolves relative to the marketplace root, which is where Claude looks when this
repo is added.

Do not edit it by hand; `plugins:marketplace --check` will fail, in pre-commit
and in CI. Because it is derived from the manifests, a plugin cannot be
unregistered, orphaned, or disagree with its own entry — which is the drift the
old `plugin.json`-plus-hand-written-entry pair existed to create.

Two traps ride on it, both verified against the real tool and both silent when
wrong: **sources resolve against the marketplace root** (a path that exists but
resolves from the wrong base looks fine in the manifest), and **every entry must
state its own `version`** (omitting it does not leave the version unset — the
tool falls back through a chain that resolves by accident, and the plugin lists
as `0.0.0`). Details: `.claude/skills/plugin-authoring/references/structure.md`.

## The vwf Plugin

`vwf` is the flagship plugin. Its layout under `plugins/vwf/`:

- `skills/` (workflow) — the `/vwf:` workflow skills (each
  `skills/<name>/SKILL.md`), implementing the Product → Blueprint → Plan →
  Execute model. Most are slash- **and** model-invocable because **other skills
  delegate to them by name**; five are **user-only**
  (`disable-model-invocation: true`) — see Invocation policy below. **Each
  SKILL.md is the authoritative description of its own behavior**; the table
  below is an index, not a second copy — the previous prose version of it
  drifted twice in a single session before being cut.

  | Skill                | What it does                                                                                                                                                                                                                                                                                                                                                                       | Halts / gates                                                                                                                                                                                                    |
  | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `setup`              | Phase-0 bootstrapper: Step 0 resolves one of three entry paths — `onboard` (blank repo or repo with code), `migrate` (reconcile the tree against the current format), `current` (report and exit) — then a shared spine validates, stamps `.config/vwf.yaml`, runs `doctor`, commits, and prints the chain forward without running it                                              | unparseable `.config/vwf.yaml` → halt; a `doctor` **blocking** finding → halt **and revert the stamp**                                                                                                           |
  | `product`            | Phase −1 outcome contract — problem, users, goals (`#goal-<slug>` anchors), slice priority, optional tier matrix                                                                                                                                                                                                                                                                   | —                                                                                                                                                                                                                |
  | `architecture`       | The system shape: writes `registry.yaml` (authoritative) + `architecture.md` (its prose view); stacks go to `.config/vwf.yaml`. Registry absent but `product.md` present → **derivation mode**: the registry proposal is read out of the product contract with its evidence quoted, corrected by MCQ, with the interview as the fallback for whatever the contract underdetermines | —                                                                                                                                                                                                                |
  | `design-system`      | **Import-only where there are screens** — the project's configured design tool authors the design system; this imports it via the adapter and pins `design.design_system_id`. A registry with **no** screen platform takes the text-only path: adapter preflight skipped, Terminal UX elicited directly                                                                            | no canvas surface on a screen-platform product → halt; required once the registry has a UI project                                                                                                               |
  | `blueprint`          | The full-product **flow-first sweep**: works a coverage worklist (incl. `density/` items → `blueprint-condenser`) until whole-product coverage **and** the coherence review hold, then stamps `blueprint.coverage`                                                                                                                                                                 | halts without `product.md`; halts on a Screens flow with no `design-system.md`                                                                                                                                   |
  | `mockups`            | Batch re-render of screens into the **gitignored** `docs/scratchpad/` tree — never pushed to Claude Design, never a gate for `plan`                                                                                                                                                                                                                                                | —                                                                                                                                                                                                                |
  | `screens`            | Two-way canvas sync: `prompt` writes per-platform design briefs (the files *are* the deliverable), `import` diffs designed pages back and routes every accepted delta through `/vwf:blueprint`                                                                                                                                                                                     | never edits a flow doc itself                                                                                                                                                                                    |
  | `plan`               | One slice's desired-vs-actual delta as a cycle plan; resolves the transitive dependency chain and plans each unimplemented dependency as its own plan first                                                                                                                                                                                                                        | halts unless `blueprint.coverage: complete`; on a `doctor` **blocking** finding across the chain's projects (no LSP gate — planning compiles nothing); on an `unresolved` axis; on a failed `conventions:` fetch |
  | `execute`            | Runs one approved plan to completion **autonomously** in a dedicated worktree, to **one** final human gate that renders the run journal                                                                                                                                                                                                                                            | halts until every `requires:` plan's `covers:` docs read `implementation: complete`; halts on an `unresolved` stack axis                                                                                         |
  | `verify`             | Post-deploy environment check; a clean **production** run offers to freeze each service's OpenAPI contract into `apis/released/`                                                                                                                                                                                                                                                   | vwf never deploys                                                                                                                                                                                                |
  | `feedback`           | Production-feedback front door: classifies bug/hole/metric/UX/idea and routes each into the doc + command that fixes it; `canvas` harvests claude.ai/design review conversations                                                                                                                                                                                                   | —                                                                                                                                                                                                                |
  | `archive`            | Moves completed cycle plans into `docs/plans/archived/`; never deletes                                                                                                                                                                                                                                                                                                             | —                                                                                                                                                                                                                |
  | `doctor`             | Checks the repo against `.config/vwf.yaml` — per-language LSP + toolchain, frameworks/deps vs each manifest, `repo.stack`, harness task names, health paths, the mempalace config (one at the repo root, its wing/room set, its secret excludes), the graphify CLI/graph/hook/ignore, format-stamp drift. Reports to room `doctor`; never writes uninvited, never builds a graph   | never halts — a mandate is a **blocking** finding, and `setup` + `execute` both halt on one (`execute` also gates on LSP)                                                                                        |
  | `git-workflow`       | Internal: worktree isolation, commits, merges, pushes — every other skill delegates git here                                                                                                                                                                                                                                                                                       | —                                                                                                                                                                                                                |
  | `handoff` / `recall` | session handoff written to **both** memory stores; the reserved **`next`** handoff is the argument-less default, is mirrored to the **main checkout's** `docs/memory/handoff/next.md` (gitignored — a handoff is personal, and a worktree copy would die with the worktree), and `recall next` resumes without a gate                                                              | —                                                                                                                                                                                                                |
  | `readme`             | Scans the repo and writes/updates its README against the eight required sections. Absorbed from the retired `markdown` plugin; model-invocable **because `/vwf:docs-sync` routes a drifted README through it** — `setup` only names it in the chain it prints                                                                                                                      | —                                                                                                                                                                                                                |
  | `docs-sync`          | Reconciles the repo's human-facing docs — README, `CLAUDE.md`, `docs/` guides, per-project READMEs, the app changelog — against a landed change, editing only what it falsified. Every reality-changing run ends by delegating here; standalone it scopes to a commit range or the branch's delta, which is what finally covers ad-hoc work. Scan runs in `docs-sync-surveyor`     | empty scope, or one touching only `docs/blueprint/`+`docs/plans/` → report and stop (that is intent, not reality)                                                                                                |

  Ordering and what each gate means: **Foundations & ordering** below. The
  execute stage pipeline (`code` → `review` ‖ `security` → `acceptance` + `ux`,
  the convergence guard, the run journal): `assets/execute-stages.md`.
- `agents/` — the subagents the workflow skills delegate to. Delegation is a
  **latency and context strategy as much as a quality one**: read-heavy scans
  and mechanical writing run in a subagent so their file loads never enter the
  orchestrator's context, where every loaded line is re-processed on each later
  turn. Each agent file states its own contract; `plugins:check` verifies these
  names resolve, in both directions.

  | Agent                                        | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
  | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `blueprint-surveyor`                         | The sweep's coverage worklist — walks the bundle against the coverage conditions (incl. standard-flows mandates and `density/` line counts) and returns only the ordered worklist                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `flow-writer`, `entity-writer`               | Render the orchestrator's **already-elicited** decisions into format-conformant docs + catalog rows. Never elicit, never invent; report anything unfilled as `UNRESOLVED:`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
  | `blueprint-reviewer`                         | Per-doc completeness gate, two modes (flow / entity), plus the code-independence, vendor-name, and **density** bars                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
  | `blueprint-condenser`                        | The density pass — one over-budget doc → a lossless-of-contract rewrite; returns before/after counts, what it could not cut, rationale to persist, questions to park, and any contract hole the cut exposed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
  | `blueprint-coherence-reviewer`               | End-of-sweep whole-product pass across flows/entities/schemas/APIs; catalog + erDiagram sync; the released-API additive-only diff as a HARD gap. Takes a **scope** (`full`, or sharded `flow-walk` + one `bundle`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
  | `plan-surveyor`                              | The desired-vs-actual survey — the largest inline read in the workflow; graph-first, returns `PRESENT`/`PARTIAL`/`ABSENT` + reuse candidates as `file:line`, never code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
  | `architecture-writer`                        | Writes `registry.yaml` + `architecture.md`; never sees or records a stack                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `mockup-generator`                           | Per-flow: Screens contract + design-system tokens → self-contained HTML into the gitignored scratchpad; returns only a manifest                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
  | `execute-coder`                              | The code stage under strict TDD, to the coverage gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
  | `execute-code-reviewer`                      | Adversarial review incl. the released-contract compatibility dimension and its `API COMPAT:` line                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `execute-security-reviewer`                  | Threat-models the diff against the project's declared capabilities                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
  | `execute-acceptance-verifier`                | Independent criteria→E2E mapping + run; also `/vwf:verify`'s environment mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | `execute-ux-reviewer`                        | Renders changed screens and judges them against design-system + the Screens contract. Invokes the repo's **own** `ux-gate` skill by fixed name — materialized there by whichever pack owns the stack, never a name constructed from the stack pin. **One path, not a web path and a native one** — every screen platform, browser (`site`/`webapp`) or device (`desktop`/`mobile`/`tablet`/`auto`), gets its visual check and its a11y scan from that same gate, and *how* it renders or asserts is the owning plugin's business, never named here. The agent judges what comes back against design-system + Screens, plus a code-level pass the render can't prove. `RENDERED: n/a` on any UI slice reaches the gate, never a silent downgrade |
  | `docs-sync-surveyor`                         | Stateless doc-drift survey for `/vwf:docs-sync` — one change scope against a doc inventory; returns terse `file:line` findings (falsified claims, omissions) and `BROAD DRIFT: <path>` once a doc passes ~10, which routes it to a wholesale rewrite. Never edits                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `product-reviewer`, `design-system-reviewer` | The completeness gates for their two foundation docs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

- `skills/` (doctrine, auto-applying — `user-invocable: false` + `paths:`
  scoped) — read automatically when editing the files they govern. Each SKILL.md
  and its references are authoritative:

  | Skill                     | Governs                                                                                                                                                                                                                                                                                                                                                                                                                    |
  | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `blueprint-authoring`     | `docs/blueprint/**` — the contract-vs-realization line, the **density** bars (budgets, the delete test, the anti-patterns), the per-surface completeness bars (flow-contract, plugin-contract, entity-contract, api-and-schema-contracts), and the OKF frontmatter/link doctrine. Also `docs/plans/**`, for frontmatter + link hygiene only                                                                                |
  | `product-foundations`     | The twelve foundational concerns every product decides (users & operators, observability, audit logs, change logs, background processes, data retention & PII, notifications, runtime settings, rate limiting, reliability targets, disaster recovery, cost guardrails) as **elicited defaults** — walked by `/vwf:architecture` step 3c, expanded by `/vwf:blueprint` into `conventions.md` anchors and per-flow surfaces |
  | `design-system-authoring` | `docs/blueprint/design-system` — tokens, typography, spacing, motion, accessibility, component behaviors/anti-patterns, and terminal-ux (required when a project declares platform `cli`)                                                                                                                                                                                                                                  |
  | `rest-api-design`         | API contract depth — resources, methods, errors, pagination, idempotency, versioning                                                                                                                                                                                                                                                                                                                                       |
  | `documentation-standards` | `**/*.md` — writing style, heading hierarchy, links, front matter, CHANGELOGs, and the mermaid rules. Absorbed from the retired `markdown` plugin                                                                                                                                                                                                                                                                          |

  There is **no `project-setup` doctrine skill**. Onboarding and migration
  doctrine governs a command run, not a file being edited, so nothing about it
  auto-applies: it lives under `skills/setup/references/` — the topology menu
  and the recognition tables (roles by consumer domain, platforms by evidence)
  in `topology-detection.md`, the target layouts in `workspace-structure.md`,
  the dry-run discipline in `migration-and-consent.md`, and the retired-spelling
  map in `format-lineage.md`. The one structural rule vwf enforces is still
  there: an `iac` project must be its own repo under every topology, which
  `doctor` raises as **blocking** unless a decline is recorded under
  `enforcement:`, after which it is a warning reported every run.
- `assets/` — the shared doctrine and data every skill and agent reads. **Each
  file is authoritative for its own subject**; this is a map of which one owns
  what, not a summary of their contents:

  | Asset                                  | Owns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `templates/`                           | Every doc skeleton vwf writes: `flow` + `flow-platform`, `flows-index`, `entity` + `entities-index` + `schema.yaml`, `registry.yaml`, `openapi.yaml`, `conventions`, `plan`, `product`, `architecture`, `design-system`, `environment`, `screen-prompt`, `project-claude`, `handoff`. All blueprint markdown opens with the OKF frontmatter block                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | `examples/blueprint/`                  | The **format-23 conformance bundle** — a worked, format-valid slice where every link resolves, each flow carries Acceptance + sequence diagram + Components blocks + a Guarantees table, every doc sits inside the density budget, and nothing names a vendor. The concrete "what good looks like", link-checked by `plugins:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
  | `elicitation.md`                       | The shared questioning protocol (one decision per round, **§3a — every question names its scope**: the registry project + its `platforms`, the platform when platform-specific, or "the whole product"; the hard gate before writing, the convergence guard, the **parked-scope rule**)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
  | `execute-stages.md`                    | The execute stage pipeline: the stage table + Runs column, per-stage subagent contracts, shared stage rules (model enforcement, loop-on-findings, the **convergence guard**), the **run journal** shape, and the end-of-run reconcile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
  | `capability-vocabulary.md`             | The stack-agnostic capability tokens — each carrying a **kind** (`B` backing service / `F` product foundation / `P` project-axis fact), which is what makes "this capability has no provider" checkable and is the gap `/vwf:doctor` §5 now reports as a non-blocking finding — **and** the prose-noun mapping (`document-datastore` → "the datastore") every blueprint doc writes against, plus the **non-capability nouns** (version control, a package registry, the CI workflow, the agent host) added after real product names leaked into a flow because no noun was offered                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
  | `engineering-baseline.md`              | The **15 centralized technical rules** every product follows by default — enforced, never elicited; seeded into `conventions.md#baseline`, waived only via `enforcement.rules`. Since 19.2.0 a **third state**: a rule the product has no *surface* for is **inapplicable** — named in a closing paragraph, carrying no waiver, since a waiver would assert a departure from a rule that applies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | `principles/`                          | The **principles catalog** — 13 judgment entries (KISS, YAGNI, DRY, the five SOLID, information hiding, design by contract, idempotency, explicit error semantics, least privilege), each in a fixed shape ending in **when NOT to apply it**. The baseline is enforced contract; this is the judgment beside it — cited by reviewers, and instantiated by stackgen's generator for uncovered stacks. Entries link to, never duplicate, the baseline, `minimalism.md`, the karpathy guidelines and `rest-api-design`; `index.md` is the catalog map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
  | `delivery-pipeline.md`                 | The canonical environment vocabulary (`development`/`staging`/`production`) + the CI/CD contract stated as **guarantees, never a spelling**: mise-built, deploys **deliberate** (an explicit act naming one project and one environment, never a branch push, re-validated by the pipeline), branch-validated (the commit is reachable from the branch that environment releases from), staging-is-not-a-release, tested-before-release. The tag grammar `<project>-<env>-v<semver>`, the `develop`/`main` mapping and the reachability check are the **recommended default**, owned by the CI system pinned on the project's `cicd` axis. Read by `blueprint` and `verify`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
  | `standard-flows.md`                    | The canonical flow-slug vocabulary per **platform kind** (device vs browser), the designated numbers, the **screen-platform** subset that alone gets `<platform>.md` files, the auth-capability signal, and the synonym table (rename proposals, never automatic)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | `design-adapter.md`                    | The **design-adapter contract** — vwf talks to no design tool. Export (`/vwf:screens prompt`) needs no adapter since briefs are files; only **import** delegates, and always to the same three names — `-import-screens`, `-import-design-system` and `-import-conversations` (the last added to stop `/vwf:feedback canvas` reaching one tool's MCP server by hardcoded prefix, which left the menu's other two tokens advertised and silently dead). **vwf constructs no skill name from config**: the tool is a **per-project** key the adapter resolves internally. Defines all three normalized payloads, the mandatory model-invocability, and the **preflight** — a user-only adapter skill cannot be invoked and does not error, so an unsupported tool is indistinguishable from an empty result unless it halts first. Conversations alone may return `harvested: n/a` (that tool has no review surface); the other two must halt, since an empty payload there reads as a design nobody authored                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
  | `vwf-config.md`                        | The `.config/vwf.yaml` doctrine (currently `config_format` **16**, which gives every stack axis a **third state** — `unresolved`, deferred rather than decided, which is what lets a product be *defined* before any stack is chosen — and makes `deploy_template` a **list**, since a project routinely ships through more than one delivery mechanism; blueprint format 23 is untouched): stamp keys, the coverage stamp, per-project nuances **and the structured `stack` block** (all three technology axes per project since 13, alongside the per-project `design` and `cicd` keys), the repo-level `repo.stack`, `harness:`, `enforcement:`, bounded `pipeline` knobs, `verify` environments, the `design:` canvas pins, and the hard floor config can never disable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
  | `harness.md`                           | The harness contract — the verification capabilities a repo must be able to run (`dev`, `e2e_local`, `local_stack`, `e2e_staging`, `health`, `screenshots`, `goldens`) and their canonical task names. Task names may vary; `local_stack` carries one **requirement** beyond its name — the stack must come up behind a deterministic readiness signal the acceptance verifier can gate on, so a fixed sleep is a finding. *How* services start and signal ready is the stack plugin's business, and a product whose `e2e_local` needs no backing services needs no local stack at all                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
  | `stack-adapter.md`                     | The **stack-adapter contract** — vwf ships **no** stack templates and the `assets/stacks/` tree is gone. What stays vwf's is the abstraction: the **four independent axes** (`project`/`backing`/`deploy` per project since `config_format` 13, `repo` per repo — they vary independently and never merge, so nothing has precedence), the `platform` vocabulary a project template declares (a **list** since format 22, since one template routinely serves several — and a pin must **cover** every platform its project declares), the harness capability *names*, and the template-payload shape. What each axis actually offers lives in a **stack plugin**, reached at two contracted skill names — `/<plugin>:<plugin>-stack-menu` and `/<plugin>:<plugin>-stack-template <slug>`, both mandatorily model-invocable, since a user-only adapter returns an empty menu rather than an error. `architecture` presents the union and the user picks; adding an option means adding a file **to a plugin**, never to vwf. Also **Resolving the conventions** — the config records *which* template a project pinned, never what it says, so `plan` (once per chain, at its stack gate) and `execute` (once per run, at Setup) fetch each template's `conventions:` prose deduped by slug. A failed fetch **halts**: the gate already proved the pin resolves, so a failure is the plugin being unreachable, and code sized against conventions nobody read is the failure the closed menu exists to prevent. Since the stackgen work it also defines the **materialized-template variant** (a plugin may land artifacts directly in the repo's committed `.claude/` tree under a lockfile — payloads may carry `language_facts`, materialized fetches are pure reads, a menu may carry one consent-gated `generated/<technology-slug>` open entry) and the **catalog handover** (every `-stack-template` invocation passes the principles-catalog paths; generating adapters halt without them) |
  | `stack-vocabulary.md`                  | The **shape of a language fact**, not a list of languages — vwf names none. A token is whatever a stack template's `languages:` frontmatter declares, and the facts `doctor` checks against it (LSP plugin, manifest, mise tool) are supplied by the **language plugin** that owns it. Also the template frontmatter contract — since format 22 a project template declares `platforms:` in frontmatter and sits **flat** under `stacks/project/`, because one template serves several platforms and a directory name cannot say so — and why frameworks/dependencies stay open. But the **menu is closed**: the union of what the installed plugins declare *is* the vocabulary, so since `config_format` 14 a language no plugin claims is **unknown = blocking** (`setup` and `execute` halt) — conditionally since 16, where the severity follows the pin: a degradation while the project's `template` reads `unresolved`, blocking the moment it is pinned — and `template: custom` is retired with no *other (describe)* path — many stacks, every one defined by a plugin. One second door since the stackgen work: the **materialized escape** — a token is also known when the project's pin is a materialized template carrying emitted `language_facts` (LSP provision, mise tool, manifest), which doctor verifies against instead of a language plugin; a token with neither stays blocking once its project's axis is pinned                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
  | `memory.md`                            | The memory protocol: **two stores written together** — mempalace (semantic search) and `docs/memory/<room>/<drawer>.md` (always present, greppable), which is what makes the daemon **optional** rather than required. Recall prefers mempalace and degrades to grep, saying so. The **closed seven-room set** (`decisions`/`problems`/`planning`/`gaps`/`runs`/`doctor`/`handoff`); `decisions`/`planning`/`gaps`/`problems` are committed, `handoff`/`doctor`/`runs` gitignored (one developer's state, not the team's). Plus recall before work, persist decisions, findings memory for loop-backs, **gap memory**, and the **`mempalace.yaml`** contract — **exactly one per product, at the repo root** (mining reads the config only from the directory it is pointed at, so a copy in `.config/` or a submodule is silently inert), one wing, all seven rooms seeded, the first-match routing trap, and a **secret denylist in `exclude_patterns` as the backstop behind `.gitignore`**. `/vwf:doctor` §7 enforces it, four of the checks as **blocking** — a mistyped room name never errors, it just empties every later recall, and a misplaced config never errors either                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `graphify.md`                          | The code-intelligence protocol — graph-first for codebase questions, file reads as verification. **graphify is mandatory**, enforced at the entry gate: `/vwf:doctor` §8 reports a missing CLI or a graph absent from *both* this checkout and the main one as **blocking**, and `setup`/`execute` halt. A worktree resolving to the main checkout's graph is the normal path, never a finding — treating it as one would halt every run. Refresh-hook absence and staleness stay **degradations**; mid-run it still degrades rather than crashes, and only `setup` builds a graph. `.graphifyignore` at each checkout root narrows what is indexed — memory, archived plans and `docs/prompts/` out; blueprint, code and active plans in — written by `setup`, and a missing one is a **degradation**, never blocking                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
  | `docs-sync.md`                         | The docs-ship-with-the-change **contract** only: the principle, and the when-it-fires table (`execute`, `architecture`/`product` update mode; `blueprint`/`plan` exempt — they document intent). The **procedure** is the `/vwf:docs-sync` skill it points to, not this file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `format-check.md` + `blueprint-format` | The format-drift preflight: compare the repo's stamp to the shipped integer (**23**) and nudge `/vwf:setup`. Since vwf is user-scoped, this usage-time check is what reaches each repo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
  | `minimalism.md`                        | The Ponytail decision ladder — what gets **built** (scope). Prose density is a separate bar, in the blueprint-authoring skill                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
- `hooks/hooks.json` — the guarded `rtk` Bash hook plus the two mempalace
  auto-save hooks (`Stop` + `PreCompact`), whose scripts sit beside it. The
  npm→pnpm/bun normalizer moved to `typescript`, where the language it rewrites
  for lives.
- `vendor/` — provenance, licence position and resync policy for the vendored
  third-party skills: `mempalace/` (the two memory skills, MIT with upstream's
  own LICENSE) and `andrej-karpathy-skills/` (`karpathy-guidelines`, MIT
  **declared but with no licence text published upstream**, so a `NOTICE.md`
  records the declaration rather than reproducing a template nobody published).
  Both ship with the plugin, which is the point: the provenance travels with the
  code.

Docs the commands maintain live under `docs/blueprint/` (the outcome contract
`product.md` — problem/users/goals/slice-priority + the `/vwf:feedback`-owned
Metric readings appendix + the optional Tiers & entitlements matrix — the
machine-readable registry `registry.yaml` beside its prose view
`architecture.md`, `conventions.md`, the product-wide `design-system.md`, the
per-project env-var/secret catalog `environment.md`; **one flow folder per flow,
grouped by primary registry project and numbered in execution order** —
`flows/<project>/<NNN>-<flow>/index.md` at one uniform depth for UI and non-UI
projects alike — `index.md` holding the **platform-agnostic contract** (trigger,
actors, steps, diagram, jobs, acceptance; no screens) beside one
**`<platform>.md` per implemented platform** (`mobile`/`tablet`/`desktop`/
`web`/`auto`) carrying that platform's Screens (rows coded `<NNN><letter>`,
codes **shared across platform files**, each with its per-screen Components
block); a non-UI flow is `index.md` alone, as is a `cli` project's — the sixth
platform is a terminal surface with no screens, so it takes no platform file and
never reaches the canvas, mockups or the scratchpad, and a cli-only project is
exempt from the standard-flows mandates. Numbers are **designated** — `100` is
always `home`, `010` splash / `020` signin / `030` recover-account / `040`
onboarding, `110`–`890` product flows, `910`–`940` the account screens — on one
number line per project. `flows/index.md` is the catalog (per-project sections,
numeric order, a Platforms column) + inter-service contracts; **one entity
folder per entity** — `entities/<entity>/` holding exactly `index.md` +
`schema.yaml` — with `entities/index.md` the catalog + product-wide erDiagram;
and the API contracts `apis/<project>.openapi.yaml` — one per API-publishing
project, one declaring the `service` platform — plus the frozen `apis/released/`
snapshots, which a `service` with no co-declared screen platform alone gets (a
`[service, webapp]` project's API serves its own UI, so no independent consumer
needs the freeze); the blueprint root holds only the system docs), `docs/plans/`
(`<date>-<time>-<slice>.md`, with `archived/`), and `docs/prompts/`
(`<type>/<project>/<NNN>-<flow>/<platform>.md` — canvas design briefs grouped by
prompt type → registry project → flow, one brief per platform regenerated in
place (the filename carries the platform, mirroring the flows tree exactly),
plus the per-design-project canvas conventions files
`screens/<project>/CLAUDE--<platform>.md`; written by `/vwf:screens prompt`;
committed intent artifacts, not blueprint docs), and `docs/scratchpad/`
(**gitignored, never committed** — the mockup render tree,
`<project>/<NNN>-<flow>/<platform>/<screen-slug>[--<state>].html`, written by
`/vwf:mockups` and blueprint §6a, overwritten in place per flow; vwf auto-adds
the `.gitignore` line when missing). Superseded commands/agents/templates are
archived under `archived/vwf-<date>/` (`vwf-2026-06-19/` from the prior model;
`vwf-2026-07-04/` holds the retired `autopilot` command, whose behavior merged
into `execute`; `vwf-2026-07-07/` the format-8 `integration.md` template,
dissolved into the flow templates).

The `docs/blueprint/` tree is an **OKF bundle** — vwf is an opinionated
*profile* of Google's Open Knowledge Format (OKF) v0.1. Every doc is a typed OKF
concept: mandatory YAML frontmatter (`type` from a fixed vocabulary —
`vwf-product`/`vwf-architecture`/`vwf-conventions`/`vwf-design-system`/
`vwf-environment`/`vwf-flow`/`vwf-flow-platform`/`vwf-integration` (the flow
catalog)/`vwf-entity`/`vwf-entities`/`vwf-plan`/`vwf-gap-report` — plus `title`,
`description`, `status`; optional `timestamp`/`owner`/`resource`/`tags`;
flow/entity docs additionally carry the pipeline-owned `implementation:` build
stamp), and cross-doc relationships are typed markdown links (the OKF edge)
rather than prose. YAML artifacts (`registry.yaml`, `schema.yaml`,
`*.openapi.yaml`) are typed by **path**, not frontmatter (the OpenAPI files
carry only `info.x-vwf.status`). This makes a blueprint portable to any
OKF-aware tool (e.g. the OKF static-HTML visualizer) and ingestable by graphify,
and lets the `blueprint-reviewer` verify frontmatter + that every edge resolves.
The doctrine lives in the blueprint-authoring skill's `frontmatter-and-links`
reference.

**Format versioning.** vwf ships the stamp in `assets/blueprint-format`
(currently **23**). Since vwf 18 the stamps are **drift detectors only** —
nothing selects a migration by them. There is no `N → N+1` delta ladder for the
blueprint format: a stale stamp sends `/vwf:setup` into its `migrate` mode,
which **reconciles the tree against the current format's own sources**
(`assets/templates/`, `assets/examples/blueprint/`, the blueprint-authoring
bars, `assets/vwf-config.md`) rather than replaying steps, resolving retired
spellings through the lineage table in
`skills/setup/references/format-lineage.md` and confirming by MCQ any spelling
that fans out to more than one current one. There is therefore no support
window: any stamp reconciles to the shipped one. **Do not restate the per-format
history here** — what each past format changed is git's job; a second narrative
copy is precisely the drift the density doctrine warns about, and it was 105
lines of this file before format 16. The *current* shape is what this section
describes throughout; the paired `config_format` (currently **16**) is described
under `assets/vwf-config.md`, and its own `N → N+1` deltas do still live there —
state-based reconciliation replaced the **blueprint** ladder only. The two
stamps are separate number lines, which have now drifted apart in both
directions: `14` and `16` shipped without a blueprint bump (the first closed the
stack menu; the second gave each stack axis its `unresolved` state and made
`deploy_template` a list) and `21` shipped without a config bump (it only moved
one config file). `22`/`15` shipped **together**, as `19`/`12` and `20`/`13` did
— the config's `template` pin and `ui:` key both depend on the platform
vocabulary, so a repo on one but not the other is a state neither migration
expects. `23` then shipped alone and purely additively: it lifts the
blueprint-coverage exemption for the `plugin` platform, retires no spelling, and
needs no config key.

**Foundations & ordering.** The workflow is
`setup → product → architecture → design-system → blueprint → plan → execute`,
with `verify` (post-deploy) and `feedback` (production intake) closing the loop
back into `product`/`blueprint`/`plan`. `setup` is the Phase-0 bootstrapper — it
onboards a repo (detect-or-ask topology via MCQ, consent-gated reconciliation
into the `docs/blueprint/` format, `/devtools:scaffold` for the mise config, the
CLAUDE.md vwf section, the memory tree and `mempalace.yaml`, the
`environment.md` bootstrap) and is **re-runnable**: re-running *is* the resume
mechanism, since Step 0 re-resolves the mode from what is on disk and a
conforming repo resolves to `current`. **It runs none of the foundations** — it
ends by printing the chain and offering to start `/vwf:product`, because each of
those commands resolves its own mode and reports what it did, which a gate
inside setup could only guess at on their behalf. `product.md` (the Phase −1
outcome contract, type `vwf-product`, gated by the `product-reviewer`) and
`architecture` (the registry) are both unconditionally required before
`blueprint` — every **flow's** Purpose must `Serves:`-link a product goal anchor
(entities trace to goals transitively via their `Used by:` flow links), which
the `blueprint-reviewer` verifies and the minimalism check traces to.
`design-system` is a second foundation, **required once the registry has a UI
project** (some project declares a **screen platform**): `blueprint` halts on a
flow with a Screens surface if `docs/blueprint/design-system.md` is missing.
`environment.md` (the per-project env-var/secret catalog, type
`vwf-environment`) is a third foundation, **required once the registry declares
an external integration or a secrets-manager `config`** — `setup` bootstraps it
from the repo's existing env-var/secret usage (names only, never values) and
`blueprint` maintains it as flows add integrations, with `conventions.md#config`
holding only the injection mechanism. **Everything up to `blueprint` is done in
full before planning**: a blueprint run sweeps until whole-product coverage
holds (every goal served by a flow, every referenced entity/schema/API operation
authored + reviewed, every registry surface represented, the coherence review
clean) and stamps it; `plan` hard-halts on a partial stamp and chains its
slice's unimplemented dependencies as their own plans, so per-slice execution
never builds on an unblueprinted or unbuilt dependency. The blueprint is a
**code-independent technical contract** — it records only decisions that have
more than one reasonable answer *and* are true regardless of how the code is
written today; reuse/placement/ordering/library choices are `plan`'s job. The
`blueprint-reviewer` gate enforces the per-doc completeness bars (flow steps,
acceptance, screens, jobs; entity lifecycle, relationships, concurrency, schema;
API errors + idempotency), the goal-traceability bars (`Serves:` on flows,
`Used by:` on entities), and the code-independence guardrail (no
file/class/library/CSS/pixel leakage); the `blueprint-coherence-reviewer` closes
the sweep with the cross-doc pass (flow↔lifecycle↔schema↔operationId agreement,
catalog/erDiagram sync, the released-API additive-only diff).

### Dependencies

`vwf` depends on two plugins — `devtools` and `stackgen` — **both resolved from
the `virajp-plugins` marketplace itself**, so installing `vwf` needs no other
marketplace registered. Both are authored here.

**`stackgen` is a dependency because without it the stack menu is empty.** The
four stack axes are closed to what the installed stack plugins declare, and
since `config_format` 14 there is no *other (describe)* escape. Since 16 that is
no longer a dead end — the user can defer the axis as `unresolved` and keep
defining the product — but deferral only moves the wall: `plan` and `execute`
halt on an unresolved axis, so with no stack plugin installed nothing can be
built. `devtools`'s adapter retired in Wave C, which left vwf shipping with no
answer to its own menu. stackgen is the general-purpose stack plugin, so it is
the one that closes it. **Installing is not using**: stackgen acts only when an
axis is pinned, so a user adopting vwf first and choosing a stack later pays
nothing for having it present.

`mempalace` and `andrej-karpathy-skills` used to be on that list and are gone as
plugins: vwf **vendored** their skills. That is the one place third-party code
is vendored into this repo, and it buys something a dependency could not — see
The memory layer and The vendored guidelines below.

**`devtools` is load-bearing, not tidiness.** `/vwf:setup` orchestrates
`/devtools:scaffold`, and a skill vwf cannot see fails **silently** — it looks
exactly like a skill that ran and returned nothing. Note that `mise`
legitimately appears in two different keys with two different meanings: the
**plugin** `devtools` ships its doctrine skill (`dependencies:`), while the
**binary** `mise` is a mandate `/vwf:doctor` blocks on once a stack axis is
pinned.

**Required binaries are no longer gated at install time.** A plugin used to
declare `requires:`, and the CLI computed the union over the dependency-expanded
set and refused the install — explicitly not overridable by `--force`. That gate
stayed retired when the CLI's plugin installs came back as a thin wrapper.

**Doctor does not fully replace it, and the gap is worth stating precisely.** Of
the five binaries vwf shells out to, `/vwf:doctor` blocks on **`graphify` always
and `mise` conditionally** — since `config_format` 16 a missing `mise` is
blocking only once some axis in the repo is pinned or some harness capability is
claimed, and a degradation before that, since a repo with no stack has no
toolchain to resolve. A missing language server is an ordinary finding; `uv` is
named as a prerequisite of graphify's remedy rather than checked on its own; a
missing `rtk` is a **degradation** finding in §5 — its hook is guarded, so the
run is correct and merely costs more — and the **Context7 runner is not checked
at all**, a missing one surfacing as a dead MCP server. That runner is
`pnpm
dlx` by default and `${CONTEXT7_RUNNER}` overrides it, so what a check
would have to verify is whatever the user pinned, not `pnpm`.

So the trade is slightly worse than "doctor already blocked on it": one of five
blocks always, one once a stack is pinned, one degrades, one is named only as
another's remedy, and one is silent. It was still worth taking —
`claude plugin
install vwf` cannot now fail for a reason the user did not ask
about — but `readme.md`'s caveat states the gap rather than implying doctor
covers it, and that is the honest version. **If a Context7-runner check is ever
added to doctor, this paragraph is what should shrink.**

`markdown` and `context7` used to be on that list and are gone as plugins: vwf
**absorbed** them. Their two skills (`documentation-standards`, `readme`) are
vwf skills now, and the Context7 docs server is one of vwf's two `mcpServers`.
Both were authored here, required by the workflow, and useful only alongside it
— a separate plugin bought nothing but a dependency edge. `/markdown:readme` is
therefore `/vwf:readme`, and vwf-only; that is intended.

The dependency list is declared in **one** place —
`plugins/vwf/.claude-plugin/plugin.json` — and the marketplace entry is
generated from it, so the two can no longer drift. (They were once separate
files kept in sync by hand, which is what `plugins:check` used to compare.) The
checker now verifies each name resolves to a real plugin instead.

**`design-tools` is gone entirely, and vwf now names no design tool at all.**
Its three import skills became vwf's own in Wave C — `/vwf:import-screens`,
`/vwf:import-design-system`, `/vwf:import-conversations`, invoked only when a
project declares a `design:` tool. Wave D finished the job: the three per-tool
references left vwf for stackgen `design-tool` packs, and the manifest that
carried the Claude Design MCP server was deleted once `.mcp.json` became a
permitted target.

The seam is **two hops of fixed names**, and no constructed name anywhere. vwf
calls its own three skills; those delegate to three more fixed names in the
repo's own `.claude/` — `design-import-screens`, `design-import-design-system`,
`design-import-conversations` — which is what the project's `design:` pin
materializes. It is the same mechanism that dissolved `<plugin>-ux-gate`, reused
rather than reinvented.

Two consequences worth knowing. **The technology-free guard's allowlist got
smaller, not bigger** — the three exceptions those references needed are
retired, which is the intended direction whenever an entry stops feeling
arguable. And **the guard's MCP rule was generalized**: it matched the
plugin-scoped `mcp__plugin_design-tools_` prefix, which a project-scoped
`.mcp.json` server never produces, so matching only that would have quietly
stopped catching anything.

**There is no CI dependency edge at all any more.** vwf owns the
delivery-pipeline **contract** (`assets/delivery-pipeline.md`), which states
what a deploy must guarantee and names no mechanism; the mechanism belongs to
whichever CI system the project's `cicd` axis pins — since the `cicd` plugin
dissolved, a `stackgen` `ci-system` bundle behind
`contracts/release-trigger.md`. Nothing in vwf delegates to it, so nothing in
vwf has to force an install.

When `vwf` is enabled, Claude Code (≥ 2.1.143) **auto-installs and
auto-enables** these dependencies at the same scope. Key rules:

- **A new dep is one edit, not two.** Add a `{marketplace, name}` entry to
  `dependencies` in `plugins/vwf/.claude-plugin/plugin.json`; the marketplace
  entry is generated from it. Keep it inside `virajp-plugins`: a
  cross-marketplace dep is blocked at install time unless the **root**
  marketplace allowlists it via `allowCrossMarketplaceDependenciesOn`.
- **Auto-enable is event-driven**, firing only when the parent (`vwf`) is
  enabled — not on a continuous reconcile. If a dependency is later disabled on
  its own, re-enable it directly or toggle `vwf` off/on.

#### The memory layer: vendored skills, vwf's server

The memory layer arrives in three pieces, from three different places, and it is
worth knowing which is which: **the skills are vendored**, **the MCP server is
declared by vwf**, and **the daemon is a process you run yourself**.

**Why vendored rather than depended on.** `mempalace` was a `url`-sourced entry
and a vwf dependency, and a url-sourced plugin had no rendered bundle for the
OpenCode adapter to copy — so **OpenCode users got no memory layer at all**,
silently: the plugin was listed, the install printed a skip note, and the thing
vwf leans on hardest was simply absent.

That reason is now historical, since there is one tree and one target. **The
vendoring stays**, and on its own merits: the provenance travels with the code,
nothing has to be reachable at install time for memory to work, and a url source
would pin every reader to whatever ref it resolved. Do not undo it on the
grounds that the original argument expired.

What was taken is **two skills and nothing else** — not the Python package, not
the server implementation, not `integrations/`. Provenance, the version taken,
the MIT licence, the local edits and the resync policy live in
`plugins/vwf/vendor/mempalace/`, which ships with the plugin. It is a one-time
fork, deliberately re-synced: nothing watches upstream, so the **Version taken**
row is the only thing that makes drift detectable, and it is the one edit a
resync must not skip.

**The auto-save hooks are reimplemented, not vendored** — see Hooks below for
why upstream's could not be wrapped.

vwf declares its own mempalace server in its `plugin.json` — `"type": "http"`
against `http://127.0.0.1:8765/mcp` — so the memory layer is a **long-lived
process you run yourself**, not a stdio subprocess Claude Code owns:

```sh
mempalace-mcp --transport http --host 127.0.0.1 --port 8765
```

Not `mempalace serve`: `serve` forks the real server as a child and holds PID 1
itself, so under a supervisor the server never sees `SIGTERM`. The daemon needs
no flags: it is configured through `~/.mempalace/config.json` (palace path,
`backend: qdrant`, the qdrant URL) plus `MEMPALACE_*` environment variables —
and the precedence **differs by setting**, which is the fact to reach for when
debugging. The backend choice runs `--backend` flag → config.json →
`MEMPALACE_BACKEND` → chroma default (**file beats env**); the qdrant connection
settings run `MEMPALACE_QDRANT_*` → config.json → defaults
(`http://localhost:6333`, 10 s) (**env beats file**). So the file is what a
supervised daemon reliably reads for the backend — but a stale
`MEMPALACE_QDRANT_URL` in the *supervisor's* inherited environment still
outranks a correct file, and fixing it means restarting the supervisor, not the
daemon. Keep file and env stating the same values so the flip never bites.
`MEMPALACE_MCP_HTTP_ALLOW_INSECURE_NO_TOKEN=1` is what lets the loopback daemon
run tokenless. The full setup — the mise-managed install, the qdrant container,
the config file and the env set — is the `mempalace` skill's Prerequisites,
which is authoritative for it.

Why: an stdio server is a child of the client, so when it dies the connection
stays dead for the rest of the session. Over HTTP it reconnects, it survives
session restarts, one daemon serves **every** Claude Code instance (all repos,
all worktrees, in parallel), and its logs are yours to read.

**Single-writer is no longer part of that argument, which is exactly what makes
stdio look switchable again.** On Chroma a second writer corrupted the store; on
Qdrant `palace.py`'s `_MULTI_PROCESS_WRITER_BACKENDS` opts the backend out, so
`backend_requires_single_writer()` is false and the lease is never taken.
Concurrent processes are safe *at the store* — and stdio is still wrong, because
**`hallways.json` is a lockless read-modify-write**: `_save_hallways` replaces
the whole file atomically but takes no lock, so one daemon serializes those
writes in-process while N processes race and last-writer-wins silently drops
entity edges. It is local JSON beside the palace, which Qdrant never sees;
tunnels are the same shape. stdio would also spawn one server per session, each
holding its own ~140 MB embedder.

**If the upstream mempalace plugin is separately installed, its own stdio server
must be turned off** — for that same hallway race, and because its docs say so
(*"don't point two server processes at the same backend collection"*). Nothing
here installs it any more, so this only bites a user who adds it themselves.
Toggle it off in `/mcp` — Claude Code records that in `~/.claude.json` under
`disabledMcpServers`, which covers plugin servers. The toggle is recorded **per
project**. Confirm with `/mcp` that exactly one mempalace server is connected.

**Tool names are scoped to whichever plugin declares the server**, so the
execute subagents' `tools:` lists carry **both** —
`mcp__plugin_vwf_mempalace__*` (this manifest) and
`mcp__plugin_mempalace_mempalace__*` (the upstream plugin's stdio server). An
allowlist entry for a server that isn't connected is inert, so carrying both
means vwf works under either wiring — which is exactly the case above. **Drop
one and the subagents silently lose memory**: the orchestrator still has it, so
recall keeps working while the findings loop-back quietly stops persisting.

#### The vendored guidelines

**The Karpathy guidelines were vendored for the same reason as memory**, and the
same reasoning applies to keeping them: `andrej-karpathy-skills` was
url-sourced, so three of the four targets installed `vwf` and got **none** of
the behavioural guidelines it assumes are on — each failing quietly. That
failure mode is gone with the targets; the vendoring stays because the
provenance travelling with the code is worth more than the dependency edge.

`karpathy-guidelines` ships under `plugins/vwf/skills/`, taken **verbatim**,
with provenance in `plugins/vwf/vendor/andrej-karpathy-skills/`. One local edit
was needed: the repo's lint gate requires a language on every fence, so one bare
fence became `text`. It is recorded under **Local edits**, which is the only
thing that makes vendor drift survivable — an unrecorded edit is silently
reverted by the next resync.

The licence position differs from mempalace's and the difference is deliberate.
Upstream declares MIT in its skill frontmatter and its `plugin.json`, but
**publishes no licence text** — GitHub reports the repo as unlicensed. So this
vendor directory carries a `NOTICE.md` quoting both declarations verbatim rather
than a `LICENSE` file. Shipping an MIT text the upstream author never published
would be worse than an honest note.

## The installer CLI

`@askviraj/ai-plugins`, run as `pnpx @askviraj/ai-plugins …`, does three things:
**plugin installs as a thin wrapper** (`--all` / `--user <name>` /
`--project <name>` drive Claude's own `plugin marketplace add` +
`plugin install`, reading this repo's `main`), **graphify's wiring**, and
**`--uninstall`**. It never edits Claude's settings itself, and writes **no
receipt** — both install paths belong to a tool that keeps its own records, and
those records are what `--uninstall` reads live.

**The statusline is a separate package** — `claude-status`
(`brew install virajp/tap/claude-status`) — and it is what provides the caps
hook `/vwf:execute` depends on; see the contract stated in vwf's `execute`
skill. Nothing here installs, configures or removes it; `--statusline` survives
only to say so, printing the redirect and exiting 1. A machine upgrading from a
version that did keeps a `statusLine` key naming a script this CLI no longer
deletes, and re-points it by installing `claude-status`.

> **The user-facing reference is `docs/cli/`** — `usage.md` for the flags,
> `targets.md` for what lands where, `internals.md` for the source map. What
> follows is the shape a maintainer needs in context, not a second copy of them;
> `internals.md`'s path table is the fuller one.

**An invocation that installs nothing prints the help and exits 1** — except
`--statusline`, which installs nothing but is a request, so it answers with
where the bar went instead of the flag table. `strict` parsing is on, so a
retired flag — `--platform`, `--upgrade`, `--force`, `--no-statusline` — reports
itself by name rather than being a silent no-op; `--user` and `--project` are
repeatable (`multiple: true`), with the both-survive regression test that guards
the silent-drop bug the old parser had. `--force` is worth its own sentence: it
existed only to configure the statusline on a machine where Claude was off
`PATH`, and every remaining install *is* a `claude` invocation, so nothing is
left to force.

**`--uninstall` is interactive**: it enumerates what it can see (the marketplace
registration, user- and project-scoped plugin installs, graphify's hook and
graph), presents it **all selected** so the interaction is deselection, and
removes each piece through whatever owns it — `claude plugin uninstall` rather
than an edit to `enabledPlugins`. No TTY refuses rather than guesses, but only
once there is something to remove; `--dry-run` is the scriptable path.

**It also reads legacy receipts**, and that reader is now the whole receipt
story. It cleans up after the discontinued OpenCode, Oh-My-Pi and Cursor
surfaces — those lost their named entries once Claude Code was the only target,
but a receipt of theirs on disk is still read and reverted under a generic
label, since `LEGACY_RECEIPTS` supplies a display label and the `filesOnly`
flag, **never** the gate on what is found: `legacyItems` enumerates every
readable `*.json` in the receipt directory, so dropping an entry downgrades a
row's label and changes no behaviour — deliberately, since refusing to read a
receipt because its target was discontinued would strand exactly the machine
most in need of cleaning. Each is restored from its recorded prior state, so an
existing install migrates rather than being orphaned. The one remaining named
entry is `claude.json`, and it is `filesOnly` — replaying its `command` entries
would uninstall each plugin a second time and report the failure as a broken
run; `uninstall.ts`'s comment on the map is authoritative for that.

**Every GitHub call sends `$GITHUB_API_TOKEN` when it is set**, because GitHub's
anonymous limit is per source IP and shared egress exhausts it between users.
The hint to set one appears **only** for a real rate limit: `429`, or `403` with
`x-ratelimit-remaining: 0`. A plain `403` is an authorization failure a
read-only token would not fix. The npm registry call is not GitHub and stays
tokenless.

**`cli/` is the source; `bin/` is the build output, and `bin/` is what npm
publishes.** tsup bundles `cli/src/index.ts` → `bin/installer.mjs`; `bin/` is
gitignored and `i:build` regenerates it. **The artifact was renamed; the command
was not** — `package.json`'s `bin` *key* stays `ai-plugins`, which is what users
invoke and what npm's Trusted Publisher is bound to. The published tarball is
`bin` alone — **4 files**, where the four render trees once shipped ~12 MB
inside it. The committed-tree-validated-by-CI guarantee moved channel rather
than disappearing: what users install is `main`, and `plugins.yml` validates
`main` on every push.

| Path                     | Is                                                                  |
| ------------------------ | ------------------------------------------------------------------- |
| `cli/src/args.ts`        | the flag surface on `util.parseArgs`, plus the usage renderer       |
| `cli/src/index.ts`       | the router — resolve, gate, execute, report, exit                   |
| `cli/src/install.ts`     | the plugin installer — plan against Claude's settings, drive claude |
| `cli/src/uninstall.ts`   | enumerate → deselect → remove, plus the legacy-receipt reader       |
| `cli/src/receipt.ts`     | read-only: reverting the receipts older versions wrote              |
| `cli/src/github.ts`      | the token header and the rate-limit-only hint                       |
| `cli/src/graphify.ts`    | `graphify install` + `hook install`                                 |
| `cli/src/version.ts`     | `--version` — this CLI against npm, plugins on `main`               |
| `cli/src/config/json.ts` | format-preserving JSON/JSONC edits, and `restoreJsonKey`            |
| `cli/src/**/*.test.ts`   | vitest; `i:test` smoke-tests the **built** bundle, not the source   |

> **Working here:** the flag surface, the receipt rules, the interactive
> uninstall and the packaging traps are in `.claude/skills/installer-cli/`,
> which auto-applies while you edit `cli/`.

## CI & Releases

### mise environments

The mise config is split by `MISE_ENV` (all under `.config/`, where mise
resolves env variants):

- `.config/mise.toml` — **generic**, loaded everywhere: the common `node` +
  `pnpm` runtime plus settings/env/`tasks.init`.
- `.config/mise.dev.toml` — loaded when `MISE_ENV=dev` (the maintainer's machine
  has this exported): the full dev toolchain (doppler, pre-commit, dprint,
  taplo, gitleaks, grype, jq, opencode, python, uv) + shell aliases.
- `.config/mise.ci.toml` — loaded when `MISE_ENV=ci` (the workflows set this):
  CI-only tools/settings. Currently sets `node.gpg_verify = false` to work
  around a mise-on-Linux bug where its bundled Node release-key import fails on
  the CI runner's gpg with "no valid OpenPGP data found" (the Node tarball is
  still SHA256-checksum verified). Same mise version verifies fine on macOS; see
  jdx/mise discussion #10553.

Keep common tools in `mise.toml` (don't duplicate across dev/ci); put
environment-specific tools in the matching env file.

### Workflows (`.github/workflows/`)

- **`plugins.yml`** — validates the plugin toolkit on every push to `main` and
  every PR: `plugins:marketplace --check`, then `plugins:check`, then the vitest
  suites, then `typescript:test`, then `tsc --noEmit` per project. The order
  matters — proving the committed manifest is what the plugin manifests generate
  *before* validating anything means a stale manifest fails as staleness rather
  than as some confusing downstream assertion. **This workflow is now also the
  guarantee behind the marketplace**, since users install `main` directly: a bad
  merge is installable until the build goes red, which is the residual risk any
  git-served marketplace carries. Deliberately a **separate file** from
  `release.yml`: npm allows one Trusted Publisher and validates the entry-point
  workflow's filename, so that file's trigger surface stays untouched. This
  workflow publishes nothing and holds no `id-token` permission.
- **`release.yml`** — publishes `@askviraj/ai-plugins` to npm via **OIDC trusted
  publishing** (no stored token, provenance automatic). Triggered two ways: a
  pushed `v*` tag, or `workflow_dispatch` — which is also how `deps-update.yml`
  publishes. **Every publish path must enter through this file** (see below). It
  sets up mise (`MISE_ENV=ci`), checks out the triggering ref, verifies the tag
  matches `package.json` (whenever that ref is a tag),
  `pnpm install --frozen-lockfile`, **osv-scans** the lockfile, **runs the
  tests** (`mise run i:test`), verifies the package (`mise run i:build`), then
  `npm publish`. The publish step is **idempotent** — it skips (does not fail)
  if that version is already on npm, so tag re-points, dispatch retries, and
  re-runs are safe. **Publishing uses the npm CLI; everything else stays pnpm.**
  The local `i:publish` task mirrors the gates + `npm publish`.
- **`deps-update.yml`** — monthly cron (+ manual dispatch): `pnpm update`
  (bounded by the cooldown below); if anything changed, `osv-scanner` gates on
  any known-vulnerable package, then it cuts a **patch release**
  (`mise run i:release --ci` → tests + bump + commit + tag, no push/watch) and
  pushes the refresh + bump + tag to `main`. It then **delegates the npm publish
  by dispatching `release.yml` on the new tag**
  (`gh workflow run release.yml
  --ref <tag>`, using the built-in
  `GITHUB_TOKEN` and the job's `actions: write` grant) rather than publishing
  inline.

  **Why a dispatch and not `workflow_call`.** npm allows only **one Trusted
  Publisher per package**, and it validates the **entry-point** workflow's
  filename — not the workflow that actually runs `npm publish`. `workflow_call`
  therefore does *not* work: this repo shipped it that way for two months and
  both monthly runs died at the publish step with `ENEEDAUTH`, because npm saw
  `deps-update.yml` and matched nothing. A dispatch makes `release.yml` the
  entry point, so the single Trusted Publisher authorizes it. The tag push alone
  cannot trigger `release.yml` — refs pushed with `GITHUB_TOKEN` don't start
  workflow runs — but **`workflow_dispatch` and `repository_dispatch` are
  explicit exceptions to that rule**, so no PAT or GitHub App token is needed.
  The dispatch is fire-and-forget: the `release.yml` run is the publish record.

### Supply-chain settings

`pnpm-workspace.yaml` sets **`minimumReleaseAge`** (a publish cooldown, in
minutes) so neither installs nor the monthly update adopt brand-new —
potentially compromised — releases.

### One-time manual setup (not automatable here)

On **npmjs.com**, add this repo + `release.yml` as the **Trusted Publisher** for
`@askviraj/ai-plugins` (enables OIDC). The workflow-filename field takes a
**single file** and a package has **exactly one** Trusted Publisher — set it to
`release.yml` only (not a comma-separated list, and not `deps-update.yml`, which
publishes by *dispatching* `release.yml`). A mismatch surfaces only at publish
time as `ENEEDAUTH`. Until configured, `release.yml` cannot publish.

### Cutting a release

`mise run i:release` (`--minor`/`--major` to choose the bump), then a GitHub
Release for the tag — every `vX.Y.Z` tag carries one, so a missing Release means
a missed step. **Ask the user before running it.** Prefer releasing via CI over
the local `i:publish`, so every version keeps the strongest npm trust level.

> The full ritual, the release-note format, and the CI facts that make a failed
> publish legible are in `.claude/skills/release/` — run `/release`.

## Hooks

Hooks are authored directly as each plugin's `hooks/hooks.json`, in Claude's own
format, with the scripts beside it. What ships today: the `typescript`
npm→pnpm/bun normalizer (`PreToolUse` on `Bash`, via `updatedInput`), vwf's
guarded `rtk` Bash hook, and vwf's two mempalace auto-save hooks (`Stop` +
`PreCompact`). One script ships that is **not** a plugin hook: `stackgen`'s
`capability-provider/fnox` pack payload carries a git pre-commit gate, copied
into the target repo rather than discovered here — so `plugins:check`'s hook
rule, which reads only a plugin's own `hooks/hooks.json`, does not see it or its
executable bit.

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
   (what an install pins to; bump it to ship changes) and `description`.
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
pnpx @askviraj/ai-plugins --all                      # vwf (+ devtools, stackgen) at user scope
pnpx @askviraj/ai-plugins --project <plugin-name>    # into this repo

# Or Claude's own commands directly — the same thing, unsequenced
claude plugin marketplace add --scope user virajp/ai-plugins
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `vwf`, `typescript`, `flutter`, `devtools`,
`cloudflare`, `gcp`, `stackgen`. Every one of them is authored here — no name on
this list is re-listed from another repo. (The statusline is not among them and
is not a plugin — it is a separate package,
`brew install virajp/tap/claude-status`.)

Installing `vwf` pulls in its dependencies (`devtools`, `stackgen`)
automatically from the same `virajp-plugins` marketplace — no other marketplace
needs to be registered. `mempalace` is not a name here at all — its memory layer
ships inside `vwf`. See the Dependencies section above.

Upgrading is `claude plugin marketplace update virajp-plugins` then
`claude plugin update <name>`. The marketplace is served from this repo's
`main`, which `plugins.yml` validates on every push.

**Nothing is gated at install time**, so the first thing to run afterwards is
`/vwf:doctor` — it is what reports a missing required binary, as a **blocking**
finding.

For **other agents** there is no marketplace and no rendered tree: point the
tool at this repo and ask it to adapt the plugin. `readme.md`'s "Other tools"
section carries the prompts and states plainly what is and is not promised.
