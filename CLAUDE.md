# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What This Repo Is

A Claude Code plugin marketplace (`virajp-plugins`) containing LSP servers, an
MCP server, `vwf` — a full Spec → Plan → Execute workflow plugin — and
`statusline`, a config-driven powerline statusline. The root
`.claude-plugin/marketplace.json` defines the marketplace; each plugin lives in
`plugins/<name>/.claude-plugin/plugin.json`.

Plugins are pure JSON/markdown configuration plus shell scripts — there is no
build, lint, or test step.

## Plugins

| Plugin           | Source                     | What it provides                                          |
| ---------------- | -------------------------- | --------------------------------------------------------- |
| `vwf`            | `./plugins/vwf`            | Commands, subagents, skills, and an npm→pnpm hook         |
| `statusline`     | `./plugins/statusline`     | Config-driven powerline statusline (bin/ script + JSON)   |
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
- `bin/` → executables added to the session `PATH` when the plugin is enabled
  (the `statusline` plugin ships its script here; see The statusline Plugin)
- `settings.json` at the plugin root → default settings applied when the plugin
  is enabled. Only the `agent` and `subagentStatusLine` keys are honoured here —
  the main `statusLine` cannot be shipped by a plugin and must be wired by the
  user in their own `settings.json`.

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

## The statusline Plugin

`statusline` is a standalone, config-driven powerline statusline. Its layout
under `plugins/statusline/`:

- `bin/statusline` — the Node script (executable, `#!/usr/bin/env node`). Drives
  **both** surfaces from one file: a stdin payload with a `tasks` array renders
  the subagent panel, anything else the main two-line bar.
- `bin/statusline.json` — the default config (every constant: palette, powerline
  glyphs, symbols, per-segment styling, line layout, subagent panel). This is
  config **layer 3**.
- `settings.json` — ships `subagentStatusLine` so the subagent panel auto-wires
  when the plugin is enabled. The main `statusLine` is added by the user.

**Three-layer config**, deep-merged low → high (objects merge key-by-key, arrays
replace wholesale; any layer may be absent):

1. `${CLAUDE_PLUGIN_ROOT}/bin/statusline.json` — plugin defaults (lowest). The
   script falls back to the file next to it in `bin/` when the env var is unset.
2. `~/.config/statusline.json` — per-user.
3. `<repo-root>/.config/statusline.json` — per-repo (highest).

The JSON Schema lives at the **repo root** under
`schemas/statusline.schema.json` (never shipped with the plugin — it is consumed
only via its raw GitHub URL, referenced by `$schema`). User-facing reference
docs are at `docs/statusline.md`. When changing the config shape, keep the
script, `bin/statusline.json`, `schemas/statusline.schema.json`, and
`docs/statusline.md` in sync.

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

Available plugin names: `vwf`, `statusline`, `mempalace`, `context7`,
`typescript-lsp`, `dart-lsp`.

Installing `vwf` pulls in its dependencies (`context7`, `mempalace`)
automatically from the same `virajp-plugins` marketplace — no other marketplace
needs to be registered. See the Dependencies section above.
