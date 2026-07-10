# typescript plugin

The `typescript` plugin packs opinionated TypeScript standards for pnpm projects
plus the TypeScript/JavaScript language server. Five skills encode how to name,
type, structure, lint, build, and test code; the language server gives Claude
Code in-editor diagnostics, hovers, and navigation. Each skill is
single-package-first, with clearly marked monorepo guidance. Effect-TS is a
first-class concern — its patterns (`Effect.gen`, `Effect.Schema`,
`Effect.Service`, Effect Config) apply in an Effect codebase and stand down in a
non-Effect one — and the `typescript` skill auto-applies to every TypeScript
file you edit.

## Install

```sh
pnpx @askviraj/ai-plugins --user typescript
```

## Skills

Five skills auto-apply by file path — they load whenever you edit a matching
file, no action needed. `typescript` is a **router**: a lean `SKILL.md` that
loads the always-on baseline and points to a library of references read on
demand, so editing a file never pulls the whole corpus into context.

| Skill          | Standardizes                                                                                                                                                                                                                                                                                                                                  | Activation                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `typescript`   | The TypeScript entry point. Always-on baseline (naming, import ordering, strict type safety, named functions, parameter conventions) plus routed references: Effect-TS patterns (`Effect.gen`, `Effect.Schema`, `Effect.Service`, telemetry, logging, config, the HTTP boundary), the Effect runtime, Vitest testing, and the build pipeline. | Auto-applies on `**/*.ts`, `.tsx`, `.mts`, `.cts`                             |
| `lint-format`  | The house lint/format gate: `@askviraj/linter` (bundled ESLint) for correctness and `dprint` for layout — both must pass before commit — plus how to run each, how to scope rule overrides, and common failure remedies.                                                                                                                      | Auto-applies on `**/dprint.json`, eslint config, and `**/.config/linter.yaml` |
| `package-json` | package.json, single-package-first with a monorepo section: consent-gated new dependencies (never added without asking), pnpm-only, `"latest"` versions, ESM, the exports map, `workspace:*` links, standard build/check/clean/test scripts.                                                                                                  | Auto-applies on `**/package.json`                                             |
| `pnpm`         | Workspace config: `pnpm-workspace.yaml` globs, catalogs, supply-chain safety (`minimumReleaseAge`, `trustPolicy`), build allowlists, peer-dependency rules, `.npmrc`.                                                                                                                                                                         | Auto-applies on `**/pnpm-workspace.yaml` and `**/.npmrc`                      |
| `tsconfig`     | Config layout, single-package-first with a monorepo section: a strict shared `tsconfig.base.json`, per-project `tsconfig.json` with the `@/` path alias, a `tsconfig.build.json` emit variant, project references.                                                                                                                            | Auto-applies on `**/tsconfig.json` and `**/tsconfig.*.json`                   |

The `typescript` skill's reference library covers the former standalone skills:
**Effect-TS** patterns, the **Effect runtime** (Layer composition,
`ManagedRuntime`, `Scope`/`acquireRelease`, `Schedule` retries, `Stream`,
`TestClock`), **Vitest** testing, and the **build** pipeline (the `@/` alias and
`tsc-alias` rewriting, barrels, the clean→check→build:ts→build:alias order,
project references, turbo). Each loads only when the routed topic is relevant.

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
