# Topology Detection

Infer the project shape from repo signals **before** asking — then confirm by
MCQ.

**Which topology** (`repo` | `monorepo` | `polyrepo`):

- `pnpm-workspace.yaml`, a `workspaces` field (npm/yarn/bun), `turbo.json`, or
  `nx.json` → **monorepo**.
- a single `package.json` / `pubspec.yaml` / `build.gradle(.kts)` /
  `Package.swift` at the root with no workspace globs → **repo** (or, inside a
  parent, a polyrepo member).
- a `.gitmodules` naming child repos (child dirs carrying their own `.git`) →
  **polyrepo**: a parent repo holding the vwf docs, with each child classified
  on its own signals. See
  [structure](%%AI_PLUGINS_ROOT%%/skills/project-setup/references/workspace-structure.md)
  for the topology menu and how a choice is recorded.

**Package manager** (JS/TS only, and only `pnpm` or `bun` — see the vwf-config
asset): `pnpm-lock.yaml` → pnpm, `bun.lock` / `bun.lockb` → bun. The lockfile is
the signal, since bun reuses npm's `workspaces` field. A repo carrying neither
is asked. Non-JS projects record their language's native tool, which was never a
choice.

Signals are scoped to the languages in
[stack-vocabulary](%%AI_PLUGINS_ROOT%%/assets/stack-vocabulary.md). A repo
outside that set (a Go or Rust codebase) will **not** be detected and must be
described by the user — deliberate for now, and expected to widen as the
vocabulary does.

**Project role** — seven tokens, never literal tech. Each project carries
exactly one, in the registry's `role` field.

- **`packages`** — shared schema/contract or library package, proto, OpenAPI.
- **`service`** — an HTTP/RPC server with no UI. Synonym: `api`.
- **`worker`** — a background / queue / cron processor.
- **`site`** — a web UI that calls someone else's API. **Its presence makes the
  design system mandatory** — confirm it explicitly. Synonym: `web`.
- **`fullstack`** — a web UI that also **publishes its own API**, as one
  deployable. Requires `apis/<project>.openapi.yaml` and a health endpoint, and
  makes the design system mandatory. SSR alone does not make a site fullstack.
- **`frontend`** — a client-side app (mobile / tablet / desktop / auto). Also
  makes the design system mandatory. Synonym: `app`.
- **`infra`** — an IaC project (Pulumi, Terraform, …). Registered, but exempt
  from blueprint coverage.

An **operator back-office** is not its own role: record it as `role: fullstack`
plus the `operator-rbac` capability.

**Stacks** — read each manifest (`package.json` deps, `pubspec.yaml`,
`build.gradle(.kts)`, `Package.swift`) and record the stack per project for the
registry.

**Existing vwf state** — `docs/blueprint/` (current), `docs/specs/` (legacy,
pre-rename), or none.

Detection is a starting point, not the truth: present it and let the user
correct it via MCQ. Never assume a UI surface — it gates the design system.
