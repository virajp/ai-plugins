---
name: Doppler
axis: backing
kind: capability-provider
components:
- capability-provider/doppler@1.0.0
---

# Backing — Doppler

Secrets a **vendor** holds, injected at the process boundary. Onboarding a
teammate is an org invite; nobody ever distributes a key, and offboarding stops
access at the source rather than re-encrypting around it.

**The composition is the neutral secrets contract plus this one provider.** The
contract (`assets/contracts/secrets.md`) leads with the rule that outranks the
rest — a secret reaches a process as an environment variable, injected at the
boundary, never read by the application from a file — which is what makes the
manager replaceable, and what keeps this bundle a prefix on a command line
rather than an import in every service.

**The scope is `development`, deliberately, and the contract's answer for the
rest is a named gap rather than an omission.** Staging and production take their
secrets from the platform that runs them — the cloud provider's secret manager,
the CI system's own store — so nothing on the deployed path depends on a second
vendor being reachable at start-up.

The constraint the product is built around follows directly: **two suppliers
share only the variable name.** That makes `docs/blueprint/environment.md` the
reconciliation surface, and it makes failing loudly on a missing variable a
requirement rather than a preference.

**What it lands in the repo.** Two files, through the `config/` tier
(`assets/output-tree.md`): an environment fragment under
`.config/mise/conf.d/`, which the toolchain manager auto-loads, so the
project and configuration names are set without any component editing the
manager's own config; and an overlay of the manager's `setup/secrets` slot,
which scopes this directory to the right project and skips cleanly — a
warning, not a failure — when nobody is logged in. A capability provider
**outranks every language and framework pack** in composition order for
exactly this reason: whatever a language pack thought that task should do,
the repo's actual secrets manager is the more specific answer. Only a cloud
deploy target composes later still, and it writes different files.

Full judgment: the component's own skill and its references. The contract it
cites is `assets/contracts/secrets.md`.
