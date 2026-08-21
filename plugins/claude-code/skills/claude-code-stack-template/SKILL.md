---
name: claude-code-stack-template
description: Return one claude-code stack template as a vwf template payload —
  its axis fields, per-capability harness mechanisms, and conventions. Invoked
  by /vwf:architecture and /vwf:setup after the user picks from the claude-code
  menu — not a general-purpose skill.
argument-hint: "<slug>"
disable-model-invocation: false
model: sonnet
effort: medium
---

# claude-code-stack-template

Return the template payload for the slug the caller names, per the
stack-adapter contract. The valid slugs are **exactly** the ones
`/claude-code:claude-code-stack-menu` lists, and nothing else.

> **`invocation` must stay `both`** — see `claude-code-stack-menu`.

An unknown slug is an **error**, not a guess. Name the slugs that do exist, and
add that an extension for a host other than Claude Code belongs to a plugin of
its own. Never answer a slug this plugin has not written from general knowledge
of Claude Code — a template it has not written is a template it does not offer.

## How to answer

1. Read `${CLAUDE_PLUGIN_ROOT}/stacks/project/<slug>.md` — the template file,
   whose own frontmatter is authoritative for its axis and platforms.
2. Return **only** the payload below, filled from it. No prose around it, no
   summary of what you read, no advice.

```yaml
slug: <the requested slug>
axis: project
platforms: <the file's own platforms: list>
languages: <the file's own languages: list>
optional_languages: <the file's own optional_languages: list>
frameworks: [] # the file's frontmatter, verbatim
dependencies: [] # the file's frontmatter, verbatim
harness: # how THIS stack satisfies each vwf capability
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the template's prose — the directory conventions, the invocation policy,
  the traps, and what the gates are. Verbatim from the file; do not summarize
  it away.>
```

## The language facts, and why none of them is a finding

This plugin is what makes `markdown` a **known** language token — the union of
what the installed stack plugins declare is the vocabulary, so a plugin project
pinned here never reports `unknown`, which is blocking. Its three facts are
deliberately thin, and each absence is an answer rather than a gap:

| Fact       | Value                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| LSP plugin | **none** — `/vwf:doctor` reports *no LSP available in this marketplace* and moves on |
| manifest   | `.claude-plugin/plugin.json`                                                         |
| toolchain  | — not mise-managed                                                                   |

`bash` is an **optional** language, not a required one: a plugin with no hooks
has no shell scripts at all, and reporting a missing shell toolchain for a
directory of markdown would be noise.

## The harness block is the point

vwf no longer knows what satisfies a capability — this block is where that
knowledge lives. Most of vwf's capabilities are `n/a` for a plugin project and
saying so plainly is the right answer, never an invented mechanism: there is no
dev server, no local stack, no health endpoint and no screenshots, because a
plugin is loaded by its host rather than run. What is **not** `n/a` is the
validation the host and the repo can actually perform — answer those honestly
from the template file, and never name a test runner or package manager, which
belong to the repo axis.

## What belongs in `conventions`, and what does not

The payload carries **judgment**, not API surface.

| Include                                                         | Leave out                            |
| ----------------------------------------------------------------- | ------------------------------------ |
| Why the wrong invocation state fails silently                   | The frontmatter key list as a schema |
| That `${CLAUDE_PLUGIN_ROOT}` names only its own plugin          | Claude Code's release notes          |
| Which artifacts are discovered by convention, so none is listed | A tour of every hook event           |
| What a marketplace entry must state, and what breaks silently   | The marketplace JSON schema verbatim |
