---
name: cloudflare-stack-menu
description: Return the Cloudflare stack templates this plugin offers, as a vwf
  menu payload. Invoked by /architecture and /setup when `cloudflare` is
  listed in the config's `stacks:` — not a general-purpose skill.
---

# cloudflare-stack-menu

Return the templates the `cloudflare` plugin offers, per the stack-adapter
contract. **Return the payload and nothing else** — no prose, no recommendation,
no comparison. Choosing is the user's job and presenting the choice is vwf's.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked programmatically — vwf does not get an
> error, it gets an empty menu.

## Scope is deliberately parked

This plugin covers **Zero Trust Access only**: putting a project that must not
be publicly reachable behind an identity-aware proxy on its own hostname,
whichever cloud actually hosts it. Workers, Pages, R2, D1, KV, Durable Objects,
Queues, Images and Stream are planned under their own dedicated effort and are
**not offered here**.

Say that in the payload's `note`, always. A short — or empty — menu with no
explanation is indistinguishable from a broken adapter, which is the exact
failure the stack-adapter contract warns about.

## How to answer

1. List `%%AI_PLUGINS_ROOT%%/stacks/*/*.md`. Each file is one template: its **slug**
   is the filename without `.md`, its **axis** is that file's `axis:`
   frontmatter key, and its `name` + summary line come from the same
   frontmatter and the file's opening prose.
2. Return the payload below — `note` included, on every answer.

```yaml
plugin: cloudflare
note: Cloudflare coverage is parked at Zero Trust Access. Workers, Pages, R2,
  D1, KV, Durable Objects, Queues, Images and Stream are planned under a
  dedicated effort and are not offered yet.
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

- **This list is exhaustive.** If a composition is not here, the `cloudflare`
  plugin does not offer it; vwf falls back to `template: custom` and records
  what the user describes. Do not fill the gap from general Cloudflare
  knowledge.
- **The project axis is not ours.** Cloudflare fronts and hosts code; it does
  not decide the language or framework a project is written in. A `cloudflare`
  menu entry never carries a `role`.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
