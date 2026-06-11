# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What This Repo Is

A Claude Code plugin marketplace (`virajp-plugins`) containing LSP servers and
skill collections. The root `.claude-plugin/marketplace.json` defines the
marketplace; each plugin lives in `plugins/<name>/.claude-plugin/plugin.json`.

## Plugin Structure

Every plugin is a directory under `plugins/` with a
`.claude-plugin/plugin.json`:

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
- **`skills`** — array of paths to skill directories (relative to the plugin
  root). The `plugins/skills` plugin uses `"./"` to register all skill
  subdirectories.

The marketplace manifest at `.claude-plugin/marketplace.json` lists each plugin
with its `source`, `version`, `category`, and `tags`.

## Adding a Plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json` with only the fields the
   plugin needs
2. Register it in `.claude-plugin/marketplace.json` under `plugins[]`

No build, lint, or test steps — plugins are pure JSON configuration.

## Skills Plugin

Skills live in `plugins/skills/<skill-name>/SKILL.md`. The
`.claude-plugin/plugin.json` registers them via `"skills": ["./"]`. The `skills`
plugin declares a dependency on the official `superpowers` plugin.

To add a skill: create `plugins/skills/<name>/SKILL.md` — no other registration
needed.

## Installation (end-user)

```sh
# Add marketplace once (user-scoped)
claude plugin marketplace add --scope user virajp/ai-plugins

# Install a plugin into a project
claude plugin install --scope project <plugin-name>@virajp-plugins
```

Available plugin names: `typescript-lsp`, `dart-lsp`, `skills`.
