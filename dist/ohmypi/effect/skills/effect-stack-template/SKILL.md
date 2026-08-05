---
name: effect-stack-template
description: Return one Effect-TS stack template as a vwf template payload —
  its
  axis fields, per-capability harness mechanisms, and conventions. Invoked by
  /skill:architecture and /skill:setup after the user picks from the effect menu —
  not a general-purpose skill.
---

# effect-stack-template

Return the template payload for the slug the caller names, per the stack-adapter
contract. The only valid slug is `typescript-effect`, which
`/skill:effect-stack-menu` lists. An unknown slug is an error, not a guess.

> **`disable-model-invocation` must stay `false`** — see `effect-stack-menu`.

## How to answer

1. Read `%%AI_PLUGINS_ROOT%%/stacks/project/packages/<slug>.md`.
2. Return **only** the payload below, filled from it. No prose around it.

```yaml
slug: typescript-effect
axis: project
role: packages
languages: [ typescript ]
optional_languages: []
frameworks: [ effect ]
dependencies: [ opentelemetry, vitest ]
harness:
  e2e_local: { task: test, mechanism: Vitest against the package's own units }
  dev: n/a # a library has no dev server
  screenshots: n/a
  goldens: n/a
conventions: |
  <the template's prose — the two placement rules, the subpath export shape,
  and the testing conventions. Verbatim from the file; do not summarize.>
```

## What belongs in `conventions`

The payload carries **judgment**, not API surface — callers have Context7 for
`Effect.gen`'s signature and will fetch it themselves. What they cannot fetch:

- **The two placement rules** — all shared schemas live in this package, and all
  third-party integrations are wrapped here. These are what make the vendor
  swappable, and they are decisions, not API facts.
- **The subpath export shape** — why this package has no single entry point.
- **Where the DI seam sits** — the aggregate services layer downstream projects
  provide.

Leave out: Effect operator signatures, Layer combinator syntax, anything a
version bump could change.

## The harness block

A `packages` project is a library: no dev server, no screens, nothing to deploy.
Answer `n/a` for those honestly rather than inventing a mechanism — vwf uses
this to decide which capabilities it can even ask about.

Its `e2e_local` is plain unit testing with no backing services, which is what
makes this the one project template needing no local stack at all.
