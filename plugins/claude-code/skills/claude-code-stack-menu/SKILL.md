---
name: claude-code-stack-menu
description: Return the stack templates the claude-code plugin offers, as a vwf
  menu payload. Invoked by /vwf:architecture and /vwf:setup when `claude-code`
  is listed in the config's `stacks:` — not a general-purpose skill.
disable-model-invocation: false
model: sonnet
effort: low
---

# claude-code-stack-menu

Return the templates the `claude-code` plugin offers, per the stack-adapter
contract. **Return the payload and nothing else** — no prose, no
recommendation, no comparison. Choosing is the user's job and presenting the
choice is vwf's.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked programmatically — vwf does not get an
> error, it gets an empty menu.

## Why an authoring plugin is on the stack menu at all

`claude-code` is doctrine for extending Claude Code, and most of what it owns
is exactly that. It carries **one** template, on the **project** axis: a
project whose registry `platforms:` is `[ plugin ]` — a Claude Code plugin,
which is a directory of markdown and a manifest rather than a program.

That template is what makes the `plugin` platform buildable. vwf covers
`plugin` projects in the blueprint as of blueprint format 23, and a covered
project needs a pin its `doctor` run can check against; without one, the
project's language token resolves to `unknown`, which is **blocking**.

## How to answer

1. List `${CLAUDE_PLUGIN_ROOT}/stacks/*/*.md`. Each file is one template: its
   **slug** is the filename without `.md`, its **axis** is that file's `axis:`
   frontmatter key, and its `name` + summary line come from the same
   frontmatter and the file's opening prose.
2. Return the payload below — `note` included, on every answer.

```yaml
plugin: claude-code
note: This plugin offers the project axis only, for the `plugin` platform —
  a Claude Code plugin. It is host-specific by definition: an extension for a
  different host application is a different plugin's template, not a variant
  of this one. The backing, deploy and repo axes are not ours.
templates:
  - slug: <filename without .md>
    axis: <the file's own axis: key>
    platforms: <the file's own platforms: list>
    name: <display name>
    summary: <one line — why you would pick it>
```

**If `stacks/` holds no template files, return `templates: []` alongside that
same `note`.** An empty list is the truth; the note is what makes it read as a
decision rather than a fault.

## Rules

- **This list is exhaustive.** If a composition is not here, the `claude-code`
  plugin does not offer it. There is no `custom` fallback — vwf retired it in
  `config_format` 14 and halts instead, naming the two ways forward (install a
  plugin that has it, or write one). Do not fill the gap from general knowledge
  of Claude Code, and never invent an entry to spare the user that halt.
- **The host is part of the template, not a parameter of it.** This plugin
  answers for Claude Code. A VS Code extension, a Neovim plugin or a browser
  extension is also platform `plugin`, and each belongs to a plugin of its own
  — offering one here from general knowledge would pin a project to a template
  nobody wrote.
- **A `plugin` project takes no deploy template.** It is installed from a
  marketplace, not deployed; pair it with `deploy_template: n/a`. Say so if the
  caller's context makes it relevant, but never as an extra menu entry.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
