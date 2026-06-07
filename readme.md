# Plugins for Claude Code

A curated collection of opinionated Claude Code plugins by Viraj Patel — LSP servers and other tooling for use with the Claude Code CLI.

## Prerequisites

[Claude Code CLI](https://claude.ai/code) & [Mise](https://mise.jdx.dev/) installed.

> NOTE: `MISE` is required to use plugins

## Installation

**Step 1 — Add the marketplace (once, user-scoped):**

```sh
claude plugin marketplace add --scope user virajp/ai-plugins
```

**Step 2 — Install a plugin into your project:**

```sh
claude plugin install --scope project <plugin-name>@virajp-plugins
```

## Plugins

### ts-js-lsp

TypeScript/JavaScript language server (via `typescript-language-server`).

```sh
claude plugin install --scope project ts-js-lsp@virajp-plugins
```

### dart-lsp

Dart language server.

```sh
claude plugin install --scope project dart-lsp@virajp-plugins
```

### vskills

A collection of reusable skills for the Claude Code CLI.

```sh
claude plugin install --scope project vskills@virajp-plugins
```

**Skills included:**

| Skill | Description |
|---|---|
| `doc-architecture` | Create or update the workspace-level `docs/architecture.md` — the single source of truth for project type, stack, and capabilities |
| `doc-engineering` | Write or update engineering docs for a project; reads `docs/architecture.md` and runs the matching doc set (service, worker, packages, site, or frontend) |
| `doc-product` | Write or update product documentation for an entity or action |
| `spec-plan` | Create an implementation spec and plan for an entity; requires engineering docs to exist |
| `exec-plan` | Execute an approved implementation plan; covers code writing, code review, security review, and doc updates |
| `workflow` | Explicit project workflow router — start here for any product or engineering work |
| `karpathy-guidelines` | Behavioral guidelines to reduce common LLM coding mistakes: avoid overcomplication, make surgical changes, surface assumptions, define verifiable success criteria |
