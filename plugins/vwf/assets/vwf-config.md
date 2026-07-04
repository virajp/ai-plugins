# The vwf Config — `.config/vwf.yaml`

**How vwf operates in this product.** One file per workspace (the parent repo in
workspace topology; submodules never get their own), written by `/vwf:setup` and
maintained by the workflow commands. It is the operating config, **never a copy
of the system description**: what the product *is* (projects, types, paths,
stacks, capabilities) lives in the registry in `docs/blueprint/architecture.md`;
this file holds only how vwf treats it. Since **blueprint-format 6** it replaces
the old stamp at `docs/blueprint/.vwf.yml`.

## Schema (config_format 1)

```yaml
config_format: 1 # this file's own schema version — setup migrates it
blueprint_format: 6 # the docs/blueprint format stamp

product:
  name: <product-name> # display name; the default mempalace wing

topology: workspace # workspace | monorepo | polyrepo
ui: true # a UI project exists → design-system required
integrations: true # external integration/secret exists → environment.md required

projects: # per-project NUANCES only — no type/path/stack keys, ever
  <project-name>:
    platforms: [
      <target>,
      <...>,
    ] # extensions beyond the reference stack (e.g. flutter: ios, android, macos, windows)
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
  autopilot_caps: {} # tighten-only: context/five_hour/seven_day below the shipped 65/90/80

environments: # /vwf:verify targets — URLs only, NEVER secrets (those stay in environment.md by name + the secret manager by value)
  <env-name>:
    <project-name>: <base-url>

memory:
  wing: <wing-name> # explicit mempalace wing; defaults to product.name

docs_sync:
  include: [] # extra human docs in the docs-sync scope (README/CLAUDE.md are always in)

setup_progress: [] # transient — /vwf:setup resume state, removed on completion
```

## Semantics — who reads/writes what

| Section              | Written by                           | Read by                                             |
| -------------------- | ------------------------------------ | --------------------------------------------------- |
| stamp keys           | `setup`                              | every command's format check                        |
| `product` / `memory` | `setup` (confirmed with the user)    | every command's wing resolution                     |
| `projects.*`         | `setup`; `execute` reconcile         | `blueprint` (platforms), `plan`, the verifiers      |
| `harness`            | `setup`; `execute` reconcile         | `plan` preflight, acceptance/ux verifiers, `verify` |
| `enforcement`        | `setup` / `architecture` (consented) | `setup`, `architecture`, `blueprint`, the reviewers |
| `pipeline`           | the user (hand-edited)               | `execute`, `autopilot`, the statusline caps hook    |
| `environments`       | `setup` / `verify` (confirmed)       | `verify`                                            |
| `docs_sync`          | the user (hand-edited)               | the docs-sync step                                  |

## The hard floor (never configurable)

No key in this file can disable: the **security review**, **TDD**, the
**approval gates**, the **blueprint/product/design-system reviewer bars**, or
the docs-sync step. `pipeline.models` may change a stage's tier but the stage
still runs — and any downgrade from the shipped default is stated at that
stage's gate. `pipeline.autopilot_caps` may only **tighten** (pause earlier than
65/90/80), never loosen.

## Reading rules

- Commands read `.config/vwf.yaml`; when absent, fall back to the legacy
  `docs/blueprint/.vwf.yml` — its presence **is** format drift (pre-6): nudge
  `/vwf:setup`, which performs the move as the `5 → 6` migration.
- Unknown keys are preserved, never stripped; missing sections mean "the shipped
  default" — an empty file is valid.
- `config_format` versions this file's own schema; bump it (with a migration
  note here) when a key's shape changes.
