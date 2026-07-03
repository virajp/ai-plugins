# Backend Monorepo — Reference Tooling

The tooling every backend monorepo (the `backend/` submodule) shares across its
`projects/*` and `packages/*` members. All-ESM TypeScript, built on Effect-TS.

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
- **Doppler** injects secrets — every dev/test script runs under
  `doppler run --`. Config reaches code as env vars, parsed with Effect
  `Config` + `Schema` (invalid config fails startup).

## Local dev & deployment

- **Local emulators via Docker Compose**: the Firebase emulator suite (Auth,
  Firestore, Storage), a Temporal dev server, and a Grafana OTel-LGTM stack —
  tests gate on them with `wait-on`.
- **Deploy target: Google Cloud Run.** One shared multi-stage Dockerfile for all
  deployables (parameterized by `APP_NAME`; Chainguard node base; `turbo`
  build + `pnpm deploy --prod`), built with Docker Buildx Bake, pushed to
  Artifact Registry, released via `gcloud run deploy` (mise `release:*` tasks or
  tag-triggered GitHub Actions).
- **Observability**: OpenTelemetry from every project, exported to Grafana
  Cloud.
