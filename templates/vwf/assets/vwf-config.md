# The vwf Config — `.config/vwf.yaml`

**How vwf operates in this product.** One file per product (the parent repo in
polyrepo topology; submodules never get their own), written by `<%= it.cmd("vwf:setup") %>` and
maintained by the workflow commands. It is the operating config, **never a copy
of the system description**: what the product *is* (projects, roles, paths,
capabilities, platforms) lives in `docs/blueprint/registry.yaml`; this file
holds how vwf treats it — plus, since **format 10**, the one fact about the
product that is realization rather than description: each project's **stack**.
That lives here precisely so no blueprint-authoring or reviewing surface can
reach it, which is what makes a vendor name in a blueprint doc structurally
impossible rather than merely discouraged. Since **format 11** the stack is
**structured** — a template selection plus the four axes `<%= it.cmd("vwf:doctor") %>` checks
the repo against — and is written for **every** project, always. Since
**format 13** every technology choice is **per project**: the backing and deploy
axes, the design tool and the CI tool all live under `projects.<name>`, because
a product may legitimately host its site on one cloud and its API on another,
and design its app in one tool and its website in another. Only `repo` (per
repo) and the canvas state under `design:` remain outside that scope. Since
**blueprint-format 6** this file replaces the old stamp at
`docs/blueprint/.vwf.yml`.

## Schema (config_format 13)

```yaml
config_format: 13 # this file's own schema version — setup migrates it
blueprint_format: 20 # the docs/blueprint format stamp

product:
  name: <product-name> # display name; the default mempalace wing

blueprint: # coverage stamp — written by <%= it.cmd("vwf:blueprint") %> after every sweep
  coverage: complete # complete | partial — <%= it.cmd("vwf:plan") %> halts unless complete
  remaining: [] # unresolved holes when partial: flows/<project>/<NNN>-<flow>, entities/<entity>, apis/<project>, screens/<project>/<NNN>-<flow>/<platform> (skipped visual review), density/<unit> (over its line budget — cleared by the sweep's condenser pass, or when the condenser reports every remaining line load-bearing), coherence; a flow not yet authored (unserved goal, missing standard flow) is named without its number — flows/<project>/<slug> — and takes its NNN when authored

topology: polyrepo # repo | monorepo | polyrepo — a MENU since format 19 (assets/topologies/), not enforced
topology_reason: <one
  line> # why this shape; recorded so it is never re-litigated
ui: true # a UI project exists → design-system required
integrations: true # external integration/secret exists → environment.md required

repo: # REPO-level tooling, the counterpart to a project's stack. One block per repo; in polyrepo topology the parent and each member carry their own
  stack:
    template: repo/<slug> # a repo-axis template from a stack plugin, or `custom`
    package_manager: <tool> # only where the language has one; the repo template names the permitted values
    tools: [] # open, lowercase-kebab — whatever the repo template names

projects: # per-project REALIZATION + nuances — no role/path keys, ever (those describe the system: registry.yaml)
  <project-name>:
    stack: # the CONCRETE technology, structured. Lives here (never registry.yaml) so the blueprint is structurally incapable of naming a vendor. Written for EVERY project, always — an absent block is drift, not "the default", because <%= it.cmd("vwf:doctor") %> cannot check what was never recorded
      template: project/<role>/<slug> # the PROJECT-axis template under assets/stacks/project/, or `custom`. NOT a default: <%= it.cmd("vwf:architecture") %> presents the menu and the user picks
      backing_template: [
        <slug>,
      ] # the BACKING axis, PER PROJECT since format 13 (was one product-wide `backing:` block). A LIST: one slug per capability the project needs — datastore, identity, queue, object storage, telemetry sink. `[]` when the project talks to no backing service at all (a `packages` or `frontend` project usually does not)
      deploy_template: <slug> # the DEPLOY axis, PER PROJECT since format 13 (was one product-wide `deploy:` block). A `frontend` project on a SCREEN platform sets this to `n/a`: it ships through a store, not a deploy target. A `cli` frontend sets `deploy/npm-package` — a package registry IS its target. An `iac` project sets `n/a`: it IS the deploy path
      package_manager: <tool> # optional — overrides repo.stack.package_manager for a hybrid repo mixing managers
      languages: [
        <token>,
      ] # CLOSED vocabulary — assets/stack-vocabulary.md. At least one; drives doctor's LSP + toolchain checks
      frameworks: [] # open, lowercase-kebab; 0..n. What the code is written against
      dependencies: [] # open, lowercase-kebab; the few that characterize the stack
      note: <one
        line> # optional — why this stack, when the reason is not obvious from the template name
    # NO `platforms:` key — a project's implemented surfaces are a system-shape fact and live in docs/blueprint/registry.yaml, the single source (format 19). Config carries realization: the stack and the design pins
    design: <tool-token> # the DESIGN TOOL for this project's surfaces — claude-design | lovable | stitch | … Per project since format 13 (was one product-wide `design.tool`): a product may design its website in one tool and its app in another. A TOOL token the design adapter recognises, NOT a plugin name — vwf never constructs a skill name from it (assets/design-adapter.md). Required for a UI project, absent for every other role
    cicd: <tool> # the CI SYSTEM that builds and releases this project — github-actions | gitlab-ci | … Per project since format 13, so a product whose projects ship through different pipelines can say so. Read ONLY by the `cicd` plugin, which resolves it to one of its per-tool references; vwf owns the delivery-pipeline CONTRACT (assets/delivery-pipeline.md) and never the mechanism. In a monorepo every project repeats the same value — accepted, since the key's scope follows the other three rather than inventing a fourth scoping rule
    coverage_target: <int> # per-project override of pipeline.coverage_target
    harness:
      health: </path or
        n/a> # override the GET /health convention, or declare no surface

harness: # workspace-level capability inventory (see the harness contract)
  dev: true
  e2e_local: true # or { present: true, task: <non-canonical name> }
  local_stack: true
  e2e_staging: false
  health: true
  screenshots: true

enforcement: # vwf's enforcement opt-outs
  # `structure:` was retired in format 19 and `stacks:` in format 10, for the same reason: both became MENUS (assets/topologies/, assets/stacks/), so no choice deviates from anything and none needs a waiver. A legacy `structure:` or `stacks:` block reads as drift — structure migrates into `topology` + `topology_reason`, stacks into projects.<name>.stack (its reason into `note`).
  rules: {} # <rule-id>: { waived: true, reason: <one line> } — e.g. standard-flows/<project>/<slug> waives a mandatory standard flow (assets/standard-flows.md); baseline/<rule>[/<unit>] waives an engineering-baseline rule product-wide or scoped (assets/engineering-baseline.md; boundary-validation never product-wide); pipeline/<rule>[/<unit>] waives a delivery-pipeline rule (assets/delivery-pipeline.md)

pipeline: # bounded knobs — see the hard floor below
  coverage_target: 100 # default coverage gate (per-project override above)
  review_round_cap: 4 # code→review loops before residuals become gaps
  models: {} # per-stage tier override, e.g. review: sonnet — ALWAYS reported at the gate as configured-vs-default
  execute_caps: {} # tighten-only: context/five_hour/seven_day below the shipped 65/90/80

environments: # <%= it.cmd("vwf:verify") %> targets — URLs only, NEVER secrets (those stay in environment.md by name + the secret manager by value); keys use the CANONICAL names development/staging/production per assets/delivery-pipeline.md — a synonym key (dev/test/stage/prod) is drift to propose fixing
  <env-name>:
    <project-name>: <base-url>

production_env: production # optional — names the release environment for <%= it.cmd("vwf:verify") %> (default: the env literally named "production")

design: # CANVAS STATE only — ids and flow names, never content. The design TOOL is not here: it is per project, at projects.<name>.design (format 13)
  design_system_id: <uuid> # UNIVERSAL — one per product: the design system <%= it.cmd("vwf:design-system") %> imports from, as the design tool identifies it (its own canvas project); every mockup push binds it
  projects: # one canvas design-system project per registry UI project PER PLATFORM — each platform canvas carries its own conventions CLAUDE.md (device frame, layout), so two platforms NEVER share a project; the same platform of two registry projects may share a uuid, as the product needs
    <registry-project>:
      <platform>: <uuid> # mobile | tablet | desktop | web | auto — the one vocabulary (assets/standard-flows.md), minus `cli`: a terminal surface has no canvas project
  flows_rendered: [] # flow PLATFORMS whose Screens have a current user-reviewed visual — entries are <project>/<NNN>-<flow>/<platform> (format 15: platform granularity, so a flow rendered for mobile but not auto is visibly partial); recorded by blueprint's §6a local render, by mockups (docs/scratchpad renders), and by screens import (canvas pages current), dropped by blueprint when a flow's Screens change unrendered; read by plan's soft visual-review advisory. Mockup renders live in the gitignored docs/scratchpad/<project>/<NNN>-<flow>/<platform>/ tree, NEVER on the canvas

memory:
  wing: <wing-name> # explicit mempalace wing; defaults to product.name

docs_sync:
  include: [] # extra human docs in the docs-sync scope (README/CLAUDE.md are always in)

setup_progress: [] # transient — <%= it.cmd("vwf:setup") %> resume state, removed on completion
```

## Semantics — who reads/writes what

| Section              | Written by                                                                                                                                | Read by                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| stamp keys           | `setup`                                                                                                                                   | every command's format check                                                                                    |
| `product` / `memory` | `setup` (confirmed with the user)                                                                                                         | every command's wing resolution                                                                                 |
| `blueprint`          | `blueprint` (after every sweep)                                                                                                           | `plan` (the coverage gate)                                                                                      |
| `projects.*`         | `setup` / `architecture` (`stack`, `design`, `cicd` — all elicited); `execute` reconcile                                                  | `plan`, `execute`, `doctor`, the verifiers, the design adapter (`design`) and the `cicd` plugin (`cicd`) — **never** `blueprint` or the reviewers, which must not see a stack |
| `repo`               | `setup` / `architecture` (elicited)                                                                                                       | `doctor`, `plan`, `execute`                                                                                     |
| `harness`            | `setup`; `execute` reconcile                                                                                                              | `plan` preflight, acceptance/ux verifiers, `verify`, `doctor`                                                   |
| `enforcement`        | `setup` / `architecture` (consented)                                                                                                      | `setup`, `architecture`, `blueprint`, the reviewers                                                             |
| `pipeline`           | the user (hand-edited)                                                                                                                    | `execute`, the statusline caps hook                                                                             |
| `environments`       | `setup` / `verify` (confirmed)                                                                                                            | `verify`                                                                                                        |
| `production_env`     | `setup` / `verify` (confirmed)                                                                                                            | `verify` (the release environment)                                                                              |
| `design`             | `design-system` (`design_system_id`); `screens` (`projects.*.*` pins — confirmed); `blueprint` / `mockups` / `screens` (`flows_rendered`) | `design-system`, `blueprint`, `mockups`, `screens`, `feedback`, `plan` (advisory) — the tool itself is `projects.<name>.design` |
| `docs_sync`          | the user (hand-edited)                                                                                                                    | the docs-sync step                                                                                              |

## The hard floor (never configurable)

No key in this file can disable: the **security review**, **TDD**, the
**approval gates** (including `plan`'s blueprint coverage gate and `execute`'s
final gate), the **blueprint/product/design-system reviewer bars**, the
**released-API compatibility gate** (breaking a contract under
`docs/blueprint/apis/released/` gates like a security finding — always fixed,
exempt from the review round cap), or the docs-sync step. A
`baseline/boundary-validation` waiver may only ever be **scoped to a named
unit** — a product-wide waiver of boundary validation is refused (unvalidated
boundaries are a security surface). `pipeline.models` may change a stage's tier
but the stage still runs — and any downgrade from the shipped default is stated
at that stage's gate. `pipeline.execute_caps` may only **tighten** (pause
earlier than 65/90/80), never loosen.

## Reading rules

- Commands read `.config/vwf.yaml`; when absent, fall back to the legacy
  `docs/blueprint/.vwf.yml` — its presence **is** format drift (pre-6): nudge
  `<%= it.cmd("vwf:setup") %>`, which performs the move as the `5 → 6` migration.
- Unknown keys are preserved, never stripped; missing sections mean "the shipped
  default" — an empty file is valid. Exception: a missing `blueprint:` block
  means **no sweep has stamped this repo** — `<%= it.cmd("vwf:plan") %>` halts until
  `<%= it.cmd("vwf:blueprint") %>` runs (self-healing on repos configured before config_format
  2).
- `config_format` versions this file's own schema; bump it (with a migration
  note here) when a key's shape changes.
- **`1 → 2` migration** (performed by `<%= it.cmd("vwf:setup") %>`): rename
  `pipeline.autopilot_caps` → `pipeline.execute_caps` (same shape and
  semantics); the statusline caps hook reads both names during the transition.
- **`2 → 3` migration** (performed by `<%= it.cmd("vwf:setup") %>`): bump the number — no key is
  reshaped. New semantics: the environment named `production` (or the one named
  by the new optional `production_env` key) is the **release environment** — a
  clean `<%= it.cmd("vwf:verify") %>` run against it offers to freeze each deployed service's
  OpenAPI contract into `docs/blueprint/apis/released/`; the frozen snapshots
  (not this file) are the release record. If your production environment is
  named differently, set `production_env`.
- **`3 → 4` migration** (performed by `<%= it.cmd("vwf:setup") %>`): rename `mockups:` →
  `design:` (`mockups.project_id` → `design.project_id`, same semantics — the
  pin now serves `design-system`, `mockups`, `feedback`, and `plan`, not just
  mockups). `design_system_id` and `flows_pushed` are new optional keys with no
  migration action. During the transition, readers fall back to the legacy
  `mockups.project_id` and treat its presence as `3` drift (nudge `<%= it.cmd("vwf:setup") %>`).
- **`4 → 5` migration** (performed by `<%= it.cmd("vwf:setup") %>`): the single
  `design.project_id` becomes the **per-registry-project map** `design.projects`
  — one entry per registry UI project, each keyed to the old shared uuid
  (sharing preserved; split later by re-pinning). The design system becomes
  **universal**: `design.design_system_id` is one per product, its own canvas
  project, no longer tied to a mockup project's uuid. `flows_pushed` is
  unchanged. Readers fall back to a legacy `design.project_id` (or the older
  `mockups.project_id`) as the shared pin for **every** UI project — its
  presence is `4` (or `3`) drift.
- **`5 → 6` migration** (performed by `<%= it.cmd("vwf:setup") %>`): each
  `design.projects.<registry-project>` entry becomes a **per-platform map** —
  one canvas project per platform, since each platform canvas carries its own
  conventions CLAUDE.md (device frame, layout; written by `<%= it.cmd("vwf:screens") %>`). An
  existing flat uuid becomes the pin for the project's **primary platform**
  (`mobile` for a `frontend` role, `desktop` for a `site` role); other declared
  platforms are pinned on next use (per the adapter contract). Readers fall back
  to a flat `design.projects.<registry-project>` uuid as that primary-platform
  pin — its presence is `5` drift. Two platforms must never share a uuid; a
  shared uuid found during migration is surfaced for re-pinning, never silently
  kept.
- **`6 → 7` migration** (performed by `<%= it.cmd("vwf:setup") %>`, alongside the blueprint
  `12 → 14` delta): every flow identifier stored in this file **drops its
  `<device>` segment**, since format 14 moved the device out of the flow path
  and into the flow doc's `device:` frontmatter key. Concretely
  `design.flows_pushed` entries go `<project>/<device>/<NNN>-<flow>` →
  `<project>/<NNN>-<flow>`, and `blueprint.remaining` `flows/…` and `screens/…`
  entries do the same. Purely mechanical — no pin, stamp, or coverage value
  changes. Readers honor a legacy entry carrying a device segment by matching on
  the trailing `<project>/<NNN>-<flow>` — its presence is `6` drift.
- **`7 → 8` migration** (performed by `<%= it.cmd("vwf:setup") %>`): `design.flows_pushed` is
  **renamed to `design.flows_rendered`** — mockups no longer push to the canvas;
  they render into the repo's gitignored `docs/scratchpad/` tree, and the stamp
  now records visual-review currency regardless of surface (a local scratchpad
  render, or canvas pages a screens import confirmed current). Entries are
  unchanged. Readers honor a legacy `flows_pushed` key as the same list — its
  presence is `7` drift. The `design.projects` pins stay: they serve
  `<%= it.cmd("vwf:screens") %>` and `<%= it.cmd("vwf:feedback") %> canvas`, no longer mockups.
- **`8 → 9` migration** (performed by `<%= it.cmd("vwf:setup") %>`, alongside the blueprint
  `14 → 15` delta): every flow identifier stored in this file **gains a
  `<platform>` leaf**, since format 15 moved screens into per-platform files.
  `design.flows_rendered` entries go `<project>/<NNN>-<flow>` →
  `<project>/<NNN>-<flow>/<platform>` (one entry per platform file the flow
  has), and `blueprint.remaining` `screens/…` entries do the same. The
  **platform vocabulary is rewritten** everywhere it appears (`design.projects`
  pins, `projects.<name>.platforms`): `carplay` and `android-auto` collapse to
  **`auto`** — two pins that collapse onto one platform are surfaced for
  re-pinning, never silently merged — and a `site`-role project's `desktop` pin
  becomes `web`. Flow numbers are renumbered by the blueprint migration; the
  entries here are rewritten to match. Readers honor a legacy entry without a
  platform leaf by matching the flow prefix — its presence is `8` drift.
- **`9 → 10` migration** (performed by `<%= it.cmd("vwf:setup") %>`, alongside the blueprint
  `15 → 16` delta): the **stack moves here from the registry**. For each project
  in the old `architecture.md` Project Registry, compare its `stack:` to the
  reference stack for its `type` (since format 11 the templates live at
  `assets/stacks/<type>/<slug>.md`; a repo migrating from 9 runs straight on
  into `10 → 11` below, which rewrites whatever this step produces):
  - **matches the reference** → write nothing. The absent key means "the
    reference stack", which is the normal case and keeps this file small.
  - **differs** → write `projects.<name>.stack` with the actual value, and
    `projects.<name>.stack_reason` taken from the matching legacy
    `enforcement.stacks.<project>.reason` (or `migrated — reason not recorded`
    when the legacy entry carried none).

  Then **drop `enforcement.stacks` entirely** — a deviation is now recorded
  once, where the stack lives, instead of as a value in the registry plus a
  waiver here. Readers honor a legacy `enforcement.stacks` block as `9` drift
  and read its `choice` as the project's stack.

  Nothing else reads a stack from the blueprint afterwards: `registry.yaml` has
  no `stack` key at all, which is what makes a vendor name in a blueprint doc a
  reviewer failure rather than a matter of authoring discipline.
- **`11 → 12` migration** (performed by `<%= it.cmd("vwf:setup") %>`): the config catches up
  with blueprint-format 19. Six changes, all mechanical except where noted:

  1. **`topology`** — `workspace` becomes `polyrepo` (the shape is unchanged: a
     parent repo with submodule members). Add **`topology_reason`**, carrying
     the existing `enforcement.structure` reason when one was recorded, else a
     one-line summary of why this shape. Then **drop `enforcement.structure`**
     entirely: topology is a menu now (`assets/topologies/`), so no choice
     deviates from anything and none needs a waiver — the same retirement
     `enforcement.stacks` got in format 11.
  2. **The stack splits into four axes.** `projects.<name>.stack.template`
     re-points from `<type>/<slug>` to `project/<role>/<slug>` (the templates
     moved under `assets/stacks/project/`). Add the product-wide **`backing`**
     and **`deploy`** blocks — this is the one step needing input, since the old
     monolithic templates carried a datastore and a host implicitly. Propose the
     backing and deploy templates matching what the repo is already running,
     read off its own config, and confirm rather than assume. A `frontend` project takes
     `deploy_template: n/a` — it ships through a store.
  3. **`repo.stack.package_manager`** narrows to what the repo template permits.
     A repo recording a manager the template does not list is drift to fix; a
     language with only one manager moves to having it implied. Optionally add
     a per-project `package_manager` where a hybrid repo mixes managers.
  4. **`design.tool`** is added, naming the adapter **plugin**. Default it to
     `claude-design` for any repo carrying a `design.design_system_id` — that is
     the tool it was already using. The pin itself stays, now adapter-scoped.
  5. **`memory`** — nothing changes in the config, but `<%= it.cmd("vwf:setup") %>` creates
     `docs/memory/` and gitignores `handoff/`, `doctor/` and `runs/`, then moves
     a pre-19 `docs/handoffs/next.md` to `docs/memory/handoff/next.md`.
  6. **`projects.<name>.platforms` is removed** — the registry is the single
     source. Merge each project's config list into its `platforms:` in
     `docs/blueprint/registry.yaml` (union, canonical vocabulary), then delete
     the key here. The two were written together and read apart, with nothing
     checking them against each other; a config-only platform surfaced as a
     reviewer rejection and a config-only `cli` silently skipped the design
     system's Terminal UX section. Report any project where the two lists
     disagreed — that divergence is a real finding, not noise.

  Bump `config_format` to `12` and `blueprint_format` to `19` together — the two
  migrations ship in one release and a repo on one but not the other is a state
  neither migration expects.

- **`12 → 13` migration** (performed by `<%= it.cmd("vwf:setup") %>`, alongside the blueprint
  `19 → 20` delta): **every technology axis becomes per project.** A product can
  legitimately mix providers — the site on one cloud, the API on another, the
  app designed in one tool and the website in another — and format 12 could not
  express any of it. Four keys move down into `projects.<name>`, and each move
  is the same two mechanical steps: **copy the product-wide value onto every
  project, then delete the product-wide key.** Copying down is what makes this
  safe — the repo's behaviour is byte-identical afterwards, and a project only
  diverges when the user later changes one.

  1. **`backing`** → `projects.<name>.stack.backing_template`, and the value
     becomes a **list**. A project already carrying a `backing_template`
     override keeps its own value (the override wins over the pin it was
     overriding); every other project takes the product-wide
     `backing.template`'s slug. Wrap a single slug as a one-element list. Then
     drop the top-level `backing:` block. A project the registry declares with
     no backing service at all — typically `packages`, and a `frontend` that
     talks only to a `service` — records `[]` rather than inheriting a slug it
     never used; propose that, do not assume it.
  2. **`deploy`** → `projects.<name>.stack.deploy_template`, unchanged in shape.
     Same override rule, and the existing `n/a` conventions carry over verbatim:
     a `frontend` on a screen platform stays `n/a`, a `cli` frontend stays
     `deploy/npm-package`. Then drop the top-level `deploy:` block.
  3. **`design.tool`** → `projects.<name>.design`, for every **UI** project only
     (`role` `site`, `fullstack` or `frontend` in `registry.yaml`) — a project
     with no surfaces never had a design tool and must not acquire one. Then
     drop `design.tool`; the rest of the `design:` block is canvas state and
     stays exactly where it is. A repo with no `design.tool` and a
     `design_system_id` takes `claude-design`, on the same reasoning the
     `11 → 12` migration used.
  4. **`cicd`** is **new** — there was no product-wide key to copy down. Detect
     it once from the repo (`.github/workflows/` → `github-actions`,
     `.gitlab-ci.yml` → `gitlab-ci`, `.circleci/config.yml` → `circleci`),
     **confirm with the user**, and write the confirmed token to every project.
     More than one signal, or none, is a question — never a guess. This is the
     only step here that needs input, and it is also the last place repo
     detection is legitimate: from `13` on the `cicd` plugin reads the key and
     asks when it is absent, rather than sniffing the repo behind the user's
     back.

  Report any project left without a required axis — that is a real finding
  `<%= it.cmd("vwf:doctor") %>` will raise on the next run, not noise.

  Bump `config_format` to `13` and `blueprint_format` to `20` together, for the
  same reason `12`/`19` shipped together.

- **`10 → 11` migration** (performed by `<%= it.cmd("vwf:setup") %>`): stacks stop being
  *enforced with an escape hatch* and become a **menu**, and the flat
  `projects.<name>.stack` list becomes the structured block above. Per project:
  - **had a `stack:` list** → map its entries onto the axes: tokens matching the
    closed language vocabulary (`assets/stack-vocabulary.md`) become
    `languages`, the rest split between `frameworks` and `dependencies` per that
    asset's rule. Set `template:` to the `assets/stacks/<type>/<slug>.md` whose
    frontmatter matches, else `custom`. Any `stack_reason` moves verbatim to
    `note` — the reason was recorded as a *deviation justification*, and under a
    menu there is nothing to deviate from, but the rationale is still worth
    keeping.
  - **had no `stack:` key** (the old "accept the reference" case) → **write the
    block out in full** from the template that was previously enforced for its
    `type`, with `template:` naming it. This is the load-bearing half of the
    migration: absence used to mean "read a prose doc and infer", and that
    indirection is what let a repo's real stack drift with nothing recording it.

  Then elicit the **`repo.stack`** block once (topology-appropriate templates
  from `assets/stacks/repo/`), and drop `enforcement.stacks` if a legacy block
  survived the `9 → 10` migration. Readers treat a flat list at
  `projects.<name>.stack`, or an absent block on a project the registry
  declares, as `10` drift.

  The stack templates moved in the same release: `assets/stacks/<type>.md` →
  `assets/stacks/<type>/<slug>.md`, each gaining machine-readable frontmatter. A
  link to the old flat path is `10` drift.
