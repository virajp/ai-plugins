---
name: doppler
description: Development-time secret injection with Doppler — secrets reach a
  process as environment variables and are never read from a committed file,
  `doppler run --` wraps the mise task rather than the application, and nothing
  here is in the deployed path. Auto-applies when editing doppler config or a
  mise config that wires it.
paths:
  - "**/doppler.yaml"
  - "**/doppler.yml"
  - "**/.doppler.yaml"
  - "**/.config/doppler.yaml"
---

# Doppler — development secrets only

**Doppler is a development tool.** It is how a developer's laptop gets the
credentials the app needs before any cloud secret manager is in the picture. It
is **not** the production answer and must not be presented as one: in CI the
injector is the CI system's secret store, and in production it is the cloud
plugin's secret manager (`gcp` → Secret Manager, `cloudflare` → Workers
secrets). A product that needs Doppler at runtime has moved a dev tool into
production.

There is deliberately **no `secrets` plugin** in this marketplace. Dev secrets
are `devtools`; production secrets belong to whichever cloud plugin the project
deploys on.

## The one rule that outranks the mechanism

**Secrets are injected into the process environment. Nothing is read from a
committed file.** That holds whichever injector is in use, in every environment,
and it is the rule the mechanism exists to serve — not the other way round.

Two consequences worth stating plainly:

- A `.env` file checked into the repo is a leak, not a convenience. If one
  exists, it is `gitleaks`' finding and it is not waived.
- A secret that is only ever an env var can change injector without touching a
  line of application code. That portability is what keeps Doppler a dev
  concern rather than a dependency.

## Wrap the task, not the application

```sh
doppler run -- mise run dev
doppler run -- mise run test:e2e
```

Wrap the **mise task**, never the application binary and never a shell you then
work inside. Wrapping the task is what makes the same task run with and without
Doppler: CI calls `mise run dev` directly under its own injected environment,
and the task is identical in both. Wrapping the application instead pushes the
injector into the task file, where CI then has to route around it.

Doppler belongs in `mise.dev.toml`, never in `mise.toml` or `mise.ci.toml` — it
is dev-only tooling, and the base file carries the runtime alone:

```toml
# .config/mise.dev.toml
[tools]
doppler = { version = "latest" }
```

## Names are catalogued; values never are

`docs/blueprint/environment.md` is vwf's per-project catalog of env-var and
secret **names**, never values, whichever injector supplies them. That file
stays true when the injector changes, which is the point of cataloguing names.

**vwf states the requirement; this plugin states the mechanism.** Do not push
Doppler project/config naming into the blueprint — the blueprint records that a
credential exists and what reads it, not where it is stored.

## When a project needs no injector at all

Plenty do not. A project whose only configuration is non-secret (log level,
runtime env name) reads it from `mise.dev.toml`'s `[env]` block and needs
nothing else. Reach for an injector when a real credential appears, not before.
