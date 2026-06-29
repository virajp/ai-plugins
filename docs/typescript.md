# typescript plugin

The `typescript` plugin packs opinionated Effect-TS standards for pnpm monorepos
plus the TypeScript/JavaScript language server. Four skills encode how to name,
type, structure, build, and test code; the language server gives Claude Code
in-editor diagnostics, hovers, and navigation. Effect is mandatory — the
standards assume Effect-TS throughout (`Effect.gen`, `Effect.Schema`,
`Effect.Service`, Effect Config), and the `typescript` skill — with its Effect
reference — auto-applies to every TypeScript file you edit.

## Install

```sh
pnpx @askviraj/ai-plugins --user typescript
```

## Skills

Four skills auto-apply by file path — they load whenever you edit a matching
file, no action needed. `typescript` is a **router**: a lean `SKILL.md` that
loads the always-on baseline and points to a library of references read on
demand, so editing a file never pulls the whole corpus into context.

| Skill          | Standardizes                                                                                                                                                                                                                                                                                                                       | Activation                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `typescript`   | The TypeScript entry point. Always-on baseline (naming, import ordering, strict type safety, named functions, parameter conventions) plus routed references: Effect-TS patterns (`Effect.gen`, `Effect.Schema`, `Effect.Service`, telemetry, logging, config, the HTTP boundary), Vitest testing, and the monorepo build pipeline. | Auto-applies on `**/*.ts`                                   |
| `package-json` | package.json for pnpm monorepos: pnpm-only, `"latest"` versions, ESM, the exports map, `workspace:*` links, standard build/check/clean/test scripts.                                                                                                                                                                               | Auto-applies on `**/package.json`                           |
| `pnpm`         | Workspace config: `pnpm-workspace.yaml` globs, catalogs, supply-chain safety (`minimumReleaseAge`, `trustPolicy`), build allowlists, peer-dependency rules, `.npmrc`.                                                                                                                                                              | Auto-applies on `**/pnpm-workspace.yaml` and `**/.npmrc`    |
| `tsconfig`     | Config layout: a strict shared `tsconfig.base.json`, per-project `tsconfig.json` with the `@/` path alias, a `tsconfig.build.json` emit variant, project references.                                                                                                                                                               | Auto-applies on `**/tsconfig.json` and `**/tsconfig.*.json` |

The `typescript` skill's reference library covers the former standalone skills:
**Effect-TS** patterns, **Vitest** testing, and the **build** pipeline (the `@/`
alias and `tsc-alias` rewriting, barrels, the clean→check→build:ts→build:alias
order, project references, turbo). Each loads only when the routed topic is
relevant.

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
