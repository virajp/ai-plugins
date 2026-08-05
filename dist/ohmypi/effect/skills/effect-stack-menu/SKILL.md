---
name: effect-stack-menu
description: Return the Effect-TS stack templates this plugin offers, as a vwf
  menu payload. Invoked by /skill:architecture and /skill:setup when `effect` is
  listed in the config's `stacks:` — not a general-purpose skill.
---

# effect-stack-menu

Return the templates the `effect` plugin offers on vwf's `project` axis, per the
stack-adapter contract. **Return the payload and nothing else** — no prose, no
recommendation. Choosing is the user's job and presenting the choice is vwf's.

> **`disable-model-invocation` must stay `false`.** A `true` value blocks
> programmatic invocation *silently* — vwf cannot see this skill, and the menu
> comes back empty rather than erroring.

## The payload

```yaml
plugin: effect
templates:
  - slug: typescript-effect
    axis: project
    role: packages
    name: TypeScript · Effect
    summary: The shared kernel — every domain schema and every third-party
      integration lives here as an Effect service, so downstream projects
      depend on an interface rather than a vendor SDK.
```

## Rules

- **This list is exhaustive.** A composition not listed is one this plugin does
  not offer; vwf falls back to `template: custom`.
- **Only the `packages` role.** Effect is the kernel and the DI mechanism, not a
  server or a UI framework — a `service` template belongs to the plugin owning
  that server framework, which composes Effect on top.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
