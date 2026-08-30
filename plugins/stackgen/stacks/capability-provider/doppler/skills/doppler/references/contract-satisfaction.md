# Doppler — contract satisfaction

Clause by clause against the neutral secrets contract
(`assets/contracts/secrets.md`). It cites, and does not restate.

## The rule that outranks every other

**Satisfied by construction.** `doppler run -- <command>` starts a process with
the secrets already in its environment; there is no SDK to import and no
in-application fetch, so the bootstrap problem the contract describes never
arises.

The shape is `doppler run -- <the repo's own task>`, never the application
binary and never a shell you then work inside. Wrapping the task is what keeps
the task identical with and without the injector — the property
[local stack](local-stack.md) depends on entirely.

## Clause 1 — a distinct set per environment

**Satisfied for `development`. Named gap for `staging` and `production`.**

Doppler's own model is a project holding one config per environment, selected
explicitly by the working directory's link — there is no ambient default to
fall back to, so resolving the wrong set fails rather than silently succeeding,
which is what the clause is actually asking for.

**The gap is a scope decision this pack makes, not a limitation of the
platform.** Doppler can serve deployed environments. This composition declines
to let it, so that nothing running in staging or production depends on a second
vendor being reachable at start-up. **Those environments take their secrets
from the platform that runs them** — the cloud provider's secret manager where
the project pins a cloud, reached by workload identity rather than by a stored
token; the CI system's own secret store for anything the pipeline needs.

That split is not free, and its cost is the whole of
[two injectors](two-injectors.md).

## Clause 2 — non-interactive CI authentication

**Not satisfied within this pack's scope, by the same decision.**

The mechanism exists: a per-config **service token** is exactly the
environment-scoped, read-only, rotatable-without-a-code-change credential the
clause describes. This pack does not use it, because CI is a deployed
environment by the split above — **the pipeline authenticates to its own
system's secret store**, which it can already do without any credential being
stored anywhere.

A product that wants CI on Doppler anyway is making a coherent choice; it
should say so, and it should say where the token itself is stored, because a
service token is a secret that no secrets manager is holding.

## Clause 3 — onboard and offboard at a stated cost

**Satisfied, and this is the clause Doppler is strongest on.**

- **Onboarding** is an org invite plus `doppler login` on the new machine. No
  key is collected, distributed or re-encrypted, and there is no window in
  which someone has the repo but not the secrets.
- **Offboarding** is removing the member, which stops access at the source,
  immediately, across every environment at once. Revocation is real here rather
  than emulated by re-keying.

**Revocation still does not un-compromise what that person already read.** The
contract makes this point about re-keying; it is no less true of revocation.
Everything a departing member could read is rotated, not merely made
unreachable — the difference between the two is a matter of who already has the
value, which no access-control change can reach.

## Clause 4 — enumerate names without printing values

**Satisfied.** The CLI can list the names in a config without their values, and
the dashboard shows the same. That is the only view anyone should be using when
maintaining `docs/blueprint/environment.md`, which catalogs names and issuers
and **never a value**.

Consult Context7 for the current flag rather than trusting a remembered one:
this is the one command family where a wrong flag prints the thing the clause
exists to keep unprinted.

**Doppler's own project and config naming stays here.** The blueprint records
that a credential exists and what reads it — never where it is stored.

## Clause 5 — values out of the terminal and the log

**Satisfied, with two traps that are the pack's to name.**

- **Never run a command whose normal output is a value.** The CLI has one, for
  the rare case that genuinely needs it; its normal use is not that case, and a
  value printed once lives in a scrollback and in a CI log, both of which are
  read by more people than the repo is.
- **Do not wrap an interactive shell.** `doppler run -- <task>` ends when the
  task does. A wrapped shell you then work inside puts every secret in the
  environment of every command you subsequently type, including the ones that
  dump their environment on error.

## The encrypt-into-git allowance

**Not applicable — this pack does not offer that mode.** Nothing is stored in
the repository, so the contract's four conditions are not engaged: no scanner
allowlist is emitted, no plaintext gate is added, and no path is added to
`mempalace.yaml`'s `exclude_patterns` on the secrets manager's behalf.

The corollary is worth stating because it is what a reader coming from the
other end of the axis will assume: **a committed plaintext secrets file is
still a leak here**, with no exemption available. If a `.env` appears in the
tree it is the secret scanner's finding, and it is not waived.
