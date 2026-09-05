# Doppler — conventions

Secrets held by a **vendor** rather than by the repo or by your cloud. The
trade against a local-first manager is that you get an account model — invite,
revoke, audit — and give up ever holding the material yourself.

**The injector wraps the repo's own task, never the application.**
`doppler run -- <task>` is the only shape. Downstream of that boundary the app,
its tests and its tooling know only that the variables are set, which is what
lets CI run the identical task under a different injector.

**Every task must run without Doppler.** It is not on the deployed path, so a
task that only works when wrapped is a task CI cannot run. The seam is a plain
environment; the fake is whatever non-secret defaults a contributor without a
seat needs.

**This pack scopes Doppler to `development`.** The platform can serve deployed
environments; the composition declines to let it, so nothing that runs in
staging or production depends on a second vendor being reachable. Those
environments take their secrets from the platform that runs them — the cloud
provider's secret manager, the CI system's own store.

**Two injectors means the variable name is the contract.** The name is the only
thing development and the deployed environments share, so
`docs/blueprint/environment.md` is the join, and a process must **fail loudly**
on a missing variable rather than defaulting.

**The CLI's pin and its two environment variables live in this pack's own
file**, `.config/mise/conf.d/doppler.toml` — never in `mise.toml`, which stays
free of any provider's name so that swapping the secrets manager is deleting
one file and landing another. The toolchain manager's `conf.d/` has no
environment scoping, so the pin is unconditional and CI installs a CLI it
never calls; that cost buys the provider owning its own pin, and the rule
above — every task runs without Doppler — is what actually keeps CI
independent.

**A committed plaintext secrets file is a leak, not a convenience.** This pack
offers no encrypt-into-git mode, so it emits no scanner allowlist and claims no
exemption; a `.env` in the tree stays the secret scanner's finding and is not
waived. `.doppler/` is gitignored.

**Names are catalogued; values never are.** Doppler's project and config naming
is this pack's business and never reaches a blueprint doc.

## What this pack writes

| Lands at                             | Is                                            |
| ------------------------------------ | --------------------------------------------- |
| `.config/mise/conf.d/doppler.toml`   | the CLI pin, `DOPPLER_PROJECT`, `DOPPLER_CONFIG` |
| `.config/mise/tasks/setup/secrets`   | the fill for the toolchain manager's slot     |

Nothing else. There is no `doppler.yaml` in the repo: the CLI honours
`DOPPLER_PROJECT` and `DOPPLER_CONFIG` from the environment, and
`doppler setup --scope` records the mapping outside the tree — so the repo
carries the two names and not a second config file that could disagree with
them.

**The task overlays a slot, and stays skippable.** `setup:secrets` is a task
name the toolchain manager defines and this pack fills. It exits 0 when the
CLI is absent or not logged in, because a contributor without a seat still has
to be able to run `setup:all` end to end.

## Naming — one project per repo

**One Doppler project per repository, one config, `local`.** Every
sub-project's keys live in it, separated by the key prefix rather than by a
second project — a second project splits the access grant and nothing else.
The project name defaults to the repository directory's basename and is
overridden in `mise.local.toml` when the two differ.

| Prefix        | Is                            | Example              |
| ------------- | ----------------------------- | -------------------- |
| `<REPO>_<KEY>` | this repository's own value   | `SITE_DATABASE_URL`  |
| `GLB_<KEY>`   | shared across repositories    | `GLB_GITHUB_TOKEN`   |

Names are `[A-Z0-9_]`. The convention is stated once in the config file, beside
the variables, so the reader who needs it is looking at it.

Full judgment: the `doppler` skill's references. The contract it cites is
`assets/contracts/secrets.md`.
