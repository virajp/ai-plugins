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
(`@askviraj/ai-plugins`) rather than the marketplace — see The statusline CLI.

Plugins are pure JSON/markdown configuration plus shell scripts (no build step).
The one addition is the statusline CLI: a small plain-JS `oclif` package at the
repo root — also no build step.

The plugins have two test tasks, run **locally via pre-commit** (never in
`release.yml`, which is the installer's):

- **`plugins:check`** — static validation of **every** local plugin under
  `plugins/*`: manifest JSON validity, `plugin.json` `name`↔dir, registration in
  `marketplace.json` with the right `./plugins/<name>` source (both directions),
  `plugin.json`↔marketplace dependency sync, `${CLAUDE_PLUGIN_ROOT}` asset-ref
  resolution, agent `name:`↔filename (for plugins with an `agents/` dir), skill
  frontmatter (`name:`↔dir + `description:`), command frontmatter
  (`description:`, plausible `model:`), `hooks.json` validity + script
  existence/executability, relative links under `assets/examples/**`, and the
  installer sync assertion (`bin/claude.mjs` `PLUGINS` ≡ marketplace names,
  `PROJECT_SCOPED`/`OPT_IN` ⊆ `PLUGINS`). url-sourced entries (e.g. `mempalace`)
  are covered only for JSON validity. Scoped to fire when anything under
  `plugins/` or the marketplace manifest changes.
- **`vwf:test`** — table-tests the `vwf` `npm-to-pnpm.sh` hook through the
  system sed (the BSD-sed portability guarantee); vwf-specific since it is the
  only plugin shipping a hook. Scoped to `plugins/vwf/hooks/`.

Plugin/skill version numbers are **not** cross-checked — they are independent by
design (a plugin may hold skills versioned on their own cadence).

## Plugins

| Plugin                   | Source                     | What it provides                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`                    | `./plugins/vwf`            | Commands, subagents, skills, and an npm→pnpm hook                                                                                                                                                                                                                                              |
| `markdown`               | `./plugins/markdown`       | Opinionated Markdown/doc-writing skill, path-scoped to `**/*.md` + a `/markdown:readme` command that scans a repo and writes/updates its README                                                                                                                                                |
| `typescript`             | `./plugins/typescript`     | Opinionated Effect-TS skills — a `typescript` router skill (lean SKILL.md → on-demand effect/effect-runtime/vitest/build references, single-package and monorepo) plus `package-json`, `pnpm`, `tsconfig`, `lint-format` + the TypeScript/JavaScript language server (launched via `pnpm dlx`) |
| `context7`               | `./plugins/context7`       | Context7 MCP docs server                                                                                                                                                                                                                                                                       |
| `flutter`                | `./plugins/flutter`        | Opinionated Flutter skills — `dart` & `swift` router skills (lean SKILL.md → on-demand topic references) plus `kotlin`, `pubspec`, `analysis-options`, `internationalization` + bundled Dart, Kotlin & Swift (SourceKit) language servers; self-contained (no cross-marketplace deps)          |
| `mempalace`              | external (url)             | Re-listed in `virajp-plugins`; AI memory system (vwf dep)                                                                                                                                                                                                                                      |
| `andrej-karpathy-skills` | external (url)             | Re-listed in `virajp-plugins`; behavioral guidelines reducing common LLM coding mistakes (Karpathy). **Opt-in** — excluded from installer `--all`, installed only via `--user`/`--project`. Not a vwf dep (the workflow already enforces these pillars)                                        |
| `mise`                   | `./plugins/mise`           | Opinionated mise skill (the `.config/` three-file `MISE_ENV` split, tool/env placement, file-based tasks, CI node-gpg workaround) + a `/mise:scaffold` command                                                                                                                                 |
| `github-actions`         | `./plugins/github-actions` | A `/github-actions:workflow` command that generates GitHub Actions workflows installing all tools via `jdx/mise-action` (mise only), supporting both polyrepo and monorepo (detect-and-ask strategy)                                                                                           |

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
  `startupTimeout`. `plugins/flutter` bundles three — `dart` (run via `mise`)
  plus `kotlin-lsp` and `sourcekit-lsp` (Swift), which invoke system-installed
  binaries on `PATH`.
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

Skills, commands, agents, and hooks are **auto-discovered by directory
convention** — they do not need to be listed in `plugin.json`:

- `commands/<name>.md` → `/<plugin>:<name>` slash commands
- `skills/<name>/SKILL.md` → skills
- `agents/<name>.md` → subagents
- `hooks/hooks.json` → hooks (see Hooks below)

The marketplace manifest at `.claude-plugin/marketplace.json` lists each plugin
with its `source`, `version`, `category`, `tags`, and optional `dependencies`.

## The vwf Plugin

`vwf` is the flagship plugin. Its layout under `plugins/vwf/`:

- `commands/` — `/vwf:` slash commands: the Product → Blueprint → Plan → Execute
  model — `setup` (Phase-0 onboarding/migration bootstrapper; ends by offering
  `/vwf:blueprint`), `product` (the Phase −1 outcome contract:
  problem/users/goals with `#goal-<slug>` anchors/slice priority; `blueprint`
  halts without it), `architecture`, `design-system`, `blueprint` (a
  **full-product sweep** — a run works a coverage worklist entity by entity
  until whole-product coverage holds, then stamps `blueprint.coverage` in
  `.config/vwf.yaml` and offers `/vwf:plan`), `mockups` (optional
  post-blueprint: renders each entity's Screens contract as self-contained
  static HTML from design-system tokens — via per-entity `mockup-generator`
  subagents into an ephemeral build dir, never committed — and pushes them to a
  claude.ai/design design-system project through the harness DesignSync tool
  behind an explicit approval gate; pins `mockups.project_id` in
  `.config/vwf.yaml`; never a gate for `plan`), `plan` (halts unless that stamp
  is `complete`; pulls the slice's **transitive dependency closure** — any
  depended-on entity's unimplemented delta — into the plan as leading steps;
  **routes blueprint gaps back through `/vwf:blueprint` before writing** — a
  *what*-level hole the diff exposes is fixed in the contract, never settled in
  the plan or parked as a risk, so execute never trips on an open decision; the
  approval gate offers Approve & execute), `execute`, `archive`, `verify`
  (post-deploy environment check: health pass + the flows' acceptance criteria
  run against staging/prod via the acceptance verifier's environment mode — vwf
  never deploys), `feedback` (the production-feedback front door: classifies
  bug/hole/metric-reading/UX/feature-idea and routes each into the doc+command
  that fixes it, incl. the `product.md` Metric readings appendix), internal
  `git-workflow`, and `handoff`/`recall` (mempalace-backed session handoff —
  wing=`<project>`, room=`handoff`, drawer=`<name>`). `execute` runs one
  approved plan to completion **autonomously** in a dedicated worktree:
  dependency-ordered steps, `code→review→security` per step (security findings
  always fixed; review findings loop ≤4 rounds then become documented gaps) plus
  one `acceptance + ux` pass after all steps (same 4-round cap), gaps mirrored
  to the plan doc's "Gaps surfaced during execution" section + mempalace room
  `gaps`, mid-run pauses only on hard halts, the statusline resource caps, an
  all-blocking gap, or an uncovered irreversible decision — then **one final
  human gate** (run report + gap list) behind which the merge/push happens, gap
  reconciliation is offered (blueprint/plan loop-backs), and archive is offered
  once no gaps remain. (The former `autopilot` command is merged into this
  behavior and retired.)
- `agents/` — subagents the commands delegate to: `blueprint-reviewer`,
  `design-system-reviewer`, `product-reviewer`, `execute-coder`,
  `execute-code-reviewer`, `execute-security-reviewer`,
  `execute-acceptance-verifier` (independent criteria→E2E-test mapping + run;
  also `/vwf:verify`'s environment mode), `execute-ux-reviewer` (renders changed
  screens via dev server + Playwright screenshots, judges against
  design-system + Screens contract, axe a11y scan; code-level-only for Flutter),
  `architecture-writer`, `mockup-generator` (per-entity: Screens contract +
  design-system tokens → self-contained HTML mockups in a scratch build dir,
  returns only a manifest)
- `skills/` — `rest-api-design`; `product-foundations` (the nine foundational
  concerns every product decides — users & operators, observability
  (OTel→Grafana), audit logs (privileged+destructive baseline), change logs
  (Keep-a-Changelog→fastlane), background processes (sync/async +
  worker-vs-service placement, ask only on ambiguity), data retention & PII,
  notifications, runtime settings, rate limiting — **elicited defaults**
  distilled from 95octane: `/vwf:architecture` walks the checklist in step 3c
  (accept/adapt/skip → `cross_cutting` tokens), `/vwf:blueprint` expands
  accepted ones into `conventions.md` anchors + per-entity surfaces, execute's
  docs-sync drafts app changelog entries; realizations live in
  `assets/stacks/`); `blueprint-authoring` (the contract-vs-realization
  doctrine + per-surface completeness bars — incl. the per-flow Acceptance block
  **and sequence diagram**, the lifecycle state-diagram bar, and the entity
  `Serves:` goal edge — + the doc-unit doctrine, auto-applies on
  `docs/blueprint/**` and — for frontmatter/link hygiene only —
  `docs/plans/**`); `design-system` (the UX/visual-contract doctrine — tokens,
  typography, spacing, motion, accessibility, components/anti-patterns —
  auto-applies on `docs/blueprint/design-system`); `project-setup`
  (onboarding/migration doctrine — topology detection incl. the **enforced**
  workspace shape (parent repo + backend/frontend submodules: applied for
  new/empty repos, proposed as a consent-gated restructure for non-conforming
  existing ones) and the **enforced reference stacks** (fixed per project type,
  one stack doc each under `assets/stacks/`; explicit opt-outs recorded under
  `enforcement:` in `.config/vwf.yaml`, never re-asked), harness-capability
  detection (per the harness contract, stamped in `.config/vwf.yaml`),
  consent-gated dry-run migration, the blueprint format-version + drift map;
  used by `/vwf:setup`)
- `assets/templates/` — `entity` (Purpose carries a `Serves:` goal-link line),
  `conventions`, `plan` (incl. the "Acceptance criteria (from blueprint)"
  section `plan` fills and the acceptance stage verifies), `product`,
  `architecture`, `design-system`, `environment` (the per-project env-var/secret
  catalog), `integration` (each flow carries an Acceptance block),
  `project-claude` (the vwf section `/vwf:setup` merges into a repo's
  CLAUDE.md), `handoff` (stack-agnostic; section→project mapping resolved from
  the registry). All blueprint templates open with the OKF frontmatter block
- `assets/examples/blueprint/` — a **format-8 conformance bundle** (`order/`,
  `customer/` entity folders + `product.md`, `integration.md`, `conventions.md`,
  `design-system.md`, `environment.md`): a worked, format-valid entity slice
  where every relationship/reference/goal link resolves, the flow carries a
  worked Acceptance block + sequence diagram, and the order lifecycle its state
  diagram. Referenced from the blueprint-authoring skill as the concrete "what
  good looks like"; its asset-refs are covered by `plugins:check`
- `assets/elicitation.md` — the shared questioning protocol referenced by
  `product`, `blueprint`, `plan`, `architecture`, `design-system`, `setup`, and
  `feedback`; incl. the **parked-scope rule** — an answer that goes beyond the
  current pass's scope is filed to mempalace room `gaps` (tag `<slice>/parked`)
  and mirrored into the pass's doc (Open Questions / Out of scope / Risks)
  before the next question, so a scope change arriving in a new session recalls
  it
- `assets/execute-stages.md` — the stage pipeline used by `execute`: the
  code→review→security→acceptance+ux table (acceptance + ux run once per cycle
  after all steps; each conditional and skipped explicitly, stated at the final
  gate), per-stage subagent contracts (incl. the slice/round tags, the
  coverage-report policy, and the acceptance/ux `n/a` gap policy), shared stage
  rules (model enforcement, terse output, loop-on-findings with the recall-miss
  fallback, gap capture), and the end-of-run architecture/environment reconcile
- `assets/capability-vocabulary.md` — the stack-agnostic capability tokens
  shared by `/vwf:architecture` elicitation and the `architecture-writer`
- `assets/vwf-config.md` — the **vwf config** doctrine for `.config/vwf.yaml`
  (one per workspace, config_format 2): the stamp keys, `product`/`memory.wing`,
  the **`blueprint:` coverage stamp** (written by every blueprint sweep; `plan`
  halts unless `coverage: complete`), per-project nuances (`platforms:`
  extensions, coverage/health overrides), the `harness:` inventory, the
  **`enforcement:` block** (structure/stack/rule opt-outs — moved out of the
  registry, which now purely describes the system), bounded `pipeline` knobs
  (coverage target, review round cap, stage model tiers — downgrades always
  reported at the gate — and tighten-only `execute_caps` honored by the
  statusline caps hook, which also reads the legacy `autopilot_caps` name; the
  `1 → 2` config migration is the rename), `verify` `environments`, and
  `docs_sync` scope. Hard floor: config can never disable security review, TDD,
  the approval gates, or the reviewer bars. Readers fall back to the legacy
  `docs/blueprint/.vwf.yml` (its presence = pre-6 drift)
- `assets/harness.md` — the **harness contract**: the verification capabilities
  a repo must be able to run (`dev`, `e2e_local`, `local_stack`, `e2e_staging`,
  `health`, `screenshots`) with canonical task-name conventions. `setup` detects
  and stamps them (the config's `harness:` block — vwf-internal, never a format
  bump), `plan`'s harness preflight re-verifies what a slice's gates need and
  injects bootstrap steps for missing ones (guardrails — exempt from
  minimalism), execute's reconcile updates the stamp, and the
  acceptance/ux/verify surfaces name any `n/a` in this vocabulary — so harness
  gaps surface at plan time with the fix attached, not at the gate
- `assets/stacks/` — the **enforced reference stack** docs, one per project type
  (`packages`, `service`, `worker`, `site`, `console`, `frontend`) plus
  `monorepo.md` (backend monorepo tooling), distilled from the 95octane
  reference implementation. Read by `/vwf:setup` (onboarding) and
  `/vwf:architecture` (registry `stack` — stated, not elicited; an override
  becomes a config `enforcement:` entry). The common-package placement rules
  (`rules/schemas-in-common`, `rules/integrations-via-common`) are seeded into
  each repo's `conventions.md#patterns` and enforced by the execute reviewers
- `assets/memory.md` — the shared mempalace memory protocol (recall before work,
  persist durable decisions, findings memory for loop-backs, and **gap memory**:
  blueprint/plan holes surfaced during execution + out-of-scope points parked
  during elicitation, room `gaps`) referenced by `product`, `blueprint`, `plan`,
  `execute`, `verify`, and `feedback`. The orchestrator resolves the project
  wing and persists decisions; the execute subagents (coder, reviewers,
  acceptance/ux verifiers) file and recall findings **directly** — they are
  granted scoped mempalace MCP tools in their agent frontmatter
  (`mcp__plugin_mempalace_mempalace__mempalace_search` / `…_add_drawer`), so
  rich review detail lives in mempalace instead of the orchestrator's context.
  Gaps are also mirrored to a durable "Gaps surfaced during execution" section
  in the plan doc, so they survive a mempalace outage and feed the
  blueprint/plan fixes. The skip-silently-when-down rule carves out
  `handoff`/`recall`, which fall back to `docs/handoffs/<name>.md` instead
- `assets/docs-sync.md` — the **docs-sync rule** (stale docs are more harmful
  than no docs): every run that changes reality — `execute` (landed code, via
  the shared Reconcile step 4), `architecture` and `product` in update mode —
  ends by reconciling the repo's human docs (README, CLAUDE.md, anything the
  change contradicts) in the same worktree/commit flow, reporting what was
  synced or `docs: nothing contradicted`. `blueprint`/`plan` are exempt (their
  output documents intent, not reality); `setup` owns full authoring
- `assets/format-check.md` + `assets/blueprint-format` — the **format-drift
  preflight**: `product`, `blueprint`, `plan`, `execute`, `design-system`, and
  `verify` compare a repo's `.config/vwf.yaml` stamp (legacy fallback:
  `docs/blueprint/.vwf.yml`) to the format integer vwf ships
  (`blueprint-format`) and nudge `/vwf:setup` when behind (halting only if a
  needed artifact is missing). Since vwf is user-scoped — upgraded once
  globally, with no per-repo install event — this usage-time check is what
  reaches each repo, self-healing on next use
- `hooks/` — `hooks.json` + `npm-to-pnpm.sh`

Docs the commands maintain live under `docs/blueprint/` (the outcome contract
`product.md` — problem/users/goals/slice-priority + the `/vwf:feedback`-owned
Metric readings appendix — registry `architecture.md`, `conventions.md`, the
product-wide `design-system.md`, the per-project env-var/secret catalog
`environment.md`, the cross-entity `integration.md` — every flow carrying an
Acceptance block — and one entity **folder** per entity — `<entity>/` holding
`index.md` alone when small, or `index.md` +
`data.md`/`api.md`/`jobs.md`/`screens.md` when large; the blueprint root holds
only the system docs, never a flat entity file) and `docs/plans/`
(`<date>-<time>-<slice>.md`, with `archived/`). Superseded
commands/agents/templates are archived under `archived/vwf-<date>/`
(`vwf-2026-06-19/` from the prior model; `vwf-2026-07-04/` holds the retired
`autopilot` command, whose behavior merged into `execute`).

The `docs/blueprint/` tree is an **OKF bundle** — vwf is an opinionated
*profile* of Google's Open Knowledge Format (OKF) v0.1. Since **blueprint-format
2**, every doc is a typed OKF concept: it opens with mandatory YAML frontmatter
(`type` from a fixed vocabulary —
`vwf-product`/`vwf-architecture`/`vwf-conventions`/`vwf-design-system`/
`vwf-environment`/`vwf-integration`/`vwf-entity`/`vwf-plan`/`vwf-gap-report` —
plus `title`, `description`, `status`; optional
`timestamp`/`owner`/`resource`/`tags`), and cross-doc relationships are typed
markdown links (the OKF edge) rather than prose. This makes a blueprint portable
to any OKF-aware tool (e.g. the OKF static-HTML visualizer) and ingestable by
graphify, and lets the `blueprint-reviewer` verify frontmatter + that every edge
resolves. The doctrine lives in the blueprint-authoring skill's
`frontmatter-and-links` reference; the format is carried by `blueprint-format` +
the `N → N+1` deltas in the project-setup skill's `format-versioning` reference,
so `/vwf:setup` migrates stale repos on next use. **Format 3** added the
`vwf-environment` type and the `environment.md` catalog; **format 4** the
Acceptance block on every `integration.md` flow (what the execute acceptance
stage verifies); **format 5** the `vwf-product` type + `product.md` foundation
and the entity `Serves:` goal links (see Foundations below); **format 7**
mermaid diagrams as contract views — the `architecture.md` system-shape
flowchart (in sync with the registry), a `sequenceDiagram` per `integration.md`
flow (incl. the failure branch), and a `stateDiagram-v2` per entity lifecycle
with ≥3 states or branching — always views of the authoritative tables/steps,
never additions to them (format 6 is the `.config/vwf.yaml` move, described
under `assets/vwf-config.md`); **format 8** folders-only entities — every entity
at `docs/blueprint/<entity>/` (`index.md` alone when small; + surface files when
large), the root reserved for the system docs, migrated by `setup` via
`git mv` + mechanical link rewrite.

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
registry) are both unconditionally required before `blueprint` — every entity's
Purpose must `Serves:`-link a product goal anchor, which the
`blueprint-reviewer` verifies and the minimalism check traces to.
`design-system` is a second foundation, **required once the registry has a UI
project** (type `site`, `frontend`, or `console`): `blueprint` halts on an
entity with a Screens surface if `docs/blueprint/design-system.md` is missing.
`environment.md` (the per-project env-var/secret catalog, type
`vwf-environment`) is a third foundation, **required once the registry declares
an external integration or a secrets-manager `config`** — `setup` bootstraps it
from the repo's existing env-var/secret usage (names only, never values) and
`blueprint` maintains it as entities add integrations, with
`conventions.md#config` holding only the injection mechanism. **Everything up to
`blueprint` is done in full before planning**: a blueprint run sweeps until
whole-product coverage holds (every goal served, every referenced entity
authored + reviewed, every registry surface represented) and stamps it; `plan`
hard-halts on a partial stamp and dependency-closes its slice, so per-slice
execution never builds on an unblueprinted or unbuilt dependency. The blueprint
is a **code-independent technical contract** — it records only decisions that
have more than one reasonable answer *and* are true regardless of how the code
is written today; reuse/placement/ordering/library choices are `plan`'s job. The
`blueprint-reviewer` gate enforces the completeness bars (data, relationships,
concurrency, API, UI/UX, flows incl. the Acceptance block bar when a pass
touches `integration.md`), the goal-traceability bar (the `Serves:` line), and
the code-independence guardrail (no file/class/library/CSS/pixel leakage).

### Dependencies

`vwf` depends on `context7`, `markdown`, `mempalace`, and `mise` — **all
resolved from the `virajp-plugins` marketplace itself**, so installing `vwf`
needs no other marketplace registered. `context7`, `markdown`, and `mise` are
authored here; `mempalace` is not — it is **re-listed** in
`.claude-plugin/marketplace.json` via a `url` source (pointing at its upstream
repo) so it lives under `virajp-plugins`.

The dependency list is declared in **two** places, which must stay in sync —
both reference `@virajp-plugins` for every entry (the `plugins:check` task
enforces this):

- `plugins/vwf/.claude-plugin/plugin.json` → `context7`, `markdown`,
  `mempalace`, `mise`
- `.claude-plugin/marketplace.json` (vwf entry) → `context7`, `markdown`,
  `mempalace`, `mise`

When `vwf` is enabled, Claude Code (≥ 2.1.143) **auto-installs and
auto-enables** these dependencies at the same scope. Key rules:

- **Keep both dependency lists in sync.** A new dep must be added to both
  `plugin.json` and the vwf entry in `marketplace.json`, and (if external)
  re-listed as its own `url`-sourced plugin in `marketplace.json` so it resolves
  within `virajp-plugins`.
- **Auto-enable is event-driven**, firing only when the parent (`vwf`) is
  enabled — not on a continuous reconcile. If a dependency is later disabled on
  its own, re-enable it directly or toggle `vwf` off/on.

## The statusline CLI

The statusline is **not** a Claude Code plugin — it is an `oclif` CLI published
as `@askviraj/ai-plugins` that installs a powerline statusline into Claude Code.
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
  TypeScript). It imports `bin/claude.mjs` (the `ClaudeCode` tool) and
  `bin/utils.mjs` (shared helpers). The run-directly guard uses
  `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` (the ESM
  equivalent of `require.main === module`, symlink-safe for the npm bin).
- `tools/statusline/context-caps.js` — the context/rate-limit caps `PostToolUse`
  hook, bundled with the main `statusLine` install (see Statusline below).
- `test/` — `node --test` suites run by `i:test` (and thus in `release.yml`):
  `utils.test.mjs` (cmpVer/cmpPre/deepMerge incl. prototype-pollution keys) and
  `statusline.test.mjs` (hermetic smoke tests for both render surfaces + the
  usage-file contract `context-caps.js` reads). Not shipped in the npm package
  (`files` is `bin` + `tools`).

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
overwrite unless `--yes`). `--all` installs plugins only — pair it with
`--statusline` for the bar. Installing the statusline additionally wires the
**context/rate-limit caps** `PostToolUse` hook (`installContextCaps`): it copies
`tools/statusline/context-caps.js` into `~/.claude/hooks/`, sets
`env.AI_PLUGINS_USAGE_DIR` (`${HOME}/.claude/usage`), and appends the hook entry
(idempotently, preserving other env keys / PostToolUse hooks). The statusline's
`writeUsageFile` mirrors each session's `context_window`/`rate_limits` to that
dir — the only surface those numbers appear on — and the hook reads them and, at
the caps (context over 65%, 5-hour over 90%, 7-day over 80%), tells the agent to
`/vwf:handoff` then halt. It is bundled with the `statusLine` key (not the
subagent panel) because that main-bar writer is its sensor, and is inert until
the bar runs. **Versions:** `--version`/`-v` prints the CLI version (vs the
latest on npm), the bundled statusline version, and each plugin's installed
version (from `claude plugin list`) vs the latest in the **remote** marketplace
manifest on GitHub (`REMOTE_MARKETPLACE_URL`), flagging updates. **Upgrade:**
`--upgrade` runs **after** any install phase — it `claude plugin update`s every
installed virajp-plugins plugin that's outdated, refreshes the statusline, and
notes a newer CLI; combine with `--all --statusline` for an idempotent
install+upgrade fit for a setup script. `--version`/`--upgrade` need the network
and `claude`, and error out (non-zero) if either is unavailable. **Uninstall:**
`--uninstall` reuses the same selection flags but removes —
`claude plugin uninstall`s the selected plugins (matching their install scope)
and/or strips the statusline keys from `settings.json`, deleting the installed
script once no statusline key remains. Uninstalling the statusline also runs
`uninstallContextCaps` — it strips the caps hook entry and
`AI_PLUGINS_USAGE_DIR` from `settings.json` and deletes
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

## Adding a vwf Skill or Command

- Skill: create `plugins/vwf/skills/<name>/SKILL.md`.
- Command: create `plugins/vwf/commands/<name>.md`.

No other registration is needed — both are auto-discovered.

## Installation (end-user)

```sh
# Add marketplace once (user-scoped)
claude plugin marketplace add --scope user virajp/ai-plugins

# Install a plugin into a project
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `vwf`, `markdown`, `typescript`, `flutter`, `mempalace`,
`context7`, `mise`, `github-actions`, `andrej-karpathy-skills` (external,
opt-in). (The statusline is not a plugin — install it via
`npx @askviraj/ai-plugins …`; see The statusline CLI.)

Installing `vwf` pulls in its dependencies (`context7`, `markdown`, `mempalace`,
`mise`) automatically from the same `virajp-plugins` marketplace — no other
marketplace needs to be registered. See the Dependencies section above.
