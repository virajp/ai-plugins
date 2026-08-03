# The vwf Config — `.config/vwf.yaml`

**How vwf operates in this product.** One file per product (the parent repo in
polyrepo topology; submodules never get their own), written by `/vwf:setup` and
maintained by the workflow commands. It is the operating config, **never a copy
of the system description**: what the product *is* (projects, types, paths,
capabilities) lives in `docs/blueprint/registry.yaml`; this file holds how vwf
treats it — plus, since **format 10**, the one fact about the product that is
realization rather than description: each project's **stack**. That lives here
precisely so no blueprint-authoring or reviewing surface can reach it, which is
what makes a vendor name in a blueprint doc structurally impossible rather than
merely discouraged. Since **format 11** the stack is **structured** — a template
selection plus the four axes `/vwf:doctor` checks the repo against — and is
written for **every** project, always. Since **blueprint-format 6** this file
replaces the old stamp at `docs/blueprint/.vwf.yml`.

## Schema (config_format 11)

```yaml
config_format: 11 # this file's own schema version — setup migrates it
blueprint_format: 16 # the docs/blueprint format stamp

product:
  name: <product-name> # display name; the default mempalace wing

blueprint: # coverage stamp — written by /vwf:blueprint after every sweep
  coverage: complete # complete | partial — /vwf:plan halts unless complete
  remaining: [] # unresolved holes when partial: flows/<project>/<NNN>-<flow>, entities/<entity>, apis/<project>, screens/<project>/<NNN>-<flow>/<platform> (skipped visual review), density/<unit> (over its line budget — cleared by the sweep's condenser pass, or when the condenser reports every remaining line load-bearing), coherence; a flow not yet authored (unserved goal, missing standard flow) is named without its number — flows/<project>/<slug> — and takes its NNN when authored

topology: polyrepo # repo | monorepo | polyrepo — a MENU since format 19 (assets/topologies/), not enforced
topology_reason: <one
  line> # why this shape; recorded so it is never re-litigated
ui: true # a UI project exists → design-system required
integrations: true # external integration/secret exists → environment.md required

repo: # REPO-level tooling, the counterpart to a project's stack. One block per repo; in polyrepo topology the parent and each member carry their own
  stack:
    template: repo/<slug> # a template under assets/stacks/repo/, or `custom`
    package_manager: <tool> # pnpm | bun ONLY, and only for JS/TS. A non-JS repo records its language's native tool (cargo, uv, pub), which was never a choice
    tools: [] # open, lowercase-kebab — turborepo, dprint, mise, …

# The BACKING and DEPLOY axes are product-wide, not per-project: every project
# talks to the same datastore/identity/queue set and ships the same way. A
# project that genuinely differs overrides them in its own `stack` block.
backing:
  template: backing/<slug> # a template under assets/stacks/backing/, or `custom`
deploy:
  template: deploy/<slug> # a template under assets/stacks/deploy/, or `custom`

projects: # per-project REALIZATION + nuances — no role/path keys, ever (those describe the system: registry.yaml)
  <project-name>:
    stack: # the CONCRETE technology, structured. Lives here (never registry.yaml) so the blueprint is structurally incapable of naming a vendor. Written for EVERY project, always — an absent block is drift, not "the default", because /vwf:doctor cannot check what was never recorded
      template: project/<role>/<slug> # the PROJECT-axis template under assets/stacks/project/, or `custom`. NOT a default: /vwf:architecture presents the menu and the user picks
      backing_template: <slug> # optional — overrides the product-wide `backing` pin for this project only
      deploy_template: <slug> # optional — overrides the product-wide `deploy` pin. A `frontend` project sets this to `n/a`: it ships through a store, not a deploy target
      package_manager: <tool> # optional — overrides repo.stack.package_manager for a hybrid repo mixing pnpm and bun projects
      languages: [
        <token>,
      ] # CLOSED vocabulary — assets/stack-vocabulary.md. At least one; drives doctor's LSP + toolchain checks
      frameworks: [] # open, lowercase-kebab; 0..n. What the code is written against
      dependencies: [] # open, lowercase-kebab; the few that characterize the stack
      note: <one
        line> # optional — why this stack, when the reason is not obvious from the template name
    platforms: [
      <target>,
      <...>,
    ] # the platforms this project implements, from the one vocabulary: mobile | tablet | desktop | web | auto (assets/standard-flows.md) — each admits a <platform>.md file on a flow. `auto` = in-car, CarPlay and Android Auto together, frontend projects only. `cli` may also appear: a terminal surface, which has no screens but requires the design system's Terminal UX section
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

environments: # /vwf:verify targets — URLs only, NEVER secrets (those stay in environment.md by name + the secret manager by value); keys use the CANONICAL names development/staging/production per assets/delivery-pipeline.md — a synonym key (dev/test/stage/prod) is drift to propose fixing
  <env-name>:
    <project-name>: <base-url>

production_env: production # optional — names the release environment for /vwf:verify (default: the env literally named "production")

design: # design-tool pins & canvas state — ids and flow names only, never content
  tool: claude-design # the ADAPTER PLUGIN NAME (claude-design | lovable | stitch | …). vwf never talks to a design tool itself: it delegates to /<tool>:<tool>-import-screens and /<tool>:<tool>-import-design-system per assets/design-adapter.md. The named plugin must be installed — /vwf:design-system and /vwf:screens import PREFLIGHT that, because a missing adapter fails silently
  design_system_id: <uuid> # UNIVERSAL — one per product: the Claude Design design system /vwf:design-system imports from (its own canvas project, authored on claude.ai/design); every mockup push binds it via get_claude_design_prompt
  projects: # one claude.ai/design design-system project per registry UI project PER PLATFORM — each platform canvas carries its own conventions CLAUDE.md (device frame, layout), so two platforms NEVER share a project; the same platform of two registry projects may share a uuid, as the product needs
    <registry-project>:
      <platform>: <uuid> # mobile | tablet | desktop | web | auto — the one vocabulary (assets/standard-flows.md)
  flows_rendered: [] # flow PLATFORMS whose Screens have a current user-reviewed visual — entries are <project>/<NNN>-<flow>/<platform> (format 15: platform granularity, so a flow rendered for mobile but not auto is visibly partial); recorded by blueprint's §6a local render, by mockups (docs/scratchpad renders), and by screens import (canvas pages current), dropped by blueprint when a flow's Screens change unrendered; read by plan's soft visual-review advisory. Mockup renders live in the gitignored docs/scratchpad/<project>/<NNN>-<flow>/<platform>/ tree, NEVER on the canvas

memory:
  wing: <wing-name> # explicit mempalace wing; defaults to product.name

docs_sync:
  include: [] # extra human docs in the docs-sync scope (README/CLAUDE.md are always in)

setup_progress: [] # transient — /vwf:setup resume state, removed on completion
```

## Semantics — who reads/writes what

| Section              | Written by                                                                                                                                | Read by                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| stamp keys           | `setup`                                                                                                                                   | every command's format check                                                                                          |
| `product` / `memory` | `setup` (confirmed with the user)                                                                                                         | every command's wing resolution                                                                                       |
| `blueprint`          | `blueprint` (after every sweep)                                                                                                           | `plan` (the coverage gate)                                                                                            |
| `projects.*`         | `setup` / `architecture` (`platforms` + `stack`, elicited); `execute` reconcile                                                           | `blueprint` (platforms **only** — never `stack`), `design-system` (`cli`), `plan`, `execute`, `doctor`, the verifiers |
| `repo`               | `setup` / `architecture` (elicited)                                                                                                       | `doctor`, `plan`, `execute`                                                                                           |
| `harness`            | `setup`; `execute` reconcile                                                                                                              | `plan` preflight, acceptance/ux verifiers, `verify`, `doctor`                                                         |
| `enforcement`        | `setup` / `architecture` (consented)                                                                                                      | `setup`, `architecture`, `blueprint`, the reviewers                                                                   |
| `pipeline`           | the user (hand-edited)                                                                                                                    | `execute`, the statusline caps hook                                                                                   |
| `environments`       | `setup` / `verify` (confirmed)                                                                                                            | `verify`                                                                                                              |
| `production_env`     | `setup` / `verify` (confirmed)                                                                                                            | `verify` (the release environment)                                                                                    |
| `design`             | `design-system` (`design_system_id`); `screens` (`projects.*.*` pins — confirmed); `blueprint` / `mockups` / `screens` (`flows_rendered`) | `design-system`, `blueprint`, `mockups`, `screens`, `feedback`, `plan` (advisory)                                     |
| `docs_sync`          | the user (hand-edited)                                                                                                                    | the docs-sync step                                                                                                    |

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
- `config_format` versions this file's own schema; bump it (with a migration
  note here) when a key's shape changes.
- **`1 → 2` migration** (performed by `/vwf:setup`): rename
  `pipeline.autopilot_caps` → `pipeline.execute_caps` (same shape and
  semantics); the statusline caps hook reads both names during the transition.
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
- **`6 → 7` migration** (performed by `/vwf:setup`, alongside the blueprint
  `12 → 14` delta): every flow identifier stored in this file **drops its
  `<device>` segment**, since format 14 moved the device out of the flow path
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
- **`8 → 9` migration** (performed by `/vwf:setup`, alongside the blueprint
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
- **`9 → 10` migration** (performed by `/vwf:setup`, alongside the blueprint
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
- **`10 → 11` migration** (performed by `/vwf:setup`): stacks stop being
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
