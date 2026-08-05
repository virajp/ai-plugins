---
name: documentation-standards
version: 0.3.1
category: development
description: Opinionated standards for writing and maintaining Markdown
  documentation — writing style, code blocks, tables, CHANGELOGs, and diagrams.
  Auto-applies when editing any Markdown file.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write
paths:
  - "**/*.md"
---

# Markdown & Documentation Standards

## Writing Style

- Short sentences. Present tense. Active voice.
- No filler: "This document describes…" → just start writing.
- Code blocks use language identifiers for syntax highlighting.
- Tables for structured comparisons.

## Heading Hierarchy

- One `#` H1 per file — the title. Everything else is `##` and deeper.
- Never skip a level (no `##` → `####`). Nest by one.
- Sentence case, not Title Case. No trailing punctuation, no numbering unless
  the order is load-bearing.

## Links

- Descriptive link text — never "click here" or a bare URL for prose.
- Relative links within a repo (`../api/auth.md`), absolute only for external.
- Inline by default; reference-style (`[text][ref]`) only when the same target
  repeats or the URL is long enough to hurt readability.

## Front Matter

- Add YAML front matter only when a tool consumes it (static-site generators,
  skill/command manifests) — not on a plain README or doc.
- Keep it minimal: only keys the consumer reads. No speculative metadata.

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
- **Animate every dotted/dashed link.** A dotted link (`-. text .->`) marks a
  loop-back, an alternative, or a deferred edge — make it move: give the edge an
  id and turn animation on. Uses the Mermaid ≥ 11.3 edge-id syntax; renderers
  that sanitize CSS fall back to a static dotted link.

  ```mermaid
  flowchart LR
    A e1@-. text .-> B
    e1@{ animate: true }
  ```
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
