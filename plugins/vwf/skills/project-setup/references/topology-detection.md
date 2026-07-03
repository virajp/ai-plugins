# Topology Detection

Infer the project shape from repo signals **before** asking — then confirm by
MCQ.

**Monorepo vs polyrepo vs workspace:**

- `pnpm-workspace.yaml`, npm/yarn `workspaces`, `turbo.json`, `nx.json`, a Cargo
  workspace, or `go.work` → **monorepo**.
- a single `package.json` / `pubspec.yaml` / `go.mod` / `Cargo.toml` at the root
  with no workspace globs → **single-package** (a polyrepo member).
- a `.gitmodules` naming child repos (child dirs carrying their own `.git`) →
  **workspace**: a parent repo holding the vwf docs, with each child classified
  on its own signals. See the
  [workspace structure](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/workspace-structure.md)
  reference — the enforced shape, what to apply for a new/empty repo, and the
  restructure proposal a non-conforming existing repo gets.

**Project types** (map to the registry `type`, never literal tech):

- **schema/contract** — shared schema/contract package, proto, OpenAPI.
- **service/API** — an HTTP/RPC server.
- **worker** — a background / queue / cron processor.
- **frontend/app** — a web or mobile UI. **Its presence makes the design system
  mandatory** — confirm it explicitly.
- **console/admin UI** — a web-based back-office/admin app, cloud-hosted beside
  the service. A UI surface: **it too makes the design system mandatory**.

**Stacks** — read each manifest (`package.json` deps, `pubspec.yaml`, `go.mod`,
`Cargo.toml`, build files) and record the stack per project for the registry.

**Existing vwf state** — `docs/blueprint/` (current), `docs/specs/` (legacy,
pre-rename), or none.

Detection is a starting point, not the truth: present it and let the user
correct it via MCQ. Never assume a UI surface — it gates the design system.
