---
name: documentation-standards
version: 0.1.0
category: development
description: Opinionated standards for writing and maintaining Markdown
  documentation — writing style, code blocks, tables, CHANGELOGs, and diagrams.
  Auto-applies when editing any Markdown file.
license: MIT
user-invocable: false
paths:
  - "**/*.md"
---

# Markdown & Documentation Standards

## Writing Style

- Short sentences. Present tense. Active voice.
- No filler: "This document describes…" → just start writing.
- Code blocks use language identifiers for syntax highlighting.
- Tables for structured comparisons.

## CHANGELOGs

- One `## vMAJOR.MINOR.PATCH` heading per version.
- No "Unreleased" section — always commit under a version heading.
- Entries match conventional-commit types: `feat`, `fix`, `refactor`.

## Keeping Docs Current

- Update docs when you change a public API, add a module, or change behavior.
- Update the CHANGELOG when bumping a version.
- Don't add documentation stubs — either write it or don't create the file.

## Diagrams

- Always use `mermaid` for diagrams. No external images.
- Keep diagrams simple and focused on the concept being explained.
- Use comments in the mermaid code to explain complex parts.
- Exception: things mermaid doesn't support (e.g. directory structures) can be
  ASCII.
