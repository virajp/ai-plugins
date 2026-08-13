---
name: object-storage-stack-menu
description: Return the object-storage templates this plugin offers, as a vwf
  menu payload — deliberately none, with the reason. Invoked by
  <%= it.cmd("vwf:architecture") %> and <%= it.cmd("vwf:setup") %> when `object-storage` is listed in the config's
  `stacks:` — not a general-purpose skill.
invocation: both
model: sonnet
effort: low
---

# object-storage-stack-menu

Return the payload below, per the stack-adapter contract. **Return the payload
and nothing else** — no prose, no recommendation, no comparison.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked programmatically — vwf does not get an
> error, it gets an empty menu.

## This plugin ships no template, and that is the answer

`object-storage` is **contract-only**. It owns the neutral requirements
(`<%= it.root %>/assets/contract.md`) and offers no provider of its own, because
every object store worth using belongs to a cloud. The flavour comes from the
project's **cloud plugin** — Cloud Storage from `gcp`, R2 from `cloudflare` once
that plugin is unparked — and vwf renders the union of the menus.

**Never invent a vendor-neutral entry to fill the list.** A protocol is not a
template: it names no lifecycle policy, no consistency guarantee and no egress
price, so an entry built from one would record a decision nobody made.

## The payload — return it exactly, on every answer

```yaml
plugin: object-storage
templates: []
note: This plugin is contract-only by design and ships no template. Every
  object store belongs to a cloud, so the flavour comes from the project's
  cloud plugin — Cloud Storage from gcp, R2 from cloudflare once it is
  unparked. The neutral requirements every store must satisfy live in this
  plugin's contract, and the cloud plugin's backing template is what vwf
  records. An empty template list here is a decision, not a fault.
```

**The `note` is not optional.** An empty list with no explanation is
indistinguishable from a broken adapter — a skill that failed to load, or one
whose invocation was flipped to `user` — and that silent ambiguity is precisely
what the stack-adapter contract exists to prevent. `templates: []` alone would
tell the caller nothing about which of those it was looking at.

## Rules

- **Never list another plugin's template.** vwf asks each configured plugin and
  unions the answers; naming `gcp`'s buckets here would double-count them and
  make this plugin the wrong owner of a decision it does not hold.
- **The project axis is not ours.** Object storage does not decide the language
  or framework a project is written in, so this plugin never returns `platforms:`
  — that key is project-axis only.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
