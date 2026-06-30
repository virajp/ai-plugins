# markdown

An opinionated Markdown plugin for Claude Code. It ships the always-on
`documentation-standards` skill — which auto-applies whenever Claude edits a
file matching `**/*.md` and shapes every Markdown change — plus a
`/markdown:readme` command you invoke on demand to document a whole repo. The
command writes through the same skill, so a generated README follows the
standards below.

## Install

```sh
pnpx @askviraj/ai-plugins --user markdown
```

## What it standardizes

The `documentation-standards` skill carries one ruleset, grouped by concern.

### Writing style

- Short sentences. Present tense. Active voice.
- No filler. Skip "This document describes…" and start writing.
- Code blocks always use a language identifier for syntax highlighting.
- Tables for structured comparisons.

### CHANGELOGs

| Rule           | Standard                                                   |
| -------------- | ---------------------------------------------------------- |
| Version blocks | One `## vMAJOR.MINOR.PATCH` heading per version            |
| Unreleased     | None — always commit under a version heading               |
| Entry types    | Match conventional-commit types: `feat`, `fix`, `refactor` |

### Keeping docs current

- Update docs when you change a public API, add a module, or change behavior.
- Update the CHANGELOG when bumping a version.
- No documentation stubs — either write the file or don't create it.

### Diagrams

The skill mandates `mermaid` for all diagrams, with portability and clarity
rules:

- Use `mermaid`, never external images. Diagrams must render on both GitHub and
  GitLab — no `%%{init}%%` config directives or custom themes, since portability
  across both is not guaranteed.
- Pick the diagram type by purpose instead of defaulting to a flowchart:

  | Purpose                                  | Diagram type          |
  | ---------------------------------------- | --------------------- |
  | Process, topology, dependencies          | `flowchart` (`graph`) |
  | Interactions over time, API/message flow | `sequenceDiagram`     |
  | Data model, entities and relations       | `erDiagram`           |
  | Lifecycle, status machine                | `stateDiagram-v2`     |

- Quote any label with special characters: `A["pay (USD)"]`, not `A[pay (USD)]`.
  Unquoted parens, brackets, and colons are the top cause of a diagram that
  won't render.
- One concept per diagram. Split rather than cram. Keep node IDs short and
  alphanumeric, and put the prose in the label.
- Use `%%` comments to explain complex parts.
- Exception: things mermaid can't express, such as directory structures, may be
  ASCII inside a fenced block.

## /markdown:readme

`/markdown:readme [target-dir]` scans the repository and writes — or updates —
its README, applying the standards above. It defaults to the current repo root;
pass a directory to document another repo. An existing readme is updated in
place (its filename and casing preserved); otherwise it creates `README.md`.

The generated README always carries these eight sections, in order:

| Section              | What it documents                                                         |
| -------------------- | ------------------------------------------------------------------------- |
| Title                | The project name as the H1                                                |
| Short description    | One or two sentences on what the project is                               |
| List of projects     | Every package (a table for a monorepo; one entry for a polyrepo)          |
| Architecture         | A `mermaid` diagram of how the projects/services fit together, plus notes |
| Infrastructure       | Every cloud tool/service the repo uses                                    |
| Local Development    | A step-by-step setup guide to run the repo locally                        |
| Projects             | One detailed section per project (monorepo) or a single one (polyrepo)    |
| Important mise tasks | The `mise tasks` a developer runs day to day                              |

The command follows a **detect → ask → write → report** flow: it scans for the
layout (monorepo vs polyrepo), the projects, the architecture, the cloud tooling
(IaC, containers, CI/CD, deploy configs, cloud SDKs), and the mise setup; asks
only what it can't infer (a missing tagline, which cloud services are actually
in use); then writes the README and reports what it created or updated. When
updating, it refreshes those eight sections and leaves any others (License,
Contributing, badges) untouched.

## See also

- [../readme.md](../readme.md)
