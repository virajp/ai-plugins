---
name: pnpm
version: 0.1.0
category: development
description: Opinionated pnpm workspace configuration — pnpm-workspace.yaml
  globs,
  supply-chain safety (minimumReleaseAge, trustPolicy), workspace linking, build
  allowlists, and .npmrc. Auto-applies when editing pnpm-workspace.yaml or .npmrc.
license: MIT
user-invocable: false
paths:
  - "**/pnpm-workspace.yaml"
  - "**/.npmrc"
---

# pnpm Workspace Configuration

`pnpm-workspace.yaml` at the repo root is the single source of truth for the
monorepo layout and pnpm's behavior. Group settings by intent and keep a short
comment (often a `https://pnpm.io/settings#...` link) above any non-obvious key.

## Workspace layout & linking

```yaml
packages:
  - projects/*
  - packages/*

# Use the workspace protocol for local packages
linkWorkspacePackages: deep
# Copy (not symlink) workspace deps so builds match what ships
injectWorkspacePackages: true
# Install the package manager version pinned in package.json
managePackageManagerVersions: true
```

## Supply-chain safety

```yaml
# Minimum age (minutes) before a release can be auto-adopted — 1440 = 24h
minimumReleaseAge: 1440
minimumReleaseAgeExclude:
  - "@scope/*" # your own packages publish and consume immediately
  - "typescript"
  - "@types/node"

# https://pnpm.io/settings#trustpolicy
trustPolicy: no-downgrade
trustPolicyIgnoreAfter: 43200 # 30 days, in minutes

blockExoticSubdeps: true # https://pnpm.io/settings#blockexoticsubdeps
verifyDepsBeforeRun: error # fail fast if node_modules is stale
strictDepBuilds: true
```

`minimumReleaseAge` is the main defense against a freshly-compromised release —
keep it on, and only exclude packages you control plus low-risk pins.

## Build allowlists

Postinstall/build scripts are blocked by default (`.npmrc` sets
`ignore-scripts=true`). Allowlist the few packages that genuinely need to build
native code:

```yaml
onlyBuiltDependencies:
  - "@parcel/watcher"
  - "@swc/core"
  - esbuild
  - protobufjs
allowBuilds:
  "@swc/core": true
  esbuild: true
```

## requiredScripts & overrides

```yaml
# Every workspace must define these (keeps monorepo task fan-out honest)
requiredScripts:
  - clean
  - build

# Pin transitive deps up to a safe floor (usually for advisories)
overrides:
  "yaml": ">=2.8.3"
  "uuid": ">=11.1.1"
```

## .npmrc

Minimal and security-leaning:

```ini
fund=false
ignore-scripts=true
```

`ignore-scripts=true` neutralizes arbitrary install-time code; the
`onlyBuiltDependencies`/`allowBuilds` allowlists above re-enable builds only
where needed.
