# typescript plugin

The `typescript` plugin packs opinionated Effect-TS standards for pnpm monorepos
plus the TypeScript/JavaScript language server. Seven skills encode how to name,
type, structure, build, and test code; the language server gives Claude Code
in-editor diagnostics, hovers, and navigation. Effect is mandatory — the
standards assume Effect-TS throughout (`Effect.gen`, `Effect.Schema`,
`Effect.Service`, Effect Config), and the `effect` skill auto-applies to every
TypeScript file you edit.

## Install

```sh
pnpx @askviraj/ai-plugins --plugin typescript
```

## Skills

Six skills auto-apply by file path — they load whenever you edit a matching
file, no action needed. One skill (`build`) is user-invocable from the `/` menu.
None of the path-scoped skills appear in the `/` menu.

| Skill          | Standardizes                                                                                                                                                                      | Activation                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `typescript`   | Stack-neutral coding standards: naming, import ordering, strict type safety, named functions, parameter conventions.                                                              | Auto-applies on `**/*.ts`                                   |
| `effect`       | Effect-TS patterns: `Effect.gen`, `Effect.Schema`, `Effect.Service`, a single error class, telemetry spans, structured logging, Effect Config, the HTTP boundary.                 | Auto-applies on `**/*.ts`                                   |
| `package-json` | package.json for pnpm monorepos: pnpm-only, `"latest"` versions, ESM, the exports map, `workspace:*` links, standard build/check/clean/test scripts.                              | Auto-applies on `**/package.json`                           |
| `pnpm`         | Workspace config: `pnpm-workspace.yaml` globs, catalogs, supply-chain safety (`minimumReleaseAge`, `trustPolicy`), build allowlists, peer-dependency rules, `.npmrc`.             | Auto-applies on `**/pnpm-workspace.yaml` and `**/.npmrc`    |
| `tsconfig`     | Config layout: a strict shared `tsconfig.base.json`, per-project `tsconfig.json` with the `@/` path alias, a `tsconfig.build.json` emit variant, project references.              | Auto-applies on `**/tsconfig.json` and `**/tsconfig.*.json` |
| `build`        | How the build stitches together: the `@/` alias and `tsc-alias` rewriting, barrel `index.ts` exports, the clean→check→build:ts→build:alias pipeline, project references, turbo.   | User-invocable from the `/` menu                            |
| `vitest`       | Vitest + `@effect/vitest` testing: the shared config (`vite-tsconfig-paths`, v8 coverage to 100%), `it.effect` tests, the `_testUtils/` layout, running via package.json scripts. | Auto-applies on `**/vitest.config.ts` and `**/*.test.ts`    |

## Language server

The plugin ships one `lspServers` entry, `typescript`, backed by
`typescript-language-server`. It runs through `mise`: on startup it installs
`typescript-language-server` and `typescript` globally under `node@latest`, then
launches the server over stdio.

```sh
mise x node@latest -- npm add -g typescript-language-server typescript && \
  mise x node@latest -- typescript-language-server --stdio
```

The server maps these extensions to languages, so it covers TypeScript,
JavaScript, JSX, and TSX:

| Extension             | Language          |
| --------------------- | ----------------- |
| `.ts`, `.mts`, `.cts` | `typescript`      |
| `.js`, `.mjs`, `.cjs` | `javascript`      |
| `.tsx`                | `typescriptreact` |
| `.jsx`                | `javascriptreact` |

Startup is allowed up to 60 seconds (`startupTimeout: 60000`) to cover the
first-run global install.

## See also

[../readme.md](../readme.md)
