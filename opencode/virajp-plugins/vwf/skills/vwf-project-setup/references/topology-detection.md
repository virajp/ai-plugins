# Topology Detection

Infer the project shape from repo signals **before** asking — then confirm by
MCQ.

**Which topology** (`repo` | `monorepo` | `multi-repo`):

- a **workspace declaration** — a manifest listing member globs, or a
  task-runner config spanning several projects → **monorepo**.
- a **single root manifest** with no workspace globs → **repo** (or, inside a
  base repo, a multi-repo member).
- a `.gitmodules` naming child repos, **or** a `.config/vwf.yaml` carrying a
  `members:` list, **or** a `.config/vwf-membership.yaml` in this repo →
  **multi-repo**. See
  [structure](references/workspace-structure.md)
  for the topology menu and how a choice is recorded.

**Which linkage** — multi-repo only, recorded as `linkage:`:

- `.gitmodules` naming the members → **`submodule`**.
- a `members:` list whose paths escape the repo, with no `.gitmodules` →
  **`siblings`**.
- both → the submodules win, and the `members:` paths should already agree;
  report a disagreement rather than picking.

**Where the base repo is.** Resolve it per
[membership](%%AI_PLUGINS_ROOT%%/assets/membership.md) before anything else — a run
started inside a member must operate on the product, not on the one repo it
happens to be standing in. The base repo carries `.config/vwf.yaml`; every
member carries `.config/vwf-membership.yaml` and none carries the config.

**Which members are present.** Detect on every run; never read it from config
and never write it there. A member is present when its resolved `path` exists
and is a git work tree. A twenty-repo product with three cloned is a normal
state, not a degraded one — the absent-member sequence in
[membership](%%AI_PLUGINS_ROOT%%/assets/membership.md) is what handles the rest.

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
finding, so setup's step-10 `vwf-doctor` run halts on it: vwf's stack menu is
closed to what the installed plugins declare, and it will not plan or build
against a language none of them covers
([stack-vocabulary](%%AI_PLUGINS_ROOT%%/assets/stack-vocabulary.md)). Detection
records the fact; the gate decides what it means. Onboarding completes once a
plugin declaring that language is installed.

## Role and platforms

Since blueprint format 22 a project carries **one role** — the coarse domain
grouping — and **one or more platforms** from that role's closed list. Platforms
are what vwf branches on; the role is an index, never a gate.

| Role | Platforms |
| --- | --- |
| `backend` | `packages` `service` `worker` |
| `frontend` | `packages` `site` `webapp` `desktop` `mobile` `tablet` `auto` `cli` |
| `data` | `packages` `data-lake` `analytics` `ingestion` `ml-platform` |
| `system` | `packages` `iac` `plugin` `misc` `cicd` |

`packages` is available under every role; the role names the primary consumer
domain. A package consumed by both the API and the web app is a judgment call —
**ask**, never guess.

**One project may declare several platforms.** A single Flutter codebase
shipping mobile, tablet, desktop and web is **one** project with four platforms,
not four projects — flows are keyed on project name, so splitting it would
triplicate every flow doc.

What each platform obliges:

- **Screen platforms** — `site`, `webapp`, `desktop`, `mobile`, `tablet`,
  `auto`. Any of them makes the design system **mandatory** — confirm the
  surface explicitly, never assume it — mandates the standard flows, and gives
  each of the project's flow folders one `<platform>.md`. Every other platform
  is screenless and takes `index.md` alone.
- **`service`** — requires `apis/<project>.openapi.yaml` and a health endpoint.
  A project with `platforms: [service, webapp]` is what `fullstack` used to
  mean: one deployable publishing both an API contract and its own UI. SSR alone
  does not make a `site` a `service`.
- **`iac`** — registered, exempt from blueprint coverage, and **always its own
  repo**, never a directory inside another project's
  (`%%AI_PLUGINS_ROOT%%/assets/topologies/`).
- **Every `data` and `system` platform** — exempt from blueprint coverage. A doc
  shape for them is a later effort; until it exists their absence from the
  blueprint is by design, not a hole.

An **operator back-office** is not its own platform: record it as
`platforms: [service, webapp]` plus the `operator-rbac` capability.

**`iac` placement.** For every project declaring the `iac` platform, resolve
which repo's working tree its directory falls in. One sitting inside another
project's repo violates the own-repo rule — record it and carry it into the
migration plan as a restructure proposal.

**Stacks** — read each manifest and record the stack per project for the
config. The project-axis template a project pins must **cover** every platform
it declares (`%%AI_PLUGINS_ROOT%%/assets/stack-adapter.md`).

**Existing vwf state** — `docs/blueprint/` (current), `docs/specs/` (legacy,
pre-rename), or none.

Detection is a starting point, not the truth: present it and let the user
correct it via MCQ. Never assume a screen platform — it gates the design system.
