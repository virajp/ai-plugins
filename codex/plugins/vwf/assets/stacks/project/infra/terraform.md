---
role: infra
name: Terraform / OpenTofu
languages: []
optional_languages: []
frameworks: [ terraform ]
dependencies: []
---

# Infra — Terraform / OpenTofu

An `infra` project provisioning infrastructure with
[Terraform](https://terraform.io) or [OpenTofu](https://opentofu.org) — HCL
rather than a general-purpose language. Pick this when the team already knows
HCL, or when the module ecosystem matters more than sharing a language with the
application code.

`languages` is empty on purpose: HCL is not in the closed language vocabulary
(`%%AI_PLUGINS_ROOT%%/assets/stack-vocabulary.md`), so `$doctor` performs
no LSP or toolchain check for it. That is a known gap, not an oversight.

**`infra` is exempt from blueprint coverage.** It carries no flows, screens or
API contracts. It is registered so `plan`, `doctor` and `execute` can see it.

## Stack

- **Workspaces per environment**: one workspace or state key per environment
  (`development` / `staging` / `production`, the canonical names from the
  delivery-pipeline contract). Never one state file shared across environments.
- **Remote state with locking**, on a backend that supports it. Local state is a
  development-only convenience and is never the source of truth.
- **Layout**: `modules/<name>/` for reusable modules (each with its own
  `variables.tf` / `outputs.tf` / `README.md`), `environments/<env>/` for the
  root configuration that composes them. Root configs declare no resources
  directly beyond wiring.
- **Version pinning**: the provider and module versions are pinned and the lock
  file is committed — an unpinned provider makes a plan unreproducible.
- **No secrets in state-visible variables**: values come from the secrets
  manager the backing axis names.

## Testing

- `terraform validate` + `terraform fmt -check` as the fast gate.
- `terraform plan` against a non-production workspace as the integration check,
  with the plan output reviewed rather than auto-applied.
- Module-level tests via the native test framework (`terraform test`) where a
  module carries real logic.

## Change discipline

Infrastructure changes are irreversible far more often than application changes,
so an `infra` step in a plan states its **blast radius** and whether the apply
is reversible — a plan that shows a resource replacement rather than an update
is a halt for human confirmation. `$execute` treats an irreversible apply
like any other irreversible decision.
