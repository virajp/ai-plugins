---
name: package-json
version: 0.1.0
category: development
description: Opinionated package.json standards for pnpm monorepos — pnpm as
  the
  only package manager, "latest" versions, ESM, the exports map, workspace:*
  links, and the standard build/check/clean/test scripts. Auto-applies when
  editing any package.json.
license: MIT
user-invocable: false
paths:
  - "**/package.json"
---

# package.json Standards

pnpm is the **only** package manager (`packageManager: pnpm@11.x`). Never
`npm install` or `bun install`. Workspaces are defined in the root
`pnpm-workspace.yaml`.

## Versions

- Use `"latest"` for every dependency version — pinning is the lockfile's job
  (`pnpm-lock.yaml`).
- Local workspace packages link via the workspace protocol: `"workspace:*"`.
- After any `package.json` change, run `pnpm install` from the repo root.
- Commit `pnpm-lock.yaml` changes separately: `ops: update pnpm lockfile`.

## Module shape

- `"type": "module"` — ESM everywhere.
- `"private": true` on the root and any unpublished workspace.
- Publishable packages declare `"files"` (ship `./dist/` + `package.json`) and a
  multi-entry **exports map** that points each subpath at its built `.js` and
  `.d.ts`:

```json
{
  "name": "@scope/common",
  "type": "module",
  "exports": {
    "./effect": {
      "import": "./dist/effect/index.js",
      "types": "./dist/effect/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    }
  },
  "files": ["./dist/", "package.json"]
}
```

Add one `exports` entry per public barrel — consumers import
`@scope/common/utils`, never deep paths into `dist`.

## Standard scripts

Every buildable workspace exposes the same script vocabulary so monorepo tasks
and `pnpm-workspace.yaml`'s `requiredScripts` line up:

```json
{
  "scripts": {
    "build": "pnpm run clean && pnpm run check && pnpm run build:ts && pnpm run build:alias",
    "build:ts": "tsc -p tsconfig.build.json",
    "build:alias": "tsc-alias -p tsconfig.build.json",
    "check": "tsc -p tsconfig.build.json --noEmit",
    "clean": "rm -rf ./dist ./node_modules/.cache/* || true",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

- `build` always runs `clean → check → build:ts → build:alias` in order — type
  check before emit, rewrite `@/` aliases after (see the **build** skill).
- The root `package.json` orchestrates workspaces via `turbo run build` and
  `pnpm run --filter '<pkg>' <script>`; keep cross-workspace fan-out there.
- Dev runs use `tsx`; never commit a script that runs `vitest run` directly when
  it needs emulators or secrets — wrap it in the relevant runner.

The `@/` alias needs two **devDependencies** in every package that uses it (the
alias itself is declared in `tsconfig.json` — see the **tsconfig** skill):

```jsonc
{
  "devDependencies": {
    "tsc-alias": "latest", // build:alias — rewrites @/ → relative paths in dist
    "vite-tsconfig-paths": "latest", // resolves @/ in Vitest (see the vitest skill)
  },
}
```

`tsx` resolves `@/` from the tsconfig directly, so dev runs need nothing extra.
