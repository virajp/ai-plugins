# pnpm in a monorepo

The **workspace-only** half of `pnpm-workspace.yaml`. Everything in the skill
itself — supply-chain safety, build allowlists, `overrides`, peer-dependency
rules, `.npmrc` — applies to a monorepo too and is not repeated here.

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

## Catalogs

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

## requiredScripts

A monorepo guard that every workspace defines the listed scripts — drop it in a
single-package repo.

```yaml
# Monorepo-only: every workspace must define these (keeps task fan-out honest)
requiredScripts:
  - clean
  - build
```
