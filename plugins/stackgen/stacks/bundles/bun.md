---
name: bun · workspaces
axis: repo
kind: language-bundle
components:
- package-manager/bun@generated
---

# Monorepo — bun · workspaces

Repo-level tooling for a workspace whose package manager, runtime, bundler and
test runner are all [bun](https://bun.sh). The counterpart to the pnpm ·
Turborepo template: fewer moving parts, at the cost of a smaller ecosystem for
anything bun does not cover natively.

## Workspace & builds

- **bun workspaces** globbing `projects/*` and `packages/*` via the root
  `package.json` `workspaces` field, with `bun.lock` committed. Note that bun
  reuses npm's `workspaces` key, so the **lockfile** is what identifies the
  package manager — `/vwf:setup` detects it that way.
- **`bun run --filter`** orchestrates `build` / `check` / `dev` / `lint` across
  members. There is no separate task-graph tool: bun's own filtering plus mise
  tasks carry what Turborepo would.
- **TypeScript** from a shared `tsconfig.base.json`: strict, `ESNext`,
  `moduleResolution: bundler`, `verbatimModuleSyntax`,
  `noUncheckedIndexedAccess`. bun runs TypeScript directly, so a build step is
  only needed for published packages.

## Code quality

- **dprint** formats (one root config, symlinked into each member); **ESLint**
  lints; **gitleaks** and **grype** gate security — all wired through
  pre-commit: format → lint → tests.
- **`bun test`** is the test runner. A project needing Vitest-specific APIs
  keeps Vitest and runs it under bun; record that in the project's own template
  choice rather than here.

## Tooling & config

- **mise** manages tools with the three-file `MISE_ENV` split under `.config/`:
  base runtime (`bun`), `dev` (formatters, linters, security tools), `ci`
  (production endpoints/overrides). File-based task library with per-project
  prefixes plus `all:*`, `code:*`, `release:*`.
- **Secrets** are injected by the manager the backing axis names — every
  dev/test script runs under its wrapper rather than reading a committed file.

## Supply chain

bun installs are fast enough to make a cooldown feel unnecessary; set one
anyway. Pin the registry, commit `bun.lock`, and keep a trusted-dependencies
allowlist for postinstall scripts — bun blocks them by default, which is the
right posture.

## Local dev & build artifact

- **Local stack via Docker Compose** — the emulators/services the **backing**
  axis defines, with `wait-on` readiness gates.
- **One shared multi-stage Dockerfile** for all deployables, using bun's
  official base image and `bun install --production`. Where that image is pushed
  and how it is released is the **deploy** axis.
