# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What This Repo Is

A Claude Code plugin marketplace (`virajp-plugins`) containing LSP servers, an
MCP server, and `vwf` — a full Spec → Plan → Execute workflow plugin. The root
`.claude-plugin/marketplace.json` defines the marketplace; each plugin lives in
`plugins/<name>/.claude-plugin/plugin.json`.

The repo also ships a **statusline**, installed via a small `oclif` CLI
(`@askviraj/ai-plugins`) rather than the marketplace — see The statusline CLI.

Plugins are pure JSON/markdown configuration plus shell scripts (no build/test
step). The one addition is the statusline CLI: a small plain-JS `oclif` package
at the repo root — also no build step.

## Plugins

| Plugin           | Source                     | What it provides                                          |
| ---------------- | -------------------------- | --------------------------------------------------------- |
| `vwf`            | `./plugins/vwf`            | Commands, subagents, skills, and an npm→pnpm hook         |
| `context7`       | `./plugins/context7`       | Context7 MCP docs server                                  |
| `typescript-lsp` | `./plugins/typescript-lsp` | TypeScript/JavaScript language server                     |
| `dart-lsp`       | `./plugins/dart-lsp`       | Dart language server                                      |
| `mempalace`      | external (url)             | Re-listed in `virajp-plugins`; AI memory system (vwf dep) |

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
  `startupTimeout`. See `plugins/dart-lsp/.claude-plugin/plugin.json` for a
  working example using `mise`.
- **`mcpServers`** — MCP server definitions. See
  `plugins/context7/.claude-plugin/plugin.json`.
- **`dependencies`** — other plugins this plugin requires (see below).

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
  `spec`, `plan`, `execute`, `archive`, `architecture`, plus internal
  `git-workflow`
- `agents/` — subagents the commands delegate to: `spec-reviewer`,
  `execute-coder`, `execute-code-reviewer`, `execute-security-reviewer`,
  `architecture-writer`
- `skills/` — `karpathy-guidelines`, `rest-api-design`
- `assets/templates/` — `entity`, `conventions`, `plan`, `architecture`
  (stack-agnostic; section→project mapping resolved from the registry)
- `assets/elicitation.md` — the shared questioning protocol referenced by
  `spec`, `plan`, and `architecture`
- `assets/memory.md` — the shared mempalace memory protocol (recall before work,
  persist durable decisions, findings memory for loop-backs) referenced by
  `spec` and `execute`. The orchestrator resolves the project wing and persists
  decisions; the execute reviewers/coder file and recall findings **directly** —
  they are granted scoped mempalace MCP tools in their agent frontmatter
  (`mcp__plugin_mempalace_mempalace__mempalace_search` / `…_add_drawer`), so
  rich review detail lives in mempalace instead of the orchestrator's context
- `hooks/` — `hooks.json` + `npm-to-pnpm.sh`

Docs the commands maintain live under `docs/specs/` (registry `architecture.md`,
`conventions.md`, one `<entity>.md` per entity) and `docs/plans/`
(`<date>-<time>-<slice>.md`, with `archived/`). Superseded commands/agents/
templates from the prior model are archived under `archived/vwf-2026-06-19/`.

### Dependencies

`vwf` depends on `context7` and `mempalace` — **both resolved from the
`virajp-plugins` marketplace itself**, so installing `vwf` needs no other
marketplace registered. `mempalace` is not authored here; it is **re-listed** in
`.claude-plugin/marketplace.json` via a `url` source (pointing at its upstream
repo) so it lives under `virajp-plugins`.

The dependency list is declared in **two** places, which must stay in sync —
both reference `@virajp-plugins` for every entry:

- `plugins/vwf/.claude-plugin/plugin.json` → `context7`, `mempalace`
- `.claude-plugin/marketplace.json` (vwf entry) → `context7`, `mempalace`

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

The command does several jobs. **Plugins:** `--all` (everything), `--plugins`
(all marketplace plugins), or `--plugin <name>` (repeatable) drive the `claude`
CLI to add the `virajp-plugins` marketplace (user scope) and install each plugin
at its default scope — `dart-lsp` is project-scoped, every other plugin is
user-scoped (see `PROJECT_SCOPED` in `bin/installer.js`). Plugin names are
**bare and allowlisted** (`PLUGINS`); an `@marketplace` or path qualifier is
rejected outright so the CLI can only ever install from `virajp-plugins`.
**Statusline:** `--statusline` and/or `--subagentstatusline` (both implied by
`--all`) copy the script into `~/.claude/scripts/` (chmod 755), seed the bundled
defaults into `~/.config/statusline.json` (deep-merging missing settings if it
already exists, preserving user edits), and write the chosen key(s) into
`~/.claude/settings.json` (preserving other keys; prompting before overwrite
unless `--yes`). **Versions:** `--version`/`-v` prints the CLI version (vs the
latest on npm), the bundled statusline version, and each plugin's installed
version (from `claude plugin list`) vs the latest in the **remote** marketplace
manifest on GitHub (`REMOTE_MARKETPLACE_URL`), flagging updates. **Upgrade:**
`--upgrade` runs **after** any install phase — it `claude plugin update`s every
installed virajp-plugins plugin that's outdated, refreshes the statusline, and
notes a newer CLI; combine with `--all` for an idempotent install+upgrade fit
for a setup script. `--version`/`--upgrade` need the network and `claude`, and
error out (non-zero) if either is unavailable. **Uninstall:** `--uninstall`
reuses the same selection flags but removes — `claude plugin uninstall`s the
selected plugins (matching their install scope) and/or strips the chosen
statusline key(s) from `settings.json`, deleting the installed script once no
statusline key remains. It leaves the seeded `~/.config/statusline.json` (it may
hold user edits) and never touches external tools (the CLI never installed
those).

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
  CI-only tools; empty today since CI only needs the generic node + pnpm.

Keep common tools in `mise.toml` (don't duplicate across dev/ci); put
environment-specific tools in the matching env file.

### Workflows (`.github/workflows/`)

- **`release.yml`** — on a pushed `v*` tag: sets up mise (`MISE_ENV=ci`),
  verifies the tag matches `package.json` version,
  `pnpm install --frozen-lockfile`, **runs the tests** (`mise run i:test`) and
  verifies the package (`mise run i:build`), then `npm publish` for **OIDC
  trusted publishing** — no stored token, provenance added automatically.
  **Publishing uses the npm CLI; everything else stays pnpm.** The local
  `i:publish` task mirrors this (auth check + the same gates + `npm publish`).
- **`deps-update.yml`** — monthly cron (+ manual dispatch): `pnpm update`
  (bounded by the cooldown below); if anything changed, `osv-scanner` gates on
  any known-vulnerable package, then it cuts a **patch release**
  (`mise run
  i:release` → tests + bump + commit + tag) and **publishes
  inline** via `npm publish` (OIDC), committing the refresh + bump to `main`. It
  publishes itself rather than via `release.yml` because a tag pushed with the
  workflow's `GITHUB_TOKEN` would not trigger another workflow.

### Supply-chain settings

`pnpm-workspace.yaml` sets **`minimumReleaseAge`** (a publish cooldown, in
minutes) so neither installs nor the monthly update adopt brand-new —
potentially compromised — releases.

### One-time manual setup (not automatable here)

- On **npmjs.com**, add this repo + `release.yml` as a **Trusted Publisher** for
  `@askviraj/ai-plugins` (enables OIDC). Until then `release.yml` cannot
  publish.
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

Available plugin names: `vwf`, `mempalace`, `context7`, `typescript-lsp`,
`dart-lsp`. (The statusline is not a plugin — install it via
`npx @askviraj/ai-plugins …`; see The statusline CLI.)

Installing `vwf` pulls in its dependencies (`context7`, `mempalace`)
automatically from the same `virajp-plugins` marketplace — no other marketplace
needs to be registered. See the Dependencies section above.
