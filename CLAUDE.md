# CLAUDE.md

## Rules

- ALWAYS ask user before running `i:release` task

## What This Repo Is

A Claude Code plugin marketplace (`virajp-plugins`) containing LSP servers, an
MCP server, and `vwf` — a full Spec → Plan → Execute workflow plugin. The root
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
  resolution, and agent `name:`↔filename (for plugins with an `agents/` dir).
  url-sourced entries (e.g. `mempalace`) are covered only for JSON validity.
  Scoped to fire when anything under `plugins/` or the marketplace manifest
  changes.
- **`vwf:test`** — table-tests the `vwf` `npm-to-pnpm.sh` hook through the
  system sed (the BSD-sed portability guarantee); vwf-specific since it is the
  only plugin shipping a hook. Scoped to `plugins/vwf/hooks/`.

Plugin/skill version numbers are **not** cross-checked — they are independent by
design (a plugin may hold skills versioned on their own cadence).

## Plugins

| Plugin       | Source                 | What it provides                                                                                                                                                                                                          |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vwf`        | `./plugins/vwf`        | Commands, subagents, skills, and an npm→pnpm hook                                                                                                                                                                         |
| `markdown`   | `./plugins/markdown`   | Opinionated Markdown/doc-writing skill, path-scoped to `**/*.md`                                                                                                                                                          |
| `typescript` | `./plugins/typescript` | Opinionated Effect-TS skills (effect, package-json, pnpm, tsconfig, build) + the TypeScript/JavaScript language server                                                                                                    |
| `context7`   | `./plugins/context7`   | Context7 MCP docs server                                                                                                                                                                                                  |
| `flutter`    | `./plugins/flutter`    | Opinionated Flutter skills (dart, pubspec, build, testing, analysis-options, internationalization, swift, kotlin) + bundled Dart, Kotlin & Swift (SourceKit) language servers; self-contained (no cross-marketplace deps) |
| `mempalace`  | external (url)         | Re-listed in `virajp-plugins`; AI memory system (vwf dep)                                                                                                                                                                 |
| `mise`       | `./plugins/mise`       | Opinionated mise skill (the `.config/` three-file `MISE_ENV` split, tool/env placement, file-based tasks, CI node-gpg workaround) + a `/mise:scaffold` command                                                            |

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

- `commands/` — `/vwf:` slash commands: the Spec → Plan → Execute model —
  `spec`, `plan`, `execute`, `archive`, `architecture`, plus `autopilot` (the
  autonomous variant of `execute`), internal `git-workflow`, and
  `handoff`/`recall` (mempalace-backed session handoff — wing=`<project>`,
  room=`handoff`, drawer=`<name>`). `autopilot` runs one approved plan to
  completion **without per-stage human gates** in a dedicated worktree:
  dependency-ordered steps, `code→review→security` per step (security findings
  always fixed; review findings loop ≤4 rounds then become documented gaps),
  gaps written to `docs/plans/<plan>.gap-report.md` + mempalace room `gaps`,
  **never merges/pushes or archives**, and pauses only on hard halts, the
  statusline resource caps, an all-blocking gap, or an uncovered irreversible
  decision. Reuses execute's three subagents.
- `agents/` — subagents the commands delegate to: `spec-reviewer`,
  `execute-coder`, `execute-code-reviewer`, `execute-security-reviewer`,
  `architecture-writer`
- `skills/` — `karpathy-guidelines`, `rest-api-design`
- `assets/templates/` — `entity`, `conventions`, `plan`, `architecture`,
  `handoff` (stack-agnostic; section→project mapping resolved from the registry)
- `assets/elicitation.md` — the shared questioning protocol referenced by
  `spec`, `plan`, and `architecture`
- `assets/memory.md` — the shared mempalace memory protocol (recall before work,
  persist durable decisions, findings memory for loop-backs, and **gap memory**:
  spec/plan holes surfaced during execution, room `gaps`) referenced by `spec`,
  `plan`, and `execute`. The orchestrator resolves the project wing and persists
  decisions; the execute reviewers/coder file and recall findings **directly** —
  they are granted scoped mempalace MCP tools in their agent frontmatter
  (`mcp__plugin_mempalace_mempalace__mempalace_search` / `…_add_drawer`), so
  rich review detail lives in mempalace instead of the orchestrator's context.
  Gaps are also mirrored to a durable "Gaps surfaced during execution" section
  in the plan doc, so they survive a mempalace outage and feed the spec/plan
  fixes
- `hooks/` — `hooks.json` + `npm-to-pnpm.sh`

Docs the commands maintain live under `docs/specs/` (registry `architecture.md`,
`conventions.md`, one `<entity>.md` per entity) and `docs/plans/`
(`<date>-<time>-<slice>.md`, with `archived/`). Superseded commands/agents/
templates from the prior model are archived under `archived/vwf-2026-06-19/`.

### Dependencies

`vwf` depends on `context7`, `markdown`, and `mempalace` — **all resolved from
the `virajp-plugins` marketplace itself**, so installing `vwf` needs no other
marketplace registered. `context7` and `markdown` are authored here; `mempalace`
is not — it is **re-listed** in `.claude-plugin/marketplace.json` via a `url`
source (pointing at its upstream repo) so it lives under `virajp-plugins`.

The dependency list is declared in **two** places, which must stay in sync —
both reference `@virajp-plugins` for every entry (the `plugins:check` task
enforces this):

- `plugins/vwf/.claude-plugin/plugin.json` → `context7`, `markdown`, `mempalace`
- `.claude-plugin/marketplace.json` (vwf entry) → `context7`, `markdown`,
  `mempalace`

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
  `ai-plugins`, sole runtime dep `@oclif/core`. Plain JS — no build step.
- `bin/installer.js` — the whole CLI in one file: the oclif command class plus
  the bootstrap that runs it (single-command `strategy`/`target` in
  `package.json`; `settings.enableAutoTranspile = false` keeps oclif from
  hunting for TypeScript).
- `tools/statusline/context-caps.js` — the context/rate-limit caps `PostToolUse`
  hook, bundled with the main `statusLine` install (see Statusline below).

The command does several jobs. **Plugins:** `--all` (every user-scoped plugin +
both statusline keys), `--plugins` (all user-scoped plugins), or
`--plugin
<name>` (repeatable) drive the `claude` CLI to add the
`virajp-plugins` marketplace (user scope) and install each plugin at its default
scope. The bulk flags (`--all`/`--plugins`) install **user-scoped plugins only**
(`USER_SCOPED`); **project-scoped** plugins (`flutter` — `PROJECT_SCOPED` in
`bin/installer.js`) are a deliberate per-project choice and are reached **only
via an explicit `--plugin <name>`** (which installs at the plugin's own scope).
`--scope user|project` **overrides** each selected plugin's default scope
(`scopeFor`'s `override` arg); absent, the per-plugin default applies. It
governs both install and uninstall, but never the marketplace add (always user
scope). Plugin names are **bare and allowlisted** (`PLUGINS`); an `@marketplace`
or path qualifier is rejected outright so the CLI can only ever install from
`virajp-plugins`. The CLI installs and refreshes **only** `virajp-plugins`;
every plugin (including the bundled Dart/Kotlin/Swift language servers, which
ship inside `flutter`) resolves from it alone — no other marketplace is
registered or refreshed. Installing or upgrading **`vwf`** additionally runs
`setupGraphify` — `graphify install --platform claude` plus
`graphify hook install` — since vwf's commands depend on graphify's knowledge
graph. Both graphify commands are idempotent (so an upgrade self-heals the
setup); the step is soft-skipped when `graphify` isn't on `PATH` (the
`checkDeps` gate guarantees it for installs, but the upgrade-only path does not
run that gate). **`--skip-graphify`** bypasses this step at every call site
(install and upgrade) and drops `graphify` from the dependency check — for
installing the plugins **outside a git repo**, where graphify's repo-scoped
commands don't apply. **Statusline:** `--statusline` and/or
`--subagentstatusline` (both implied by `--all`) copy the script into
`~/.claude/scripts/` (chmod 755), seed the bundled defaults into
`~/.config/statusline.json` (deep-merging missing settings if it already exists,
preserving user edits), and write the chosen key(s) into
`~/.claude/settings.json` (preserving other keys; prompting before overwrite
unless `--yes`). Installing the **main** `statusLine` (so also `--all`)
additionally wires the **context/rate-limit caps** `PostToolUse` hook
(`installContextCaps`): it copies `tools/statusline/context-caps.js` into
`~/.claude/hooks/`, sets `env.AI_PLUGINS_USAGE_DIR` (`${HOME}/.claude/usage`),
and appends the hook entry (idempotently, preserving other env keys /
PostToolUse hooks). The statusline's `writeUsageFile` mirrors each session's
`context_window`/`rate_limits` to that dir — the only surface those numbers
appear on — and the hook reads them and, at the caps (context > 65%, 5-hour

> 90%, 7-day > 80%), tells the agent to `/vwf:handoff` then halt. It is bundled
> with `statusLine` (not the subagent panel) because that main-bar writer is its
> sensor, and is inert until the bar runs. **Versions:** `--version`/`-v` prints
> the CLI version (vs the latest on npm), the bundled statusline version, and
> each plugin's installed version (from `claude plugin list`) vs the latest in
> the **remote** marketplace manifest on GitHub (`REMOTE_MARKETPLACE_URL`),
> flagging updates. **Upgrade:** `--upgrade` runs **after** any install phase —
> it `claude plugin update`s every installed virajp-plugins plugin that's
> outdated, refreshes the statusline, and notes a newer CLI; combine with
> `--all` for an idempotent install+upgrade fit for a setup script.
> `--version`/`--upgrade` need the network and `claude`, and error out
> (non-zero) if either is unavailable. **Uninstall:** `--uninstall` reuses the
> same selection flags but removes — `claude plugin uninstall`s the selected
> plugins (matching their install scope) and/or strips the chosen statusline
> key(s) from `settings.json`, deleting the installed script once no statusline
> key remains. Uninstalling the **main** `statusLine` also runs
> `uninstallContextCaps` — it strips the caps hook entry and
> `AI_PLUGINS_USAGE_DIR` from `settings.json` and deletes
> `~/.claude/hooks/context-caps.js` (leaving other hooks/env keys intact). It
> leaves the seeded `~/.config/statusline.json` (it may hold user edits) and
> never touches external tools (the CLI never installed those).

Before any install, the CLI **checks required external tools** for the resolved
plan (`CORE_DEPS` brew/mise/claude for any plugin install, `PLUGIN_EXTRA_DEPS`
like vwf→rtk+pnpm+graphify, `node` for the statusline). If any are missing it
prints the install command for each (`DEP_HINTS`) and exits non-zero — it never
auto-installs a dependency. Keep `PLUGINS`, `PROJECT_SCOPED`, `DEP_HINTS`,
`CORE_DEPS`, and `PLUGIN_EXTRA_DEPS` in sync with the marketplace and the
plugins' actual runtime needs. Users run it via `npx @askviraj/ai-plugins …`.

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
  (`mise run i:release` → tests + bump + commit + tag) and pushes the refresh +
  bump + tag to `main`. It then **delegates the npm publish to `release.yml` via
  `workflow_call`** (passing the new tag as `ref`) rather than publishing
  inline: npm allows only **one Trusted Publisher per package**, and OIDC's
  `job_workflow_ref` resolves to `release.yml` even when called — so the single
  `release.yml` Trusted Publisher authorizes this path too. (A tag pushed with
  the workflow's `GITHUB_TOKEN` would not trigger `release.yml` on its own, so
  it is called directly.)

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
  commits, and creates the `vX.Y.Z` tag. Then
  `git push && git push origin vX.Y.Z` to trigger `release.yml`. Prefer
  releasing via CI over local `i:publish` so every version keeps the strongest
  npm trust level (trusted publisher).

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
`context7`. (The statusline is not a plugin — install it via
`npx @askviraj/ai-plugins …`; see The statusline CLI.)

Installing `vwf` pulls in its dependencies (`context7`, `markdown`, `mempalace`)
automatically from the same `virajp-plugins` marketplace — no other marketplace
needs to be registered. See the Dependencies section above.
