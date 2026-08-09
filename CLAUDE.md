# CLAUDE.md

## Rules

- ALWAYS ask user before running `i:release` task
- **Docs ship with the change.** Any change to plugin behavior must reconcile
  `readme.md`, this file, and `docs/` in the same commit — stale docs are more
  harmful than no docs

## What This Repo Is

A multi-agent plugin toolkit (`virajp-plugins`) containing LSP servers, MCP
servers, and `vwf` — a full Product → Blueprint → Plan → Execute workflow plugin
(with post-deploy verify + production-feedback intake).

The repo also ships a **statusline**, installed via a small `citty` CLI
(`@askviraj/ai-plugins`) rather than the marketplace — see The installer &
statusline CLI.

### Templates, targets, and the rendered trees

Plugins are **authored once, in a target-agnostic form, and rendered per
agent**. Claude Code is one target of four, not the source shape:

```text
templates/<plugin>/        authored source — plugin.yaml + skills/ + agents/
  ↓  build/ (TypeScript, no build step of its own — node strips the types)
claude/plugins/**          committed, one tree per target, at the repo root
{opencode,cursor,ohmypi}/**
plugins.json                       the target-agnostic plugin index the CLI reads
.claude-plugin/marketplace.json    generated at the repo root
.cursor-plugin/marketplace.json    likewise — Cursor reads it from there

cli/src/**                 installer source (TypeScript)
  ↓  tsup
bin/ai-plugins.mjs         gitignored build output — the published entrypoint
```

**Four top-level directories are rendered output**, and one of them reads
confusingly beside its neighbours: `claude/` sits next to `.claude/` (which
holds the worktrees) and `.claude-plugin/` (the generated Claude marketplace
manifest). The dot prefixes keep them distinct on disk, but a reader skimming
the root will not infer it — `claude/` is machine-written and never edited by
hand, the other two are not.

- **`templates/`** is the only thing authored. `plugin.yaml` is the neutral
  manifest, merging what used to be split between `plugin.json` and the
  marketplace entry — so those two can no longer disagree. Prose uses Eta
  helpers (`<%= it.root %>`, `<%= it.cmd('vwf:plan') %>`) wherever a target
  needs a different spelling.
- **`schema/`** holds the neutral contract: order-preserving frontmatter, zod
  schemas, and the verified per-target capability matrix. Frontmatter is
  modelled as ordered `(key, raw)` pairs and re-emitted **verbatim** — never
  round-tripped through a YAML serialiser, because the corpus uses nine key
  orders and folds descriptions at irregular widths.
- **The rendered trees** are committed, so what users install is inspectable and
  diffable in review, and CI can assert they match a fresh render. The frozen
  pre-migration tree `plugins/` is **gone**, deleted with the installer cutover.
  It existed for two reasons and outlived both: it was the Claude renderer's
  byte-parity ground truth, and the published installer's OpenCode path read it
  from the `main` tarball at run time. That second consumer disappeared when
  `bin/` became build output, and the two had to go in one commit — deleting
  `plugins/` while any published version still fetched it would have broken
  `pnpx @askviraj/ai-plugins --platform opencode` for **already-released**
  versions, not just future ones.

Retiring it retires the byte-parity gate with it. That gate was never automated
— it was a manual `diff -rq plugins claude/plugins`, which settled at **3
justified hunks** (two of the then-separate design adapters dropping a
`description` duplicated from the marketplace entry; `git-workflow` dropping
`user-invocable: true`, which is the default). All four targets now stand on the
same footing: `plugins:check` plus the schema and renderer suites are the whole
defence, and `schema/src/frontmatter.test.ts` still proves
`emit(parse(x)) === x` over every authored document — the parity property in
miniature, and the part that actually generalised.

### Targets and adapters

Two halves, deliberately kept apart. A **Target** (`build/src/targets/`) is
build-time and pure: templates → the committed render tree. An **Adapter**
(`cli/src/adapters/`) is install-time and effectful: that tree → the user's
machine. That split is what keeps format-preserving config mutation out of the
renderer, and what let the OpenCode installer shrink from a 1189-line renderer
to a copier.

Adapters come in two kinds, and which kind a target gets is dictated by the
target, not chosen:

- **Copy** — OpenCode alone, because it has no plugin concept: skills, agents
  and commands go into well-known directories and the rest is config to merge.
- **Marketplace** — everyone else. Claude and Oh-My-Pi are driven through their
  own CLI (`plugin marketplace add` + `plugin install`), because each owns
  bookkeeping this tool has no business editing — Oh-My-Pi an npm-shaped tree
  with a lockfile. Cursor has no CLI, so its adapter writes the reference
  itself.

**Scope is declared by `plugin.yaml` and honoured where the target supports it;
where it does not, the request falls back rather than failing.** Only OpenCode
and Oh-My-Pi support both natively. Cursor is project-only — user-scope
marketplace installs are account-side, and the local file that once held them is
closed (`addGitHubPlugin` throws). The redirect logs a note; it is never silent.

An install returns a **receipt** recording prior state, so uninstall restores
rather than guesses. For CLI-driven targets an entry pairs the command run with
the command that undoes it — deleting their files directly would leave the
tool's own records claiming an install that is gone. An undo is recorded **only
when the command changed something**, so uninstall never removes a marketplace
the user registered themselves.

### Tasks

Run locally via pre-commit **and** in `plugins.yml` (never in `release.yml`,
which is the installer's and whose trigger surface must stay untouched — npm
allows one Trusted Publisher and validates the entry-point filename):

- **`plugins:build`** — renders `templates/` into every `<repo>/<target>/`. Each
  target directory is removed first, so a deleted skill disappears rather than
  lingering.
- **`plugins:render-clean`** — renders, then fails if that produced anything not
  already staged. This is what catches a template edited without a rebuild;
  nothing else can, because the rendered trees are committed.
- **`plugins:check`** — validates `templates/` **and** all four rendered
  targets, then prints the per-target coverage report. On the source: manifest
  name↔dir, dependencies resolving within the marketplace, hook scripts existing
  and executable, **agent cross-reference resolution** (every role-shaped
  `` `token` `` in a plugin's own prose names a real agent, and every declared
  agent is referenced at least once — the two directions cover each other on a
  rename), cross-plugin skill-name uniqueness (skills share one flat namespace
  on OpenCode and Oh-My-Pi), the vwf design-adapter contract, relative links
  under `assets/examples/**`, and **strict-YAML frontmatter**. On each rendered
  target: no surviving template tags, strict-YAML frontmatter, and every
  root-relative reference resolving to something actually emitted.
- **`typescript:test`** — table-tests the `typescript` `npm-normalize.sh` hook
  through the system sed (the BSD-sed portability guarantee), for **both**
  package managers: each table runs in a temp dir seeded with the lockfile that
  selects pnpm or bun, so resolution is exercised alongside the rewrite. It runs
  against `templates/typescript/hooks/` — hook scripts are copied byte-for-byte
  rather than rendered, so the source is exactly what every target ships. The
  hook lives in the **language** plugin, not in `vwf`: a JS/TS rewrite has no
  business in a language-agnostic workflow plugin.
- **`vitest run`** — schema, renderer and checker suites.
- **`tsc --noEmit`** per TypeScript project — `schema/`, `build/`, `cli/`, and
  **`templates/`**. That last one exists solely so the `opencode-plugin/`
  modules are type-checked: they ship as authored TypeScript with nothing
  transforming them on the way out, so without a project covering them they
  would carry the extension and none of the guarantee. Its `include` is
  `*/opencode-plugin/*.ts` — the rest of `templates/` is prose.

`plugins:check` is deliberately smaller than the Python task it replaced. Whole
families of the old assertions became *unrepresentable* rather than merely
unchecked: the two dependency lists that had to be kept identical by hand,
marketplace registration in both directions (the marketplace is derived from the
manifests), and skill `name:`/`description:`/`model:` shape (zod types all
three). What remains is what no type can state.

Plugin/skill version numbers are **not** cross-checked — they are independent by
design (a plugin may hold skills versioned on their own cadence).

### Traps worth knowing

- **Eta needs `autoEscape: false` AND `autoTrim: false`.** `autoTrim` strips the
  newline next to a tag, which silently reflows folded YAML scalars — same text,
  different bytes, parity gone.
- **dprint deliberately excludes `templates/**/*.md`** — and every rendered tree
  (`claude/`, `cursor/`, `ohmypi/`, `opencode/`) plus `plugins.json` with it. It
  re-wraps markdown, but Eta expressions are wider than what they render to, so
  formatting the templates mis-wraps the rendered output — and formatting the
  output itself would make it differ from a fresh render, failing
  `plugins:render-clean`. Match the existing fold width rather than fighting it.
  `CLAUDE.md` and `readme.md` *are* formatted, so widening one table cell
  re-pads every row.
- **The rendered trees are committed; `bin/` and the per-package `dist/` are
  gitignored.** A rendered tree is meant to be diffed in review; a bundle diff
  is noise.
- **Frontmatter must be strict-YAML valid.** Claude's parser is lenient and will
  accept what a strict parser rejects outright — and a rejected skill is dropped
  silently, with no error and no warning.

## Plugins

| Plugin                   | Source                     | What it provides                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`                    | `templates/vwf`            | Skills (slash-invocable workflow skills + auto-applying doctrine skills, incl. the absorbed `documentation-standards` + `readme` and the vendored `mempalace` + `mempalace-recall`), subagents, the guarded `rtk` Bash hook plus the two mempalace auto-save hooks, and **two** MCP servers — mempalace over **HTTP** (see The memory layer: vendored skills, vwf's server) and the absorbed Context7 docs server over stdio. Names **no** technology: no stack templates, no language list                                                                                       |
| `typescript`             | `templates/typescript`     | The **TypeScript language plugin** — one plugin per language, covering `typescript` and `javascript`. A `typescript` router skill (lean SKILL.md → on-demand standards/vitest/build references, single-package and monorepo) plus an `effect` router skill (effect/effect-runtime/testing references, folded back in — a framework is not a plugin boundary), `package-json`, `pnpm`, `tsconfig`, `lint-format`, the TypeScript/JavaScript language server, the npm→pnpm/bun normalizing hook, and **all ten** TypeScript stack templates behind the two vwf stack-adapter skills |
| `design-tools`           | `templates/design-tools`   | The **vwf design adapter** — two skills (`design-tools-import-screens`, `design-tools-import-design-system`) that resolve the design tool **per project** and dispatch to a per-tool reference (`claude-design`, `lovable`, `stitch`), read on demand. Ships the Claude Design MCP server. Not a vwf dependency                                                                                                                                                                                                                                                                   |
| `flutter`                | `templates/flutter`        | Opinionated Flutter skills — `dart` & `swift` router skills (lean SKILL.md → on-demand topic references) plus `kotlin`, `pubspec`, `analysis-options`, `internationalization` + bundled Dart, Kotlin & Swift (SourceKit) language servers. Also owns the `dart-flutter` **stack template** (the `frontend` role) and the two vwf stack-adapter skills. Self-contained (no cross-marketplace deps)                                                                                                                                                                                 |
| `andrej-karpathy-skills` | external (url)             | Re-listed in `virajp-plugins`; behavioral guidelines reducing common LLM coding mistakes (Karpathy). A **vwf dependency** — no longer opt-in, since the workflow wants those pillars on by default                                                                                                                                                                                                                                                                                                                                                                                |
| `devtools`               | `templates/devtools`       | The **developer-machine toolchain** — the mise skill (the `.config/` three-file `MISE_ENV` split, tool/env placement, file-based tasks, node-gpg workaround) + `/devtools:scaffold`, `doppler` (**development** secrets only; no `secrets` plugin exists), `docker`, and the repo-level gates the stack templates name: `dprint`, `eslint`, `gitleaks`, `grype`, `pre-commit`. Owns the provider-neutral `container-generic` **deploy** template (no `container` capability plugin) + the two vwf stack-adapter skills. A **vwf dep**                                             |
| `cicd`                   | `templates/cicd`           | A `/cicd:workflow` skill that resolves the repo's CI system (the per-project `cicd` key, else ask — **never** repo detection, **never** a silent default) and reads only that tool's `references/<tool>.md`; GitHub Actions is the one implemented today. Neutral rules live in SKILL.md (mise installs everything, both layouts, vwf's delivery-pipeline contract); adding a CI system is one reference file. **Independent — not a vwf dep** (vwf states the contract, `cicd` implements it)                                                                                    |
| `cloudflare`             | `templates/cloudflare`     | Cloudflare stack plugin for vwf — **scope deliberately parked at Zero Trust Access**: a private plane in front of a project that must not be publicly reachable, whichever cloud hosts it. Workers, Pages, R2, D1, KV, Durable Objects, Queues, Images and Stream are **not** offered and arrive under their own dedicated plan; the menu states what it does not cover rather than coming back quietly short. **Opt-in**                                                                                                                                                         |
| `gcp`                    | `templates/gcp`            | Google Cloud stack plugin for vwf — the judgment an SDK reference cannot give: which service to pick and when it stops being the answer, how each bills, which have local emulators, least-privilege IAM. Ships `firebase`/`cloud-sql` (backing) and `cloud-run`/`gke` (deploy) plus `gcp-cost`, `gcp-iam`, `gcp-local-stack`. Observability is OTLP only — GCP services are sinks, never SDKs. **Opt-in**                                                                                                                                                                        |
| `datastore`              | `templates/datastore`      | **Capability** plugin — the neutral datastore contract (versioning, atomic multi-record writes, server time, the services-layer access rule, a deterministic local stack) plus the provider that needs no cloud: **Postgres**. Managed flavours come from the project's cloud plugin. **Opt-in**                                                                                                                                                                                                                                                                                  |
| `identity`               | `templates/identity`       | **Capability** plugin — the neutral identity contract (verification per route, the *claims carry status not roles* rule, revocation, the operator plane) plus the provider that belongs to no cloud: any **OIDC** issuer. Managed flavours come from the project's cloud plugin. **Opt-in**                                                                                                                                                                                                                                                                                       |
| `observability`          | `templates/observability`  | **Capability** plugin — the neutral telemetry contract (**the product emits OTLP and never a vendor SDK**, signal correlation, cardinality as a design decision, retention) plus the self-hosted sink: **OpenTelemetry → Grafana OTel-LGTM**. A managed backend is a destination, not an import. **Opt-in**                                                                                                                                                                                                                                                                       |
| `orchestration`          | `templates/orchestration`  | **Capability** plugin — the neutral contract for work that happens later (at-least-once and the idempotency it forces, bounded retry, the poison path, work-in-flight visibility, queue vs bus vs scheduler vs workflow engine) plus the self-hosted engine: **Temporal**. **Opt-in**                                                                                                                                                                                                                                                                                             |
| `object-storage`         | `templates/object-storage` | **Capability** plugin, **contract-only by design** — buckets, lifecycle as a bucket policy, signed access, prefix-scoped credentials, the never-proxy-bytes rule, egress cost. It ships **no provider**: every object store is a cloud's, so the flavour comes from `gcp` (Cloud Storage) or `cloudflare` (R2, once unparked). Its menu and template skills **say so explicitly** rather than returning empty, which would be indistinguishable from a broken adapter. **Opt-in**                                                                                                 |

## Plugin Structure

Every plugin is a directory under `templates/` with a `plugin.yaml` — the
**neutral manifest**. Minimal form:

```yaml
name: <plugin-name>
description: <one line>
```

Everything else defaults: `category` to `development`, `scope` to `user`,
`source` to local, and `optIn`/`userOnly` to false. The schema is
`schema/src/manifest.ts`, which is authoritative.

This one file replaces what used to be split between
`plugins/<name>/.claude-plugin/plugin.json` (servers, dependencies) and the
plugin's entry in `.claude-plugin/marketplace.json` (version, category, tags,
source) — two files that had to be kept in sync by hand, and a whole class of
drift `plugins:check` existed to catch. The marketplace manifest is now
**generated** from the manifests, so a plugin cannot be unregistered, orphaned,
or disagree with its own entry.

Plugins may declare any combination of:

- **`lspServers`** — LSP server definitions keyed by language ID. Each entry
  needs `command`, `args`, `extensions`, and optionally `startupTimeout` and
  per-target `idAliases` (OpenCode keys LSP config by its own built-in ids, so
  `typescript-lsp` has to be written as `typescript` there). `templates/flutter`
  bundles three — `dart-lsp` (run via `mise`) plus `kotlin-lsp` and
  `sourcekit-lsp` (Swift), which invoke system-installed binaries on `PATH`.
  Cursor has no LSP surface at all; the build reports it as a gap.
- **`mcpServers`** — MCP server definitions, a discriminated union on
  `transport` (`stdio` or `http`). See `templates/vwf/plugin.yaml`, which
  declares one of each.
- **`dependencies`** — other plugins this plugin requires (see below), as a
  plain list of names; `vwf` is the only one that declares them, all resolved
  within `virajp-plugins` itself. `plugins:check` enforces that each names a
  real plugin. A dependency *may* point at **another marketplace** (each entry
  carries its own `marketplace`), but cross-marketplace deps are **blocked at
  install time** unless the ROOT `marketplace.json` allowlists that foreign
  marketplace via top-level `allowCrossMarketplaceDependenciesOn` (not
  transitive — only the installing marketplace's allowlist applies). No plugin
  here currently uses one, so that allowlist is absent; re-add it if a
  cross-marketplace dependency is introduced.

Skills, agents, and hooks are **auto-discovered by directory convention** — they
do not need to be listed in `plugin.yaml`:

- `skills/<name>/SKILL.md` → skills. Invocation is the neutral three-valued
  `invocation:` key — `model` (auto-applying doctrine), `user` (slash only) or
  `both` (the default) — which each renderer projects down to its target's
  spelling. This repo has **no `commands/` dirs**: former commands are skills,
  so one artifact serves every target.
- `agents/<name>.md` → subagents
- `hooks/hooks.yaml` → hooks, declared as *intent* (`event`, `matcher`,
  `action`, `script`) so each renderer can emit its own mechanism (see Hooks
  below)
- `opencode-plugin/*.{ts,js}` → **OpenCode plugin modules**, for behaviour no
  neutral hook can express (vwf's mempalace auto-save is the first). `source.ts`
  reads them into `openCodePlugins`, deliberately **not** into `files`, so the
  other three targets never ship them as dead bundle files; the OpenCode target
  copies each to `plugin/<plugin>-<basename>` with an ownership stamp, so the
  existing install/uninstall/receipt machinery covers them with no adapter
  change. **They ship as authored TypeScript, untranspiled** — verified against
  OpenCode's source: its discovery glob is `{plugin,plugins}/*.{ts,js}` and its
  loader is Bun. No transform, no new dependency.

### Marketplace manifests

Three of the four targets have a native plugin marketplace, so `plugins:build`
generates one per target from the manifests. **Only OpenCode has none** — it has
no plugin concept at all, which is why its installer copies a rendered tree
while the other three register a marketplace and let the tool do the installing.
Do not edit any of them by hand; `plugins:render-clean` will fail.

| Target   | Manifest                          | Plugin source                  |
| -------- | --------------------------------- | ------------------------------ |
| Claude   | `.claude-plugin/marketplace.json` | `./claude/plugins/<name>`      |
| Cursor   | `.cursor-plugin/marketplace.json` | `git-subdir` → `cursor/<name>` |
| Oh-My-Pi | `ohmypi/.omp-plugin/…json`        | `./<name>`                     |

Two manifests live at the **repo root** rather than under `<repo>/<target>/`,
because that is where the tool looks when the marketplace is added from this
repo, and their sources are root-relative and would resolve nowhere else.
Cursor's must be there for a second reason: Cursor accepts
`.claude-plugin/marketplace.json` as a fallback, and checks `.cursor-plugin/`
**first** — so without ours at the root it would read Claude's and resolve every
plugin to a Claude-rendered bundle.

Two traps, each verified by running the real tool and each silent when wrong:

- **Sources resolve against the marketplace root**, not the repo root.
  Oh-My-Pi's were once spelled from the repo root and resolved to
  `ohmypi/ohmypi/<name>`, failing every install. `plugins:check` cannot catch
  this — the path exists, just not where the tool looks.
- **Cursor's sources are git-only** — a bare string, or an object tagged
  `github` / `url` / `git-subdir`; there is no local-path variant. So a Cursor
  install clones this repo and reads whatever ref it resolves, rather than the
  `cursor/` tree beside it. It is the one target where the committed-render
  guarantee does not reach, and the only one needing `marketplace.yaml`'s
  `repository` field.

## The vwf Plugin

`vwf` is the flagship plugin. Its layout under `templates/vwf/`:

- `skills/` (workflow) — the `/vwf:` workflow skills (each
  `skills/<name>/SKILL.md`), implementing the Product → Blueprint → Plan →
  Execute model. Most are slash- **and** model-invocable (`invocation: both`)
  because **other skills delegate to them by name**; five are **user-only**
  (`invocation: user`) — see Invocation policy below. **Each SKILL.md is the
  authoritative description of its own behavior**; the table below is an index,
  not a second copy — the previous prose version of it drifted twice in a single
  session before being cut.

  | Skill                | What it does                                                                                                                                                                                                                                                                                                      | Halts / gates                                                                                                             |
  | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
  | `setup`              | Phase-0 onboarding + migration bootstrapper: detects topology, migrates to the shipped format, stamps `.config/vwf.yaml`                                                                                                                                                                                          | —                                                                                                                         |
  | `product`            | Phase −1 outcome contract — problem, users, goals (`#goal-<slug>` anchors), slice priority, optional tier matrix                                                                                                                                                                                                  | —                                                                                                                         |
  | `architecture`       | The system shape: writes `registry.yaml` (authoritative) + `architecture.md` (its prose view); stacks go to `.config/vwf.yaml`                                                                                                                                                                                    | —                                                                                                                         |
  | `design-system`      | **Import-only** — the project's configured design tool authors the design system; this imports it via the adapter as the offline contract and pins `design.design_system_id`                                                                                                                                      | no canvas surface → halt; required once the registry has a UI project                                                     |
  | `blueprint`          | The full-product **flow-first sweep**: works a coverage worklist (incl. `density/` items → `blueprint-condenser`) until whole-product coverage **and** the coherence review hold, then stamps `blueprint.coverage`                                                                                                | halts without `product.md`; halts on a Screens flow with no `design-system.md`                                            |
  | `mockups`            | Batch re-render of screens into the **gitignored** `docs/scratchpad/` tree — never pushed to Claude Design, never a gate for `plan`                                                                                                                                                                               | —                                                                                                                         |
  | `screens`            | Two-way canvas sync: `prompt` writes per-platform design briefs (the files *are* the deliverable), `import` diffs designed pages back and routes every accepted delta through `/vwf:blueprint`                                                                                                                    | never edits a flow doc itself                                                                                             |
  | `plan`               | One slice's desired-vs-actual delta as a cycle plan; resolves the transitive dependency chain and plans each unimplemented dependency as its own plan first                                                                                                                                                       | halts unless `blueprint.coverage: complete`                                                                               |
  | `execute`            | Runs one approved plan to completion **autonomously** in a dedicated worktree, to **one** final human gate that renders the run journal                                                                                                                                                                           | halts until every `requires:` plan's `covers:` docs read `implementation: complete`                                       |
  | `verify`             | Post-deploy environment check; a clean **production** run offers to freeze each service's OpenAPI contract into `apis/released/`                                                                                                                                                                                  | vwf never deploys                                                                                                         |
  | `feedback`           | Production-feedback front door: classifies bug/hole/metric/UX/idea and routes each into the doc + command that fixes it; `canvas` harvests claude.ai/design review conversations                                                                                                                                  | —                                                                                                                         |
  | `archive`            | Moves completed cycle plans into `docs/plans/archived/`; never deletes                                                                                                                                                                                                                                            | —                                                                                                                         |
  | `doctor`             | Checks the repo against `.config/vwf.yaml` — per-language LSP + toolchain, frameworks/deps vs each manifest, `repo.stack`, harness task names, health paths, the mempalace wing/room set, the graphify CLI/graph/hook, format-stamp drift. Reports to room `doctor`; never writes uninvited, never builds a graph | never halts — a mandate is a **blocking** finding, and `setup` + `execute` both halt on one (`execute` also gates on LSP) |
  | `git-workflow`       | Internal: worktree isolation, commits, merges, pushes — every other skill delegates git here                                                                                                                                                                                                                      | —                                                                                                                         |
  | `handoff` / `recall` | session handoff written to **both** memory stores; the reserved **`next`** handoff is the argument-less default, is mirrored to `docs/memory/handoff/next.md` (gitignored — a handoff is personal), and `recall next` resumes without a gate                                                                      | —                                                                                                                         |
  | `readme`             | Scans the repo and writes/updates its README against the eight required sections. Absorbed from the retired `markdown` plugin; `invocation: both` **because `setup` orchestrates it**                                                                                                                             | —                                                                                                                         |

  Ordering and what each gate means: **Foundations & ordering** below. The
  execute stage pipeline (`code` → `review` ‖ `security` → `acceptance` + `ux`,
  the convergence guard, the run journal): `assets/execute-stages.md`.
- `agents/` — the subagents the workflow skills delegate to. Delegation is a
  **latency and context strategy as much as a quality one**: read-heavy scans
  and mechanical writing run in a subagent so their file loads never enter the
  orchestrator's context, where every loaded line is re-processed on each later
  turn. Each agent file states its own contract; `plugins:check` verifies these
  names resolve, in both directions.

  | Agent                                        | Role                                                                                                                                                                                                                                                                                                                                                                                                                                      |
  | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `blueprint-surveyor`                         | The sweep's coverage worklist — walks the bundle against the coverage conditions (incl. standard-flows mandates and `density/` line counts) and returns only the ordered worklist                                                                                                                                                                                                                                                         |
  | `flow-writer`, `entity-writer`               | Render the orchestrator's **already-elicited** decisions into format-conformant docs + catalog rows. Never elicit, never invent; report anything unfilled as `UNRESOLVED:`                                                                                                                                                                                                                                                                |
  | `blueprint-reviewer`                         | Per-doc completeness gate, two modes (flow / entity), plus the code-independence, vendor-name, and **density** bars                                                                                                                                                                                                                                                                                                                       |
  | `blueprint-condenser`                        | The density pass — one over-budget doc → a lossless-of-contract rewrite; returns before/after counts, what it could not cut, rationale to persist, questions to park, and any contract hole the cut exposed                                                                                                                                                                                                                               |
  | `blueprint-coherence-reviewer`               | End-of-sweep whole-product pass across flows/entities/schemas/APIs; catalog + erDiagram sync; the released-API additive-only diff as a HARD gap. Takes a **scope** (`full`, or sharded `flow-walk` + one `bundle`)                                                                                                                                                                                                                        |
  | `plan-surveyor`                              | The desired-vs-actual survey — the largest inline read in the workflow; graph-first, returns `PRESENT`/`PARTIAL`/`ABSENT` + reuse candidates as `file:line`, never code                                                                                                                                                                                                                                                                   |
  | `architecture-writer`                        | Writes `registry.yaml` + `architecture.md`; never sees or records a stack                                                                                                                                                                                                                                                                                                                                                                 |
  | `mockup-generator`                           | Per-flow: Screens contract + design-system tokens → self-contained HTML into the gitignored scratchpad; returns only a manifest                                                                                                                                                                                                                                                                                                           |
  | `execute-coder`                              | The code stage under strict TDD, to the coverage gate                                                                                                                                                                                                                                                                                                                                                                                     |
  | `execute-code-reviewer`                      | Adversarial review incl. the released-contract compatibility dimension and its `API COMPAT:` line                                                                                                                                                                                                                                                                                                                                         |
  | `execute-security-reviewer`                  | Threat-models the diff against the project's declared capabilities                                                                                                                                                                                                                                                                                                                                                                        |
  | `execute-acceptance-verifier`                | Independent criteria→E2E mapping + run; also `/vwf:verify`'s environment mode                                                                                                                                                                                                                                                                                                                                                             |
  | `execute-ux-reviewer`                        | Renders changed screens and judges them against design-system + the Screens contract. **Web** (`site`/`fullstack`): dev server + Playwright, axe a11y scan. **Native** `frontend`: the equivalent gate from its own toolchain — Flutter golden tests + `flutter_test`'s `meetsGuideline` a11y assertions, Compose/XCUITest screenshot + semantics equivalents. `RENDERED: n/a` on any UI slice reaches the gate, never a silent downgrade |
  | `product-reviewer`, `design-system-reviewer` | The completeness gates for their two foundation docs                                                                                                                                                                                                                                                                                                                                                                                      |

- `skills/` (doctrine, auto-applying — `invocation: model` + `paths:` scoped) —
  read automatically when editing the files they govern. Each SKILL.md and its
  references are authoritative:

  | Skill                     | Governs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
  | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `blueprint-authoring`     | `docs/blueprint/**` — the contract-vs-realization line, the **density** bars (budgets, the delete test, the anti-patterns), the per-surface completeness bars (flow-contract, entity-contract, api-and-schema-contracts), and the OKF frontmatter/link doctrine. Also `docs/plans/**`, for frontmatter + link hygiene only                                                                                                                                                                                                                                                 |
  | `product-foundations`     | The twelve foundational concerns every product decides (users & operators, observability, audit logs, change logs, background processes, data retention & PII, notifications, runtime settings, rate limiting, reliability targets, disaster recovery, cost guardrails) as **elicited defaults** — walked by `/vwf:architecture` step 3c, expanded by `/vwf:blueprint` into `conventions.md` anchors and per-flow surfaces                                                                                                                                                 |
  | `design-system-authoring` | `docs/blueprint/design-system` — tokens, typography, spacing, motion, accessibility, component behaviors/anti-patterns, and terminal-ux (required when a project declares platform `cli`)                                                                                                                                                                                                                                                                                                                                                                                  |
  | `project-setup`           | Onboarding + migration: topology detection plus the **topology menu** (`repo`/`monorepo`/`polyrepo` under `assets/topologies/` — a menu since format 19, not enforced; `enforcement.structure` retired with it — the **one** exception is an `iac` project, which format 20 requires to be its own repo, enforced as a blocking `doctor` finding), the **stack-template axes** (`architecture` presents each, per project since `config_format` 13), harness-capability detection, consent-gated dry-run migration, and the format-version drift map. Used by `/vwf:setup` |
  | `rest-api-design`         | API contract depth — resources, methods, errors, pagination, idempotency, versioning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `documentation-standards` | `**/*.md` — writing style, heading hierarchy, links, front matter, CHANGELOGs, and the mermaid rules. Absorbed from the retired `markdown` plugin                                                                                                                                                                                                                                                                                                                                                                                                                          |
- `assets/` — the shared doctrine and data every skill and agent reads. **Each
  file is authoritative for its own subject**; this is a map of which one owns
  what, not a summary of their contents:

  | Asset                                  | Owns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
  | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `templates/`                           | Every doc skeleton vwf writes: `flow` + `flow-platform`, `flows-index`, `entity` + `entities-index` + `schema.yaml`, `registry.yaml`, `openapi.yaml`, `conventions`, `plan`, `product`, `architecture`, `design-system`, `environment`, `screen-prompt`, `canvas-claude`, `project-claude`, `handoff`. All blueprint markdown opens with the OKF frontmatter block                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `examples/blueprint/`                  | The **format-20 conformance bundle** — a worked, format-valid slice where every link resolves, each flow carries Acceptance + sequence diagram + Components blocks + a Guarantees table, every doc sits inside the density budget, and nothing names a vendor. The concrete "what good looks like", link-checked by `plugins:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
  | `elicitation.md`                       | The shared questioning protocol (one decision per round, **§3a — every question names its scope**: the registry project + `role`, the platform when platform-specific, or "the whole product"; the hard gate before writing, the convergence guard, the **parked-scope rule**)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
  | `execute-stages.md`                    | The execute stage pipeline: the stage table + Runs column, per-stage subagent contracts, shared stage rules (model enforcement, loop-on-findings, the **convergence guard**), the **run journal** shape, and the end-of-run reconcile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
  | `capability-vocabulary.md`             | The stack-agnostic capability tokens **and** the prose-noun mapping (`document-datastore` → "the datastore") every blueprint doc writes against                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
  | `engineering-baseline.md`              | The **15 centralized technical rules** every product follows by default — enforced, never elicited; seeded into `conventions.md#baseline`, waived only via `enforcement.rules`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
  | `delivery-pipeline.md`                 | The canonical environment vocabulary (`development`/`staging`/`production`) + CI/CD contract (mise-built; `<project>-<env>-v<semver>` tag-triggered, branch-validated, tested-before-release). Read by `blueprint`, `verify`, and the **cicd** plugin                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
  | `standard-flows.md`                    | The canonical flow-slug vocabulary per project role, the designated numbers, the auth-capability signal, and the synonym table (rename proposals, never automatic)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `design-adapter.md`                    | The **design-adapter contract** — vwf talks to no design tool. Export (`/vwf:screens prompt`) needs no adapter since briefs are files; only **import** delegates, and always to the same two names — `/design-tools:design-tools-import-screens` and `/design-tools:design-tools-import-design-system`. **vwf constructs no skill name from config**: the tool is a **per-project** key the adapter resolves internally. Defines both normalized payloads, the mandatory `invocation: both`, and the **preflight** — a user-only adapter skill cannot be invoked and does not error, so an unsupported tool is indistinguishable from an empty result unless it halts first                                                                                                                                                                              |
  | `vwf-config.md`                        | The `.config/vwf.yaml` doctrine (currently `config_format` **14**, which closes the stack menu — `template: custom` retired, an unclaimed language token blocking; the first config bump since 11 with no paired blueprint bump): stamp keys, the coverage stamp, per-project nuances **and the structured `stack` block** (all three technology axes per project since 13, alongside the per-project `design` and `cicd` keys), the repo-level `repo.stack`, `harness:`, `enforcement:`, bounded `pipeline` knobs, `verify` environments, the `design:` canvas pins, and the hard floor config can never disable                                                                                                                                                                                                                                        |
  | `harness.md`                           | The harness contract — the verification capabilities a repo must be able to run (`dev`, `e2e_local`, `local_stack`, `e2e_staging`, `health`, `screenshots`) and their canonical task names. Task names may vary; `local_stack` is the one capability whose **mechanism** may not — when a repo needs a local stack it must be Docker-composed services behind `wait-on` gates, since the acceptance verifier depends on a deterministic ready signal. A product needing no backing services needs no Docker                                                                                                                                                                                                                                                                                                                                              |
  | `stack-adapter.md`                     | The **stack-adapter contract** — vwf ships **no** stack templates and the `assets/stacks/` tree is gone. What stays vwf's is the abstraction: the **four independent axes** (`project`/`backing`/`deploy` per project since `config_format` 13, `repo` per repo — they vary independently and never merge, so nothing has precedence), the `role` vocabulary, the harness capability *names*, and the template-payload shape. What each axis actually offers lives in a **stack plugin**, reached at two contracted skill names — `/<plugin>:<plugin>-stack-menu` and `/<plugin>:<plugin>-stack-template <slug>`, both mandatorily `invocation: both`, since a user-only adapter returns an empty menu rather than an error. `architecture` presents the union and the user picks; adding an option means adding a file **to a plugin**, never to vwf    |
  | `stack-vocabulary.md`                  | The **shape of a language fact**, not a list of languages — vwf names none. A token is whatever a stack template's `languages:` frontmatter declares, and the facts `doctor` checks against it (LSP plugin, manifest, mise tool) are supplied by the **language plugin** that owns it. Also the template frontmatter contract and why frameworks/dependencies stay open. But the **menu is closed**: the union of what the installed plugins declare *is* the vocabulary, so since `config_format` 14 a language no plugin claims is **unknown = blocking** (`setup` and `execute` halt), and `template: custom` is retired with no *other (describe)* path — many stacks, every one defined by a plugin                                                                                                                                                 |
  | `memory.md`                            | The memory protocol: **two stores written together** — mempalace (semantic search) and `docs/memory/<room>/<drawer>.md` (always present, greppable), which is what makes the daemon **optional** rather than required. Recall prefers mempalace and degrades to grep, saying so. The **closed seven-room set** (`decisions`/`problems`/`planning`/`gaps`/`runs`/`doctor`/`handoff`); `decisions`/`planning`/`gaps`/`problems` are committed, `handoff`/`doctor`/`runs` gitignored (one developer's state, not the team's). Plus recall before work, persist decisions, findings memory for loop-backs, **gap memory**, and the per-repo **`mempalace.yaml`** contract (one wing per product, all seven rooms seeded, the first-match routing trap). `/vwf:doctor` §7 enforces it — a mistyped room name never errors, it just empties every later recall |
  | `graphify.md`                          | The code-intelligence protocol — graph-first for codebase questions, file reads as verification. **graphify is mandatory**, enforced at the entry gate: `/vwf:doctor` §8 reports a missing CLI or a graph absent from *both* this checkout and the main one as **blocking**, and `setup`/`execute` halt. A worktree resolving to the main checkout's graph is the normal path, never a finding — treating it as one would halt every run. Refresh-hook absence and staleness stay **degradations**; mid-run it still degrades rather than crashes, and only `setup` builds a graph                                                                                                                                                                                                                                                                       |
  | `docs-sync.md`                         | The docs-ship-with-the-change rule for runs that change reality (`execute`, `architecture`/`product` update mode). `blueprint`/`plan` are exempt — they document intent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | `format-check.md` + `blueprint-format` | The format-drift preflight: compare the repo's stamp to the shipped integer (**20**) and nudge `/vwf:setup`. Since vwf is user-scoped, this usage-time check is what reaches each repo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | `minimalism.md`                        | The Ponytail decision ladder — what gets **built** (scope). Prose density is a separate bar, in the blueprint-authoring skill                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
- `hooks/hooks.yaml` — the guarded `rtk` Bash hook plus the two mempalace
  auto-save hooks (`stop` + `preCompact`), whose scripts sit beside it; the
  OpenCode equivalent is `opencode-plugin/mempalace-autosave.ts`. The
  npm→pnpm/bun normalizer moved to `typescript`, where the language it rewrites
  for lives.
- `vendor/mempalace/` — provenance, MIT licence and resync policy for the two
  vendored memory skills. Ships in every rendered bundle, which is the point:
  the licence travels with the code.

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
project, `role` `service` **or** `fullstack` — plus the frozen `apis/released/`
snapshots, which `service` projects alone get (a fullstack's API serves its own
UI, so no independent consumer needs the freeze); the blueprint root holds only
the system docs), `docs/plans/` (`<date>-<time>-<slice>.md`, with `archived/`),
and `docs/prompts/` (`<type>/<project>/<NNN>-<flow>/<platform>.md` — canvas
design briefs grouped by prompt type → registry project → flow, one brief per
platform regenerated in place (the filename carries the platform, mirroring the
flows tree exactly), plus the per-design-project canvas conventions files
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
(currently **20**); the authoritative `N → N+1` migration deltas live in the
project-setup skill's `format-versioning` reference, and `/vwf:setup` migrates
stale repos on next use. **That reference is the single source — do not restate
the per-format history here.** What each past format changed is git's job and
`format-versioning`'s; a second narrative copy is precisely the drift the
density doctrine warns about, and it was 105 lines of this file before
format 16. The *current* shape is what this section describes throughout; the
paired `config_format` (currently **14**) is described under
`assets/vwf-config.md`, and its own `N → N+1` deltas live there rather than in
`format-versioning` — the two stamps are separate number lines, and `14` is the
first config bump since `11` to ship without a blueprint bump beside it.

**Foundations & ordering.** The workflow is
`setup → product → architecture → design-system → blueprint → plan → execute`,
with `verify` (post-deploy) and `feedback` (production intake) closing the loop
back into `product`/`blueprint`/`plan`. `setup` is the Phase-0 bootstrapper — it
onboards a repo (detect-or-ask topology via MCQ, consent-gated migration into
the `docs/blueprint/` format, orchestrates
mise/product/architecture/design-system, authors CLAUDE.md + README) and is
**re-runnable**: it stamps the blueprint format version in `.config/vwf.yaml`
and, on a later run, detects drift against the format the installed vwf ships
and migrates the delta. `product.md` (the Phase −1 outcome contract, type
`vwf-product`, gated by the `product-reviewer`) and `architecture` (the
registry) are both unconditionally required before `blueprint` — every
**flow's** Purpose must `Serves:`-link a product goal anchor (entities trace to
goals transitively via their `Used by:` flow links), which the
`blueprint-reviewer` verifies and the minimalism check traces to.
`design-system` is a second foundation, **required once the registry has a UI
project** (some project's `role` is `site`, `fullstack` or `frontend`):
`blueprint` halts on a flow with a Screens surface if
`docs/blueprint/design-system.md` is missing. `environment.md` (the per-project
env-var/secret catalog, type `vwf-environment`) is a third foundation,
**required once the registry declares an external integration or a
secrets-manager `config`** — `setup` bootstraps it from the repo's existing
env-var/secret usage (names only, never values) and `blueprint` maintains it as
flows add integrations, with `conventions.md#config` holding only the injection
mechanism. **Everything up to `blueprint` is done in full before planning**: a
blueprint run sweeps until whole-product coverage holds (every goal served by a
flow, every referenced entity/schema/API operation authored + reviewed, every
registry surface represented, the coherence review clean) and stamps it; `plan`
hard-halts on a partial stamp and chains its slice's unimplemented dependencies
as their own plans, so per-slice execution never builds on an unblueprinted or
unbuilt dependency. The blueprint is a **code-independent technical contract** —
it records only decisions that have more than one reasonable answer *and* are
true regardless of how the code is written today;
reuse/placement/ordering/library choices are `plan`'s job. The
`blueprint-reviewer` gate enforces the per-doc completeness bars (flow steps,
acceptance, screens, jobs; entity lifecycle, relationships, concurrency, schema;
API errors + idempotency), the goal-traceability bars (`Serves:` on flows,
`Used by:` on entities), and the code-independence guardrail (no
file/class/library/CSS/pixel leakage); the `blueprint-coherence-reviewer` closes
the sweep with the cross-doc pass (flow↔lifecycle↔schema↔operationId agreement,
catalog/erDiagram sync, the released-API additive-only diff).

### Dependencies

`vwf` depends on exactly two plugins — `andrej-karpathy-skills` and `devtools` —
**both resolved from the `virajp-plugins` marketplace itself**, so installing
`vwf` needs no other marketplace registered. `devtools` is authored here;
`andrej-karpathy-skills` is not — it is **re-listed** via a `url` source
(pointing at its upstream repo) so it lives under `virajp-plugins`.

`mempalace` used to be the third, and is gone as a plugin: vwf **vendored** its
two skills. That is the one place third-party code is vendored into this repo,
and it buys something a dependency could not — see The memory layer below.

**`devtools` is load-bearing, not tidiness.** `/vwf:setup` orchestrates
`/devtools:scaffold`, and a skill vwf cannot see fails **silently** — it looks
exactly like a skill that ran and returned nothing. Note that `mise`
legitimately appears in two different keys with two different meanings: the
**plugin** `devtools` ships its doctrine skill (`dependencies:`), while the
**binary** `mise` is a mandate `/vwf:doctor` blocks on (`requires:`).

**A plugin's `requires:` is a hard install gate, not a bibliography.** The CLI
computes the required-tool union over the *dependency-expanded* set and that
gate is explicitly not overridable by `--force`, so the test is "does this
plugin shell out to it", never "does it document it". `devtools` therefore
requires `mise` alone — `doppler`, `dprint`, `eslint`, `gitleaks`, `grype` and
`pre-commit` are all documented here and executed by the user's own repo.
Because `devtools` is a vwf dependency and vwf is in `--all`, adding one of them
would hard-fail a bare `pnpx @askviraj/ai-plugins --all` for every user lacking
that binary — and with no `DEP_HINTS` entry it would fail while naming no way to
fix itself.

`markdown` and `context7` used to be on that list and are gone as plugins: vwf
**absorbed** them. Their two skills (`documentation-standards`, `readme`) are
vwf skills now, and the Context7 docs server is one of vwf's two `mcpServers`.
Both were authored here, required by the workflow, and useful only alongside it
— a separate plugin bought nothing but a dependency edge. `/markdown:readme` is
therefore `/vwf:readme`, and vwf-only; that is intended.

The dependency list is declared in **one** place — `templates/vwf/plugin.yaml` —
and the marketplace entry is generated from it, so the two can no longer drift.
(Before the template layer they were separate files kept in sync by hand, which
is what `plugins:check` used to compare.) The checker now verifies each name
resolves to a real plugin instead.

**`design-tools` is deliberately *not* a dependency.** vwf is decoupled from any
design tool: it calls two fixed adapter skill names and the adapter resolves
which tool answers, per project. The adapter is chosen, not inherited — see the
design-adapter contract.

**`cicd` is deliberately *not* a dependency either.** vwf owns the
delivery-pipeline **contract** (`assets/delivery-pipeline.md`); `cicd` owns the
**mechanism** that satisfies it on a given CI system. Nothing in vwf delegates
to `/cicd:workflow` — every mention of it is prose recommending it to the user —
so vwf has no reason to force its install.

When `vwf` is enabled, Claude Code (≥ 2.1.143) **auto-installs and
auto-enables** these dependencies at the same scope. Key rules:

- **A new dep is one edit, not two.** Add the name to `dependencies:` in
  `templates/vwf/plugin.yaml`; the marketplace entry is generated from it. If
  the dep is external, it also needs its own `templates/<name>/plugin.yaml`
  carrying `source: {kind: url, url: …}`, so it resolves within `virajp-plugins`
  without vendoring third-party code.
- **Auto-enable is event-driven**, firing only when the parent (`vwf`) is
  enabled — not on a continuous reconcile. If a dependency is later disabled on
  its own, re-enable it directly or toggle `vwf` off/on.

#### The memory layer: vendored skills, vwf's server

The memory layer arrives in three pieces, from three different places, and it is
worth knowing which is which: **the skills are vendored**, **the MCP server is
declared by vwf**, and **the daemon is a process you run yourself**.

**Why vendored rather than depended on.** `mempalace` was a `url`-sourced entry
and a vwf dependency. A url-sourced plugin has no rendered bundle, and the
OpenCode adapter can only copy one — so `cli/src/plan.ts`'s `localOnly` branch
skipped it, and **OpenCode users got no memory layer at all**. Silently: the
plugin was listed, the install printed a skip note, and the thing vwf leans on
hardest was simply absent. The three marketplace targets were fine, which is
what made it easy to miss for so long. Vendoring is what makes memory ship on
every target.

What was taken is **two skills and nothing else** — not the Python package, not
the server implementation, not `integrations/`. Provenance, the version taken,
the MIT licence, the one local edit and the resync policy live in
`templates/vwf/vendor/mempalace/`, which ships in every rendered bundle. It is a
one-time fork, deliberately re-synced: nothing watches upstream, so the
**Version taken** row is the only thing that makes drift detectable, and it is
the one edit a resync must not skip.

**The auto-save hooks are reimplemented, not vendored** — see Hooks below for
why upstream's could not be wrapped.

vwf declares its own mempalace server in `plugin.yaml` — `transport: http`
against `http://127.0.0.1:8765/mcp` — so the memory layer is a **long-lived
process you run yourself**, not a stdio subprocess Claude Code owns:

```sh
mempalace serve --host 127.0.0.1 --port 8765   # loopback needs no token
```

Why: an stdio server is a child of the client, so when it dies the connection
stays dead for the rest of the session. Over HTTP it reconnects, it survives
session restarts, one daemon serves **every** Claude Code instance (all repos,
all worktrees, in parallel — mempalace serializes concurrent writes), and its
logs are yours to read.

**If the upstream mempalace plugin is separately installed, its own stdio server
must be turned off**, or two processes contend for mempalace's single writer
lease (its docs: *"don't point two server processes at the same backend
collection"*). Nothing here installs it any more, so this only bites a user who
adds it themselves. Toggle it off in `/mcp` — Claude Code records that in
`~/.claude.json` under `disabledMcpServers`, which covers plugin servers. The
toggle is recorded **per project**. Confirm with `/mcp` that exactly one
mempalace server is connected.

**Tool names are scoped to whichever plugin declares the server**, so the
execute subagents' `tools:` lists carry **both** —
`mcp__plugin_vwf_mempalace__*` (this manifest) and
`mcp__plugin_mempalace_mempalace__*` (the upstream plugin's stdio server). An
allowlist entry for a server that isn't connected is inert, so carrying both
means vwf works under either wiring — which is exactly the case above. **Drop
one and the subagents silently lose memory**: the orchestrator still has it, so
recall keeps working while the findings loop-back quietly stops persisting.

## The installer & statusline CLI

The statusline is **not** a plugin — it ships inside `@askviraj/ai-plugins`, the
`citty` CLI that installs the toolkit across all four targets (marketplace
registration or a copied tree, plus the statusline).

**"The statusline" is three installs of one idea**, because each target offers a
different kind of hook and none of them offers ours. Claude Code has a config
key, so it gets the powerline script this CLI copies and points `settings.json`
at. Oh-My-Pi has a renderer of its own, so it gets four `omp config set` keys.
OpenCode has neither — it has an **extension point**, so it gets a TUI plugin
copied into the config dir and registered in `tui.json`. In both of the latter
two the target is **information parity, not visual parity**: the same segments,
drawn with their separators and palette. **Cursor** is the one target exposing
no status surface at all, so a run targeting only it still installs nothing.

**`cli/` is the source; `bin/` is the build output, and `bin/` is what npm
publishes.** tsup bundles `cli/src/index.ts` → `bin/ai-plugins.mjs`, and two
things make that split load-bearing rather than stylistic: `@ai-plugins/schema`
is a private workspace package that would not resolve from an installed tarball
(every import of it is `import type`, so the bundle erases it), and shipping
`cli/src/*.ts` directly would raise `engines.node` from `>=18` to `>=22.18`,
where Node strips types unflagged. **`bin/` is gitignored** — note the asymmetry
with the rendered trees, which are committed because a *rendered* tree is meant
to be diffed in review, whereas a bundle diff is noise. `i:build` regenerates
it, and `release.yml` already calls `i:build` before publishing, so its trigger
surface is untouched.

The published tarball is `bin` + `tools` + the four rendered trees +
`plugins.json` + both root marketplace manifests: every adapter reads
`<target>/` at install time through `context.sourceRoot`, and the Claude and
Cursor adapters read `.claude-plugin/marketplace.json` and
`.cursor-plugin/marketplace.json` from the package root. That makes the package
~12 MB, which is the cost of the committed-render guarantee — what a user
installs is what CI validated.

Layout:

- `tools/statusline/statusline` — the executable Node script (node shebang).
  Drives **both** surfaces from one file: a stdin payload with a `tasks` array
  renders the subagent panel, anything else the main two-line bar.
- `tools/statusline/statusline.json` — the bundled default config (every
  constant: palette, powerline glyphs, symbols, per-segment styling, line
  layout, subagent panel). The installer seeds this into
  `~/.config/statusline.json`.
- `package.json` (root) — the npm package: `bin` `ai-plugins` →
  `./bin/ai-plugins.mjs`. Runtime deps are whatever the bundle leaves external
  (`citty`, `jsonc-parser`, `smol-toml`, `write-file-atomic`); tsup treats
  `dependencies` as external and inlines everything else, so **a runtime import
  that is only a `devDependency` gets silently bundled** — it works, and it
  hides that package from `osv-scanner`, which reads the lockfile. The package
  `type` stays `commonjs`: the bundle is ESM by its `.mjs` extension, while the
  standalone `tools/statusline/` scripts (run outside this package, with no
  package.json beside them) must remain CommonJS — so the ESM/CJS split is
  carried per-file, not by a package-wide `type: module`.
- `tsup.config.ts` — one entry, `outDir: bin`, ESM, `target: node18`,
  `clean: true`. The hashbang on `cli/src/index.ts` is not decoration: tsup
  copies it through and marks the output executable, which is what lets `bin`
  point straight at the bundle.
- `cli/src/index.ts` — the citty router: parse, resolve, gate, execute, report,
  exit. It resolves the package root by **walking up for a `package.json` whose
  name matches**, rather than counting `..` segments, because it runs from two
  depths (`cli/src/` in the repo, `bin/` once bundled) and a fixed offset would
  be right in one and silently wrong in the other.
- `cli/src/deps.ts` — the external-tool gate. Each plugin declares its own
  `requires:` in `plugin.yaml`; the build projects it into `plugins.json`, and
  the union over the dependency-expanded set is checked before anything is
  written. The old installer kept this as a hand-maintained `PLUGIN_EXTRA_DEPS`
  map whose entries rolled their dependencies' tools up by hand — the derived
  union reproduces every one of those entries exactly, and a test pins that.
  **Not overridable by `--force`**, which means something narrower (act on a
  target whose own CLI is missing): there is no useful state on the far side of
  installing vwf without graphify. `DEP_HINTS` stays CLI-side because it
  describes *this toolchain*, not the plugin — so a tool with no hint still
  reports as missing rather than needing the two lists kept in sync.
- `cli/src/graphify.ts` — runs `graphify install --platform <target>` plus
  `graphify hook install` when vwf is installed, for the two targets graphify
  supports (claude, opencode). Not optional: vwf enforces graphify at its own
  entry gate, so an install that skips this produces a plugin that halts.
  Soft-skips throughout — the hook needs a git work tree, and failing here would
  undo an install that already succeeded.
- `cli/src/version.ts` — `--version`. It does **not** ask each tool what it has
  installed the way `bin/claude.mjs` asked `claude plugin list --json`; with
  four targets that is four bookkeeping formats. Instead, a plugin's version *in
  this build* is what an install would give you — every target reads `<target>/`
  in place or copies it — so the local manifest against the one on `main`
  answers it for all four at once. A plugin here but not on `main` is labelled
  `(not on main yet)` rather than left bare, which read as a failed lookup.
- `cli/src/statusline.ts` — the Claude statusline installer. Not a plugin and
  therefore not an adapter; wired straight from the router with its own receipt.
  See Statusline below.
- `cli/src/statusline-ohmypi.ts` — the Oh-My-Pi half, with a receipt file of its
  own so uninstalling one surface never touches the other. It sets four keys
  (`statusLine.preset` `custom`, plus `leftSegments` / `rightSegments` /
  `segmentOptions`) through `omp config set`, reading each one's prior value
  first so the undo restores it — and recording an undo **only when the value
  changed**, since re-setting an identical value is a no-op whose undo would
  clobber a choice the user made. Two verified `omp` facts shape it:
  `omp config get` prints exactly the form `set` takes back (bare for an enum,
  compact JSON otherwise), and **`omp config reset` does not remove a key** — it
  writes the default back as explicit YAML. So byte-identity on uninstall rests
  on one extra receipt entry filing the `config.yml` `omp` created, and a key
  that was absent from a *pre-existing* config comes back as its explicit
  default: semantically identical, not byte-identical, which is the price of
  restoring key by key rather than rewriting a file the user also edits. **`omp`
  does not validate segment names** — a typo installs cleanly and draws nothing.
- `cli/src/statusline-opencode.ts` — the OpenCode third, again with its own
  receipt. It copies `tools/statusline/opencode-tui.tsx` into the config dir
  (reusing the OpenCode adapter's `configDir`, so the two cannot disagree about
  where OpenCode reads) and appends its relative path to **`tui.json`** through
  the same format-preserving JSONC helpers the adapter uses. Three verified
  facts, none of them in the published docs: **`tui.json` is a separate file
  from `opencode.json`** (OpenCode routes `server` plugins to the latter and
  everything else to the former, and the wrong one is accepted and never
  loaded); **TUI plugins are not auto-discovered** — the
  `{plugin,plugins}/*.{ts,js}` glob that loads vwf's mempalace auto-save does
  not reach them, so the `tui.json` entry *is* the registration; and **there is
  no build step**, since OpenCode's loader is Bun and resolves the plugin's two
  imports itself. A `tui.json` this CLI created is undone by deleting it, one
  that already existed key by key at the **shallowest new key**; the `$schema`
  key and the formatting pass are both creation-only, because on the user's file
  a reflow would break the byte-identical round-trip the receipt promises.
- `tools/statusline/opencode-tui.tsx` — the TUI plugin itself, and the authority
  on what it draws. **Deliberately not covered by any tsconfig**: type-checking
  it would mean adding `@opentui/solid` and `@opencode-ai/plugin` as
  devDependencies purely to resolve two imports in a file nothing here builds,
  putting two packages into the lockfile and the osv scan that ship nothing and
  pinning them against an OpenCode runtime we do not control. `tools/` is
  already an unchecked island for the same reason (`statusline`,
  `context-caps.js`, `mempalace-hooks.js` are all plain JS). What stands in for
  the compiler is the file's own discipline: **every read is optional and every
  segment is built inside a `try`**, because a plugin that throws in a render
  slot takes the frame down with it.
- `tools/statusline/context-caps.js` — the context/rate-limit caps `PostToolUse`
  hook, bundled with the main `statusLine` install (see Statusline below).
- Tests live beside the source under `cli/src/**/*.test.ts` and run under
  **vitest**. `i:test` bundles first and then smoke-tests
  **`bin/ai-plugins.mjs`, not `cli/src/index.ts`** — a packaging mistake (a
  missing external, a broken package-root walk) only shows up in the built
  artifact, because in the repo everything resolves through the workspace. It
  then runs the vitest suites too, so `release.yml` cannot publish something no
  gate validated; `plugins.yml` runs them independently.

  **`vitest.config.mts` restricts collection to
  `{schema,build,cli}/src/**/*.test.ts`.** A test file anywhere else — beside
  `tools/`, or at the repo root — is silently never run rather than failing.
  That is why the statusline *script* tests live at
  `cli/src/statusline-script.test.ts` even though what they exercise is
  `tools/statusline/`.

### Flags

**Plugins.** `--all` installs every **user-scoped, non-opt-in** plugin at user
scope; `--user <name>` / `--project <name>` (both repeatable) name plugins at a
scope. Project-scoped plugins (`flutter`) and opt-in ones (the two cloud plugins
`cloudflare` + `gcp`, and all five capability plugins) are excluded from `--all`
and reached by name. Every one of those sets is **derived from `plugin.yaml` via
`plugins.json`**, not hardcoded — the old `PLUGINS` / `PROJECT_SCOPED` /
`OPT_IN` / `USER_ONLY` / `PLUGIN_DEPS` constants and the `plugins:check`
assertion that kept them honest are both gone, because there is no longer a
second copy to disagree. Names are bare and validated against that index, so an
`@marketplace` or path qualifier is simply not a known name and the CLI can only
install from `virajp-plugins`.

**Targets.** `--platform` (repeatable) selects among `claude`, `cursor`,
`ohmypi`, `opencode`; omitted, every tool detected on `PATH` is targeted. A
selected target whose tool is absent is *skipped with a note*, not failed —
targets are independent, and one missing agent should not fail a run that
installed into the others. `--force` acts on it anyway.

**Statusline.** `--statusline` installs whichever surfaces the selected targets
have: for Claude both `statusLine` and `subagentStatusLine` plus the caps hook,
for Oh-My-Pi the four `omp config` keys, for OpenCode the TUI plugin and its
`tui.json` entry. **Tri-state**: `--statusline` asks, `--no-statusline` refuses,
unset defers to `--all` — so a bare `--all` installs the bar. Only an *explicit*
`--statusline` on a run reaching **none of the three** prints the skip note,
which now means a Cursor-only run. `omp` or `opencode` missing from `PATH` is a
skip with a note rather than a failure, the same rule the plugin targets follow
— though the OpenCode **uninstall** needs no binary, since everything it wrote
is files this CLI owns. The **caps hook is Claude-only** and stays that way: its
sensor is the Claude bar, which mirrors `context_window` / `rate_limits` to a
usage file, and neither of the other two surfaces the equivalent — OpenCode
exposes no ambient rate-limit state at all, which is also why its bar carries no
5-hour / 7-day segments.

**`--version` / `--upgrade`.** See `cli/src/version.ts` above for what
`--version` compares. `--upgrade` replays each target's receipt: **installing is
already upgrading**, since every target reads `<target>/` in place or copies it,
so there is no per-tool update command to drive. Combined with an install
request the install phase covers it, and only the newer-CLI note is kept. A
receipt written before plans were recorded is reported, not silently skipped.

**`--uninstall` / `--dry-run`.** Uninstall reverts from the receipt, which
records prior state — so it restores rather than guessing, and leaves the seeded
`~/.config/statusline.json` (it may hold user edits). A dry run writes nothing
and prints the full diff to stdout, progress to stderr.

Users run it via `pnpx @askviraj/ai-plugins …`.

### Distribution

**npm is the only channel** — `pnpx @askviraj/ai-plugins`, which needs Node.
There is deliberately no standalone binary, no Homebrew tap and no Scoop bucket.

A binary here could never be self-contained: Claude and Oh-My-Pi each register a
marketplace whose source is a real rendered directory, which the agent re-reads
*in place* on every later session, so the payload has to sit on disk beside the
executable rather than inside it. That made every non-npm channel a per-platform
archive plus a per-release checksum file plus an extract-and-symlink installer —
a second distribution system to keep current, delivering exactly what the npm
package already delivers. So `packageRoot()` resolves from `import.meta.dirname`
alone, and Windows users run the same `pnpx` command everyone else does.

**Two-layer config**, deep-merged low → high (objects merge key-by-key, arrays
replace wholesale; either layer may be absent):

1. `~/.config/statusline.json` (lowest) — per-user; the installer seeds this
   with the full defaults and deep-merges missing settings on re-run. The script
   reads defaults **only** from here, never from a file beside itself.
2. `<repo-root>/.config/statusline.json` — per-repo (highest).

The JSON Schema lives at the **repo root** under
`schemas/statusline.schema.json` (consumed only via its raw GitHub URL,
referenced by `$schema`). User-facing reference docs are at
`docs/statusline.md`. When changing the config shape, keep the script,
`tools/statusline/statusline.json`, `schemas/statusline.schema.json`, and
`docs/statusline.md` in sync.

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
  every PR: `plugins:render-clean`, then `plugins:check`, then the vitest
  suites, then `typescript:test`. The order matters — proving the rendered trees
  are a fresh render *before* validating it means a stale tree fails as
  staleness rather than as some confusing downstream assertion. Deliberately a
  **separate file** from `release.yml`: npm allows one Trusted Publisher and
  validates the entry-point workflow's filename, so that file's trigger surface
  stays untouched. This workflow publishes nothing and holds no `id-token`
  permission. Before it, these checks ran only in pre-commit — i.e. only for
  whoever had the hooks installed.
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

- On **npmjs.com**, add this repo + `release.yml` as the **Trusted Publisher**
  for `@askviraj/ai-plugins` (enables OIDC). The workflow-filename field takes a
  **single file** and a package has **exactly one** Trusted Publisher — set it
  to `release.yml` only (not a comma-separated list, and not `deps-update.yml`,
  which publishes by *dispatching* `release.yml`). A mismatch surfaces only at
  publish time as `ENEEDAUTH`. Until configured, `release.yml` cannot publish.
- To cut a release: run **`mise run i:release`** (`--minor`/`--major` to choose
  the bump) — it requires a clean tree, runs the tests, bumps the version,
  commits, and creates the `vX.Y.Z` tag, then (interactively) **pushes the
  commit and tag and watches the `release.yml` run to completion**
  (`gh run watch
  --exit-status`), so the task only succeeds if the npm-publish
  pipeline does (needs `gh` installed + authenticated). **Passing `--ci` stops
  after the tag** (no push/watch) — `deps-update.yml` passes it and does its own
  push + dispatch publish. Prefer releasing via CI over local `i:publish` so
  every version keeps the strongest npm trust level (trusted publisher).

### GitHub Releases

Every `vX.Y.Z` tag carries a **GitHub Release** with a generated changelog. The
tag is the npm-publish trigger; the Release is the human-readable record beside
it. Backfilled for all 30 historical tags (`v1.2.1` … `v2.7.2`) on 2026-07-30;
**cut one for every release from here on**, right after `i:release` pushes the
tag.

```sh
gh release create vX.Y.Z --title vX.Y.Z --notes-file <notes> --verify-tag
```

- **`v*` is the installer CLI's namespace**, matching `package.json` — not a
  plugin version. Marketplace plugin versions are **not** separately tagged;
  they ride the CLI release that carries them, and the notes record which moved.
- **Creating a Release never publishes.** `release.yml` triggers on
  `push: tags: v*`; no workflow listens for `release` events. `--verify-tag`
  keeps it that way by refusing to invent a tag (which *would* push and
  publish).
- **Notes follow `.config/git-conventional-commits.yaml`** — the same config the
  repo already uses: only `feat`/`fix`/`refactor`/`perf` plus breaking changes,
  `includeInvalidCommits: false` (so `ops:`/`docs:`/`chore:` are excluded), WIP
  skipped, scopes bolded, each entry linking its commit via the `commitUrl`
  pattern. Do not invent a second changelog format.
- **Shape of a release note:** an optional `**Plugin versions:**` line (only the
  marketplace entries whose version changed since the previous tag), the
  changelog sections, and a `**Full Changelog**` compare link. A tag with no
  eligible commits still gets a Release, saying it is a maintenance release —
  the tag→Release mapping stays 1:1, so a missing Release means a missed step.
- **`--latest`** resolves by publish date, so a normal forward release is
  correct by default. Pass `--latest=false` when backfilling out of order.

## Hooks

Hooks are authored in each plugin's `hooks/hooks.yaml` as *intent* (`event`,
`matcher`, `action`, `script`) so every renderer emits its own mechanism — for a
`PreToolUse` / `Bash` rewrite, Claude a `hooks.json` with `updatedInput`,
OpenCode a generated JS plugin mutating `output.args`, Cursor and Oh-My-Pi a
deny-with-correction, since neither can rewrite a command:

- `templates/typescript/hooks/npm-normalize.sh` — rewrites `npm`/`npx` to the
  repo's package manager. Exactly two are allowed for JS/TS — **pnpm** and
  **bun** — and the hook resolves which by walking up from cwd for a lockfile
  (`bun.lock`/`bun.lockb` → bun, `pnpm-lock.yaml` → pnpm), then a
  `package_manager: bun` line in `.config/vwf.yaml` (for a project scaffolded
  but not yet installed), then defaulting to **pnpm**. The lockfile is ground
  truth because bun reuses npm's `workspaces` field, so nothing else
  distinguishes them. It lives in the **language** plugin, not in `vwf`: a JS/TS
  rewrite is a TypeScript fact, and `vwf` names no technology.
- `templates/vwf/hooks/hooks.yaml` → `rtk hook claude` — **optional**, and vwf's
  only `Bash` hook. The entry is guarded
  (`command -v rtk >/dev/null 2>&1 && rtk hook claude || true`) so a missing
  `rtk` never blocks a Bash call; `/vwf:doctor` carries the warning instead of
  the hook emitting one per command, which would be unusable noise. Installed
  out-of-band via `brew install --formulae rtk`; plugin install does **not**
  provide it.
- `templates/vwf/hooks/mempalace-checkpoint.sh` (`stop`) +
  `mempalace-precompact.sh` (`preCompact`) — the mempalace auto-save, **written
  here rather than vendored**. Upstream's hook counts human messages by parsing
  `transcript_path`, a Claude JSONL transcript, and breaks its own save loop
  with `stop_hook_active` — both Claude-only, so wrapping it for the other three
  targets yields a hook that runs, finds no transcript and does nothing: green
  in the coverage report, dead in practice. Counting *stops* in a state file
  under `$XDG_STATE_HOME/ai-plugins/mempalace` needs only a session id, which
  every target supplies. It speaks every 15th stop (`MEMPALACE_SAVE_INTERVAL`
  overrides), honours mempalace's own opt-out (`MEMPALACE_HOOKS_AUTO_SAVE`, or
  `hooks.auto_save` in `~/.mempalace/config.json`) so a user who turned
  auto-save off upstream stays off, and resets the counter on
  `stop_hook_active: true` so a save cycle cannot re-trigger itself. The
  pre-compact half is a **second file** that `exec`s the first with `--compact`,
  because the neutral schema names a script and passes it no arguments.
- `templates/vwf/opencode-plugin/mempalace-autosave.ts` — the same behaviour for
  the one target the shell hooks skip (`skipTargets: [ opencode ]`). OpenCode
  has no stop to block; its equivalent surface is a bus event plus a server API
  you inject a message into, so this counts real user messages on `session.idle`
  and re-saves after `session.compacted`.

**Two neutral events exist for these**: `stop` and `preCompact`, in
`schema/src/hooks.ts`. Claude spells them `Stop` / `PreCompact` (mechanical
capitalisation, so its renderer needed no change); Oh-My-Pi `session_stop` /
`session_before_compact`; Cursor has `stop` and **no compaction hook at all**,
which is gap-reported rather than silently dropped. Oh-My-Pi's renderer grew a
**session-shaped wrapper variant** for them: a session event carries
`{session_id, stop_hook_active}` instead of `{tool_name, tool_input}`, and
answers `{continue: true, additionalContext: REASON}` instead of
`{block: true, reason: REASON}`.

Things to know when editing hooks here:

- **Plugin hooks are never written to `settings.json`.** They are
  auto-discovered from the rendered `hooks/hooks.json` and loaded in-memory at
  session start. Verify active hooks with `/hooks`, not by inspecting
  `settings.json`.
- **Hook scripts must be portable to macOS BSD `sed`.** BSD `sed` does not
  support `\s` or `\b` — use POSIX classes (`[[:space:]]`) and explicit
  boundaries instead. `npm-normalize.sh` follows this.

## Adding a Plugin

1. Create `templates/<name>/plugin.yaml` with only the fields the plugin needs —
   including a `version` (what end-user installs pin to; bump it to ship
   changes).
2. Run `mise run plugins:build` and stage the result.

There is no second place to register it: the marketplace manifest is generated
from the manifests, so step 2 *is* the registration.

## Adding a vwf Skill

Create `templates/vwf/skills/<name>/SKILL.md` — no other registration is needed
(auto-discovered). For auto-applying doctrine, set `invocation: model` +
`paths:` scoping. Skill names must be unique across **all** local plugins
(`plugins:check` enforces this — skills share one flat namespace on OpenCode and
Oh-My-Pi). Then pick the invocation mode per the policy below, and run
`mise run plugins:build`.

### Invocation policy

Skills declare the neutral `invocation:` key — `model`, `user`, or `both` (the
default). It is **not cosmetic**: on every target, `user` removes the skill from
the model's context entirely, so a `user` skill **cannot be invoked by another
skill**, and the failure is silent — the delegating skill simply can't see it.

That makes the vwf mesh the deciding constraint — every workflow skill is
delegated to by name somewhere. The rule:

- **`both` when anything delegates to it.** `git-workflow` (every skill commits
  through it), `blueprint` / `plan` / `execute` (`/vwf:recall` routes its
  continuation through all three — resuming a cap-paused run is recall's primary
  use), `product` / `architecture` / `design-system` / `doctor` (`setup`
  orchestrates them), `handoff` (`execute` runs it at a resource cap, and the
  statusline caps hook instructs it), `feedback` (`verify` routes failures
  through it), `screens` (`feedback canvas` routes into it).
- **`user` when nothing does**, and the user owns the timing: `setup`, `verify`,
  `mockups`, `archive`, `recall`. Every reference to these from another skill
  must read as a **recommendation to the user**, never an invocation — `execute`
  tells the user to run `/vwf:archive`, it does not call it.
- **`model`** is the auto-applying doctrine archetype, paired with `paths:`.

Before flipping a skill to `user`, grep for its command reference across
`templates/vwf/skills/` and `templates/vwf/agents/` and confirm every hit is
prose addressed to the user. Adding a delegation to a user-only skill is the
reverse trap: it will never fire.

This applies across plugins too — `devtools:scaffold` is `both` **because
`/vwf:setup` orchestrates it**, per its own "orchestrate, don't reimplement"
rule; so are `devtools`' two stack-adapter skills, which vwf invokes by name. So
is `/vwf:readme`, for the same reason and now within one plugin: the absorption
moved the skill, not the delegation, so flipping it to `user` would still break
setup silently. `cicd:workflow` stays `user`: nothing delegates to it — vwf's
two mentions of it are prose recommending it to the user, which the rename from
`github-actions:workflow` did not change.

**How each target spells it** (all verified against a real install or vendor
source — do not infer these):

| Target   | `user`                              | `model`                 | Invocation                            |
| -------- | ----------------------------------- | ----------------------- | ------------------------------------- |
| Claude   | `disable-model-invocation: true`    | `user-invocable: false` | `/vwf:plan`                           |
| OpenCode | moved to `command/<plugin>-<skill>` | bare, under `skills/`   | bare name; `/vwf-setup` for user-only |
| Cursor   | `disable-model-invocation: true`    | bare + `paths:`         | `/plan`                               |
| Oh-My-Pi | `disableModelInvocation: true`      | **bare — no key**       | `/skill:plan`                         |

One of these is counter-intuitive and was found only by checking a real install,
having silently broken an entire class of skill:

- **Oh-My-Pi has one axis, not two.** `hide` and `disableModelInvocation` are
  aliases the loader ORs into a single flag meaning *hidden from the model*.
  Doctrine must therefore carry **neither** — emitting `hide` on it drops it
  from the prompt, and the skill still loads and still lists while never firing.
  Nothing can hide a skill from the slash menu alone.

## Installation (end-user)

```sh
# Add marketplace once (user-scoped)
claude plugin marketplace add --scope user virajp/ai-plugins

# Install a plugin into a project
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `vwf`, `typescript`, `flutter`, `design-tools`,
`devtools`, `cicd`, `cloudflare`, `gcp`, `datastore`, `identity`,
`observability`, `orchestration`, `object-storage`, `andrej-karpathy-skills`
(external). (The statusline is not a plugin — install it via
`pnpx @askviraj/ai-plugins …`; see The installer & statusline CLI.)

Installing `vwf` pulls in its dependencies (`andrej-karpathy-skills`,
`devtools`) automatically from the same `virajp-plugins` marketplace — no other
marketplace needs to be registered. `cicd` is **not** among them; install it by
name when you want pipelines generated. `mempalace` is not a name here at all —
its memory layer ships inside `vwf`. See the Dependencies section above.

For **OpenCode** there is no marketplace: install via the CLI's
`--platform opencode` target, which copies each plugin's rendered `opencode/`
tree into `~/.config/opencode/virajp-plugins/` (url-sourced plugins excluded,
having no rendered bundle) — see The installer & statusline CLI.
