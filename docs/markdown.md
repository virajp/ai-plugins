# markdown

An opinionated Markdown plugin for Claude Code. It ships the always-on
`documentation-standards` skill — which auto-applies whenever Claude edits a
file matching `**/*.md` and shapes every Markdown change — plus a
`/markdown:readme` skill you invoke on demand to document a whole repo. It
writes through the same documentation-standards skill, so a generated README
follows the standards below.

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

### Heading hierarchy

- One `#` H1 per file (the title); everything else is `##` and deeper.
- Never skip a level, and use sentence case with no trailing punctuation.

### Links

- Descriptive link text — never "click here" or a bare URL in prose.
- Relative links within a repo, absolute only for external targets;
  reference-style only when a target repeats or the URL hurts readability.

### Front matter

- Add YAML front matter only when a tool consumes it (static-site generators,
  skill/command manifests), never on a plain README — and keep it to the keys
  that consumer reads.

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

The generated README always carries these sections, in order (the tasks section
is omitted when the repo has no task runner):

| Section           | What it documents                                                         |
| ----------------- | ------------------------------------------------------------------------- |
| Title             | The project name as the H1                                                |
| Short description | One or two sentences on what the project is                               |
| List of projects  | Every package (a table for a monorepo; one entry for a polyrepo)          |
| Architecture      | A `mermaid` diagram of how the projects/services fit together, plus notes |
| Infrastructure    | Every cloud tool/service the repo uses                                    |
| Local Development | A step-by-step setup guide to run the repo locally                        |
| Projects          | One detailed section per project (monorepo) or a single one (polyrepo)    |
| Important tasks   | The task-runner commands a developer runs day to day                      |

The command follows a **detect → ask → write → report** flow: it scans for the
layout (monorepo vs polyrepo), the projects, the architecture, the cloud tooling
(IaC, containers, CI/CD, deploy configs, cloud SDKs), and the task runner — mise
(`mise.toml`), `package.json` `scripts`, a `Makefile`, or a `justfile`,
preferring mise when more than one is present; asks only what it can't infer (a
missing tagline, which cloud services are actually in use); then writes the
README and reports what it created or updated. The tasks section lists real
commands from the detected runner and is omitted when the repo has none. When
updating, it refreshes those sections and leaves any others (License,
Contributing, badges) untouched.

## See also

- [../readme.md](../readme.md)
