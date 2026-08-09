# Topology Detection

Infer the project shape from repo signals **before** asking — then confirm by
MCQ.

**Which topology** (`repo` | `monorepo` | `polyrepo`):

- a **workspace declaration** — a manifest listing member globs, or a
  task-runner config spanning several projects → **monorepo**.
- a **single root manifest** with no workspace globs → **repo** (or, inside a
  parent, a polyrepo member).
- a `.gitmodules` naming child repos (child dirs carrying their own `.git`) →
  **polyrepo**: a parent repo holding the vwf docs, with each child classified
  on its own signals. See
  [structure](${CLAUDE_PLUGIN_ROOT}/skills/project-setup/references/workspace-structure.md)
  for the topology menu and how a choice is recorded.

Manifests are language-specific and vwf holds no list of them. Recognise the
manifest of any language a **stack plugin** in the config's `stacks:` roster
declares, and treat any other root manifest as a manifest all the same — a
project in a language nobody has written a plugin for is still a project.

**Package manager** — only where the language has more than one. The
**lockfile is the signal**, never the manifest: some ecosystems share a manifest
field across managers, so the manifest cannot distinguish them. The repo's
`repo`-axis stack template names which managers it permits and which lockfile
selects each; ask when a repo carries none of them. A language with one manager
records it without a question, because it was never a choice.

**An unrecognised manifest never fails detection.** The repo classifies on the
structural signals above regardless, and its language is recorded verbatim with
its facts marked `unknown`. Detection is **recognition**, and recognising a
language vwf has no plugin for is a legitimate scan result — it is what lets
setup describe the repo accurately instead of refusing to look at it.

**It does not follow that the repo is onboarded.** `unknown` is a **blocking**
finding, so setup's step-10 `/vwf:doctor` run halts on it: vwf's stack menu is
closed to what the installed plugins declare, and it will not plan or build
against a language none of them covers
([stack-vocabulary](${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md)). Detection
records the fact; the gate decides what it means. Onboarding completes once a
plugin declaring that language is installed.

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
- **`iac`** — an infrastructure-as-code project. Registered, but exempt from
  blueprint coverage, and **always its own repo** — never a directory inside
  another project's (`${CLAUDE_PLUGIN_ROOT}/assets/topologies/`). Synonym: `infra`.

An **operator back-office** is not its own role: record it as `role: fullstack`
plus the `operator-rbac` capability.

**Stacks** — read each manifest (`package.json` deps, `pubspec.yaml`,
`build.gradle(.kts)`, `Package.swift`) and record the stack per project for the
registry.

**Existing vwf state** — `docs/blueprint/` (current), `docs/specs/` (legacy,
pre-rename), or none.

Detection is a starting point, not the truth: present it and let the user
correct it via MCQ. Never assume a UI surface — it gates the design system.
