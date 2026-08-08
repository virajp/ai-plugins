# typescript plugin

The `typescript` plugin is the **language plugin for TypeScript** — one plugin
per language, covering both `typescript` and `javascript`. It packs opinionated
standards for pnpm projects, all Effect-TS doctrine, the TypeScript/JavaScript
language server, and every TypeScript **stack template** vwf can offer. Six
skills encode how to name, type, structure, lint, build, and test code; the
language server gives in-editor diagnostics, hovers, and navigation. Each skill
is single-package-first, with clearly marked monorepo guidance, and both router
skills auto-apply to every TypeScript file you edit.

Effect-TS used to live in a separate `effect` plugin. It does not any more: a
framework is not a plugin boundary, so it folded back in as a sibling skill.
Plain TypeScript reads the `typescript` skill alone; an Effect project reads
both, and neither installs anything extra.

## Install

```sh
pnpx @askviraj/ai-plugins --user typescript
```

## Skills

Six skills auto-apply by file path — they load whenever you edit a matching
file, no action needed. `typescript` and `effect` are **routers**: a lean
`SKILL.md` that loads the always-on baseline and points to a library of
references read on demand, so editing a file never pulls the whole corpus into
context.

| Skill          | Standardizes                                                                                                                                                                                                                                 | Activation                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `typescript`   | The TypeScript entry point. Always-on baseline (naming, import ordering, strict type safety, named functions, parameter conventions) plus routed references: Vitest testing and the build pipeline.                                          | Auto-applies on `**/*.ts`, `.tsx`, `.mts`, `.cts`                             |
| `effect`       | The Effect-TS entry point — a router that loads the reference matching your task. Layers on the `typescript` skill's coding standards; it never replaces them.                                                                               | Auto-applies on `**/*.ts`, `.tsx`, `.mts`, `.cts`                             |
| `lint-format`  | The house lint/format gate: `@askviraj/linter` (bundled ESLint) for correctness and `dprint` for layout — both must pass before commit — plus how to run each, how to scope rule overrides, and common failure remedies.                     | Auto-applies on `**/dprint.json`, eslint config, and `**/.config/linter.yaml` |
| `package-json` | package.json, single-package-first with a monorepo section: consent-gated new dependencies (never added without asking), pnpm-only, `"latest"` versions, ESM, the exports map, `workspace:*` links, standard build/check/clean/test scripts. | Auto-applies on `**/package.json`                                             |
| `pnpm`         | Workspace config: `pnpm-workspace.yaml` globs, catalogs, supply-chain safety (`minimumReleaseAge`, `trustPolicy`), build allowlists, peer-dependency rules, `.npmrc`.                                                                        | Auto-applies on `**/pnpm-workspace.yaml` and `**/.npmrc`                      |
| `tsconfig`     | Config layout, single-package-first with a monorepo section: a strict shared `tsconfig.base.json`, per-project `tsconfig.json` with the `@/` path alias, a `tsconfig.build.json` emit variant, project references.                           | Auto-applies on `**/tsconfig.json` and `**/tsconfig.*.json`                   |

Two more skills exist but never auto-apply — they are the vwf **stack adapter**,
invoked by `/vwf:architecture` and `/vwf:setup` when a product lists
`typescript` in its `stacks:`:

| Skill                       | What it returns                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript-stack-menu`     | The ten templates below, as a vwf menu payload — slug, axis, role, name, one-line summary. Nothing else; choosing is the user's job.   |
| `typescript-stack-template` | One template as a vwf template payload — axis fields, per-capability harness mechanisms, and the conventions `plan` and `execute` read |

The `typescript` skill's reference library covers **Vitest** testing (the shared
config, `_testUtils`, v8 coverage, run wrappers) and the **build** pipeline (the
`@/` alias and `tsc-alias` rewriting, barrels, the
clean→check→build:ts→build:alias order, project references, turbo). Each loads
only when the routed topic is relevant.

The `effect` skill routes to three of its own:

| Reference          | When to read                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Effect-TS**      | `Effect.gen`, `Effect.Schema`, `Effect.Service`, error handling, telemetry, logging, config, the HTTP boundary     |
| **Effect runtime** | Composing & running Effect: Layer wiring, `ManagedRuntime`, `Scope`/`acquireRelease`, `Schedule` retries, `Stream` |
| **Testing Effect** | `it.effect`, providing test Layers, mocking a service, `TestClock` in tests                                        |

The Vitest reference is deliberately Effect-agnostic: the runner and its config
are the same whether or not the code under test uses Effect, and only the
assertions differ. For those, read **Testing Effect** alongside it.

## Stack templates

The plugin owns **ten** vwf stack templates across three axes. vwf itself ships
none — it states the axes and the role vocabulary, and this plugin supplies the
rows for TypeScript.

Project axis — one per role:

| Slug                         | Role        | Stack                                          |
| ---------------------------- | ----------- | ---------------------------------------------- |
| `typescript-effect`          | `packages`  | TypeScript · Effect-TS                         |
| `typescript-effect-hono`     | `service`   | TypeScript · Hono · Effect-TS                  |
| `typescript-hono-refine`     | `fullstack` | TypeScript · Hono + Effect-TS · React + Refine |
| `typescript-astro-react`     | `site`      | TypeScript · Astro (SSR) · React               |
| `typescript-effect-temporal` | `worker`    | TypeScript · Temporal · Effect-TS              |
| `typescript-effect-cli`      | `frontend`  | TypeScript · @effect/cli — platform `cli`      |
| `typescript-pulumi`          | `infra`     | TypeScript · Pulumi                            |

Deploy and repo axes:

| Slug          | Axis     | What it pins                                                            |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `npm-package` | `deploy` | The registry as the host — for a project users install, not one you run |
| `pnpm-turbo`  | `repo`   | pnpm workspace + Turborepo                                              |
| `bun`         | `repo`   | bun as package manager, runtime, bundler and test runner                |

`typescript-effect` is the **shared kernel**: every domain schema and every
third-party integration lives in that package as an Effect service, so
downstream projects depend on an interface rather than a vendor SDK. That
placement rule is what the other project templates are written against.

**No `backing` template is here.** A language plugin does not decide the
datastore, the identity provider or the queue — those come from the capability
and cloud plugins, and compose with any of these.

`typescript-pulumi` lives here rather than in an infrastructure plugin because
`infra` is a *role* vwf already owns and Pulumi programs are TypeScript: they
use the same type system, formatter, linter and test runner as everything else
in the workspace.

## Language server

The plugin ships one `lspServers` entry, `typescript-lsp`, backed by
`typescript-language-server`. It runs through `mise` and `pnpm dlx` — no global
install per session: on startup `dlx` resolves `typescript-language-server` on
demand and launches it over stdio.

```sh
mise x -- pnpm --package=typescript \
  --package=typescript-language-server dlx typescript-language-server --stdio
```

The workspace's own TypeScript is preferred when present; the `dlx`-provided one
is only the fallback.

The server maps these extensions to languages, so it covers TypeScript,
JavaScript, JSX, and TSX:

| Extension             | Language          |
| --------------------- | ----------------- |
| `.ts`, `.mts`, `.cts` | `typescript`      |
| `.js`, `.mjs`, `.cjs` | `javascript`      |
| `.tsx`                | `typescriptreact` |
| `.jsx`                | `javascriptreact` |

Startup is allowed up to 60 seconds (`startupTimeout: 60000`) to cover the
first-run `dlx` resolution.

## See also

[../readme.md](../readme.md)
