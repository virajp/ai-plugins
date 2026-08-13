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

The repo also ships a **statusline**, installed via a small CLI
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
confusingly beside its neighbours: `claude/` sits next to `.claude/` (the
worktrees, plus this repo's own skills and agents) and `.claude-plugin/` (the
generated Claude marketplace manifest). The dot prefixes keep them distinct on
disk, but a reader skimming the root will not infer it — `claude/` is
machine-written and never edited by hand, the other two are not.

`templates/` is the only thing authored: `plugin.yaml` is the neutral manifest,
and prose uses Eta helpers wherever a target needs a different spelling.
`schema/` holds the neutral contract — order-preserving frontmatter, zod
schemas, and the verified per-target capability matrix. The rendered trees are
**committed**, so what users install is inspectable and diffable in review, and
CI can assert they match a fresh render.

> **Authoring one:** the Eta helpers, verbatim frontmatter re-emission, what
> `plugins:check` asserts and the dprint exclusions live in
> `.claude/skills/plugin-authoring/`, which auto-applies while you edit
> `templates/`.

### Targets and adapters

Two halves, deliberately kept apart. A **Target** (`build/src/targets/`) is
build-time and pure: templates → the committed render tree. An **Adapter**
(`cli/src/adapters/`) is install-time and effectful: that tree → the user's
machine. That split is what keeps format-preserving config mutation out of the
renderer, and what let the OpenCode installer shrink from a 1189-line renderer
to a copier.

Adapters come in two kinds, and which kind a target gets is dictated by the
target, not chosen: **copy** for OpenCode, which has no plugin concept at all,
and **marketplace** for the other three, each of which owns bookkeeping this
tool has no business editing. Scope is declared by `plugin.yaml` and honoured
where the target supports it; where it does not, the request falls back rather
than failing, and says so.

An install returns a **receipt** recording prior state, so uninstall restores
rather than guesses.

> **Working on one:** the pruning rules, where each target's payload lives, the
> scope fallbacks, the receipt entry kinds and the receipt-completeness bug that
> has now shipped in every adapter are in `.claude/skills/installer-cli/`, which
> auto-applies while you edit `cli/`.

### Tasks

Run locally via pre-commit **and** in `plugins.yml` (never in `release.yml`,
which is the installer's and whose trigger surface must stay untouched — npm
allows one Trusted Publisher and validates the entry-point filename):

- **`plugins:build`** — renders `templates/` into every `<repo>/<target>/`. Each
  target directory is removed first, so a deleted skill disappears rather than
  lingering. It then **sorts the Oh-My-Pi bundles' `package.json`** — the only
  `package.json` the render emits, and one `code:format` checks against
  sort-package-json's canonical key order like any other. Sorting here rather
  than hand-ordering the generator is what stops the two drifting the next time
  a key is added. The sorter is a **pinned devDependency run through
  `pnpm exec`**, never `pnpm dlx`: this rewrites committed output, so an
  unpinned sorter picking up a new upstream key order would fail
  `plugins:render-clean` in CI with nothing having changed locally.
- **`plugins:render-clean`** — runs `plugins:build`, then fails if that produced
  anything not already staged. This is what catches a template edited without a
  rebuild; nothing else can, because the rendered trees are committed. It calls
  the **task**, not the renderer it wraps: rendering stopped being the whole
  pipeline when the sort was added, so invoking the renderer directly would
  compare the tree against output no consumer produces and fail on the sort
  every time.
- **`plugins:check`** — validates `templates/` **and** all four rendered
  targets, then prints the per-target coverage report. On the source: manifest
  name↔dir, dependencies resolving within the marketplace, hook scripts existing
  and executable, **agent cross-reference resolution** (every role-shaped
  `` `token` `` in a plugin's own prose names a real agent, and every declared
  agent is referenced at least once — the two directions cover each other on a
  rename), cross-plugin skill-name uniqueness (skills share one flat namespace
  on OpenCode and Oh-My-Pi), the vwf design-adapter contract (all **three**
  import skills present and `invocation: both`), the **technology-free vwf**
  guard, relative links under `assets/examples/**`, and **strict-YAML
  frontmatter**. On each rendered target: no surviving template tags,
  strict-YAML frontmatter, and every root-relative reference resolving to
  something actually emitted.

  The technology-free guard bans vwf naming a concrete technology **only where
  the mention prescribes**, which is subtler than it sounds — how the anchoring
  window works, and why two design tokens are deliberately unbannable, is in
  `.claude/skills/plugin-authoring/references/rendering.md`.
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

- **The rendered trees are committed; `bin/` and the per-package `dist/` are
  gitignored.** A rendered tree is meant to be diffed in review; a bundle diff
  is noise.
- `CLAUDE.md` and `readme.md` **are** dprint-formatted, so widening one table
  cell re-pads every row.
- The template-authoring traps — Eta's `autoTrim` reflowing folded scalars, the
  dprint exclusions, strict-YAML frontmatter, and bare prose naming a prefixed
  skill — are in `.claude/skills/plugin-authoring/`.

## Plugins

| Plugin           | Source                     | What it provides                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`            | `templates/vwf`            | Skills (slash-invocable workflow skills + auto-applying doctrine skills, incl. the absorbed `documentation-standards` + `readme` and the vendored `mempalace` + `mempalace-recall` + `karpathy-guidelines`), subagents, the guarded `rtk` Bash hook plus the two mempalace auto-save hooks, and **two** MCP servers — mempalace over **HTTP** (see The memory layer: vendored skills, vwf's server) and the absorbed Context7 docs server over stdio. Names **no** technology: no stack templates, no language list                                                               |
| `typescript`     | `templates/typescript`     | The **TypeScript language plugin** — one plugin per language, covering `typescript` and `javascript`. A `typescript` router skill (lean SKILL.md → on-demand standards/vitest/build references, single-package and monorepo) plus an `effect` router skill (effect/effect-runtime/testing references, folded back in — a framework is not a plugin boundary), `package-json`, `pnpm`, `tsconfig`, `lint-format`, the TypeScript/JavaScript language server, the npm→pnpm/bun normalizing hook, and **all ten** TypeScript stack templates behind the two vwf stack-adapter skills |
| `design-tools`   | `templates/design-tools`   | The **vwf design adapter** — three skills (`design-tools-import-screens`, `design-tools-import-design-system`, `design-tools-import-conversations`) that resolve the design tool **per project** and dispatch to a per-tool reference (`claude-design`, `lovable`, `stitch`), read on demand. Ships the Claude Design MCP server. Not a vwf dependency                                                                                                                                                                                                                            |
| `flutter`        | `templates/flutter`        | Opinionated Flutter skills — `dart` & `swift` router skills (lean SKILL.md → on-demand topic references) plus `kotlin`, `pubspec`, `analysis-options`, `internationalization` + bundled Dart, Kotlin & Swift (SourceKit) language servers. Also owns the `dart-flutter` **stack template** (platforms `mobile`/`tablet`/`desktop`/`webapp` — one codebase, four surfaces) and the two vwf stack-adapter skills. Self-contained (no cross-marketplace deps)                                                                                                                        |
| `devtools`       | `templates/devtools`       | The **developer-machine toolchain** — the mise skill (the `.config/` three-file `MISE_ENV` split, tool/env placement, file-based tasks, node-gpg workaround) + `/devtools:scaffold`, `doppler` (**development** secrets only; no `secrets` plugin exists), `docker`, and the repo-level gates the stack templates name: `dprint`, `eslint`, `gitleaks`, `grype`, `pre-commit`. Owns the provider-neutral `container-generic` **deploy** template (no `container` capability plugin) + the two vwf stack-adapter skills. A **vwf dep**                                             |
| `cicd`           | `templates/cicd`           | A `/cicd:workflow` skill that resolves the repo's CI system (the per-project `cicd` key, else ask — **never** repo detection, **never** a silent default) and reads only that tool's `references/<tool>.md`; GitHub Actions is the one implemented today. Neutral rules live in SKILL.md (mise installs everything, both layouts, vwf's delivery-pipeline contract); adding a CI system is one reference file. **Independent — not a vwf dep** (vwf states the contract, `cicd` implements it)                                                                                    |
| `cloudflare`     | `templates/cloudflare`     | Cloudflare stack plugin for vwf — **scope deliberately parked at Zero Trust Access**: a private plane in front of a project that must not be publicly reachable, whichever cloud hosts it. Workers, Pages, R2, D1, KV, Durable Objects, Queues, Images and Stream are **not** offered and arrive under their own dedicated plan; the menu states what it does not cover rather than coming back quietly short. **Opt-in**                                                                                                                                                         |
| `gcp`            | `templates/gcp`            | Google Cloud stack plugin for vwf — the judgment an SDK reference cannot give: which service to pick and when it stops being the answer, how each bills, which have local emulators, least-privilege IAM. Ships `firebase`/`cloud-sql` (backing) and `cloud-run`/`gke` (deploy) plus `gcp-cost`, `gcp-iam`, `gcp-local-stack`. Observability is OTLP only — GCP services are sinks, never SDKs. **Opt-in**                                                                                                                                                                        |
| `datastore`      | `templates/datastore`      | **Capability** plugin — the neutral datastore contract (versioning, atomic multi-record writes, server time, the services-layer access rule, a deterministic local stack) plus the provider that needs no cloud: **Postgres**. Managed flavours come from the project's cloud plugin. **Opt-in**                                                                                                                                                                                                                                                                                  |
| `identity`       | `templates/identity`       | **Capability** plugin — the neutral identity contract (verification per route, the *claims carry status not roles* rule, revocation, the operator plane) plus the provider that belongs to no cloud: any **OIDC** issuer. Managed flavours come from the project's cloud plugin. **Opt-in**                                                                                                                                                                                                                                                                                       |
| `observability`  | `templates/observability`  | **Capability** plugin — the neutral telemetry contract (**the product emits OTLP and never a vendor SDK**, signal correlation, cardinality as a design decision, retention) plus the self-hosted sink: **OpenTelemetry → Grafana OTel-LGTM**. A managed backend is a destination, not an import. **Opt-in**                                                                                                                                                                                                                                                                       |
| `orchestration`  | `templates/orchestration`  | **Capability** plugin — the neutral contract for work that happens later (at-least-once and the idempotency it forces, bounded retry, the poison path, work-in-flight visibility, queue vs bus vs scheduler vs workflow engine) plus the self-hosted engine: **Temporal**. **Opt-in**                                                                                                                                                                                                                                                                                             |
| `object-storage` | `templates/object-storage` | **Capability** plugin, **contract-only by design** — buckets, lifecycle as a bucket policy, signed access, prefix-scoped credentials, the never-proxy-bytes rule, egress cost. It ships **no provider**: every object store is a cloud's, so the flavour comes from `gcp` (Cloud Storage) or `cloudflare` (R2, once unparked). Its menu and template skills **say so explicitly** rather than returning empty, which would be indistinguishable from a broken adapter. **Opt-in**                                                                                                 |

## Plugin Structure

Every plugin is a directory under `templates/` with a `plugin.yaml` — the
**neutral manifest**. Minimal form:

```yaml
name: <plugin-name>
description: <one line>
```

Everything else defaults: `category` to `development` and `source` to local. The
schema is `schema/src/manifest.ts`, which is authoritative.

A manifest declares **no install-time eligibility at all** — no scope, no opt-in
flag. It used to carry three such keys and none earned its place: `scope` and
`optIn` did the same single thing in two spellings (exclude from `--all`), and
`userOnly` was set by no plugin ever. What `--all` installs is now one
`defaultInstall` list in `templates/marketplace.yaml`, and every plugin installs
at user **or** project scope purely on request — see Installation (end-user).

This one file replaces what used to be split between a `plugin.json` and a
hand-written marketplace entry — two files that had to be kept in sync by hand,
and a whole class of drift `plugins:check` existed to catch. The marketplace
manifest is now **generated** from the manifests, so a plugin cannot be
unregistered, orphaned, or disagree with its own entry.

A plugin may additionally declare `lspServers`, `mcpServers`, `dependencies`,
`requires` (a **hard install gate**, not a bibliography) and `prefixSkillNames`.
Skills, agents, and hooks are **auto-discovered by directory convention** and
are never listed in `plugin.yaml`:

- `skills/<name>/SKILL.md` → skills, carrying the neutral three-valued
  `invocation:` key. This repo has **no `commands/` dirs**: former commands are
  skills, so one artifact serves every target.
- `agents/<name>.md` → subagents
- `hooks/hooks.yaml` → hooks, declared as *intent* so each renderer can emit its
  own mechanism
- `opencode-plugin/*.{ts,js}` → OpenCode plugin modules, for behaviour no
  neutral hook can express

> Field by field, including the cross-marketplace dependency rules:
> `.claude/skills/plugin-authoring/references/manifests.md`.

### Marketplace manifests

Three of the four targets have a native plugin marketplace, so `plugins:build`
generates one per target from the manifests. **Only OpenCode has none** — it has
no plugin concept, which is why its installer copies a rendered tree while the
other three register a marketplace and let the tool do the installing. Do not
edit any of them by hand; `plugins:render-clean` will fail.

| Target   | Manifest                          | Plugin source                  |
| -------- | --------------------------------- | ------------------------------ |
| Claude   | `.claude-plugin/marketplace.json` | `./claude/plugins/<name>`      |
| Cursor   | `.cursor-plugin/marketplace.json` | `git-subdir` → `cursor/<name>` |
| Oh-My-Pi | `ohmypi/.omp-plugin/…json`        | `./<name>`                     |

Two live at the **repo root** rather than under `<repo>/<target>/`, because that
is where the tool looks when the marketplace is added from this repo, and their
sources are root-relative. Three traps ride on these — sources resolving against
the marketplace root, Cursor's git-only sources, and the mandatory per-entry
`version` — each verified by running the real tool and each silent when wrong:
`.claude/skills/plugin-authoring/references/manifests.md`.

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

  | Skill                | What it does                                                                                                                                                                                                                                                                                                                                                              | Halts / gates                                                                                                                                                                                                        |
  | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `setup`              | Phase-0 onboarding + migration bootstrapper: detects topology, migrates to the shipped format, stamps `.config/vwf.yaml`                                                                                                                                                                                                                                                  | —                                                                                                                                                                                                                    |
  | `product`            | Phase −1 outcome contract — problem, users, goals (`#goal-<slug>` anchors), slice priority, optional tier matrix                                                                                                                                                                                                                                                          | —                                                                                                                                                                                                                    |
  | `architecture`       | The system shape: writes `registry.yaml` (authoritative) + `architecture.md` (its prose view); stacks go to `.config/vwf.yaml`                                                                                                                                                                                                                                            | —                                                                                                                                                                                                                    |
  | `design-system`      | **Import-only** — the project's configured design tool authors the design system; this imports it via the adapter as the offline contract and pins `design.design_system_id`                                                                                                                                                                                              | no canvas surface → halt; required once the registry has a UI project                                                                                                                                                |
  | `blueprint`          | The full-product **flow-first sweep**: works a coverage worklist (incl. `density/` items → `blueprint-condenser`) until whole-product coverage **and** the coherence review hold, then stamps `blueprint.coverage`                                                                                                                                                        | halts without `product.md`; halts on a Screens flow with no `design-system.md`                                                                                                                                       |
  | `mockups`            | Batch re-render of screens into the **gitignored** `docs/scratchpad/` tree — never pushed to Claude Design, never a gate for `plan`                                                                                                                                                                                                                                       | —                                                                                                                                                                                                                    |
  | `screens`            | Two-way canvas sync: `prompt` writes per-platform design briefs (the files *are* the deliverable), `import` diffs designed pages back and routes every accepted delta through `/vwf:blueprint`                                                                                                                                                                            | never edits a flow doc itself                                                                                                                                                                                        |
  | `plan`               | One slice's desired-vs-actual delta as a cycle plan; resolves the transitive dependency chain and plans each unimplemented dependency as its own plan first                                                                                                                                                                                                               | halts unless `blueprint.coverage: complete`; halts on any `doctor` **blocking** finding across the chain's projects (no LSP gate — planning compiles nothing) or on a stack-template `conventions:` fetch that fails |
  | `execute`            | Runs one approved plan to completion **autonomously** in a dedicated worktree, to **one** final human gate that renders the run journal                                                                                                                                                                                                                                   | halts until every `requires:` plan's `covers:` docs read `implementation: complete`                                                                                                                                  |
  | `verify`             | Post-deploy environment check; a clean **production** run offers to freeze each service's OpenAPI contract into `apis/released/`                                                                                                                                                                                                                                          | vwf never deploys                                                                                                                                                                                                    |
  | `feedback`           | Production-feedback front door: classifies bug/hole/metric/UX/idea and routes each into the doc + command that fixes it; `canvas` harvests claude.ai/design review conversations                                                                                                                                                                                          | —                                                                                                                                                                                                                    |
  | `archive`            | Moves completed cycle plans into `docs/plans/archived/`; never deletes                                                                                                                                                                                                                                                                                                    | —                                                                                                                                                                                                                    |
  | `doctor`             | Checks the repo against `.config/vwf.yaml` — per-language LSP + toolchain, frameworks/deps vs each manifest, `repo.stack`, harness task names, health paths, the mempalace config (one at the repo root, its wing/room set, its secret excludes), the graphify CLI/graph/hook, format-stamp drift. Reports to room `doctor`; never writes uninvited, never builds a graph | never halts — a mandate is a **blocking** finding, and `setup` + `execute` both halt on one (`execute` also gates on LSP)                                                                                            |
  | `git-workflow`       | Internal: worktree isolation, commits, merges, pushes — every other skill delegates git here                                                                                                                                                                                                                                                                              | —                                                                                                                                                                                                                    |
  | `handoff` / `recall` | session handoff written to **both** memory stores; the reserved **`next`** handoff is the argument-less default, is mirrored to `docs/memory/handoff/next.md` (gitignored — a handoff is personal), and `recall next` resumes without a gate                                                                                                                              | —                                                                                                                                                                                                                    |
  | `readme`             | Scans the repo and writes/updates its README against the eight required sections. Absorbed from the retired `markdown` plugin; `invocation: both` **because `setup` orchestrates it**                                                                                                                                                                                     | —                                                                                                                                                                                                                    |

  Ordering and what each gate means: **Foundations & ordering** below. The
  execute stage pipeline (`code` → `review` ‖ `security` → `acceptance` + `ux`,
  the convergence guard, the run journal): `assets/execute-stages.md`.
- `agents/` — the subagents the workflow skills delegate to. Delegation is a
  **latency and context strategy as much as a quality one**: read-heavy scans
  and mechanical writing run in a subagent so their file loads never enter the
  orchestrator's context, where every loaded line is re-processed on each later
  turn. Each agent file states its own contract; `plugins:check` verifies these
  names resolve, in both directions.

  | Agent                                        | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `blueprint-surveyor`                         | The sweep's coverage worklist — walks the bundle against the coverage conditions (incl. standard-flows mandates and `density/` line counts) and returns only the ordered worklist                                                                                                                                                                                                                                                                                                                      |
  | `flow-writer`, `entity-writer`               | Render the orchestrator's **already-elicited** decisions into format-conformant docs + catalog rows. Never elicit, never invent; report anything unfilled as `UNRESOLVED:`                                                                                                                                                                                                                                                                                                                             |
  | `blueprint-reviewer`                         | Per-doc completeness gate, two modes (flow / entity), plus the code-independence, vendor-name, and **density** bars                                                                                                                                                                                                                                                                                                                                                                                    |
  | `blueprint-condenser`                        | The density pass — one over-budget doc → a lossless-of-contract rewrite; returns before/after counts, what it could not cut, rationale to persist, questions to park, and any contract hole the cut exposed                                                                                                                                                                                                                                                                                            |
  | `blueprint-coherence-reviewer`               | End-of-sweep whole-product pass across flows/entities/schemas/APIs; catalog + erDiagram sync; the released-API additive-only diff as a HARD gap. Takes a **scope** (`full`, or sharded `flow-walk` + one `bundle`)                                                                                                                                                                                                                                                                                     |
  | `plan-surveyor`                              | The desired-vs-actual survey — the largest inline read in the workflow; graph-first, returns `PRESENT`/`PARTIAL`/`ABSENT` + reuse candidates as `file:line`, never code                                                                                                                                                                                                                                                                                                                                |
  | `architecture-writer`                        | Writes `registry.yaml` + `architecture.md`; never sees or records a stack                                                                                                                                                                                                                                                                                                                                                                                                                              |
  | `mockup-generator`                           | Per-flow: Screens contract + design-system tokens → self-contained HTML into the gitignored scratchpad; returns only a manifest                                                                                                                                                                                                                                                                                                                                                                        |
  | `execute-coder`                              | The code stage under strict TDD, to the coverage gate                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | `execute-code-reviewer`                      | Adversarial review incl. the released-contract compatibility dimension and its `API COMPAT:` line                                                                                                                                                                                                                                                                                                                                                                                                      |
  | `execute-security-reviewer`                  | Threat-models the diff against the project's declared capabilities                                                                                                                                                                                                                                                                                                                                                                                                                                     |
  | `execute-acceptance-verifier`                | Independent criteria→E2E mapping + run; also `/vwf:verify`'s environment mode                                                                                                                                                                                                                                                                                                                                                                                                                          |
  | `execute-ux-reviewer`                        | Renders changed screens and judges them against design-system + the Screens contract. **Browser** screen platforms (`site`/`webapp`): dev server + Playwright, axe a11y scan. **Device** screen platforms (`desktop`/`mobile`/`tablet`/`auto`): the equivalent gate from its own toolchain — Flutter golden tests + `flutter_test`'s `meetsGuideline` a11y assertions, Compose/XCUITest screenshot + semantics equivalents. `RENDERED: n/a` on any UI slice reaches the gate, never a silent downgrade |
  | `product-reviewer`, `design-system-reviewer` | The completeness gates for their two foundation docs                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

- `skills/` (doctrine, auto-applying — `invocation: model` + `paths:` scoped) —
  read automatically when editing the files they govern. Each SKILL.md and its
  references are authoritative:

  | Skill                     | Governs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `blueprint-authoring`     | `docs/blueprint/**` — the contract-vs-realization line, the **density** bars (budgets, the delete test, the anti-patterns), the per-surface completeness bars (flow-contract, entity-contract, api-and-schema-contracts), and the OKF frontmatter/link doctrine. Also `docs/plans/**`, for frontmatter + link hygiene only                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `product-foundations`     | The twelve foundational concerns every product decides (users & operators, observability, audit logs, change logs, background processes, data retention & PII, notifications, runtime settings, rate limiting, reliability targets, disaster recovery, cost guardrails) as **elicited defaults** — walked by `/vwf:architecture` step 3c, expanded by `/vwf:blueprint` into `conventions.md` anchors and per-flow surfaces                                                                                                                                                                                                                                                                                                                               |
  | `design-system-authoring` | `docs/blueprint/design-system` — tokens, typography, spacing, motion, accessibility, component behaviors/anti-patterns, and terminal-ux (required when a project declares platform `cli`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
  | `project-setup`           | Onboarding + migration: topology detection plus the **topology menu** (`repo`/`monorepo`/`multi-repo` under `assets/topologies/` — a menu since format 19, not enforced; since format 22 `multi-repo` takes a second question, `linkage: submodule` (recommended) or `siblings`, so a product whose repos are not submodules needs no restructuring; `enforcement.structure` retired with it — the **one** exception is an `iac` project, which format 20 requires to be its own repo, enforced as a blocking `doctor` finding), the **stack-template axes** (`architecture` presents each, per project since `config_format` 13), harness-capability detection, consent-gated dry-run migration, and the format-version drift map. Used by `/vwf:setup` |
  | `rest-api-design`         | API contract depth — resources, methods, errors, pagination, idempotency, versioning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
  | `documentation-standards` | `**/*.md` — writing style, heading hierarchy, links, front matter, CHANGELOGs, and the mermaid rules. Absorbed from the retired `markdown` plugin                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
- `assets/` — the shared doctrine and data every skill and agent reads. **Each
  file is authoritative for its own subject**; this is a map of which one owns
  what, not a summary of their contents:

  | Asset                                  | Owns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
  | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `templates/`                           | Every doc skeleton vwf writes: `flow` + `flow-platform`, `flows-index`, `entity` + `entities-index` + `schema.yaml`, `registry.yaml`, `openapi.yaml`, `conventions`, `plan`, `product`, `architecture`, `design-system`, `environment`, `screen-prompt`, `canvas-claude`, `project-claude`, `handoff`. All blueprint markdown opens with the OKF frontmatter block                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
  | `examples/blueprint/`                  | The **format-21 conformance bundle** — a worked, format-valid slice where every link resolves, each flow carries Acceptance + sequence diagram + Components blocks + a Guarantees table, every doc sits inside the density budget, and nothing names a vendor. The concrete "what good looks like", link-checked by `plugins:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `elicitation.md`                       | The shared questioning protocol (one decision per round, **§3a — every question names its scope**: the registry project + its `platforms`, the platform when platform-specific, or "the whole product"; the hard gate before writing, the convergence guard, the **parked-scope rule**)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
  | `execute-stages.md`                    | The execute stage pipeline: the stage table + Runs column, per-stage subagent contracts, shared stage rules (model enforcement, loop-on-findings, the **convergence guard**), the **run journal** shape, and the end-of-run reconcile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
  | `capability-vocabulary.md`             | The stack-agnostic capability tokens **and** the prose-noun mapping (`document-datastore` → "the datastore") every blueprint doc writes against                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | `engineering-baseline.md`              | The **15 centralized technical rules** every product follows by default — enforced, never elicited; seeded into `conventions.md#baseline`, waived only via `enforcement.rules`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
  | `delivery-pipeline.md`                 | The canonical environment vocabulary (`development`/`staging`/`production`) + CI/CD contract (mise-built; `<project>-<env>-v<semver>` tag-triggered, branch-validated, tested-before-release). Read by `blueprint`, `verify`, and the **cicd** plugin                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
  | `standard-flows.md`                    | The canonical flow-slug vocabulary per **platform kind** (device vs browser), the designated numbers, the **screen-platform** subset that alone gets `<platform>.md` files, the auth-capability signal, and the synonym table (rename proposals, never automatic)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
  | `design-adapter.md`                    | The **design-adapter contract** — vwf talks to no design tool. Export (`/vwf:screens prompt`) needs no adapter since briefs are files; only **import** delegates, and always to the same three names — `-import-screens`, `-import-design-system` and `-import-conversations` (the last added to stop `/vwf:feedback canvas` reaching one tool's MCP server by hardcoded prefix, which left the menu's other two tokens advertised and silently dead). **vwf constructs no skill name from config**: the tool is a **per-project** key the adapter resolves internally. Defines all three normalized payloads, the mandatory `invocation: both`, and the **preflight** — a user-only adapter skill cannot be invoked and does not error, so an unsupported tool is indistinguishable from an empty result unless it halts first. Conversations alone may return `harvested: n/a` (that tool has no review surface); the other two must halt, since an empty payload there reads as a design nobody authored                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `vwf-config.md`                        | The `.config/vwf.yaml` doctrine (currently `config_format` **15**, which renames `polyrepo` → `multi-repo`, adds `linkage:` and the `members:` list, and drops the `<role>/` segment from the project-axis pin — shipped with blueprint format 22): stamp keys, the coverage stamp, per-project nuances **and the structured `stack` block** (all three technology axes per project since 13, alongside the per-project `design` and `cicd` keys), the repo-level `repo.stack`, `harness:`, `enforcement:`, bounded `pipeline` knobs, `verify` environments, the `design:` canvas pins, and the hard floor config can never disable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `harness.md`                           | The harness contract — the verification capabilities a repo must be able to run (`dev`, `e2e_local`, `local_stack`, `e2e_staging`, `health`, `screenshots`) and their canonical task names. Task names may vary; `local_stack` is the one capability whose **mechanism** may not — when a repo needs a local stack it must be Docker-composed services behind `wait-on` gates, since the acceptance verifier depends on a deterministic ready signal. A product needing no backing services needs no Docker                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `stack-adapter.md`                     | The **stack-adapter contract** — vwf ships **no** stack templates and the `assets/stacks/` tree is gone. What stays vwf's is the abstraction: the **four independent axes** (`project`/`backing`/`deploy` per project since `config_format` 13, `repo` per repo — they vary independently and never merge, so nothing has precedence), the `platform` vocabulary a project template declares (a **list** since format 22, since one template routinely serves several — and a pin must **cover** every platform its project declares), the harness capability *names*, and the template-payload shape. What each axis actually offers lives in a **stack plugin**, reached at two contracted skill names — `/<plugin>:<plugin>-stack-menu` and `/<plugin>:<plugin>-stack-template <slug>`, both mandatorily `invocation: both`, since a user-only adapter returns an empty menu rather than an error. `architecture` presents the union and the user picks; adding an option means adding a file **to a plugin**, never to vwf. Also **Resolving the conventions** — the config records *which* template a project pinned, never what it says, so `plan` (once per chain, at its stack gate) and `execute` (once per run, at Setup) fetch each template's `conventions:` prose deduped by slug. A failed fetch **halts**: the gate already proved the pin resolves, so a failure is the plugin being unreachable, and code sized against conventions nobody read is the failure the closed menu exists to prevent |
  | `stack-vocabulary.md`                  | The **shape of a language fact**, not a list of languages — vwf names none. A token is whatever a stack template's `languages:` frontmatter declares, and the facts `doctor` checks against it (LSP plugin, manifest, mise tool) are supplied by the **language plugin** that owns it. Also the template frontmatter contract — since format 22 a project template declares `platforms:` in frontmatter and sits **flat** under `stacks/project/`, because one template serves several platforms and a directory name cannot say so — and why frameworks/dependencies stay open. But the **menu is closed**: the union of what the installed plugins declare *is* the vocabulary, so since `config_format` 14 a language no plugin claims is **unknown = blocking** (`setup` and `execute` halt), and `template: custom` is retired with no *other (describe)* path — many stacks, every one defined by a plugin                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | `memory.md`                            | The memory protocol: **two stores written together** — mempalace (semantic search) and `docs/memory/<room>/<drawer>.md` (always present, greppable), which is what makes the daemon **optional** rather than required. Recall prefers mempalace and degrades to grep, saying so. The **closed seven-room set** (`decisions`/`problems`/`planning`/`gaps`/`runs`/`doctor`/`handoff`); `decisions`/`planning`/`gaps`/`problems` are committed, `handoff`/`doctor`/`runs` gitignored (one developer's state, not the team's). Plus recall before work, persist decisions, findings memory for loop-backs, **gap memory**, and the **`mempalace.yaml`** contract — **exactly one per product, at the repo root** (mining reads the config only from the directory it is pointed at, so a copy in `.config/` or a submodule is silently inert), one wing, all seven rooms seeded, the first-match routing trap, and a **secret denylist in `exclude_patterns` as the backstop behind `.gitignore`**. `/vwf:doctor` §7 enforces it, four of the checks as **blocking** — a mistyped room name never errors, it just empties every later recall, and a misplaced config never errors either                                                                                                                                                                                                                                                                                                                              |
  | `graphify.md`                          | The code-intelligence protocol — graph-first for codebase questions, file reads as verification. **graphify is mandatory**, enforced at the entry gate: `/vwf:doctor` §8 reports a missing CLI or a graph absent from *both* this checkout and the main one as **blocking**, and `setup`/`execute` halt. A worktree resolving to the main checkout's graph is the normal path, never a finding — treating it as one would halt every run. Refresh-hook absence and staleness stay **degradations**; mid-run it still degrades rather than crashes, and only `setup` builds a graph                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
  | `docs-sync.md`                         | The docs-ship-with-the-change rule for runs that change reality (`execute`, `architecture`/`product` update mode). `blueprint`/`plan` are exempt — they document intent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
  | `format-check.md` + `blueprint-format` | The format-drift preflight: compare the repo's stamp to the shipped integer (**21**) and nudge `/vwf:setup`. Since vwf is user-scoped, this usage-time check is what reaches each repo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
  | `minimalism.md`                        | The Ponytail decision ladder — what gets **built** (scope). Prose density is a separate bar, in the blueprint-authoring skill                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
- `hooks/hooks.yaml` — the guarded `rtk` Bash hook plus the two mempalace
  auto-save hooks (`stop` + `preCompact`), whose scripts sit beside it; the
  OpenCode equivalent is `opencode-plugin/mempalace-autosave.ts`. The
  npm→pnpm/bun normalizer moved to `typescript`, where the language it rewrites
  for lives.
- `vendor/` — provenance, licence position and resync policy for the vendored
  third-party skills: `mempalace/` (the two memory skills, MIT with upstream's
  own LICENSE) and `andrej-karpathy-skills/` (`karpathy-guidelines`, MIT
  **declared but with no licence text published upstream**, so a `NOTICE.md`
  records the declaration rather than reproducing a template nobody published).
  Both ship in every rendered bundle, which is the point: the provenance travels
  with the code.

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
(currently **22**); the authoritative `N → N+1` migration deltas live in the
project-setup skill's `format-versioning` reference, and `/vwf:setup` migrates
stale repos on next use. **That reference is the single source — do not restate
the per-format history here.** What each past format changed is git's job and
`format-versioning`'s; a second narrative copy is precisely the drift the
density doctrine warns about, and it was 105 lines of this file before
format 16. The *current* shape is what this section describes throughout; the
paired `config_format` (currently **15**) is described under
`assets/vwf-config.md`, and its own `N → N+1` deltas live there rather than in
`format-versioning` — the two stamps are separate number lines, which have now
drifted apart in both directions: `14` shipped without a blueprint bump (it only
closed the stack menu) and `21` shipped without a config bump (it only moved one
config file). `22`/`15` ship **together**, as `19`/`12` and `20`/`13` did — the
config's `template` pin and `ui:` key both depend on the new platform
vocabulary, so a repo on one but not the other is a state neither migration
expects.

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

`vwf` depends on exactly one plugin — `devtools` — **resolved from the
`virajp-plugins` marketplace itself**, so installing `vwf` needs no other
marketplace registered. It is authored here.

`mempalace` and `andrej-karpathy-skills` used to be on that list and are gone as
plugins: vwf **vendored** their skills. That is the one place third-party code
is vendored into this repo, and it buys something a dependency could not — see
The memory layer and The vendored guidelines below.

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
mempalace-mcp --transport http --host 127.0.0.1 --port 8765 \
  --palace "$HOME/.local/share/mempalace"   # loopback needs no token
```

Not `mempalace serve`: `serve` forks the real server as a child and holds PID 1
itself, so under a supervisor the server never sees `SIGTERM`. Pass the palace
as a **flag**, not through the environment — a daemon inherits its supervisor's
environment, so a stale value there outlives every restart of the daemon itself.

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

#### The vendored guidelines

**The Karpathy guidelines were vendored for the same reason as memory.**
`andrej-karpathy-skills` was url-sourced, so only Claude's marketplace could
resolve it: Cursor's manifest is generated from local plugins alone, Oh-My-Pi
parses the URL and then silently ignores the entry, and OpenCode's copy adapter
has no bundle to copy. **Three of four targets installed `vwf` and got none of
the behavioural guidelines it assumes are on** — and each failed quietly, which
is what let it survive as long as it did.

`karpathy-guidelines` now ships under `templates/vwf/skills/`, taken
**verbatim**, with provenance in `templates/vwf/vendor/andrej-karpathy-skills/`.
One local edit was needed and it was not for the render: the repo's lint gate
requires a language on every fence, so one bare fence became `text`. It is
recorded under **Local edits**, which is the only thing that makes vendor drift
survivable — an unrecorded edit is silently reverted by the next resync.

The licence position differs from mempalace's and the difference is deliberate.
Upstream declares MIT in its skill frontmatter and its `plugin.json`, but
**publishes no licence text** — GitHub reports the repo as unlicensed. So this
vendor directory carries a `NOTICE.md` quoting both declarations verbatim rather
than a `LICENSE` file. Shipping an MIT text the upstream author never published
would be worse than an honest note.

## The installer & statusline CLI

The statusline is **not** a plugin — it ships inside `@askviraj/ai-plugins`, the
small CLI that installs the toolkit across all four targets (marketplace
registration or a copied tree, plus the statusline). Users run it via
`pnpx @askviraj/ai-plugins …`, which is the only distribution channel.

> **The user-facing reference is `docs/cli/`** — `usage.md` for the flags,
> `targets.md` for what each agent gets and where it lands, `internals.md` for
> the source map. What follows is the shape a maintainer needs in context, not a
> second copy of them; `internals.md`'s path table is the fuller one.

**`--all` is a list, not a rule.** It installs `defaultInstall` from
`templates/marketplace.yaml` — `vwf` and `devtools`, the workflow plus exactly
its hard dependency — at user scope, plus the statusline. Every other plugin is
installed by name at whichever scope the flag asks for; nothing is pinned.
Changing the default set is an edit to that one list.

**There is no `--upgrade`.** Plugin content ships *inside* the npm package — the
marketplace source is an absolute path into `packageRoot()` — so re-running the
install **is** the upgrade, and the flag only ever replayed a receipt to do what
naming the plugins again did.

**Two of the four targets need a nudge to notice, for the same reason and with
different symptoms**: each caches something of its own that nothing re-reads.
**Claude** caches plugin content per version and answers "already installed"
without re-resolving, so a newer payload sat on disk while the old version
stayed live — the adapter compares the advertised version against Claude's own
`installed_plugins.json` and runs `plugin update` on a mismatch. **Oh-My-Pi**
caches the marketplace *catalog*: the content did refresh, but `omp plugin list`
reported the old version and a plugin **added** in a later release could not be
installed at all — the adapter now runs `omp plugin marketplace update`
unconditionally on the already-registered branch, there being no version to
compare against. Cursor and OpenCode need neither. **Both were found by the
`target-verifier` agent against the real CLIs; neither was reachable by a unit
test, because both live in state the other tool keeps.**

An invocation that installs nothing — bare, or carrying only modifiers like
`--platform` — prints the help and exits 1.

**A statusline that is not ours is never replaced silently.** The bar is
installed whenever asked for, but *configuring* the host tool is gated on
consent, since that is the step that displaces what the user had. `--statusline`
is the only consent (`--all` is not); with no TTY the run **fails** rather than
guessing; a refusal is remembered as `autoConfigure: false` in
`~/.config/statusline.json` and cleared by `--statusline`. Ownership, not
existence, decides what counts as foreign — otherwise every repeat run prompts
about its own bar. Details, including why this reverses a documented decision
and the OpenCode idempotency trap:
`.claude/skills/installer-cli/references/statusline.md`.

**"The statusline" is three installs of one idea**, because each target offers a
different kind of hook and none of them offers ours: a config key on Claude,
four `omp config` keys on Oh-My-Pi, a TUI plugin on OpenCode. **Cursor** exposes
no status surface at all.

**`cli/` is the source; `bin/` is the build output, and `bin/` is what npm
publishes.** tsup bundles `cli/src/index.ts` → `bin/ai-plugins.mjs`; `bin/` is
gitignored and `i:build` regenerates it. The published tarball is `bin` +
`tools` + the four rendered trees + `plugins.json` + both root marketplace
manifests — about 12 MB, which is the cost of the committed-render guarantee:
what a user installs is what CI validated.

| Path                     | Is                                                                |
| ------------------------ | ----------------------------------------------------------------- |
| `cli/src/args.ts`        | the flag surface on `util.parseArgs`, plus the usage renderer     |
| `cli/src/index.ts`       | the router — resolve, gate, execute, report, exit                 |
| `cli/src/adapters/`      | one per target                                                    |
| `cli/src/receipt.ts`     | prior state, so uninstall restores rather than guesses            |
| `cli/src/deps.ts`        | the external-tool gate, derived from each plugin's `requires:`    |
| `cli/src/graphify.ts`    | `graphify install` + `hook install` when vwf is installed         |
| `cli/src/version.ts`     | `--version` — the local manifest against the one on `main`        |
| `cli/src/statusline*.ts` | the three statusline surfaces, each with its own receipt          |
| `tools/statusline/`      | the script, its defaults, the caps hook, the OpenCode TUI plugin  |
| `cli/src/**/*.test.ts`   | vitest; `i:test` smoke-tests the **built** bundle, not the source |

> **Working here:** the flag surface, the receipt invariant, the packaging traps
> and every per-tool statusline fact are in `.claude/skills/installer-cli/`,
> which auto-applies while you edit `cli/` or `tools/`.

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

Hooks are authored in each plugin's `hooks/hooks.yaml` as *intent* (`event`,
`matcher`, `action`, `script`) so every renderer emits its own mechanism — for a
`PreToolUse` / `Bash` rewrite, Claude a `hooks.json` with `updatedInput`,
OpenCode a generated JS plugin mutating `output.args`, Cursor and Oh-My-Pi a
deny-with-correction, since neither can rewrite a command.

What ships today: the `typescript` npm→pnpm/bun normalizer, vwf's guarded `rtk`
Bash hook, and vwf's two mempalace auto-save hooks (`stop` + `preCompact`), with
`opencode-plugin/mempalace-autosave.ts` standing in for the one target the shell
hooks skip.

Three rules that bite: hook scripts must be portable to macOS **BSD `sed`** (no
`\s`, no `\b`); **plugin hooks are never written to `settings.json`** — they are
auto-discovered from the rendered `hooks/hooks.json`, so verify them with
`/hooks`; and **a script's verdict shape is decided by its event**, not by
convention. `hookSpecificOutput.permissionDecision` is `PreToolUse`-only —
`Stop` and `PreCompact` deny with the top-level `decision`/`reason`, and Claude
rejects the whole verdict if a `hookSpecificOutput` arrives without a matching
`hookEventName`. That shipped in the mempalace checkpoint hook, where a rejected
verdict reads exactly like a hook that decided to stay quiet.

> Details, including the neutral event vocabulary and why the mempalace hooks
> are reimplemented rather than vendored:
> `.claude/skills/plugin-authoring/references/hooks.md`.

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
default) — which each renderer projects down to its target's spelling. It is
**not cosmetic**: on every target, `user` removes the skill from the model's
context entirely, so a `user` skill **cannot be invoked by another skill**, and
the failure is silent. The rule: **`both`** when anything delegates to it,
**`user`** when nothing does and the user owns the timing, **`model`** for
auto-applying doctrine, paired with `paths:`.

Skill names must also be unique across **all** local plugins, since skills share
one flat namespace on OpenCode and Oh-My-Pi; vwf sets `prefixSkillNames` and
emits `vwf-plan` there.

> The per-skill rulings, the per-target spellings, the `flatSkillName` machinery
> and the Oh-My-Pi one-axis trap are in
> `.claude/skills/plugin-authoring/references/invocation.md`.

## Installation (end-user)

```sh
# Add marketplace once (user-scoped)
claude plugin marketplace add --scope user virajp/ai-plugins

# Install a plugin into a project
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `vwf`, `typescript`, `flutter`, `design-tools`,
`devtools`, `cicd`, `cloudflare`, `gcp`, `datastore`, `identity`,
`observability`, `orchestration`, `object-storage`. Every one of them is
authored here — no name on this list is re-listed from another repo. (The
statusline is not a plugin — install it via `pnpx @askviraj/ai-plugins …`; see
The installer & statusline CLI.)

Installing `vwf` pulls in its dependency (`devtools`) automatically from the
same `virajp-plugins` marketplace — no other marketplace needs to be registered.
`cicd` is **not** among them; install it by name when you want pipelines
generated. `mempalace` is not a name here at all — its memory layer ships inside
`vwf`. See the Dependencies section above.

For **OpenCode** there is no marketplace: install via the CLI's
`--platform opencode` target, which copies each plugin's rendered `opencode/`
tree into `~/.config/opencode/virajp-plugins/` — every plugin here is authored
locally and has one, so nothing is excluded. See The installer & statusline CLI.
