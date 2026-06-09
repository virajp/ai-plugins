# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What This Repo Is

A collection of Claude Code plugins. Each plugin lives in its own subdirectory
and is defined entirely by a `plugin.json` file.

## Plugin Structure

Every plugin is a directory containing a `plugin.json` with at minimum:

```json
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "description": "..."
}
```

Plugins may declare any combination of:

- **`lspServers`** — LSP server definitions keyed by language ID. Each entry
  needs `command`, `args`, and `extensionToLanguage`. See `dart-lsp/plugin.json`
  for a working example using `mise` to run the language server.
- **`skills`** — skill definitions for Claude Code's Skill tool
- **`hooks`** — shell commands that run on Claude Code lifecycle events
- **`mcpServers`** — MCP server configurations

## Adding a Plugin

1. Create a new directory named after the plugin (e.g., `rust-lsp/`)
2. Add a `plugin.json` following the structure above
3. Include only the fields relevant to what the plugin provides — don't copy
   boilerplate fields that don't apply

There are no build, lint, or test steps — plugins are pure JSON configuration.
