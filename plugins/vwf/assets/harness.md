# Harness Contract

What a repo must be able to **run** for vwf's verification gates to do their job
— the capabilities behind the `acceptance` and `ux` stages and `/vwf:verify`.
One vocabulary for everyone: `setup` detects against it and stamps the result,
`plan` injects repair steps against it, the verifiers name what is missing
against it. A capability is never assumed — it is detected, stamped, and
re-verified cheaply when a cycle needs it.

## Capabilities

| Capability    | Required when                                   | Canonical convention                                          |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| `dev`         | any project declares a **screen platform**      | a `dev` task/script that boots the project locally            |
| `e2e_local`   | any flow carries acceptance criteria            | a `test:e2e` task/script running E2E against the local stack  |
| `local_stack` | `e2e_local` needs backing services              | the backing services, behind a **deterministic ready signal** |
| `e2e_staging` | flows have criteria **and** a deploy target     | a `test:e2e:staging` task/script targeting a deployed env     |
| `health`      | any project declares the `service` platform     | a `GET /health` (or documented readiness) endpoint            |
| `screenshots` | a **browser** screen platform (`site`/`webapp`) | a repeatable way to render a screen and scan it               |
| `goldens`     | a **device** screen platform (`desktop`/`mobile`/`tablet`/`auto`) | a repeatable visual check + the platform's a11y assertions |
| `test:load`   | a flow's declared peak rate meets the delivery-pipeline load-validation threshold (default `~10/s`), ahead of its first production release | a `test:load` task/script running a load run against staging |

Reference implementations live in the **stack plugins**, not here. A repo may
satisfy a capability under a **non-canonical name**; detection records what it
found — the convention is the default, not a straitjacket.

**`local_stack` carries one requirement beyond its task name**, and it is a
requirement, not a mechanism: the stack must come up behind a **deterministic
readiness signal** the acceptance verifier can gate on. A fixed sleep is a
finding, because it makes the verifier's result a race rather than an
observation. *How* the services are started and *how* readiness is signalled are
the stack plugin's business. A product whose `e2e_local` needs no backing
services never needs a local stack at all.

## Detection (used by `/vwf:setup`)

Per capability: check the repo's task runner and package scripts for the
canonical (then near-canonical) names; for `local_stack`, a service definition
plus its readiness config; for `health`, a health route in the service's routing
or deploy manifest; for `screenshots` and `goldens`, the visual-check target the
project's own stack provides. **What that target looks like is the stack
plugin's answer, not vwf's** — ask its `-stack-template` skill rather than
guessing at a tool. Record each as `true` / `false` / `n/a` (not required for
this topology) in the stamp:

```yaml
# .config/vwf.yaml — the vwf config (see the vwf-config asset)
harness:
  dev: true
  e2e_local: true
  local_stack: true
  e2e_staging: false # gap: no staging mode yet
  health: true
  screenshots: true
```

## Provision & repair

- **New/empty repos** — `/vwf:setup` scaffolds the harness as part of the chosen
  topology's layout (the selected stack templates describe it), in the same
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
