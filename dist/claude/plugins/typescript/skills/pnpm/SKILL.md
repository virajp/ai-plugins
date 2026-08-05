---
name: pnpm
version: 0.2.1
category: development
description: Opinionated pnpm configuration for single-package repos and
  monorepos — pnpm-workspace.yaml as pnpm's settings file (supply-chain safety
  via minimumReleaseAge/trustPolicy, build allowlists, overrides, peer-dependency
  rules, .npmrc) plus the monorepo layout (package globs, workspace linking,
  catalogs, requiredScripts). Auto-applies when editing pnpm-workspace.yaml or
  .npmrc.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/pnpm-workspace.yaml"
  - "**/.npmrc"
---

# pnpm Configuration

`pnpm-workspace.yaml` at the repo root is where pnpm's behavior is configured —
**for any repo, single-package or monorepo.** The supply-chain, build-allowlist,
override, and peer-dependency sections below apply everywhere; a single-package
repo keeps this file for exactly those settings and simply omits the
workspace-layout section (`packages`, linking, catalogs, `requiredScripts`),
which only a monorepo needs. Group settings by intent and keep a short comment
(often a `https://pnpm.io/settings#...` link) above any non-obvious key.

## Monorepo: workspace layout & linking

> Workspace-only — omit in a single-package repo.

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

## Monorepo: catalogs

> Workspace-only — a single-package repo has nothing to share, so skip this.

When several workspace packages share a dependency, pin its version **once** in
a catalog so they can never drift apart. Define a default catalog (and optional
named catalogs for staged migrations); packages then reference `catalog:`
instead of a literal range.

```yaml
# pnpm-workspace.yaml
catalog:
  react: ^18.2.0
  react-dom: ^18.2.0

catalogs:
  # referenced as "catalog:react17"
  react17:
    react: ^17.0.2
    react-dom: ^17.0.2
```

```json
// a package's package.json
{
  "dependencies": {
    "react": "catalog:", // default catalog
    "react-dom": "catalog:react17" // a named catalog
  }
}
```

`catalog:` resolves to the default catalog; `catalog:<name>` to a named one.
Bump the version in the catalog and every package follows — a single source of
truth that the lockfile then pins. Use catalogs for cross-package shared deps;
leave single-package deps as-is.

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

## overrides & (monorepo) requiredScripts

`overrides` applies to any repo; `requiredScripts` is a monorepo guard that
every workspace defines the listed scripts — drop it in a single-package repo.

```yaml
# Pin transitive deps up to a safe floor (usually for advisories) — any repo
overrides:
  "yaml": ">=2.8.3"
  "uuid": ">=11.1.1"

# Monorepo-only: every workspace must define these (keeps task fan-out honest)
requiredScripts:
  - clean
  - build
```

## Peer dependencies

pnpm auto-installs missing peers by default (`autoInstallPeers: true`). When a
peer warning is a genuine version mismatch, fix the real version — don't mute
it. For warnings you've verified are safe, silence them narrowly with
`peerDependencyRules`:

```yaml
peerDependencyRules:
  # Suppress unmet-peer warnings only for a specific parent>peer pairing
  allowedVersions:
    "react-dom>react": "18"
  # Don't warn about missing peers matching these patterns
  ignoreMissing:
    - "@babel/*"
  # Accept any peer version for these patterns (broadest — use sparingly)
  allowAny:
    - "eslint"
```

Prefer `allowedVersions` (scoped to one pairing) over `ignoreMissing`, and reach
for `allowAny` last — each one widens what you stop being warned about.

## .npmrc

Minimal and security-leaning:

```ini
fund=false
ignore-scripts=true
```

`ignore-scripts=true` neutralizes arbitrary install-time code; the
`onlyBuiltDependencies`/`allowBuilds` allowlists above re-enable builds only
where needed.
