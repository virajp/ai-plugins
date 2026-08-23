---
axis: repo
name: pnpm · workspace
topologies: [ monorepo, workspace ]
package_manager: pnpm
tools: [ dprint, eslint, mise ]
---

# Monorepo — pnpm · workspace

Repo-level tooling for a pnpm workspace whose members are few enough that a
build orchestrator earns nothing. The task runner is the only orchestration,
and members are globbed by name rather than by a `projects/*` convention.

Pick this over [pnpm · Turborepo](pnpm-turbo.md) when the repo has a handful of
members with a shallow dependency graph, or when most of what it ships is not
compiled at all. Turborepo's caching and `dependsOn` graph pay for themselves
across many members that build in sequence; across two or three they are a
config file and a daemon that buy nothing back.

## Workspace & builds

- **pnpm** workspace listing its members explicitly in `pnpm-workspace.yaml`,
  with the supply-chain guards on (`minimumReleaseAge` cooldown, an explicit
  native-build allowlist). No `projects/*` or `packages/*` convention is
  assumed — a repo with three members names all three.
- **No build orchestrator.** Members are built and checked by task-runner
  tasks, one per member or one that walks them. Nothing computes a task graph,
  so a member whose build depends on another's output states that ordering in
  the task itself.
- **TypeScript** from a shared `tsconfig.base.json`: strict, `ESNext`,
  `moduleResolution: bundler`, `verbatimModuleSyntax`,
  `noUncheckedIndexedAccess`. Per-project `tsconfig.json` with the `@/*` path
  alias. Project references are optional here and often skipped — with no
  orchestrator to exploit them, `tsc --noEmit` per project is the simpler gate.

## Code quality

- **dprint** formats (one root config); **ESLint** lints; **gitleaks** and
  **grype** gate security — all wired through pre-commit, which calls the same
  task-runner tasks CI does, so one command runs in both places.

## Tooling & config

- **mise** manages tools with the three-file `MISE_ENV` split under `.config/`:
  base runtime (`node`, `pnpm`), `dev` (formatters, linters, security tools),
  `ci` (CI-only tools and overrides). The file-based task library is the
  orchestration layer this axis has instead of Turborepo — per-member prefixes
  plus `code:*` and `setup:*`.
- **Secrets** are injected by the manager the backing axis names — every
  dev/test script runs under its wrapper rather than reading a committed file.

## Local dev & build artifact

- **Local stack** is whatever the **backing** axis defines. A repo with no
  backing services needs none, and this axis mandates no Docker for its own
  sake.
- **The build artifact is the deploy axis's** — this axis bundles nothing on
  its own. A repo whose members publish to a registry takes `npm-package`; one
  that ships a container takes a container deploy template.
