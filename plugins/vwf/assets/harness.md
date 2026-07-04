# Harness Contract

What a repo must be able to **run** for vwf's verification gates to do their job
— the capabilities behind the `acceptance` and `ux` stages and `/vwf:verify`.
One vocabulary for everyone: `setup` detects against it and stamps the result,
`plan` injects repair steps against it, the verifiers name what is missing
against it. A capability is never assumed — it is detected, stamped, and
re-verified cheaply when a cycle needs it.

## Capabilities

| Capability    | Required when                                | Canonical convention                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `dev`         | a UI project (`site`/`console`) exists       | a `dev` task/script that boots the project locally           |
| `e2e_local`   | any flow carries acceptance criteria         | a `test:e2e` task/script running E2E against the local stack |
| `local_stack` | `e2e_local` needs backing services           | Docker-composed emulators + `wait-on` readiness gates        |
| `e2e_staging` | flows have criteria **and** a deploy target  | a `test:e2e:staging` task/script targeting a deployed env    |
| `health`      | a cloud project (`service`/`site`/`console`) | a `GET /health` (or documented readiness) endpoint           |
| `screenshots` | a **web** UI project (`site`/`console`)      | Playwright runnable via `pnpm dlx playwright`                |

Reference implementations live in the stack docs — the monorepo tooling doc
(compose stack, wait-on, task library) and the per-type docs (service test
modes, site dev server). A repo may satisfy a capability under a **non-canonical
name**; detection records what it found — the convention is the default, not a
straitjacket.

## Detection (used by `/vwf:setup`)

Per capability: check mise tasks (`mise tasks`) and package scripts for the
canonical (then near-canonical) names; for `local_stack`, a compose file plus
`wait-on`/readiness config; for `health`, a health route in the service's
routing or deploy manifest; for `screenshots`, a web UI project on a stack where
Playwright can run. Record each as `true` / `false` / `n/a` (not required for
this topology) in the stamp:

```yaml
# docs/blueprint/.vwf.yml (vwf-internal — no blueprint-format bump)
harness:
  dev: true
  e2e_local: true
  local_stack: true
  e2e_staging: false # gap: no staging mode yet
  health: true
  screenshots: true
```

## Provision & repair

- **New/empty repos** — `/vwf:setup` scaffolds the harness as part of the
  enforced workspace structure (it is part of the reference stacks), in the same
  consent-gated migration plan.
- **Existing repos** — `/vwf:plan` runs a **harness preflight**: read the stamp,
  re-verify just the capabilities this slice's gates will need (the repo may
  have changed since stamping), and **inject a bootstrap step** into the plan
  for each missing one — built by the coder under the normal
  code→review→security pipeline like any step. Harness steps are **gate-required
  guardrails**: the minimalism checks never flag them.
- **Stamp reconcile** — when a cycle adds a capability, execute's end-of-run
  reconcile updates the stamp's `harness:` block to match.

## Reporting

When a verifier cannot run, its `n/a` names the missing capability in this
vocabulary (`n/a — e2e_staging missing: no staging-mode task`), so the
orchestrator's gate, the gap record, and the next plan's preflight all point at
the same thing.
