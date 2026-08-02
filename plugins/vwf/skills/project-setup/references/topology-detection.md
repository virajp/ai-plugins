# Topology Detection

Infer the project shape from repo signals **before** asking — then confirm by
MCQ.

**Monorepo vs polyrepo vs workspace:**

- `pnpm-workspace.yaml`, a `workspaces` field (npm/yarn/bun), `turbo.json`, or
  `nx.json` → **monorepo**.
- a single `package.json` / `pubspec.yaml` / `build.gradle(.kts)` /
  `Package.swift` at the root with no workspace globs → **single-package** (a
  polyrepo member).

- a `.gitmodules` naming child repos (child dirs carrying their own `.git`) →
  **workspace**: a parent repo holding the vwf docs, with each child classified
  on its own signals. See the
  [workspace structure](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/workspace-structure.md)
  reference — the enforced shape, what to apply for a new/empty repo, and the
  restructure proposal a non-conforming existing repo gets.

**Package manager** (JS/TS only, and only `pnpm` or `bun` — see the vwf-config
asset): `pnpm-lock.yaml` → pnpm, `bun.lock` / `bun.lockb` → bun. The lockfile is
the signal, since bun reuses npm's `workspaces` field. A repo carrying neither
is asked. Non-JS projects record their language's native tool, which was never a
choice.

Signals are scoped to the languages in
[stack-vocabulary](${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md). A repo
outside that set (a Go or Rust codebase) will **not** be detected and must be
described by the user — deliberate for now, and expected to widen as the
vocabulary does.

**Project roles** — six tokens, never literal tech. A project carries a **list**
of them in the registry's `roles` field, and order is precedence: the first owns
layout, testing and deploy.

- **`packages`** — shared schema/contract or library package, proto, OpenAPI.
- **`service`** — an HTTP/RPC server. Synonym: `api`.
- **`worker`** — a background / queue / cron processor.
- **`site`** — a web UI. **Its presence makes the design system mandatory** —
  confirm it explicitly. Synonym: `web`.
- **`frontend`** — a client-side app (mobile / tablet / desktop / auto). Also
  makes the design system mandatory. Synonym: `app`.
- **`infra`** — an IaC project (Pulumi, Terraform, …). Registered, but exempt
  from blueprint coverage.

An **operator back-office** is not its own role: record it as
`roles: [site, service]` plus the `operator-rbac` capability.

**Stacks** — read each manifest (`package.json` deps, `pubspec.yaml`,
`build.gradle(.kts)`, `Package.swift`) and record the stack per project for the
registry.

**Existing vwf state** — `docs/blueprint/` (current), `docs/specs/` (legacy,
pre-rename), or none.

Detection is a starting point, not the truth: present it and let the user
correct it via MCQ. Never assume a UI surface — it gates the design system.
