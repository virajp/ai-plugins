# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What This Repo Is

A Claude Code plugin marketplace (`virajp-plugins`) containing LSP servers, an
MCP server, and `vwf` — a full product/engineering workflow plugin. The root
`.claude-plugin/marketplace.json` defines the marketplace; each plugin lives in
`plugins/<name>/.claude-plugin/plugin.json`.

Plugins are pure JSON/markdown configuration plus shell scripts — there is no
build, lint, or test step.

## Plugins

| Plugin           | Source                     | What it provides                                             |
| ---------------- | -------------------------- | ------------------------------------------------------------ |
| `vwf`            | `./plugins/vwf`            | Commands, subagents, skills, and an npm→pnpm hook            |
| `context7`       | `./plugins/context7`       | Context7 MCP docs server                                     |
| `typescript-lsp` | `./plugins/typescript-lsp` | TypeScript/JavaScript language server                        |
| `dart-lsp`       | `./plugins/dart-lsp`       | Dart language server                                         |
| `mempalace`      | external (url)             | Re-listed in `virajp-plugins`; AI memory system (vwf dep)    |
| `superpowers`    | external (url)             | Re-listed in `virajp-plugins`; core skills library (vwf dep) |

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

- `commands/` — `/vwf:` slash commands: `architecture`, `product`,
  `engineering`, `spec-plan`, `exec-plan`, `git-workflow`
- `agents/` — subagents that the commands delegate to (e.g.
  `engineering-author`, `exec-plan-coder`, `spec-plan-reviewer`)
- `skills/` — `karpathy-guidelines`, `rest-api-design`
- `assets/` — `playbooks/` and `templates/` consumed by the commands/agents
- `hooks/` — `hooks.json` + `npm-to-pnpm.sh`
- `bin/vwf` — plugin CLI entrypoint

### Dependencies

`vwf` depends on `context7`, `mempalace`, and `superpowers` — **all resolved
from the `virajp-plugins` marketplace itself**, so installing `vwf` needs no
other marketplace registered. `mempalace` and `superpowers` are not authored
here; they are **re-listed** in `.claude-plugin/marketplace.json` via `url`
sources (pointing at their upstream repos) so they live under `virajp-plugins`.

The dependency list is declared in **two** places, which must stay in sync —
both now reference `@virajp-plugins` for every entry:

- `plugins/vwf/.claude-plugin/plugin.json` → `context7`, `mempalace`,
  `superpowers`
- `.claude-plugin/marketplace.json` (vwf entry) → `context7`, `mempalace`,
  `superpowers`

When `vwf` is enabled, Claude Code (≥ 2.1.143) **auto-installs and
auto-enables** these dependencies at the same scope. Key rules:

- **Keep both dependency lists in sync.** A new dep must be added to both
  `plugin.json` and the vwf entry in `marketplace.json`, and (if external)
  re-listed as its own `url`-sourced plugin in `marketplace.json` so it resolves
  within `virajp-plugins`.
- **Auto-enable is event-driven**, firing only when the parent (`vwf`) is
  enabled — not on a continuous reconcile. If a dependency is later disabled on
  its own, re-enable it directly or toggle `vwf` off/on.

## Hooks

`vwf` ships a `PreToolUse` / `Bash` hook (`hooks/npm-to-pnpm.sh`) that rewrites
`npm`/`npx` commands to `pnpm`. Two things to know when editing hooks here:

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

Available plugin names: `vwf`, `mempalace`, `superpowers`, `context7`,
`typescript-lsp`, `dart-lsp`.

Installing `vwf` pulls in its dependencies (`context7`, `mempalace`,
`superpowers`) automatically from the same `virajp-plugins` marketplace — no
other marketplace needs to be registered. See the Dependencies section above.
