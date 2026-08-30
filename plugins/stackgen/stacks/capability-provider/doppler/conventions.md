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

**Doppler is dev-only tooling and belongs in `.config/mise.dev.toml`** — never
in `mise.toml`, never in `mise.ci.toml`.

**A committed plaintext secrets file is a leak, not a convenience.** This pack
offers no encrypt-into-git mode, so it emits no scanner allowlist and claims no
exemption; a `.env` in the tree stays the secret scanner's finding and is not
waived. `.doppler/` is gitignored.

**Names are catalogued; values never are.** Doppler's project and config naming
is this pack's business and never reaches a blueprint doc.

Full judgment: the `doppler` skill's references. The contract it cites is
`assets/contracts/secrets.md`.
