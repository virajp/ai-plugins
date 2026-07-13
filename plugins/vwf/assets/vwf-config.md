# The vwf Config — `.config/vwf.yaml`

**How vwf operates in this product.** One file per workspace (the parent repo in
workspace topology; submodules never get their own), written by `/vwf:setup` and
maintained by the workflow commands. It is the operating config, **never a copy
of the system description**: what the product *is* (projects, types, paths,
stacks, capabilities) lives in the registry in `docs/blueprint/architecture.md`;
this file holds only how vwf treats it. Since **blueprint-format 6** it replaces
the old stamp at `docs/blueprint/.vwf.yml`.

## Schema (config_format 5)

```yaml
config_format: 5 # this file's own schema version — setup migrates it
blueprint_format: 10 # the docs/blueprint format stamp

product:
  name: <product-name> # display name; the default mempalace wing

blueprint: # coverage stamp — written by /vwf:blueprint after every sweep
  coverage: complete # complete | partial — /vwf:plan halts unless complete
  remaining: [] # unresolved holes when partial: flows/<project>/<NNN>-<flow>, entities/<entity>, apis/<project>, screens/<project>/<NNN>-<flow> (skipped visual review), coherence

topology: workspace # workspace | monorepo | polyrepo
ui: true # a UI project exists → design-system required
integrations: true # external integration/secret exists → environment.md required

projects: # per-project NUANCES only — no type/path/stack keys, ever
  <project-name>:
    platforms: [
      <target>,
      <...>,
    ] # extensions beyond the reference stack (e.g. flutter: ios, android, macos, windows; `cli` marks a terminal surface — requires the design system's Terminal UX section; `carplay`/`android-auto` mark in-car surfaces — frontend projects only, extending the Screens elicitation and the /vwf:screens briefs)
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

enforcement: # vwf's enforcement opt-outs — moved here from the registry in format 6
  structure: enforced # or { deviated: <choice>, reason: <one line> }
  stacks: {} # <project>: { choice: <stack>, reason: <one line> }
  rules: {} # <rule-id>: { waived: true, reason: <one line> }

pipeline: # bounded knobs — see the hard floor below
  coverage_target: 100 # default coverage gate (per-project override above)
  review_round_cap: 4 # code→review loops before residuals become gaps
  models: {} # per-stage tier override, e.g. review: sonnet — ALWAYS reported at the gate as configured-vs-default
  execute_caps: {} # tighten-only: context/five_hour/seven_day below the shipped 65/90/80

environments: # /vwf:verify targets — URLs only, NEVER secrets (those stay in environment.md by name + the secret manager by value)
  <env-name>:
    <project-name>: <base-url>

production_env: production # optional — names the release environment for /vwf:verify (default: the env literally named "production")

design: # claude.ai/design pins & canvas state — ids and flow names only, never content
  design_system_id: <uuid> # UNIVERSAL — one per product: the Claude Design design system /vwf:design-system imports from (its own canvas project, authored on claude.ai/design); every mockup push binds it via get_claude_design_prompt
  projects: # the claude.ai/design design-system project each registry UI project pushes its mockups to — pin the same uuid to share one canvas, or separate uuids, as the product needs
    <registry-project>: <uuid>
  flows_pushed: [] # flows whose Screens cards are current on the canvas — entries are <project>/<NNN>-<flow>; recorded by blueprint's per-flow render step and by mockups, dropped by blueprint when a flow's Screens change unrendered; read by plan's soft canvas-review advisory

memory:
  wing: <wing-name> # explicit mempalace wing; defaults to product.name

docs_sync:
  include: [] # extra human docs in the docs-sync scope (README/CLAUDE.md are always in)

setup_progress: [] # transient — /vwf:setup resume state, removed on completion
```

## Semantics — who reads/writes what

| Section              | Written by                                                                                                         | Read by                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| stamp keys           | `setup`                                                                                                            | every command's format check                                            |
| `product` / `memory` | `setup` (confirmed with the user)                                                                                  | every command's wing resolution                                         |
| `blueprint`          | `blueprint` (after every sweep)                                                                                    | `plan` (the coverage gate)                                              |
| `projects.*`         | `setup` / `architecture` (`platforms`, consented); `execute` reconcile                                             | `blueprint` (platforms), `design-system` (`cli`), `plan`, the verifiers |
| `harness`            | `setup`; `execute` reconcile                                                                                       | `plan` preflight, acceptance/ux verifiers, `verify`                     |
| `enforcement`        | `setup` / `architecture` (consented)                                                                               | `setup`, `architecture`, `blueprint`, the reviewers                     |
| `pipeline`           | the user (hand-edited)                                                                                             | `execute`, the statusline caps hook                                     |
| `environments`       | `setup` / `verify` (confirmed)                                                                                     | `verify`                                                                |
| `production_env`     | `setup` / `verify` (confirmed)                                                                                     | `verify` (the release environment)                                      |
| `design`             | `design-system` (`design_system_id`); `blueprint` / `mockups` (`projects.*` pins — confirmed — and `flows_pushed`) | `design-system`, `blueprint`, `mockups`, `feedback`, `plan` (advisory)  |
| `docs_sync`          | the user (hand-edited)                                                                                             | the docs-sync step                                                      |

## The hard floor (never configurable)

No key in this file can disable: the **security review**, **TDD**, the
**approval gates** (including `plan`'s blueprint coverage gate and `execute`'s
final gate), the **blueprint/product/design-system reviewer bars**, the
**released-API compatibility gate** (breaking a contract under
`docs/blueprint/apis/released/` gates like a security finding — always fixed,
exempt from the review round cap), or the docs-sync step. `pipeline.models` may
change a stage's tier but the stage still runs — and any downgrade from the
shipped default is stated at that stage's gate. `pipeline.execute_caps` may only
**tighten** (pause earlier than 65/90/80), never loosen.

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
