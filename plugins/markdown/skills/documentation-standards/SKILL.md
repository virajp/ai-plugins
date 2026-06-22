---
name: documentation-standards
version: 0.2.0
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

- Always use `mermaid`; no external images. Must render on GitHub and GitLab —
  no `%%{init}%%` config directives or custom themes (portability is not
  guaranteed across both).
- Pick the type by purpose — don't default everything to a flowchart:
  - process / topology / dependencies → `flowchart` (`graph`)
  - interactions over time, API/message flows → `sequenceDiagram`
  - data model, entities & relations → `erDiagram`
  - lifecycle / status machine → `stateDiagram-v2`
- Quote any label with special characters: `A["pay (USD)"]`, not `A[pay (USD)]`
  — unquoted parens/brackets/colons are the top cause of a diagram that won't
  render.
- One concept per diagram. Split rather than cram; keep node IDs short and
  alphanumeric, and put the prose in the label.
- Use `%%` comments to explain complex parts.
- Exception: things mermaid doesn't support (e.g. directory structures) can be
  ASCII in a fenced block.
