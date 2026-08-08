---
name: typescript-stack-menu
description: Return the TypeScript stack templates this plugin offers, as a vwf
  menu payload. Invoked by <%= it.cmd("vwf:architecture") %> and <%= it.cmd("vwf:setup") %> when `typescript` is
  listed in the config's `stacks:` — not a general-purpose skill.
invocation: both
model: sonnet
effort: low
---

# typescript-stack-menu

Return the templates the `typescript` plugin offers on vwf's `project`, `deploy`
and `repo` axes, per the stack-adapter contract. **Return the payload and
nothing else** — no prose, no recommendation, no comparison. Choosing is the
user's job and presenting the choice is vwf's.

> **`invocation` must stay `both`.** A `user` value blocks programmatic
> invocation *silently* — vwf cannot see this skill, and the menu comes back
> empty rather than erroring.

## The payload

```yaml
plugin: typescript
templates:
  - slug: typescript-effect
    axis: project
    role: packages
    name: TypeScript · Effect
    summary: The shared kernel — every domain schema and every third-party
      integration lives here as an Effect service, so downstream projects
      depend on an interface rather than a vendor SDK.
  - slug: typescript-effect-hono
    axis: project
    role: service
    name: TypeScript · Hono · Effect
    summary: The public REST API — a Hono server with Effect services end to
      end, holding no admin routes, every schema decoded at the boundary.
  - slug: typescript-hono-refine
    axis: project
    role: fullstack
    name: TypeScript · Hono + Effect · React + Refine
    summary: One deployable publishing both an API contract and its own UI —
      the operator back-office shape, and the sole holder of admin routes.
  - slug: typescript-astro-react
    axis: project
    role: site
    name: TypeScript · Astro (SSR) · React
    summary: The public website — Astro SSR with React islands, reaching a
      service through same-origin proxy endpoints rather than publishing an
      API of its own.
  - slug: typescript-effect-temporal
    axis: project
    role: worker
    name: TypeScript · Temporal · Effect
    summary: The durable background processor — Temporal workflows with Effect
      inside activities; the only project running long-lived work.
  - slug: typescript-effect-cli
    axis: project
    role: frontend
    name: TypeScript · Effect CLI
    summary: A shipped command-line tool on `@effect/cli` — a terminal surface
      with no screens, governed by the design system's Terminal UX section.
  - slug: typescript-pulumi
    axis: project
    role: infra
    name: TypeScript · Pulumi
    summary: Infrastructure as code in the same language as the rest of the
      workspace — one Pulumi stack per environment, unit-tested against a
      mocked runtime.
  - slug: npm-package
    axis: deploy
    name: Package registry · npm
    summary: For a project users install rather than one you run — the registry
      is the host, publishes are trusted-publisher signed and idempotent, and
      there is no environment to deploy into.
  - slug: pnpm-turbo
    axis: repo
    name: pnpm · Turborepo
    summary: A pnpm workspace with Turborepo orchestrating builds across
      members — the larger ecosystem, and the answer whenever the repo needs a
      tool bun does not cover natively.
  - slug: bun
    axis: repo
    name: bun · workspaces
    summary: Package manager, runtime, bundler and test runner in one — fewer
      moving parts, at the cost of a smaller ecosystem.
```

## Rules

- **This list is exhaustive.** A composition not listed is one this plugin does
  not offer; vwf falls back to `template: custom` and records what the user
  describes.
- **Every project entry carries a `role`**, and no two share one — so the
  project-axis menu vwf renders for a given role is a single entry or none.
- **The `backing` axis is not ours.** A language plugin does not decide the
  datastore, the identity provider or the queue; those come from the capability
  and cloud plugins, and a `typescript` entry never carries `capabilities`.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill answers
  the same way in every product.
