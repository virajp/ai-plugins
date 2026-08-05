---
name: package-json
version: 0.2.0
category: development
description: Opinionated package.json standards for single-package repos and
  pnpm monorepos — pnpm as the only package manager, "latest" versions, ESM, the
  exports map, the standard build/check/clean/test scripts, and (in a workspace)
  workspace:* links. Auto-applies when editing any package.json.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/package.json"
---

# package.json Standards

pnpm is the **only** package manager (`packageManager: pnpm@11.x`). Never
`npm install` or `bun install`. These standards hold for a **single-package**
repo and a **monorepo** alike; the workspace-only additions (`workspace:*`
links, the root orchestrator, `requiredScripts`) are marked as such. In a
monorepo the workspace globs live in the root `pnpm-workspace.yaml` (see the
**pnpm** skill).

## Adding dependencies

- **Ask first.** Never add a new package to `dependencies`/`devDependencies` (or
  run `pnpm add`) without the user's explicit consent — name the package, what
  it's for, and why the stdlib or an already-installed dependency can't cover
  it, then wait for a yes. This holds even for packages a skill or standard
  recommends (e.g. the `@/`-alias devDependencies below).

## Versions

- Use `"latest"` for every dependency version — pinning is the lockfile's job
  (`pnpm-lock.yaml`).
- After any `package.json` change, run `pnpm install` from the repo root.
- Commit `pnpm-lock.yaml` changes separately: `ops: update pnpm lockfile`.
- **Monorepo:** local workspace packages link via the workspace protocol:
  `"workspace:*"`.

## Module shape

- `"type": "module"` — ESM everywhere.
- `"private": true` on anything unpublished — a single-package app, and (in a
  monorepo) the root plus any unpublished workspace.
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

Every buildable package — the lone package in a single-package repo, or each
workspace in a monorepo — exposes the same script vocabulary (so in a monorepo
`pnpm-workspace.yaml`'s `requiredScripts` line up):

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
  check before emit, rewrite `@/` aliases after (see the **build** reference).
- **Monorepo:** the root `package.json` orchestrates workspaces via
  `turbo run build` and `pnpm run --filter '<pkg>' <script>`; keep
  cross-workspace fan-out there, per-package scripts stay single-package.
- Dev runs use `tsx`; never commit a script that runs `vitest run` directly when
  it needs emulators or secrets — wrap it in the relevant runner.

The `@/` alias needs two **devDependencies** in every package that uses it (the
alias itself is declared in `tsconfig.json` — see the **tsconfig** skill):

```jsonc
{
  "devDependencies": {
    "tsc-alias": "latest", // build:alias — rewrites @/ → relative paths in dist
    "vite-tsconfig-paths": "latest", // resolves @/ in Vitest (see the vitest reference)
  },
}
```

`tsx` resolves `@/` from the tsconfig directly, so dev runs need nothing extra.
