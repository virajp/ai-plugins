# pnpm supply chain & settings

`pnpm-workspace.yaml` at the repo root is where pnpm's behavior is configured —
**for any repo shape, single-package or monorepo.** Everything on this page
applies everywhere; a single-package repo keeps this file for exactly these
settings and simply omits the workspace-layout half (`packages`, linking,
catalogs, `requiredScripts`), which is in
[references/workspace.md](workspace.md). Group settings by intent and keep a
short comment (often a `https://pnpm.io/settings#...` link) above any
non-obvious key.

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

## overrides

`overrides` applies to any repo shape. (`requiredScripts`, the monorepo guard
that every workspace defines the listed scripts, is in the workspace
reference.)

```yaml
# Pin transitive deps up to a safe floor (usually for advisories) — any repo
overrides:
  "yaml": ">=2.8.3"
  "uuid": ">=11.1.1"
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

Prefer `allowedVersions` (scoped to one pairing) over `ignoreMissing`, and
reach for `allowAny` last — each one widens what you stop being warned about.

## .npmrc

Minimal and security-leaning:

```ini
fund=false
ignore-scripts=true
```

`ignore-scripts=true` neutralizes arbitrary install-time code; the
`onlyBuiltDependencies`/`allowBuilds` allowlists above re-enable builds only
where needed.
