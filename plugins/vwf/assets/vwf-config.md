# The vwf Config — `.config/vwf.yaml`

**How vwf operates in this product.** One file per product — in the **base
repo** under `multi-repo` topology; members never get their own, they carry
`.config/vwf-membership.yaml` instead (`${CLAUDE_PLUGIN_ROOT}/assets/membership.md`).
Written by `/vwf:setup` and
maintained by the workflow commands. It is the operating config, **never a copy
of the system description**: what the product *is* (projects, roles, paths,
capabilities, platforms) lives in `docs/blueprint/registry.yaml`; this file
holds how vwf treats it — plus, since **format 10**, the one fact about the
product that is realization rather than description: each project's **stack**.
That lives here precisely so no blueprint-authoring or reviewing surface can
reach it, which is what makes a vendor name in a blueprint doc structurally
impossible rather than merely discouraged. Since **format 11** the stack is
**structured** — a template selection plus the six axes `/vwf:doctor` checks
the repo against — and is written for **every** project, always. Since
**format 13** every technology choice is **per project**: the backing and deploy
axes, the design tool and the CI tool all live under `projects.<name>`, because
a product may legitimately host its site on one cloud and its API on another,
and design its app in one tool and its website in another. Only `repo` (per
repo) and the canvas state under `design:` remain outside that scope. Since
**format 14** the stack is **closed to the menu**: every axis pins a template an
installed stack plugin ships and every language token is one such a plugin
declares, `template: custom` is retired, and anything outside that is a blocking
`/vwf:doctor` finding rather than a value recorded and then ignored. Since
**format 15** a multi-repo product no longer has to be a submodule parent: the
`members:` list names each repo, where to clone it from, and which registry
projects live in it, and `linkage:` records whether they are wired as submodules
or are plain siblings. Since **format 16** an axis has a third state,
`unresolved` — *not answered yet* — which is what lets a product be **defined**
before a stack is chosen, and the deploy axis is a **list**, because a project
may ship through more than one delivery mechanism. Since **blueprint-format 6**
this file replaces the old stamp at `docs/blueprint/.vwf.yml`.

## Schema (config_format 16)

```yaml
config_format: 16 # this file's own schema version — setup migrates it
blueprint_format: 24 # the docs/blueprint format stamp

product:
  name: <product-name> # display name; the default mempalace wing

blueprint: # coverage stamp — written by /vwf:blueprint after every sweep
  coverage: complete # complete | partial — /vwf:plan halts unless complete
  remaining: [] # unresolved holes when partial: flows/<project>/<NNN>-<flow>, entities/<entity>, apis/<project>, screens/<project>/<NNN>-<flow>/<platform> (skipped visual review), density/<unit> (over its line budget — cleared by the sweep's condenser pass, or when the condenser reports every remaining line load-bearing), coherence; a flow not yet authored (unserved goal, missing standard flow) is named without its number — flows/<project>/<slug> — and takes its NNN when authored

topology: multi-repo # repo | monorepo | multi-repo — a MENU since format 19 (assets/topologies/), not enforced. `polyrepo` was renamed in config_format 15, which also stopped requiring submodules
topology_reason: <one
  line> # why this shape; recorded so it is never re-litigated
linkage: siblings # MULTI-REPO ONLY: submodule (recommended) | siblings. How the members are wired, NOT how many are cloned — see `members:` below
ui: true # a SCREEN platform exists on some project → design-system required
integrations: true # external integration/secret exists → environment.md required

members: # MULTI-REPO ONLY (format 15). One entry per member repo; the BASE repo declares them and each member back-links in .config/vwf-membership.yaml. Absent under `repo`/`monorepo`, where the product is one checkout
  - name: <member-name>
    path: <../relative-path> # resolved from the BASE repo root. Under `submodule` linkage this is the submodule path; under `siblings` it usually escapes the repo
    url: <git-remote> # REQUIRED — the absent-member clone offer has nothing to clone from without it. Derivable from .gitmodules under submodule linkage, but recorded uniformly so member resolution has ONE shape
    projects: [ <project-name>, <...> ] # which registry projects live in this repo. The registry names WHAT exists; this names WHERE
# There is NO `present:`/`cloned:` key, and there never will be. Which members are on this machine is per-developer state that changes daily — it is DETECTED every run (assets/membership.md). A committed key would be one laptop asserted as the product's shape

repo: # REPO-level tooling, the counterpart to a project's stack. One block per repo; in multi-repo topology the base and each member carry their own
  stack:
    template: repo/<slug> # a repo-axis template an INSTALLED stack plugin ships, or `unresolved` (format 16 — deferred, see The three axis states). No `custom` — that value was retired in format 14; nothing on the menu means a halt, not a free-text pin
    package_manager: <tool> # only where the language has one; the repo template names the permitted values
    tools: [] # open, lowercase-kebab — whatever the repo template names

projects: # per-project REALIZATION + nuances — no role/path keys, ever (those describe the system: registry.yaml)
  <project-name>:
    stack: # the CONCRETE technology, structured. Lives here (never registry.yaml) so the blueprint is structurally incapable of naming a vendor. Written for EVERY project, always — an absent block is drift, not "the default", because /vwf:doctor cannot check what was never recorded
      template: project/<slug> # the PROJECT-axis template, from an INSTALLED stack plugin, or `unresolved` (format 16 — deferred, see The three axis states). NOT a default: /vwf:architecture presents the menu and the user picks. `custom` was RETIRED in format 14 — the menu is the whole vocabulary, and a platform nothing fits halts rather than recording free text. Format 15 dropped the `<role>/` path segment: a template declares the platforms it serves in its own frontmatter (one template can serve several — a Flutter template covers mobile+tablet+desktop+webapp), which a directory name cannot express. The pin must COVER every platform this project declares in the registry
      backing_template: [
        <slug>,
      ] # the BACKING axis, PER PROJECT since format 13 (was one product-wide `backing:` block). A LIST: one slug per capability the project needs — datastore, identity, queue, object storage, telemetry sink. `[]` when the project talks to no backing service at all (a `packages` platform, or a client app talking only to a `service`, usually does not). `unresolved` — the bare scalar, never an element — when the axis is deferred
      deploy_template: [
        <slug>,
      ] # the DEPLOY axis, PER PROJECT since format 13 (was one product-wide `deploy:` block). A LIST since format 16, the same shape change `backing_template` made in 13: one slug per DELIVERY MECHANISM the project ships through, because a project routinely has more than one — a `cli` may publish to a package registry AND a container image AND a signed archive, and format 15 could record exactly one. Keyed on PLATFORM: a project whose platforms are all SCREEN platforms other than `site`/`webapp` — `mobile`, `tablet`, `desktop`, `auto` — records `[]`, since it ships through a store rather than to a deploy target, as does an `iac` platform, which IS the deploy path. A `cli` platform pins a deploy template for its package registry — WHICH one is the stack plugin's answer and vwf names NO slug here, on this axis or any other. `unresolved` when deferred
      package_manager: <tool> # optional — overrides repo.stack.package_manager for a hybrid repo mixing managers
      languages: [
        <token>,
      ] # CLOSED vocabulary — the union of what the INSTALLED stack plugins declare (assets/stack-vocabulary.md); vwf holds no table of its own. At least one, EXCEPT while `template` reads `unresolved` — a project whose language nobody has chosen yet records `[]`, and that is the one legal empty. Drives doctor's LSP + toolchain checks. A token no plugin declares is doctor's `unknown` finding — BLOCKING once this project's `template` is pinned, a degradation while it reads `unresolved` (assets/stack-vocabulary.md) — never a recorded-and-ignored value
      frameworks: [] # open, lowercase-kebab; 0..n. What the code is written against
      dependencies: [] # open, lowercase-kebab; the few that characterize the stack
      note: <one
        line> # optional — why this stack, when the reason is not obvious from the template name
    # NO `platforms:` key — a project's implemented surfaces are a system-shape fact and live in docs/blueprint/registry.yaml, the single source (format 19). Config carries realization: the stack and the design pins
    design: <tool-token> # the DESIGN TOOL for this project's surfaces. Per project since format 13 (was one product-wide `design.tool`): a product may design its website in one tool and its app in another. Since Wave D it is a pin on the DESIGN AXIS and the value is that menu entry's SLUG — one value, not a token plus a separate pin, so nothing can drift. vwf never constructs a skill name from it: the pin materializes three fixed-name adapters into the repo's own .claude/ (assets/design-adapter.md). Required for a project declaring any SCREEN platform, absent for every other project
    cicd: <tool> # the CI SYSTEM that builds and releases this project. Per project since format 13, so a product whose projects ship through different pipelines can say so. Since Wave D it is a pin on the CICD AXIS, the value being that menu entry's slug — which is what finally made a CI template reachable at all, the menu having been the only door and no CI entry having existed. vwf owns the delivery-pipeline CONTRACT (assets/delivery-pipeline.md) and never the mechanism. In a monorepo every project repeats the same value — accepted, since the key's scope follows the other three rather than inventing a fourth scoping rule
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
  goldens: true # required when any project declares a DEVICE screen platform (desktop/mobile/tablet/auto) — see the harness contract
  test:load: false # required when a flow's declared peak rate meets the delivery-pipeline load-validation threshold, ahead of its first production release

enforcement: # vwf's enforcement opt-outs
  # `structure:` was retired in format 19 and `stacks:` in format 10, for the same reason: both became MENUS (assets/topologies/ for structure; the stack menu is stackgen's, offered through the stack adapter), so no choice deviates from anything and none needs a waiver. A legacy `structure:` or `stacks:` block reads as drift — structure migrates into `topology` + `topology_reason`, stacks into projects.<name>.stack (its reason into `note`).
  rules: {} # <rule-id>: { waived: true, reason: <one line> } — e.g. standard-flows/<project>/<slug> waives a mandatory standard flow (assets/standard-flows.md); baseline/<rule>[/<unit>] waives an engineering-baseline rule product-wide or scoped (assets/engineering-baseline.md; boundary-validation never product-wide); pipeline/<rule>[/<unit>] waives a delivery-pipeline rule (assets/delivery-pipeline.md)

pipeline: # bounded knobs — see the hard floor below
  coverage_target: 100 # default coverage gate (per-project override above)
  review_round_cap: 4 # code→review loops before residuals become gaps
  models: {} # per-stage tier override, e.g. review: sonnet — ALWAYS reported at the gate as configured-vs-default
  execute_caps: {} # tighten-only: context/five_hour/seven_day below the shipped 65/90/80

environments: # /vwf:verify targets — URLs only, NEVER secrets (those stay in environment.md by name + the secret manager by value); keys use the CANONICAL names development/staging/production per assets/delivery-pipeline.md — a synonym key (dev/test/stage/prod) is drift to propose fixing
  <env-name>:
    <project-name>: <base-url>

production_env: production # optional — names the release environment for /vwf:verify (default: the env literally named "production")

design: # CANVAS STATE only — ids and flow names, never content. The design TOOL is not here: it is per project, at projects.<name>.design (format 13)
  design_system_id: <uuid> # UNIVERSAL — one per product: the design system /vwf:design-system imports from, as the design tool identifies it (its own canvas project); every mockup push binds it
  projects: # one canvas design-system project per registry UI project PER PLATFORM — each platform canvas carries its own conventions CLAUDE.md (device frame, layout), so two platforms NEVER share a project; the same platform of two registry projects may share a uuid, as the product needs
    <registry-project>:
      <platform>: <uuid> # mobile | tablet | desktop | auto | site | webapp — the one vocabulary (assets/standard-flows.md), minus `cli`: a terminal surface has no canvas project
  flows_rendered: [] # flow PLATFORMS whose Screens have a current user-reviewed visual — entries are <project>/<NNN>-<flow>/<platform> (format 15: platform granularity, so a flow rendered for mobile but not auto is visibly partial); recorded by blueprint's §6a local render, by mockups (docs/scratchpad renders), and by screens import (canvas pages current), dropped by blueprint when a flow's Screens change unrendered; read by plan's soft visual-review advisory. Mockup renders live in the gitignored docs/scratchpad/<project>/<NNN>-<flow>/<platform>/ tree, NEVER on the canvas

memory:
  wing: <wing-name> # explicit mempalace wing; defaults to product.name

docs_sync:
  include: [] # extra human docs in the docs-sync scope (README/CLAUDE.md are always in)
```

## The three axis states

Every stack axis — `projects.<name>.stack.template`, `backing_template`,
`deploy_template`, and `repo.stack.template` — is in exactly one of **three**
states since format 16. Until then there were two, and the missing one is what
forced a user with no stack plugin installed to answer an unanswerable question:

| State                          | Spelling                                    | Means                                                   |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------- |
| **pinned**                     | a slug (scalar axes) / a non-empty list      | the axis is answered                                    |
| **decided: none**              | `[]` on the two list axes                    | this axis genuinely does not apply to this project      |
| **deferred**                   | `unresolved`                                 | not asked yet, or asked and postponed                   |

`unresolved` is the **bare scalar on every axis, including the list ones** —
`deploy_template: unresolved`, never `[ unresolved ]`. An element of a list is a
slug; deferral is a property of the axis, not of one mechanism within it. A list
axis therefore never mixes the two.

**`[]` and `unresolved` are opposites, not neighbours.** `[]` is a decision — *we
looked, and this project ships through nothing / talks to no backing service* —
and it is complete. `unresolved` is the absence of a decision. Collapsing them
would make an unanswered axis indistinguishable from a finished one, which is
precisely the state format 16 exists to make visible. The scalar axes
(`template`, `repo.stack.template`) have no `[]`: every project has a project
axis and every repo a repo axis, so their only two states are pinned and
deferred.

**`unresolved` only ever arrives from an `/vwf:architecture` run**, which offers
deferral alongside the menu entries and says what would unlock the axis. No
migration writes it, and nothing infers it from an absent key — an absent `stack`
block is still drift, exactly as before, because absence records nothing about
whether anyone was asked.

**Where it is tolerated, and where it is not.** Defining the product runs to
completion with every axis deferred; building it does not.

| Surface                                        | On an `unresolved` axis                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `product`, `architecture`, `blueprint`, `design-system`, and every doc surface | unaffected — none of them reads a stack                       |
| `doctor`                                       | a **degradation**, reported every run; the checks that depend on that axis report `not checked — no stack resolved`, never a blocking finding |
| `setup`                                        | records what it could not provision and names the unlock; never halts on it     |
| `plan`, `execute`                              | **halt**, naming the axis and the project and pointing at `/vwf:architecture`   |

The halt at `plan`/`execute` is not a policy choice — it falls out of
**Resolving the conventions** (`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`):
both resolve every pin's `conventions:` prose before they size or write anything,
and an unresolved axis has no prose to resolve. Code sized against conventions
nobody read is the failure the closed menu exists to prevent, so the halt points
at answering the question, never at installing something.

## Semantics — who reads/writes what

| Section              | Written by                                                                                                                                | Read by                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| stamp keys           | `setup`                                                                                                                                   | every command's format check                                                                                    |
| `linkage` / `members` | `setup` (elicited; each member's facts detected)                                                                                         | every command that resolves the base repo or a member — `plan`, `execute`, `doctor`, `verify`, `git-workflow` (`${CLAUDE_PLUGIN_ROOT}/assets/membership.md`) |
| `product` / `memory` | `setup` (confirmed with the user)                                                                                                         | every command's wing resolution                                                                                 |
| `blueprint`          | `blueprint` (after every sweep)                                                                                                           | `plan` (the coverage gate)                                                                                      |
| `projects.*`         | `setup` / `architecture` (`stack`, `design`, `cicd` — all elicited); `execute` reconcile                                                  | `plan`, `execute`, `doctor`, the verifiers, the design adapter (`design`) and the pinned CI system (`cicd`) — **never** `blueprint` or the reviewers, which must not see a stack |
| `repo`               | `setup` / `architecture` (elicited)                                                                                                       | `doctor`, `plan`, `execute`                                                                                     |
| `harness`            | `setup`; `execute` reconcile                                                                                                              | `plan` preflight, acceptance/ux verifiers, `verify`, `doctor`                                                   |
| `enforcement`        | `setup` / `architecture` (consented)                                                                                                      | `setup`, `architecture`, `blueprint`, the reviewers                                                             |
| `pipeline`           | the user (hand-edited)                                                                                                                    | `execute`, and the external caps hook that delivers its resource-cap pause                                       |
| `environments`       | `setup` / `verify` (confirmed)                                                                                                            | `verify`                                                                                                        |
| `production_env`     | `setup` / `verify` (confirmed)                                                                                                            | `verify` (the release environment)                                                                              |
| `design`             | `design-system` (`design_system_id`); `screens` (`projects.*.*` pins — confirmed); `blueprint` / `mockups` / `screens` (`flows_rendered`) | `design-system`, `blueprint`, `mockups`, `screens`, `feedback`, `plan` (advisory) — the tool itself is `projects.<name>.design` |
| `docs_sync`          | the user (hand-edited)                                                                                                                    | the /vwf:docs-sync skill                                                                        |

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
  `/vwf:setup`, which performs the move as the `5 → 6` migration.
- Unknown keys are preserved, never stripped; missing sections mean "the shipped
  default" — an empty file is valid. Exception: a missing `blueprint:` block
  means **no sweep has stamped this repo** — `/vwf:plan` halts until
  `/vwf:blueprint` runs (self-healing on repos configured before config_format
  2).
- **A stamped config with no registry is a legal state**, not drift. `setup`
  writes this file at the end of its own run; `registry.yaml` arrives later,
  from `/vwf:architecture`. Between the two the product is
  simply **early**: `/vwf:doctor` says so as information (*next
  `/vwf:product`, then `/vwf:architecture`*) and
  the format check stays silent, since nothing is behind. **No key records
  this** — the state is exactly the absence of the registry, and a key asserting
  it would be a second place to disagree with the filesystem. That state
  therefore carries **no `config_format` bump of its own**: recognising a state
  that was always reachable adds nothing to this schema.
- `config_format` versions this file's own schema; bump it (with a migration
  note here) when a key's shape changes.
- **`1 → 2` migration** (performed by `/vwf:setup`): rename
  `pipeline.autopilot_caps` → `pipeline.execute_caps` (same shape and
  semantics); the caps hook reads both names during the transition.
- **`2 → 3` migration** (performed by `/vwf:setup`): bump the number — no key is
  reshaped. New semantics: the environment named `production` (or the one named
  by the new optional `production_env` key) is the **release environment** — a
  clean `/vwf:verify` run against it offers to freeze each deployed service's
  OpenAPI contract into `docs/blueprint/apis/released/`; the frozen snapshots
  (not this file) are the release record. If your production environment is
  named differently, set `production_env`.
- **`3 → 4` migration** (performed by `/vwf:setup`): rename `mockups:` →
  `design:` (`mockups.project_id` → `design.project_id`, same semantics — the
  pin now serves `design-system`, `mockups`, `feedback`, and `plan`, not just
  mockups). `design_system_id` and `flows_pushed` are new optional keys with no
  migration action. During the transition, readers fall back to the legacy
  `mockups.project_id` and treat its presence as `3` drift (nudge `/vwf:setup`).
- **`4 → 5` migration** (performed by `/vwf:setup`): the single
  `design.project_id` becomes the **per-registry-project map** `design.projects`
  — one entry per registry UI project, each keyed to the old shared uuid
  (sharing preserved; split later by re-pinning). The design system becomes
  **universal**: `design.design_system_id` is one per product, its own canvas
  project, no longer tied to a mockup project's uuid. `flows_pushed` is
  unchanged. Readers fall back to a legacy `design.project_id` (or the older
  `mockups.project_id`) as the shared pin for **every** UI project — its
  presence is `4` (or `3`) drift.
- **`5 → 6` migration** (performed by `/vwf:setup`): each
  `design.projects.<registry-project>` entry becomes a **per-platform map** —
  one canvas project per platform, since each platform canvas carries its own
  conventions CLAUDE.md (device frame, layout; written by `/vwf:screens`). An
  existing flat uuid becomes the pin for the project's **primary platform**
  (`mobile` for a `frontend` role, `desktop` for a `site` role); other declared
  platforms are pinned on next use (per the adapter contract). Readers fall back
  to a flat `design.projects.<registry-project>` uuid as that primary-platform
  pin — its presence is `5` drift. Two platforms must never share a uuid; a
  shared uuid found during migration is surfaced for re-pinning, never silently
  kept.
- **`6 → 7` migration** (performed by `/vwf:setup`): every flow
  identifier stored in this file **drops its `<device>` segment**, since the
  device moved out of the flow path
  and into the flow doc's `device:` frontmatter key. Concretely
  `design.flows_pushed` entries go `<project>/<device>/<NNN>-<flow>` →
  `<project>/<NNN>-<flow>`, and `blueprint.remaining` `flows/…` and `screens/…`
  entries do the same. Purely mechanical — no pin, stamp, or coverage value
  changes. Readers honor a legacy entry carrying a device segment by matching on
  the trailing `<project>/<NNN>-<flow>` — its presence is `6` drift.
- **`7 → 8` migration** (performed by `/vwf:setup`): `design.flows_pushed` is
  **renamed to `design.flows_rendered`** — mockups no longer push to the canvas;
  they render into the repo's gitignored `docs/scratchpad/` tree, and the stamp
  now records visual-review currency regardless of surface (a local scratchpad
  render, or canvas pages a screens import confirmed current). Entries are
  unchanged. Readers honor a legacy `flows_pushed` key as the same list — its
  presence is `7` drift. The `design.projects` pins stay: they serve
  `/vwf:screens` and `/vwf:feedback canvas`, no longer mockups.
- **`8 → 9` migration** (performed by `/vwf:setup`): every flow
  identifier stored in this file **gains a `<platform>` leaf**, since screens
  moved into per-platform files.
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
- **`9 → 10` migration** (performed by `/vwf:setup`): the **stack
  moves here from the registry**. For each project
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
- **`11 → 12` migration** (performed by `/vwf:setup`): the config catches up
  with blueprint-format 19. Six changes, all mechanical except where noted:

  1. **`topology`** — `workspace` becomes `polyrepo` (the shape is unchanged: a
     parent repo with submodule members). Add **`topology_reason`**, carrying
     the existing `enforcement.structure` reason when one was recorded, else a
     one-line summary of why this shape. Then **drop `enforcement.structure`**
     entirely: topology is a menu now (`assets/topologies/`), so no choice
     deviates from anything and none needs a waiver — the same retirement
     `enforcement.stacks` got in format 11.
  2. **The stack splits into four axes (pre-22).** `projects.<name>.stack.template`
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
     **the tool that canvas pin came from** for any repo carrying a
     `design.design_system_id` — that is the tool it was already using, and at
     format 11 only one had a canvas to pin. The pin itself stays, now
     adapter-scoped.
  5. **`memory`** — nothing changes in the config, but `/vwf:setup` creates
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

- **`12 → 13` migration** (performed by `/vwf:setup`): **every
  technology axis becomes per project.** A product can
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
     a `frontend` on a screen platform stays `n/a`, and a `cli` frontend keeps
     whatever package-registry template it had pinned. Then drop the top-level
     `deploy:` block. (The shape changed later, in `15 → 16`, which turns this
     key into a list.)
  3. **`design.tool`** → `projects.<name>.design`, for every **UI** project only
     (`role` `site`, `fullstack` or `frontend` in `registry.yaml`) — a project
     with no surfaces never had a design tool and must not acquire one. Then
     drop `design.tool`; the rest of the `design:` block is canvas state and
     stays exactly where it is. A repo with no `design.tool` and a
     `design_system_id` takes **the same default**, on the same reasoning the
     `11 → 12` migration used.
  4. **`cicd`** is **new** — there was no product-wide key to copy down. Detect
     it once from the repo (`.github/workflows/` → `github-actions`,
     `.gitlab-ci.yml` → `gitlab-ci`, `.circleci/config.yml` → `circleci`),
     **confirm with the user**, and write the confirmed token to every project.
     More than one signal, or none, is a question — never a guess. This is the
     only step here that needs input, and it is also the last place repo
     detection is legitimate: from `13` on the pinned CI system reads the key
     and asks when it is absent, rather than sniffing the repo behind the
     user's back.

  Report any project left without a required axis — that is a real finding
  `/vwf:doctor` will raise on the next run, not noise.

  Bump `config_format` to `13` and `blueprint_format` to `20` together, for the
  same reason `12`/`19` shipped together.

- **`13 → 14` migration** (performed by `/vwf:setup`): **the stack menu closes.**
  vwf supports many stacks but only *defined* ones — every axis must pin a
  template an installed stack plugin ships, and every `languages` token must be
  one an installed plugin declares
  (`${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md`). Two things this file
  used to accept stop being values:

  1. **`template: custom` is retired**, on all four axes
     (`projects.<name>.stack.template`, `backing_template` entries,
     `deploy_template`, `repo.stack.template`). For each `custom` pin, present
     that axis's menu and have the user pick. **Never map one automatically** —
     a `custom` pin's free-text axes were never a template, so any guess silently
     changes the `conventions` prose `plan` and `execute` read and the `harness`
     block `/vwf:doctor` checks. When nothing on the menu fits, halt naming the
     two ways forward: install the stack plugin that has a fitting template, or
     write one (`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`).
  2. **An unclaimed `languages` token becomes blocking.** It is not fixable by
     editing this file: report which projects carry each such token, then halt
     with the same two remedies. The expected resolution is **installing the
     plugin**, which needs no config edit at all — the token was already correct,
     nothing declared it.

  **Bump `config_format` to `14` only once both hold.** A halted migration leaves
  the stamp at `13`, so the drift nudge keeps firing and a re-run resumes; a `14`
  stamped over an unresolved `custom` pin would assert a guarantee the repo does
  not meet. `blueprint_format` is **untouched** — nothing under `docs/blueprint/`
  changes, which is exactly the case this file's stamp rule anticipates, and the
  first config bump since `11` to ship without a paired blueprint bump.

  Readers treat a `custom` pin, or a token no installed plugin declares, as `13`
  drift **and** as a blocking `/vwf:doctor` finding — the drift says the repo is
  behind, the blocking finding says vwf will not build against it meanwhile.

- **`14 → 15` migration** (performed by `/vwf:setup`): **a
  multi-repo product stops having to be a submodule
  parent**, and the project-axis pin stops being keyed on a role that no longer
  exists. Five changes:

  1. **`topology`** — `polyrepo` becomes **`multi-repo`**, and the shape it used
     to imply moves into the new **`linkage:`** key: a repo migrating from
     `polyrepo` takes `linkage: submodule`, always. This is a rename plus an
     explicit statement of what was previously the only option; nothing about
     the repo changes. `repo` and `monorepo` are untouched and take no
     `linkage`.
  2. **`members:` is new.** For a `multi-repo` product, write one entry per
     member: `name` and `path` from `.gitmodules`, `url` from its submodule URL,
     and `projects` from which registry projects sit under that path. Nothing is
     elicited — every fact already exists, in two places that until now no
     reader compared. For `repo`/`monorepo`, the key is absent.
  3. **`.config/vwf-membership.yaml` is written into every member**, naming the
     product and the relative path back to the base repo
     (`${CLAUDE_PLUGIN_ROOT}/assets/membership.md`). Under submodule linkage this is
     **belt-and-braces** — the superproject walk already worked — but writing it
     uniformly is what lets a product later switch to `linkage: siblings`
     without a second migration, and what gives every skill one resolution
     algorithm instead of two.
  4. **`projects.<name>.stack.template`** loses its `<role>/` path segment:
     `project/<role>/<slug>` → `project/<slug>`. Mechanical — the slug is
     unchanged and unique. Re-resolve each pin against the installed plugin's
     menu afterwards and confirm the template's declared `platforms:` **cover**
     the project's registry platforms; a pin that no longer covers is a real
     finding (usually a `fullstack` project whose platforms became
     `[service, webapp]`), not noise.
  5. **`ui:`** keeps its name and its meaning inverts its trigger: it is now
     true when some project declares a **screen platform**
     (`site`/`webapp`/`desktop`/`mobile`/`tablet`/`auto`), rather than when some
     project carries a UI *role*. For every repo that already had a UI the value
     is unchanged; recompute it rather than copying it, since a `cli`-only
     project could previously be miscounted.

  **The registry's role/platform remap is a blueprint-side change**, not this
  one — the retired role spellings resolve through the setup skill's
  `format-lineage` reference. Run
  them together: this file's `template` pin and `ui:` key both depend on the new
  platform vocabulary, so a repo on one but not the other is a state neither
  migration expects.

  Bump `config_format` to `15` and `blueprint_format` to `22` together. Readers
  treat a `polyrepo` topology, a `project/<role>/<slug>` pin, or a `multi-repo`
  product with no `members:` as `14` drift.

- **`15 → 16` migration** (performed by `/vwf:setup`): **an axis gains a third
  state, and the deploy axis gains cardinality.** Two changes, one of them
  purely mechanical and the other adding nothing to any existing repo:

  1. **`deploy_template` becomes a list**, the same shape change
     `backing_template` made in `13` and for the same reason: a project ships
     through more than one delivery mechanism, and format 15 could record one.
     Wrap each existing slug as a one-element list (`deploy/<slug>` →
     `[ deploy/<slug> ]`) and rewrite each `n/a` as **`[]`**, which is what
     "decided: none" is spelled on a list axis. Both steps are mechanical and
     need no input. Then, **for every project, ask whether anything is missing** —
     this is the only step here with a question in it, and it is an offer rather
     than a gate: a `cli` publishing to a package registry may also ship a
     container image or a signed archive, and until now it could not say so. A
     user who adds nothing is left byte-equivalent to where they started.
  2. **`unresolved` is new on all four axes**, and **no repo migrates into it**.
     Every existing config has every axis answered, so there is nothing to
     convert; the value only ever arrives later, from an `/vwf:architecture` run
     that offers deferral. This step exists to state that absence of change is
     correct, not to leave the reader looking for the edit.

  Nothing else moves. `n/a` survives on the keys that are not stack axes —
  `projects.<name>.harness.health`, and the harness capability entries — where it
  has always meant "declared: no such surface" and still does.

  `blueprint_format` was **untouched** and stayed **23**: nothing under
  `docs/blueprint/` changes, which is the second config bump to ship without a
  paired blueprint bump, after `14`. Readers treat a scalar `deploy_template`, or
  a `deploy_template: n/a`, as `15` drift.

- **`10 → 11` migration** (performed by `/vwf:setup`): stacks stop being
  *enforced with an escape hatch* and become a **menu**, and the flat
  `projects.<name>.stack` list becomes the structured block above. Per project:
  - **had a `stack:` list** → map its entries onto the axes: tokens matching the
    closed language vocabulary (`assets/stack-vocabulary.md`) become
    `languages`, the rest split between `frameworks` and `dependencies` per that
    asset's rule. Set `template:` to the pre-22 `assets/stacks/<type>/<slug>.md` whose
    frontmatter matches, else `custom` — a value **format 14 retires**, so a repo
    running this delta today writes it only as an intermediate and the `13 → 14`
    step above resolves it before the run ends. Any `stack_reason` moves verbatim
    to `note` — the reason was recorded as a *deviation justification*, and under
    a menu there is nothing to deviate from, but the rationale is still worth
    keeping.
  - **had no `stack:` key** (the old "accept the reference" case) → **write the
    block out in full** from the template that was previously enforced for its
    `type`, with `template:` naming it. This is the load-bearing half of the
    migration: absence used to mean "read a prose doc and infer", and that
    indirection is what let a repo's real stack drift with nothing recording it.

  Then, still in this migration, elicit the **`repo.stack`** block once
  (topology-appropriate templates from the pre-22 `assets/stacks/repo/`), and
  drop `enforcement.stacks` if a legacy block survived the `9 → 10` migration.
  Readers treat a flat list at
  `projects.<name>.stack`, or an absent block on a project the registry
  declares, as `10` drift.

  The stack templates moved in the same release: `assets/stacks/<type>.md` →
  the pre-22 `assets/stacks/<type>/<slug>.md`, each gaining frontmatter. A
  link to the old flat path is `10` drift.
