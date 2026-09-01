---
name: pnpm · Turborepo
axis: repo
kind: workspace
components:
- package-manager/pnpm@0.1.0
- build-orchestrator/turbo@generated
---

# Monorepo — pnpm · Turborepo

Repo-level tooling for a pnpm workspace, shared across its `projects/*` and
`packages/*` members. All-ESM TypeScript, built on Effect-TS.

## Workspace & builds

- **pnpm** workspace globbing `projects/*` and `packages/*`, with the
  supply-chain guards on (`minimumReleaseAge` cooldown,
  `trustPolicy:
  no-downgrade`, `verifyDepsBeforeRun`, an explicit native-build
  allowlist).
- **Turborepo** orchestrates `build` / `check` / `dev` / `lint` across members
  (`dependsOn: ["^build"]`, cached `dist/**` outputs); root scripts drive
  `turbo run … --filter=…`.
- **TypeScript** from a shared `tsconfig.base.json`: strict, `ESNext`,
  `moduleResolution: bundler`, `verbatimModuleSyntax`, composite with
  declarations, `noUncheckedIndexedAccess`, the `@effect/language-service`
  plugin. Each member emits via its own `tsconfig.build.json` + `tsc-alias` (the
  `@/*` internal path alias).

## Code quality

- **dprint** formats (one root config, symlinked into each member); **ESLint**
  lints; **gitleaks** and **grype** gate security — all wired through
  pre-commit: format → lint → tests.

## Tooling & config

- **mise** manages tools with the three-file `MISE_ENV` split under `.config/`:
  base runtime (`node`, `pnpm`), `dev` (formatters, linters, security tools, the
  local-dev env block), `ci` (production endpoints/overrides). File-based task
  library with per-project prefixes plus `all:*`, `code:*`, `release:*`.
- **Secrets** are injected by the manager the backing axis names — every
  dev/test script runs under its wrapper rather than reading a committed file.
  Config reaches code as env vars, parsed with Effect `Config` + `Schema`
  (invalid config fails startup).

## Local dev & build artifact

- **Local stack via Docker Compose** — the emulators/services the **backing**
  axis defines, with `wait-on` readiness gates. This repo provides the compose
  wiring; which services run in it is not this axis's choice.
- **One shared multi-stage Dockerfile** for all deployables (parameterized by
  `APP_NAME`; `turbo` build + `pnpm deploy --prod`), built with Docker Buildx
  Bake. Where that image is pushed and how it is released is the **deploy**
  axis.
- **Observability**: OpenTelemetry from every project; the collector endpoint
  comes from the backing axis.
