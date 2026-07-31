# CLAUDE.md

## Rules

- ALWAYS ask user before running `i:release` task
- **Docs ship with the change.** Any change to plugin behavior must reconcile
  `readme.md`, this file, and `docs/` in the same commit — stale docs are more
  harmful than no docs

## What This Repo Is

A Claude Code plugin marketplace (`virajp-plugins`) containing LSP servers, an
MCP server, and `vwf` — a full Product → Blueprint → Plan → Execute workflow
plugin (with post-deploy verify + production-feedback intake). The root
`.claude-plugin/marketplace.json` defines the marketplace; each plugin lives in
`plugins/<name>/.claude-plugin/plugin.json`.

The repo also ships a **statusline**, installed via a small `oclif` CLI
(`@askviraj/ai-plugins`) rather than the marketplace — see The installer &
statusline CLI.

Plugins are pure JSON/markdown configuration plus shell scripts (no build step).
The one addition is the statusline CLI: a small plain-JS `oclif` package at the
repo root — also no build step.

The plugins have two test tasks, run **locally via pre-commit** (never in
`release.yml`, which is the installer's):

- **`plugins:check`** — static validation of **every** local plugin under
  `plugins/*`: manifest JSON validity, `plugin.json` `name`↔dir, registration in
  `marketplace.json` with the right `./plugins/<name>` source (both directions),
  `plugin.json`↔marketplace dependency sync, `${CLAUDE_PLUGIN_ROOT}` asset-ref
  resolution, agent `name:`↔filename (for plugins with an `agents/` dir),
  **agent cross-reference resolution** (every role-shaped `` `token` `` in a
  plugin's own prose — the suffix set derived from its own `agents/` dir — names
  a real agent, and every declared agent is referenced at least once; the two
  directions cover each other on a rename), skill frontmatter (`name:`↔dir +
  `description:` + plausible `model:` when pinned), cross-plugin skill-name
  uniqueness (OpenCode installs skills into one flat namespace), `hooks.json`
  validity + script existence/executability, relative links under
  `assets/examples/**`, and the installer sync assertion (`bin/claude.mjs`
  `PLUGINS` ≡ marketplace names, `PROJECT_SCOPED`/`OPT_IN` ⊆ `PLUGINS`,
  `PLUGIN_DEPS` ≡ the marketplace dependency lists). url-sourced entries (e.g.
  `mempalace`) are covered only for JSON validity. Scoped to fire when anything
  under `plugins/` or the marketplace manifest changes.
- **`vwf:test`** — table-tests the `vwf` `npm-to-pnpm.sh` hook through the
  system sed (the BSD-sed portability guarantee); vwf-specific since it is the
  only plugin shipping a hook. Scoped to `plugins/vwf/hooks/`.

Plugin/skill version numbers are **not** cross-checked — they are independent by
design (a plugin may hold skills versioned on their own cadence).

## Plugins

| Plugin                   | Source                     | What it provides                                                                                                                                                                                                                                                                                                            |
| ------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`                    | `./plugins/vwf`            | Skills (slash-invocable workflow skills + auto-applying doctrine skills), subagents, and an npm→pnpm hook                                                                                                                                                                                                                   |
| `markdown`               | `./plugins/markdown`       | Opinionated Markdown/doc-writing skill, path-scoped to `**/*.md` + a `/markdown:readme` skill that scans a repo and writes/updates its README                                                                                                                                                                               |
| `typescript`             | `./plugins/typescript`     | Opinionated Effect-TS skills — a `typescript` router skill (lean SKILL.md → on-demand effect/effect-runtime/vitest/build references, single-package and monorepo) plus `package-json`, `pnpm`, `tsconfig`, `lint-format` + the TypeScript/JavaScript language server (launched via `pnpm dlx`)                              |
| `context7`               | `./plugins/context7`       | Context7 MCP docs server                                                                                                                                                                                                                                                                                                    |
| `claude-design`          | `./plugins/claude-design`  | Claude Design MCP server (Anthropic's remote endpoint `https://api.anthropic.com/v1/design/mcp`); a vwf dep                                                                                                                                                                                                                 |
| `flutter`                | `./plugins/flutter`        | Opinionated Flutter skills — `dart` & `swift` router skills (lean SKILL.md → on-demand topic references) plus `kotlin`, `pubspec`, `analysis-options`, `internationalization` + bundled Dart, Kotlin & Swift (SourceKit) language servers; self-contained (no cross-marketplace deps)                                       |
| `mempalace`              | external (url)             | Re-listed in `virajp-plugins`; AI memory system (vwf dep)                                                                                                                                                                                                                                                                   |
| `andrej-karpathy-skills` | external (url)             | Re-listed in `virajp-plugins`; behavioral guidelines reducing common LLM coding mistakes (Karpathy). **Opt-in** — excluded from installer `--all`, installed only via `--user`/`--project`. Not a vwf dep (the workflow already enforces these pillars)                                                                     |
| `mise`                   | `./plugins/mise`           | Opinionated mise skill (the `.config/` three-file `MISE_ENV` split, tool/env placement, file-based tasks, CI node-gpg workaround) + a `/mise:scaffold` skill                                                                                                                                                                |
| `github-actions`         | `./plugins/github-actions` | A `/github-actions:workflow` skill that generates GitHub Actions workflows installing all tools via `jdx/mise-action` (mise only), supporting both polyrepo and monorepo (detect-and-ask strategy); generates deploy workflows conforming to vwf's delivery-pipeline contract (tag-triggered, branch-validated) — a vwf dep |

## Plugin Structure

Every plugin is a directory under `plugins/` with a
`.claude-plugin/plugin.json`. Minimal form:

```json
{
  "$schema": "https://www.schemastore.org/claude-code-plugin-manifest.json",
  "name": "<plugin-name>"
}
```

Plugins may declare any combination of:

- **`lspServers`** — LSP server definitions keyed by language ID. Each entry
  needs `command`, `args`, `extensionToLanguage`, and optionally
  `startupTimeout`. `plugins/flutter` bundles three — `dart-lsp` (run via
  `mise`) plus `kotlin-lsp` and `sourcekit-lsp` (Swift), which invoke
  system-installed binaries on `PATH`.
- **`mcpServers`** — MCP server definitions. See
  `plugins/context7/.claude-plugin/plugin.json`.
- **`dependencies`** — other plugins this plugin requires (see below); `vwf` is
  the only one that declares them, all resolved within `virajp-plugins` itself.
  `plugins:check` enforces that the `plugin.json` and marketplace-entry
  dependency lists are **identical**. A dependency *may* point at **another
  marketplace** (each entry carries its own `marketplace`), but
  cross-marketplace deps are **blocked at install time** unless the ROOT
  `marketplace.json` allowlists that foreign marketplace via top-level
  `allowCrossMarketplaceDependenciesOn` (not transitive — only the installing
  marketplace's allowlist applies). No plugin here currently uses one, so that
  allowlist is absent; re-add it if a cross-marketplace dependency is
  introduced.

Skills, agents, and hooks are **auto-discovered by directory convention** — they
do not need to be listed in `plugin.json`:

- `skills/<name>/SKILL.md` → skills, invocable as `/<plugin>:<name>` (Claude
  Code's unified skills — a skill with `disable-model-invocation: true` is
  user-only, i.e. exactly a classic slash command). This repo has **no
  `commands/` dirs**: former commands are skills, so one artifact serves both
  Claude Code and OpenCode.
- `agents/<name>.md` → subagents
- `hooks/hooks.json` → hooks (see Hooks below)

The marketplace manifest at `.claude-plugin/marketplace.json` lists each plugin
with its `source`, `version`, `category`, `tags`, and optional `dependencies`.

## The vwf Plugin

`vwf` is the flagship plugin. Its layout under `plugins/vwf/`:

- `skills/` (workflow) — the `/vwf:` workflow skills (each
  `skills/<name>/SKILL.md`), implementing the Product → Blueprint → Plan →
  Execute model. Most are slash- **and** model-invocable
  (`disable-model-invocation: false`) because **other skills delegate to them by
  name**; five are **user-only** (`true`) — see Invocation policy below. **Each
  SKILL.md is the authoritative description of its own behavior**; the table
  below is an index, not a second copy — the previous prose version of it
  drifted twice in a single session before being cut.

  | Skill                | What it does                                                                                                                                                                                                                                                   | Halts / gates                                                                       |
  | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
  | `setup`              | Phase-0 onboarding + migration bootstrapper: detects topology, migrates to the shipped format, stamps `.config/vwf.yaml`                                                                                                                                       | —                                                                                   |
  | `product`            | Phase −1 outcome contract — problem, users, goals (`#goal-<slug>` anchors), slice priority, optional tier matrix                                                                                                                                               | —                                                                                   |
  | `architecture`       | The system shape: writes `registry.yaml` (authoritative) + `architecture.md` (its prose view); stacks go to `.config/vwf.yaml`                                                                                                                                 | —                                                                                   |
  | `design-system`      | **Import-only** — Claude Design authors the design system; this imports it as the offline contract and pins `design.design_system_id`                                                                                                                          | no canvas surface → halt; required once the registry has a UI project               |
  | `blueprint`          | The full-product **flow-first sweep**: works a coverage worklist (incl. `density/` items → `blueprint-condenser`) until whole-product coverage **and** the coherence review hold, then stamps `blueprint.coverage`                                             | halts without `product.md`; halts on a Screens flow with no `design-system.md`      |
  | `mockups`            | Batch re-render of screens into the **gitignored** `docs/scratchpad/` tree — never pushed to Claude Design, never a gate for `plan`                                                                                                                            | —                                                                                   |
  | `screens`            | Two-way canvas sync: `prompt` writes per-platform design briefs (the files *are* the deliverable), `import` diffs designed pages back and routes every accepted delta through `/vwf:blueprint`                                                                 | never edits a flow doc itself                                                       |
  | `plan`               | One slice's desired-vs-actual delta as a cycle plan; resolves the transitive dependency chain and plans each unimplemented dependency as its own plan first                                                                                                    | halts unless `blueprint.coverage: complete`                                         |
  | `execute`            | Runs one approved plan to completion **autonomously** in a dedicated worktree, to **one** final human gate that renders the run journal                                                                                                                        | halts until every `requires:` plan's `covers:` docs read `implementation: complete` |
  | `verify`             | Post-deploy environment check; a clean **production** run offers to freeze each service's OpenAPI contract into `apis/released/`                                                                                                                               | vwf never deploys                                                                   |
  | `feedback`           | Production-feedback front door: classifies bug/hole/metric/UX/idea and routes each into the doc + command that fixes it; `canvas` harvests claude.ai/design review conversations                                                                               | —                                                                                   |
  | `archive`            | Moves completed cycle plans into `docs/plans/archived/`; never deletes                                                                                                                                                                                         | —                                                                                   |
  | `doctor`             | Checks the repo against `.config/vwf.yaml` — per-language LSP + toolchain, frameworks/deps vs each manifest, `repo.stack`, harness task names, health paths, the mempalace wing/room set, format-stamp drift. Reports to room `doctor`; never writes uninvited | never halts — callers decide (`execute` gates on LSP only)                          |
  | `git-workflow`       | Internal: worktree isolation, commits, merges, pushes — every other skill delegates git here                                                                                                                                                                   | —                                                                                   |
  | `handoff` / `recall` | mempalace-backed session handoff; the reserved **`next`** handoff is the argument-less default, is mirrored to `docs/handoffs/next.md`, and `recall next` resumes without a gate                                                                               | —                                                                                   |

  Ordering and what each gate means: **Foundations & ordering** below. The
  execute stage pipeline (`code` → `review` ‖ `security` → `acceptance` + `ux`,
  the convergence guard, the run journal): `assets/execute-stages.md`.
- `agents/` — the subagents the workflow skills delegate to. Delegation is a
  **latency and context strategy as much as a quality one**: read-heavy scans
  and mechanical writing run in a subagent so their file loads never enter the
  orchestrator's context, where every loaded line is re-processed on each later
  turn. Each agent file states its own contract; `plugins:check` verifies these
  names resolve, in both directions.

  | Agent                                        | Role                                                                                                                                                                                                               |
  | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `blueprint-surveyor`                         | The sweep's coverage worklist — walks the bundle against the coverage conditions (incl. standard-flows mandates and `density/` line counts) and returns only the ordered worklist                                  |
  | `flow-writer`, `entity-writer`               | Render the orchestrator's **already-elicited** decisions into format-conformant docs + catalog rows. Never elicit, never invent; report anything unfilled as `UNRESOLVED:`                                         |
  | `blueprint-reviewer`                         | Per-doc completeness gate, two modes (flow / entity), plus the code-independence, vendor-name, and **density** bars                                                                                                |
  | `blueprint-condenser`                        | The density pass — one over-budget doc → a lossless-of-contract rewrite; returns before/after counts, what it could not cut, rationale to persist, questions to park, and any contract hole the cut exposed        |
  | `blueprint-coherence-reviewer`               | End-of-sweep whole-product pass across flows/entities/schemas/APIs; catalog + erDiagram sync; the released-API additive-only diff as a HARD gap. Takes a **scope** (`full`, or sharded `flow-walk` + one `bundle`) |
  | `plan-surveyor`                              | The desired-vs-actual survey — the largest inline read in the workflow; graph-first, returns `PRESENT`/`PARTIAL`/`ABSENT` + reuse candidates as `file:line`, never code                                            |
  | `architecture-writer`                        | Writes `registry.yaml` + `architecture.md`; never sees or records a stack                                                                                                                                          |
  | `mockup-generator`                           | Per-flow: Screens contract + design-system tokens → self-contained HTML into the gitignored scratchpad; returns only a manifest                                                                                    |
  | `execute-coder`                              | The code stage under strict TDD, to the coverage gate                                                                                                                                                              |
  | `execute-code-reviewer`                      | Adversarial review incl. the released-contract compatibility dimension and its `API COMPAT:` line                                                                                                                  |
  | `execute-security-reviewer`                  | Threat-models the diff against the project's declared capabilities                                                                                                                                                 |
  | `execute-acceptance-verifier`                | Independent criteria→E2E mapping + run; also `/vwf:verify`'s environment mode                                                                                                                                      |
  | `execute-ux-reviewer`                        | Renders changed screens (dev server + Playwright), judges against design-system + the Screens contract, axe a11y scan; code-level-only for Flutter                                                                 |
  | `product-reviewer`, `design-system-reviewer` | The completeness gates for their two foundation docs                                                                                                                                                               |

- `skills/` (doctrine, auto-applying — `user-invocable: false` + `paths:`
  scoped) — read automatically when editing the files they govern. Each SKILL.md
  and its references are authoritative:

  | Skill                     | Governs                                                                                                                                                                                                                                                                                                                                                                                                                    |
  | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `blueprint-authoring`     | `docs/blueprint/**` — the contract-vs-realization line, the **density** bars (budgets, the delete test, the anti-patterns), the per-surface completeness bars (flow-contract, entity-contract, api-and-schema-contracts), and the OKF frontmatter/link doctrine. Also `docs/plans/**`, for frontmatter + link hygiene only                                                                                                 |
  | `product-foundations`     | The twelve foundational concerns every product decides (users & operators, observability, audit logs, change logs, background processes, data retention & PII, notifications, runtime settings, rate limiting, reliability targets, disaster recovery, cost guardrails) as **elicited defaults** — walked by `/vwf:architecture` step 3c, expanded by `/vwf:blueprint` into `conventions.md` anchors and per-flow surfaces |
  | `design-system-authoring` | `docs/blueprint/design-system` — tokens, typography, spacing, motion, accessibility, component behaviors/anti-patterns, and terminal-ux (required when a project declares platform `cli`)                                                                                                                                                                                                                                  |
  | `project-setup`           | Onboarding + migration: topology detection incl. the **enforced** workspace shape, the **stack-template menu** (not enforced — `architecture` presents it), harness-capability detection, consent-gated dry-run migration, and the format-version drift map. Used by `/vwf:setup`                                                                                                                                          |
  | `rest-api-design`         | API contract depth — resources, methods, errors, pagination, idempotency, versioning                                                                                                                                                                                                                                                                                                                                       |
- `assets/` — the shared doctrine and data every skill and agent reads. **Each
  file is authoritative for its own subject**; this is a map of which one owns
  what, not a summary of their contents:

  | Asset                                  | Owns                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
  | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `templates/`                           | Every doc skeleton vwf writes: `flow` + `flow-platform`, `flows-index`, `entity` + `entities-index` + `schema.yaml`, `registry.yaml`, `openapi.yaml`, `conventions`, `plan`, `product`, `architecture`, `design-system`, `environment`, `screen-prompt`, `canvas-claude`, `project-claude`, `handoff`. All blueprint markdown opens with the OKF frontmatter block                                                                                           |
  | `examples/blueprint/`                  | The **format-16 conformance bundle** — a worked, format-valid slice where every link resolves, each flow carries Acceptance + sequence diagram + Components blocks + a Guarantees table, every doc sits inside the density budget, and nothing names a vendor. The concrete "what good looks like", link-checked by `plugins:check`                                                                                                                          |
  | `elicitation.md`                       | The shared questioning protocol (one decision per round, **§3a — every question names its scope**: the registry project + `type`, the platform when platform-specific, or "the whole product"; the hard gate before writing, the convergence guard, the **parked-scope rule**)                                                                                                                                                                               |
  | `execute-stages.md`                    | The execute stage pipeline: the stage table + Runs column, per-stage subagent contracts, shared stage rules (model enforcement, loop-on-findings, the **convergence guard**), the **run journal** shape, and the end-of-run reconcile                                                                                                                                                                                                                        |
  | `capability-vocabulary.md`             | The stack-agnostic capability tokens **and** the prose-noun mapping (`document-datastore` → "the datastore") every blueprint doc writes against                                                                                                                                                                                                                                                                                                              |
  | `engineering-baseline.md`              | The **15 centralized technical rules** every product follows by default — enforced, never elicited; seeded into `conventions.md#baseline`, waived only via `enforcement.rules`                                                                                                                                                                                                                                                                               |
  | `delivery-pipeline.md`                 | The canonical environment vocabulary (`development`/`staging`/`production`) + CI/CD contract (mise-built, tag-triggered, branch-validated). Read by `blueprint`, `verify`, and the **github-actions** plugin                                                                                                                                                                                                                                                 |
  | `standard-flows.md`                    | The canonical flow-slug vocabulary per project type, the designated numbers, the auth-capability signal, and the synonym table (rename proposals, never automatic)                                                                                                                                                                                                                                                                                           |
  | `canvas-push.md`                       | The shared claude.ai/design push protocol — used by `design-system` and `screens`, **never** by `mockups` (which renders only into the gitignored scratchpad)                                                                                                                                                                                                                                                                                                |
  | `vwf-config.md`                        | The `.config/vwf.yaml` doctrine (currently `config_format` **11**): stamp keys, the coverage stamp, per-project nuances **and the structured `stack` block**, the repo-level `repo.stack`, `harness:`, `enforcement:`, bounded `pipeline` knobs, `verify` environments, the `design:` pins, and the hard floor config can never disable                                                                                                                      |
  | `harness.md`                           | The harness contract — the verification capabilities a repo must be able to run (`dev`, `e2e_local`, `local_stack`, `e2e_staging`, `health`, `screenshots`) and their canonical task names                                                                                                                                                                                                                                                                   |
  | `stacks/<type>/<slug>.md`              | The **stack template menu** — one file per variant, frontmatter carrying the four axes + prose carrying that variant's layout/testing/deploy conventions. Plus `stacks/repo/` for repo-level tooling. A menu, not a default: `architecture` presents it and the user picks. Adding an option means adding a file                                                                                                                                             |
  | `stack-vocabulary.md`                  | The **closed language vocabulary** and its per-language facts (LSP plugin, manifest, mise tool) that `doctor` checks against; the template frontmatter contract; why frameworks/dependencies stay open                                                                                                                                                                                                                                                       |
  | `memory.md`                            | The mempalace protocol: the **closed seven-room set** (`decisions`/`problems`/`planning`/`gaps`/`runs`/`doctor`/`handoff`), recall before work, persist decisions, findings memory for loop-backs, **gap memory**, and the per-repo **`mempalace.yaml`** contract (one wing per product, all seven rooms seeded, the first-match routing trap). `/vwf:doctor` §7 is what enforces it — a mistyped room name never errors, it just empties every later recall |
  | `graphify.md`                          | The code-intelligence protocol — graph-first for codebase questions, file reads as verification. Absence never blocks; only `setup` builds a graph                                                                                                                                                                                                                                                                                                           |
  | `docs-sync.md`                         | The docs-ship-with-the-change rule for runs that change reality (`execute`, `architecture`/`product` update mode). `blueprint`/`plan` are exempt — they document intent                                                                                                                                                                                                                                                                                      |
  | `format-check.md` + `blueprint-format` | The format-drift preflight: compare the repo's stamp to the shipped integer (**16**) and nudge `/vwf:setup`. Since vwf is user-scoped, this usage-time check is what reaches each repo                                                                                                                                                                                                                                                                       |
  | `minimalism.md`                        | The Ponytail decision ladder — what gets **built** (scope). Prose density is a separate bar, in the blueprint-authoring skill                                                                                                                                                                                                                                                                                                                                |
- `hooks/` — `hooks.json` + `npm-to-pnpm.sh`

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
block); a non-UI flow is `index.md` alone. Numbers are **designated** — `100` is
always `home`, `010` splash / `020` signin / `030` recover-account / `040`
onboarding, `110`–`890` product flows, `910`–`940` the account screens — on one
number line per project. `flows/index.md` is the catalog (per-project sections,
numeric order, a Platforms column) + inter-service contracts; **one entity
folder per entity** — `entities/<entity>/` holding exactly `index.md` +
`schema.yaml` — with `entities/index.md` the catalog + product-wide erDiagram;
and the API contracts `apis/<project>.openapi.yaml` + the frozen
`apis/released/` snapshots; the blueprint root holds only the system docs),
`docs/plans/` (`<date>-<time>-<slice>.md`, with `archived/`), and
`docs/prompts/` (`<type>/<project>/<NNN>-<flow>/<platform>.md` — canvas design
briefs grouped by prompt type → registry project → flow, one brief per platform
regenerated in place (the filename carries the platform, mirroring the flows
tree exactly), plus the per-design-project canvas conventions files
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
(currently **16**); the authoritative `N → N+1` migration deltas live in the
project-setup skill's `format-versioning` reference, and `/vwf:setup` migrates
stale repos on next use. **That reference is the single source — do not restate
the per-format history here.** What each past format changed is git's job and
`format-versioning`'s; a second narrative copy is precisely the drift the
density doctrine warns about, and it was 105 lines of this file before
format 16. The *current* shape is what this section describes throughout; the
paired `config_format` (currently **11**) is described under
`assets/vwf-config.md`.

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
project** (type `site`, `frontend`, or `console`): `blueprint` halts on a flow
with a Screens surface if `docs/blueprint/design-system.md` is missing.
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

`vwf` depends on `claude-design`, `context7`, `github-actions`, `markdown`,
`mempalace`, and `mise` — **all resolved from the `virajp-plugins` marketplace
itself**, so installing `vwf` needs no other marketplace registered.
`claude-design`, `context7`, `github-actions`, `markdown`, and `mise` are
authored here; `mempalace` is not — it is **re-listed** in
`.claude-plugin/marketplace.json` via a `url` source (pointing at its upstream
repo) so it lives under `virajp-plugins`.

The dependency list is declared in **two** places, which must stay in sync —
both reference `@virajp-plugins` for every entry (the `plugins:check` task
enforces this):

- `plugins/vwf/.claude-plugin/plugin.json` → `claude-design`, `context7`,
  `github-actions`, `markdown`, `mempalace`, `mise`
- `.claude-plugin/marketplace.json` (vwf entry) → `claude-design`, `context7`,
  `github-actions`, `markdown`, `mempalace`, `mise`

When `vwf` is enabled, Claude Code (≥ 2.1.143) **auto-installs and
auto-enables** these dependencies at the same scope. Key rules:

- **Keep both dependency lists in sync.** A new dep must be added to both
  `plugin.json` and the vwf entry in `marketplace.json`, and (if external)
  re-listed as its own `url`-sourced plugin in `marketplace.json` so it resolves
  within `virajp-plugins`.
- **Auto-enable is event-driven**, firing only when the parent (`vwf`) is
  enabled — not on a continuous reconcile. If a dependency is later disabled on
  its own, re-enable it directly or toggle `vwf` off/on.

## The installer & statusline CLI

The statusline is **not** a Claude Code plugin — it is an `oclif` CLI published
as `@askviraj/ai-plugins` that installs the toolkit for **Claude Code and/or
OpenCode** (plugins, OpenCode-rendered skills, and the powerline statusline).
Layout:

- `tools/statusline/statusline` — the executable Node script (node shebang).
  Drives **both** surfaces from one file: a stdin payload with a `tasks` array
  renders the subagent panel, anything else the main two-line bar.
- `tools/statusline/statusline.json` — the bundled default config (every
  constant: palette, powerline glyphs, symbols, per-segment styling, line
  layout, subagent panel). The installer seeds this into
  `~/.config/statusline.json`.
- `package.json` (root) — the npm package: oclif single-command CLI, `bin`
  `ai-plugins`, sole runtime dep `@oclif/core`. Plain JS (ESM) — no build step.
  The package `type` stays `commonjs`: the `bin/` modules are ESM by their
  `.mjs` extension, while the standalone `tools/statusline/` scripts (run
  outside this package, with no package.json beside them) must remain CommonJS —
  so the ESM/CJS split is carried per-file, not by a package-wide
  `type: module`.
- `bin/installer.mjs` — the CLI entrypoint: the oclif command class plus the
  bootstrap that runs it (single-command `strategy`/`target` in `package.json`;
  `settings.enableAutoTranspile = false` keeps oclif from hunting for
  TypeScript). It dispatches to one **tool module per platform** —
  `bin/claude.mjs` (the `ClaudeCode` tool) and `bin/opencode.mjs` (the
  `OpenCode` tool), both exposing the same surface
  (`resolvePlan`/`hasSelection`/`install`/`upgrade`/`uninstall`/`printVersions`)
  — plus `bin/utils.mjs` (shared helpers). `--platform claude|opencode`
  (repeatable) selects targets; omitted, every platform whose binary is on
  `PATH` is targeted. The run-directly guard uses
  `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` (the ESM
  equivalent of `require.main === module`, symlink-safe for the npm bin).
- `bin/opencode.mjs` — the OpenCode target. OpenCode has no plugin/marketplace
  concept, so install = **render**: fetch the repo source (GitHub `main`
  tarball; `AI_PLUGINS_SOURCE_DIR` — a local checkout — overrides for
  tests/dev), copy each selected plugin's `skills/` + `assets/` into
  `<configDir>/virajp-plugins/<plugin>/` (`--user` → `~/.config/opencode/`,
  `--project` → `.opencode/`; agents/hooks are Claude-only, skipped), rewrite
  every `${CLAUDE_PLUGIN_ROOT}` to the installed absolute path, stamp `.version`
  from the source marketplace manifest, **segregate workflow skills** (each
  `disable-model-invocation` skill moves to `commands/<name>/index.md`, outside
  the `**/SKILL.md` discovery — the model never auto-invokes them, mirroring
  Claude's user-only semantics; doctrine skills stay under `skills/`), append
  the `virajp-plugins` dir to `skills.paths` in the OpenCode config (targeted
  array append; foreign keys preserved), map the plugin's `lspServers` onto the
  config's `lsp` key (`LSP_ID_MAP` — overrides of OpenCode's built-in ids with
  the plugins' mise-provisioned launchers, stamped per plugin as `.lsp.json` so
  uninstall removes exactly what was written and never a user-modified entry),
  write a **command wrapper** `command/<plugin>-<skill>.md` per
  `disable-model-invocation` skill (OpenCode has no user-invoked skills), and
  write each plugin's MCP server (`MCP_ENTRIES`: context7 via `pnpm dlx`,
  mempalace via `mise x -- mempalace-mcp`, claude-design as a `remote` entry
  pointing at Anthropic's endpoint) to the config's `mcp` key. **Upstream
  plugins** (`UPSTREAM`): mempalace installs from its own repo (tarball;
  `AI_PLUGINS_UPSTREAM_DIR` overrides for tests) — its repo root is the plugin
  root (skills/ + integrations/ copied, versioned by its plugin.json), and its
  Claude hooks are replaced by the bundled `tools/opencode/mempalace-hooks.js`,
  copied to `<configDir>/plugin/` — an OpenCode plugin that injects a MemPalace
  save-checkpoint prompt every 15 user messages (`session.idle`) and after
  compaction (`session.compacted`), honoring mempalace's auto-save opt-out.
  **Config file:** edits target an existing `opencode.jsonc` first (OpenCode
  merges all config names, jsonc wins), else an existing `opencode.json`; a new
  file is created as `opencode.jsonc`. All names are read JSONC-tolerantly, and
  a config with comments is only rewritten after confirmation (or `--yes`) since
  a rewrite drops them. **Dependencies** expand at plan time from `PLUGIN_DEPS`
  in `claude.mjs` (kept ≡ the marketplace lists by `plugins:check`; Claude Code
  auto-installs them natively) — installs only, uninstall never removes an
  unnamed dependency. **User-level-only:** `USER_ONLY` plugins (mempalace) are
  pinned to user scope — a `--project` request or project-scoped dep expansion
  redirects them (with a note). A vwf install wires **graphify at user level
  only**: the CLI is run with a throwaway cwd (its user-level skills land in
  `~/.config/opencode/skills/graphify/`), and the project-level `graphify.js` it
  generates is harvested into the GLOBAL `plugin/` dir — no project writes, no
  `plugin`-array entry (the dir is auto-discovered). url-sourced plugins
  **without** `UPSTREAM` support (andrej-karpathy-skills) are filtered from
  `--all`, rejected when named, and skipped (with a note) as dependencies.
  `--uninstall`/`--upgrade`/`--version` mirror all of this via the `.version`
  stamps.
- `tools/statusline/context-caps.js` — the context/rate-limit caps `PostToolUse`
  hook, bundled with the main `statusLine` install (see Statusline below).
- `test/` — `node --test` suites run by `i:test` (and thus in `release.yml`):
  `utils.test.mjs` (cmpVer/cmpPre/deepMerge incl. prototype-pollution keys),
  `statusline.test.mjs` (hermetic smoke tests for both render surfaces + the
  usage-file contract `context-caps.js` reads), `claude.test.mjs` (pure
  `resolvePlan` cases — plugin selection/scope and the `--all` ⇒ statusline
  implication with its `--no-statusline` opt-out), and `opencode.test.mjs`
  (hermetic OpenCode installs into a temp `$HOME` with
  `AI_PLUGINS_SOURCE_DIR=<checkout>`: render/rewrite, wrapper emission, config
  idempotency + foreign-key preservation, uninstall symmetry). Not shipped in
  the npm package (`files` is `bin` + `tools`).

The command does several jobs. **Plugins:** `--all` (every user-scoped plugin,
at user scope) or `--user <name>` / `--project <name>` (repeatable; name plugins
at user or project scope) drive the `claude` CLI to add the `virajp-plugins`
marketplace (user scope) and install each plugin. `--all` installs **user-scoped
plugins only** (`USER_SCOPED`); **project-scoped** plugins (`flutter` —
`PROJECT_SCOPED`) and **opt-in** plugins (`andrej-karpathy-skills` — `OPT_IN`,
an external re-listed plugin) are both excluded from `--all`. Project-scoped
plugins are reached via `--project <name>`; opt-in plugins via
`--user`/`--project
<name>` at whichever scope you choose (they carry no forced
default). Scope is carried by the flag itself — `--user` installs at user scope,
`--project` at project scope, and the two compose in one run (a name cannot
appear in both). This governs install and uninstall alike, but never the
marketplace add (always user scope). Plugin names are **bare and allowlisted**
(`PLUGINS`); an `@marketplace` or path qualifier is rejected outright so the CLI
can only ever install from `virajp-plugins`. The CLI installs and refreshes
**only** `virajp-plugins`; every plugin (including the bundled Dart/Kotlin/Swift
language servers, which ship inside `flutter`) resolves from it alone — no other
marketplace is registered or refreshed. Installing or upgrading **`vwf`**
additionally runs `setupGraphify` — `graphify install --platform claude` plus
`graphify hook install` — since vwf's commands depend on graphify's knowledge
graph. `graphify install` works anywhere and always runs;
`graphify hook
install` attaches a git post-commit hook, so it runs **only
inside a git repo** (detected via `git rev-parse --is-inside-work-tree`) and is
soft-skipped with a note otherwise. Both commands are idempotent (so an upgrade
self-heals the setup), and the whole step is soft-skipped when `graphify` isn't
on `PATH` (the `checkDeps` gate guarantees it for installs, but the upgrade-only
path does not run that gate). **Statusline:** `--statusline` — one merged flag
that installs **both** the main bar `statusLine` and the subagent panel
`subagentStatusLine` — copies the script into `~/.claude/scripts/` (chmod 755),
seeds the bundled defaults into `~/.config/statusline.json` (deep-merging
missing settings if it already exists, preserving user edits), and writes both
keys into `~/.claude/settings.json` (preserving other keys; prompting before
overwrite unless `--yes`). The flag is **tri-state** (`allowNo`): `--statusline`
asks for it, `--no-statusline` refuses it, and an unset flag defers to `--all` —
which means the whole toolkit, so a bare `--all` installs the bar too (and
`--uninstall --all` removes it). Only an **explicit** `--statusline` on an
opencode-only run prints the Claude-only skip note. Installing the statusline
additionally wires the **context/rate-limit caps** `PostToolUse` hook
(`installContextCaps`): it copies `tools/statusline/context-caps.js` into
`~/.claude/hooks/`, sets `env.AI_PLUGINS_USAGE_DIR` (`${HOME}/.claude/usage`),
and appends the hook entry (idempotently, preserving other env keys /
PostToolUse hooks). The statusline's `writeUsageFile` mirrors each session's
`context_window`/`rate_limits` to that dir — the only surface those numbers
appear on — and the hook reads them and, at the caps (context over 65%, 5-hour
over 90%, 7-day over 80%), tells the agent to run a bare `/vwf:handoff` (the
reserved `next` handoff) then halt, resuming via `/vwf:recall next`. It is
bundled with the `statusLine` key (not the subagent panel) because that main-bar
writer is its sensor, and is inert until the bar runs. **Versions:**
`--version`/`-v` prints the CLI version (vs the latest on npm), the bundled
statusline version, and each plugin's installed version (from
`claude plugin list`) vs the latest in the **remote** marketplace manifest on
GitHub (`REMOTE_MARKETPLACE_URL`), flagging updates. **Upgrade:** `--upgrade`
runs **after** any install phase — it `claude plugin update`s every installed
virajp-plugins plugin that's outdated, refreshes the statusline, and notes a
newer CLI; combine with `--all` for an idempotent install+upgrade fit for a
setup script. `--version`/`--upgrade` need the network and `claude`, and error
out (non-zero) if either is unavailable. **Uninstall:** `--uninstall` reuses the
same selection flags but removes — `claude plugin uninstall`s the selected
plugins (matching their install scope) and/or strips the statusline keys from
`settings.json`, deleting the installed script once no statusline key remains.
Uninstalling the statusline also runs `uninstallContextCaps` — it strips the
caps hook entry and `AI_PLUGINS_USAGE_DIR` from `settings.json` and deletes
`~/.claude/hooks/context-caps.js` (leaving other hooks/env keys intact). It
leaves the seeded `~/.config/statusline.json` (it may hold user edits) and never
touches external tools (the CLI never installed those).

Before any install, the CLI **checks required external tools** for the resolved
plan: `CORE_DEPS` (just `claude` — the install mechanism) for any plugin
install, plus each selected plugin's `PLUGIN_EXTRA_DEPS` runtime tools
(vwf→rtk+graphify+ mise+pnpm+uv, context7→pnpm, typescript→mise+pnpm, mise→mise,
flutter→mise+kotlin-lsp+ sourcekit-lsp, mempalace→uv, github-actions→mise) and
`node` for the statusline. If any are missing it prints the install command for
each (`DEP_HINTS`) and exits non-zero — it never auto-installs a dependency.
Keep `PLUGINS`, `PROJECT_SCOPED`, `OPT_IN`, `DEP_HINTS`, `CORE_DEPS`, and
`PLUGIN_EXTRA_DEPS` in sync with the marketplace and the plugins' actual runtime
needs (`plugins:check` asserts the `PLUGINS`↔marketplace name sync). Users run
it via `npx @askviraj/ai-plugins …`.

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

- **`release.yml`** — publishes `@askviraj/ai-plugins` to npm via **OIDC trusted
  publishing** (no stored token, provenance automatic). Triggered three ways: a
  pushed `v*` tag, `workflow_dispatch`, or **`workflow_call`** (invoked by
  `deps-update.yml`). It sets up mise (`MISE_ENV=ci`), checks out the target ref
  (the `ref` input when called, else the triggering ref), verifies the tag
  matches `package.json` (tag pushes only), `pnpm install --frozen-lockfile`,
  **osv-scans** the lockfile, **runs the tests** (`mise run i:test`), verifies
  the package (`mise run i:build`), then `npm publish`. The publish step is
  **idempotent** — it skips (does not fail) if that version is already on npm,
  so tag re-points, dispatch retries, and re-runs are safe. **Publishing uses
  the npm CLI; everything else stays pnpm.** The local `i:publish` task mirrors
  the gates + `npm publish`.
- **`deps-update.yml`** — monthly cron (+ manual dispatch): `pnpm update`
  (bounded by the cooldown below); if anything changed, `osv-scanner` gates on
  any known-vulnerable package, then it cuts a **patch release**
  (`mise run i:release --ci` → tests + bump + commit + tag, no push/watch) and
  pushes the refresh + bump + tag to `main`. It then **delegates the npm publish
  to `release.yml` via `workflow_call`** (passing the new tag as `ref`) rather
  than publishing inline: npm allows only **one Trusted Publisher per package**,
  and OIDC's `job_workflow_ref` resolves to `release.yml` even when called — so
  the single `release.yml` Trusted Publisher authorizes this path too. (A tag
  pushed with the workflow's `GITHUB_TOKEN` would not trigger `release.yml` on
  its own, so it is called directly.)

### Supply-chain settings

`pnpm-workspace.yaml` sets **`minimumReleaseAge`** (a publish cooldown, in
minutes) so neither installs nor the monthly update adopt brand-new —
potentially compromised — releases.

### One-time manual setup (not automatable here)

- On **npmjs.com**, add this repo + `release.yml` as the **Trusted Publisher**
  for `@askviraj/ai-plugins` (enables OIDC). The workflow-filename field takes a
  **single file** and a package has **exactly one** Trusted Publisher — set it
  to `release.yml` only (not a comma-separated list, and not `deps-update.yml`,
  which publishes *through* `release.yml`). A mismatch surfaces only at publish
  time as `ENEEDAUTH`. Until configured, `release.yml` cannot publish.
- To cut a release: run **`mise run i:release`** (`--minor`/`--major` to choose
  the bump) — it requires a clean tree, runs the tests, bumps the version,
  commits, and creates the `vX.Y.Z` tag, then (interactively) **pushes the
  commit and tag and watches the `release.yml` run to completion**
  (`gh run watch
  --exit-status`), so the task only succeeds if the npm-publish
  pipeline does (needs `gh` installed + authenticated). **Passing `--ci` stops
  after the tag** (no push/watch) — `deps-update.yml` passes it and does its own
  push + `workflow_call` publish. Prefer releasing via CI over local `i:publish`
  so every version keeps the strongest npm trust level (trusted publisher).

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

`vwf` ships two `PreToolUse` / `Bash` hooks (declared in `hooks/hooks.json`):

- `hooks/npm-to-pnpm.sh` — rewrites `npm`/`npx` commands to `pnpm`.
- `rtk hook claude` — requires the `rtk` CLI on `PATH`, installed out-of-band
  via `brew install --formulae rtk`. Plugin install does **not** provide it;
  document it as a prerequisite.

Things to know when editing hooks here:

- **Plugin hooks are never written to `settings.json`.** They are
  auto-discovered from `hooks/hooks.json` and loaded in-memory at session start.
  Verify active hooks with `/hooks`, not by inspecting `settings.json`.
- **Hook scripts must be portable to macOS BSD `sed`.** BSD `sed` does not
  support `\s` or `\b` — use POSIX classes (`[[:space:]]`) and explicit
  boundaries instead. `npm-to-pnpm.sh` follows this.

## Adding a Plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json` with only the fields the
   plugin needs.
2. Register it in `.claude-plugin/marketplace.json` under `plugins[]` with a
   `version` (the marketplace `version` is what end-user installs pin to — bump
   it to ship changes).

## Adding a vwf Skill

Create `plugins/vwf/skills/<name>/SKILL.md` — no other registration is needed
(auto-discovered). For auto-applying doctrine, set `user-invocable: false` +
`paths:` scoping. Skill names must be unique across **all** local plugins
(`plugins:check` enforces this — OpenCode installs them into one flat
namespace). Then pick the invocation mode per the policy below.

### Invocation policy

`disable-model-invocation: true` does **not** merely stop Claude auto-triggering
a skill — it *"removes the skill from Claude's context entirely"* and *"blocks
programmatic invocation"* (Claude Code docs, Control who invokes a skill). A
skill flipped to `true` **cannot be invoked by another skill**, and the failure
is silent: the delegating skill simply can't see it.

That makes the vwf mesh the deciding constraint — every workflow skill is
delegated to by name somewhere. The rule:

- **`false` (model-invocable) when anything delegates to it.** `git-workflow`
  (every skill commits through it), `blueprint` / `plan` / `execute`
  (`/vwf:recall` routes its continuation through all three — resuming a
  cap-paused run is recall's primary use), `product` / `architecture` /
  `design-system` / `doctor` (`setup` orchestrates them), `handoff` (`execute`
  runs it at a resource cap, and the statusline caps hook instructs it),
  `feedback` (`verify` routes failures through it), `screens` (`feedback canvas`
  routes into it).
- **`true` (user-only) when nothing does**, and the user owns the timing:
  `setup`, `verify`, `mockups`, `archive`, `recall`. Every reference to these
  from another skill must read as a **recommendation to the user**, never an
  invocation — `execute` tells the user to run `/vwf:archive`, it does not call
  it.

Before flipping a skill to `true`, grep for `/vwf:<name>` across
`plugins/vwf/skills/` and `plugins/vwf/agents/` and confirm every hit is prose
addressed to the user. Adding a delegation to a user-only skill is the reverse
trap: it will never fire.

This applies across plugins too — `mise:scaffold` and `markdown:readme` are
`false` **because `/vwf:setup` orchestrates them**, per its own "orchestrate,
don't reimplement" rule. `github-actions:workflow` stays `true`: nothing
delegates to it.

## Installation (end-user)

```sh
# Add marketplace once (user-scoped)
claude plugin marketplace add --scope user virajp/ai-plugins

# Install a plugin into a project
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `vwf`, `markdown`, `typescript`, `flutter`, `mempalace`,
`claude-design`, `context7`, `mise`, `github-actions`, `andrej-karpathy-skills`
(external, opt-in). (The statusline is not a plugin — install it via
`npx @askviraj/ai-plugins …`; see The installer & statusline CLI.)

Installing `vwf` pulls in its dependencies (`claude-design`, `context7`,
`github-actions`, `markdown`, `mempalace`, `mise`) automatically from the same
`virajp-plugins` marketplace — no other marketplace needs to be registered. See
the Dependencies section above.

For **OpenCode** there is no marketplace: install via the CLI's
`--platform opencode` target, which renders each plugin's skills into
`~/.config/opencode/virajp-plugins/` (url-sourced plugins excluded) — see The
installer & statusline CLI.
