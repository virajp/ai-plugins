# Plugins for Claude Code

A curated collection of opinionated Claude Code plugins by Viraj Patel — LSP servers and other tooling for use with the Claude Code CLI.

## Prerequisites

[Claude Code CLI](https://claude.ai/code) & [Mise](https://mise.jdx.dev/) installed.

## Installation

**Step 1 — Add the marketplace (once, user-scoped):**

```sh
claude plugin marketplace add --scope user virajp/claude-plugins
```

**Step 2 — Install a plugin into your project:**

```sh
claude plugin install --scope project <plugin-name>@virajp-claude-plugins
```

## Plugins

### ts-js-lsp

TypeScript/JavaScript language server (via `typescript-language-server`).

```sh
claude plugin install --scope project ts-js-lsp@virajp-claude-plugins
```
