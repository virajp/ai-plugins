---
name: flutter-stack-menu
description: Return the Flutter stack templates this plugin offers, as a vwf
  menu payload. Invoked by vwf-architecture and /vwf-setup when `flutter` is
  listed in the config's `stacks:` — not a general-purpose skill.
---

# flutter-stack-menu

Return the templates the `flutter` plugin offers on vwf's `project` axis, per
the stack-adapter contract. **Return the payload and nothing else** — no prose,
no recommendation, no comparison. Choosing is the user's job and presenting the
choice is vwf's.

> **`invocation` must stay `both`.** A `user` skill is removed from the model's
> context entirely and cannot be invoked programmatically — vwf does not get an
> error, it gets an empty menu.

## How to answer

1. List `%%AI_PLUGINS_ROOT%%/stacks/project/*.md` — **flat**, with no role
   directory, since format 22. Each file is one template: its
   **slug** is the filename without `.md`, its **platforms** are that file's
   `platforms:` frontmatter key (a **list** — one template may serve several,
   and this plugin's does), and its `name` comes from the same frontmatter. Read no
   further into the file than the frontmatter and its opening paragraph — the
   body is `flutter-stack-template`'s to read, on demand.
2. Return the payload below, filled from that listing.

```yaml
plugin: flutter
templates:
  - slug: <filename without .md>
    axis: project
    platforms: <the file's own platforms: list>
    name: <display name>
    summary: <one line — why you would pick it>
```

## Rules

- **This list is exhaustive.** A composition not listed is one this plugin does
  not offer. There is no `custom` fallback — vwf retired it in `config_format`
  14 and halts instead, naming the two ways forward (install a plugin that has
  it, or write one). Do not fill the gap from general Flutter knowledge, and
  never invent an entry to spare the user that halt.
- **Only the `frontend` role.** Flutter is the on-device app; a server, a
  static site or a shared package belongs to the plugin owning that stack. A
  `flutter` menu entry never claims another role.
- **Kotlin and Swift are not separate offers here.** They appear on the Flutter
  template as *optional* languages, for platform channels and native embedding.
  Standalone Kotlin or Swift app templates are not offered by any plugin yet;
  say so rather than inventing one.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
