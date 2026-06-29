---
name: tsconfig
version: 0.1.0
category: development
description: Opinionated TypeScript config layout for pnpm monorepos — a
  strict
  shared tsconfig.base.json, per-project tsconfig.json with the @/ path alias, a
  tsconfig.build.json emit variant, and project references. Auto-applies when
  editing any tsconfig file.
license: MIT
user-invocable: false
paths:
  - "**/tsconfig.json"
  - "**/tsconfig.*.json"
---

# TypeScript Configuration

Three layers, each with one job:

1. `tsconfig.base.json` (repo root) — shared strict compiler settings.
2. `<workspace>/tsconfig.json` — extends base, adds the `@/` alias + references;
   used for editor/type-checking (`noEmit`).
3. `<workspace>/tsconfig.build.json` — extends the local config, flips the emit
   flags on; used by `tsc` and `tsc-alias` to produce `dist/`.

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
- `composite` + `declaration` are required for project references to work.
- Register `@effect/language-service` in `plugins` for Effect-aware diagnostics.

## Per-project tsconfig.json

Extends the base, declares the `@/*` alias, and `references` upstream workspace
packages by their **build** config:

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

- `@/*` → `./src/*` is the in-package alias (see the **build** reference for how
  it survives compilation).
- Reference each workspace dependency's `tsconfig.build.json` so `tsc --build`
  orders the graph correctly.

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
