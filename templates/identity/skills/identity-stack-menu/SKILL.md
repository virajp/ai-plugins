---
name: identity-stack-menu
description: Return the identity templates this plugin offers, as a vwf menu
  payload. Invoked by <%= it.cmd("vwf:architecture") %> and <%= it.cmd("vwf:setup") %> when `identity` is listed
  in the config's `stacks:` — not a general-purpose skill.
invocation: both
model: sonnet
effort: low
---

# identity-stack-menu

Return the templates the `identity` plugin offers, per the stack-adapter
contract. **Return the payload and nothing else** — no prose, no recommendation,
no comparison. Choosing is the user's job and presenting the choice is vwf's.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked programmatically — vwf does not get an
> error, it gets an empty menu.

## What this plugin offers, and what it deliberately does not

This is a **capability** plugin. It owns the neutral identity contract
(`<%= it.root %>/assets/contract.md`) and ships the one provider that belongs to
no cloud. **Managed flavours are a cloud plugin's**, not ours — a product on GCP
gets Firebase Auth and Identity Platform from `gcp`, and vwf renders the union
of both menus. Never list another plugin's template here.

## How to answer

1. List `<%= it.root %>/stacks/*/*.md`. Each file is one template: its **slug**
   is the filename without `.md`, its **axis** is that file's `axis:`
   frontmatter key, and its `name` + summary line come from the same
   frontmatter and the file's opening prose.
2. Return the payload below — `note` included, on every answer.

```yaml
plugin: identity
note: This plugin ships the vendor-neutral identity contract and the provider
  that needs no cloud. A managed identity service comes from the project's
  cloud plugin, which vwf asks separately.
templates:
  - slug: <filename without .md>
    axis: <the file's own axis: key>
    name: <display name>
    summary: <one line — why you would pick it>
```

**If `stacks/` holds no template files, return `templates: []` alongside that
same `note`.** An empty list is the truth; the note is what makes it read as a
decision rather than a fault.

## Rules

- **This list is exhaustive.** If a provider is not here, the `identity` plugin
  does not offer it. There is no `custom` fallback — vwf retired it in
  `config_format` 14 and halts instead, naming the two ways forward (install a
  plugin that has it, or write one). Do not fill the gap from general auth
  knowledge, and never invent an entry to spare the user that halt.
- **The project axis is not ours.** An identity provider does not decide the
  language or framework a project is written in, so an `identity` menu entry
  never carries `platforms:` — that key is project-axis only.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
