# README Update Design

**Date:** 2026-05-26  
**File:** `readme.md`

## Goal

Replace the near-empty README with a useful document covering: what this repo is, how to install from it, and which plugins are available.

## Structure

### Introduction
A short paragraph describing this as a curated collection of opinionated Claude Code plugins (LSP servers and other tooling) maintained by Viraj Patel.

### Prerequisites
One line: requires Claude Code CLI installed.

### Installation
Two numbered steps — step 1 is one-time (add marketplace at user scope), step 2 is per-project (install a specific plugin).

```
# Step 1 — add the marketplace (once, user-scoped)
claude plugin marketplace add --scope user virajp/claude-plugins

# Step 2 — install a plugin into your project
claude plugin install --scope project <plugin-name>@virajp-claude-plugins
```

### Plugins
One subsection per plugin with its description and exact install command. Current plugin:

| Plugin | Description |
|--------|-------------|
| `ts-js-lsp` | TypeScript/JavaScript language server |

Install command: `claude plugin install --scope project ts-js-lsp@virajp-claude-plugins`
