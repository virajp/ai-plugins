---
name: orchestration-stack-menu
description: Return the async-orchestration templates this plugin offers, as a
  vwf menu payload. Invoked by vwf-architecture and /vwf-setup when
  `orchestration` is listed in the config's `stacks:` — not a general-purpose
  skill.
---

# orchestration-stack-menu

Return the templates the `orchestration` plugin offers, per the stack-adapter
contract. **Return the payload and nothing else** — no prose, no recommendation,
no comparison. Choosing is the user's job and presenting the choice is vwf's.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked programmatically — vwf does not get an
> error, it gets an empty menu.

## What this plugin offers, and what it deliberately does not

This is a **capability** plugin. It owns the neutral contract for work that
happens later (`%%AI_PLUGINS_ROOT%%/assets/contract.md`) and ships the self-hosted
engine that belongs to no cloud. **Managed queues, buses and schedulers are a
cloud plugin's**, not ours, and vwf renders the union of both menus. Never list
another plugin's template here.

The contract also records the case where **no** service is needed — a job table
in the product's own datastore (`%%AI_PLUGINS_ROOT%%/assets/contract.md`). That is not
a template and this menu does not invent one for it. It needs no free-text pin
either: the project simply carries **no orchestration slug** in its
`backing_template` list, and the datastore slug already there is where the job
table lives. Absence is the recording, which is why retiring vwf's `custom`
fallback took nothing away from this case.

## How to answer

1. List `%%AI_PLUGINS_ROOT%%/stacks/*/*.md`. Each file is one template: its **slug**
   is the filename without `.md`, its **axis** is that file's `axis:`
   frontmatter key, and its `name` + summary line come from the same
   frontmatter and the file's opening prose.
2. Return the payload below — `note` included, on every answer.

```yaml
plugin: orchestration
note: This plugin ships the vendor-neutral contract for asynchronous work and
  the self-hosted workflow engine. Managed queues, buses and schedulers come
  from the project's cloud plugin, which vwf asks separately.
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

- **This list is exhaustive.** If an engine is not here, the `orchestration`
  plugin does not offer it. There is no `custom` fallback — vwf retired it in
  `config_format` 14 and halts instead, naming the two ways forward (install a
  plugin that has it, or write one). Do not fill the gap from general queueing
  knowledge, and never invent an entry to spare the user that halt.
- **The project axis is not ours.** A workflow engine does not decide the
  language or framework a project is written in, so an `orchestration` menu
  entry never carries `platforms:` — that key is project-axis only.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
