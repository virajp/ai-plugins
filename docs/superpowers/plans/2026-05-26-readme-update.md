# README Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the empty `readme.md` with an introduction, installation instructions, and plugin list.

**Architecture:** Single markdown file edit — no code, no tests. Spec: `docs/superpowers/specs/2026-05-26-readme-update-design.md`.

**Tech Stack:** Markdown

---

### Task 1: Rewrite readme.md

**Files:**
- Modify: `readme.md`

- [ ] **Step 1: Replace the contents of `readme.md`**

Write the following content to `readme.md` (overwrite entirely):

```markdown
# Plugins for Claude Code

A curated collection of opinionated Claude Code plugins by Viraj Patel — LSP servers and other tooling for use with the Claude Code CLI.

## Prerequisites

[Claude Code CLI](https://claude.ai/code) installed.

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
```

- [ ] **Step 2: Verify the file renders correctly**

Open `readme.md` and confirm:
- All three sections are present (Introduction, Installation, Plugins)
- Both code blocks in Installation use `sh` syntax highlighting
- The `ts-js-lsp` section has its own subheading and install command

- [ ] **Step 3: Commit**

```bash
git add readme.md
git commit -m "docs: add introduction, installation, and plugin list to README"
```
