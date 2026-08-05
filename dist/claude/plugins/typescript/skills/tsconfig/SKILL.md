---
name: tsconfig
version: 0.1.1
category: development
description: Opinionated TypeScript config layout for single-package repos and
  pnpm monorepos — a strict shared tsconfig.base.json, per-project tsconfig.json
  with the @/ path alias, a tsconfig.build.json emit variant, and (in a
  workspace) project references. Auto-applies when editing any tsconfig file.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write
paths:
  - "**/tsconfig.json"
  - "**/tsconfig.*.json"
---

# TypeScript Configuration

Three layers, each with one job:

1. `tsconfig.base.json` — shared strict compiler settings.
2. `tsconfig.json` — extends base, adds the `@/` alias (+ references in a
   workspace); used for editor/type-checking (`noEmit`).
3. `tsconfig.build.json` — extends the local config, flips the emit flags on;
   used by `tsc` and `tsc-alias` to produce `dist/`.

This split applies to **any repo shape**. In a **single-package** repo all three
files sit at the root and `tsconfig.json` extends `./tsconfig.base.json`. In a
**monorepo** `tsconfig.base.json` lives at the repo root and each package's
`tsconfig.json` extends it via a relative path and adds project `references` —
the extra machinery is called out in each section below.

## tsconfig.base.json (root)

Strict, modern, bundler-style resolution, declarations on for project refs:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "lib": ["esnext"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "noEmit": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["node"],
    "plugins": [{ "name": "@effect/language-service" }],
  },
  "exclude": ["**/node_modules", "**/dist", "**/coverage"],
}
```

- Keep **all** strict flags on; add `noUncheckedIndexedAccess` and the
  `noUnused*` pair — they catch real bugs.
- `composite` + `declaration` are required for project references
  (**monorepo**); they're harmless in a single-package repo, so keep the base
  identical rather than forking it.
- Register `@effect/language-service` in `plugins` for Effect-aware diagnostics
  (Effect codebases only).

## Per-project tsconfig.json

Extends the base and declares the `@/*` alias. In a single-package repo this is
the whole file:

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": ".",
    "outDir": "./dist/",
    "paths": { "@/*": ["./src/*"] },
  },
  "include": ["src/**/*.ts", "src/**/*.json"],
}
```

- `@/*` → `./src/*` is the in-package alias (see the **build** reference for how
  it survives compilation).

### Monorepo: extends path + references

In a workspace, each package's `tsconfig.json` extends the **root** base by a
relative path and adds `references` to each upstream workspace dependency's
`tsconfig.build.json`, so `tsc --build` orders the graph correctly:

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": ".",
    "outDir": "./dist/",
    "paths": { "@/*": ["./src/*"] },
  },
  "include": ["src/**/*.ts", "src/**/*.json"],
  "references": [{ "path": "../../packages/common/tsconfig.build.json" }],
}
```

## tsconfig.build.json (emit variant)

Extends the local `tsconfig.json` and turns emit **on**, excluding tests. This
is the file `tsc` and `tsc-alias` actually run against:

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "allowImportingTsExtensions": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
  },
  "include": ["src/**/*.ts", "src/**/*.json"],
  "exclude": [
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.typetest.ts",
    "src/_testUtils/**",
  ],
  "tsc-alias": {
    "replacers": { "base-url": { "enabled": false } },
  },
}
```

- `allowImportingTsExtensions` must be **off** for emit (it's on in base for the
  editor).
- The `tsc-alias` block belongs here, next to the config it rewrites.
- Vitest needs no path config — `vite-tsconfig-paths` reads these `paths`
  directly.
