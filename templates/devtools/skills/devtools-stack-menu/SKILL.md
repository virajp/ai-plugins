---
name: devtools-stack-menu
description: Return the stack templates the devtools plugin offers, as a vwf
  menu payload. Invoked by <%= it.cmd("vwf:architecture") %> and <%= it.cmd("vwf:setup") %> when `devtools` is
  listed in the config's `stacks:` — not a general-purpose skill.
invocation: both
model: sonnet
effort: low
---

# devtools-stack-menu

Return the templates the `devtools` plugin offers, per the stack-adapter
contract. **Return the payload and nothing else** — no prose, no recommendation,
no comparison. Choosing is the user's job and presenting the choice is vwf's.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked programmatically — vwf does not get an
> error, it gets an empty menu.

## Why a tooling plugin is on the stack menu at all

`devtools` is the developer toolchain, and almost everything it owns is doctrine
rather than a stack choice. It carries **one** template: the provider-neutral
**deploy** option — build an OCI image, run it on any host that runs containers.
That is the answer when the product must not be tied to one cloud, and it
belongs here because Docker is developer tooling and the template names no
provider.

There is deliberately **no `container` capability plugin**: a container is not a
backing capability, it is how a deployable is packaged.

## How to answer

1. List `<%= it.root %>/stacks/*/*.md`. Each file is one template: its **slug**
   is the filename without `.md`, its **axis** is that file's `axis:`
   frontmatter key, and its `name` + summary line come from the same
   frontmatter and the file's opening prose.
2. Return the payload below — `note` included, on every answer.

```yaml
plugin: devtools
note: This plugin offers the deploy axis only, and only its provider-neutral
  option. A managed container host — Cloud Run, GKE and the rest — comes from
  the project's cloud plugin, which vwf asks separately. Everything else
  devtools owns is doctrine, not a stack choice.
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

- **This list is exhaustive.** If a composition is not here, the `devtools`
  plugin does not offer it. There is no `custom` fallback — vwf retired it in
  `config_format` 14 and halts instead, naming the two ways forward (install a
  plugin that has it, or write one). Do not fill the gap from general container
  knowledge, and never invent an entry to spare the user that halt.
- **The project and repo axes are not ours to answer here.** Packaging does not
  decide the language, framework or package manager a project uses, so a
  `devtools` menu entry never carries `platforms:` (a project-axis key). The repo-level tooling this
  plugin documents — mise, dprint, ESLint, gitleaks, grype, pre-commit — reaches
  a repo through its skills, not through a `repo`-axis template.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
