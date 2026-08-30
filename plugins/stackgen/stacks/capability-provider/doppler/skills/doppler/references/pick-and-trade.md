# Doppler — pick & trade

## When it is the answer

**When nobody on the team should have to manage a key.** This is the decisive
one. A local-first manager is only as good as its key distribution: somebody
holds the identity file, somebody re-encrypts when a person joins, and the
moment that ritual is skipped a teammate is blocked or — worse — a key is
pasted into a chat. Doppler replaces the whole ritual with an account: you are
in the org or you are not.

**When onboarding has to be a single act by a non-expert.** Adding a member is
an invite, and the new laptop needs `doppler login` and nothing else. There is
no ciphertext to re-key, no per-person public key to collect, and no window
where a new hire has the repo but not the secrets.

**When offboarding has to actually stop access.** Removing a member revokes it
at the source, immediately, for every environment at once. A manager whose
offboarding is a re-encrypt cannot do that — see clause 3 in
[contract satisfaction](contract-satisfaction.md).

**When you want an audit trail nobody has to build.** Who read what, and when,
is a property of a service holding the secrets. It is not something a
file-based manager can give you, because reading a file leaves no record
anywhere.

**When the team is more than a couple of people and turnover is real.** The
per-seat cost buys exactly the thing that gets expensive at scale: the
membership question having one answer.

## When it stops being the answer

**When a third party holding the secrets is not acceptable.** Regulatory,
contractual, or simply a decision the team has made. There is no configuration
that answers this — the material is on someone else's servers, and that is the
product. Pick a local-first manager instead.

**When the secrets must live in infrastructure you already run.** If the
organization already operates a secret store and its access control is the one
that is audited, adding a second system with a second membership list is not a
simplification.

**When development has to work with no network and no account.** Every read is
against a hosted service. A contributor who cannot reach it — offline, or
without a seat — cannot start, unless the repo has done the work described in
[local stack](local-stack.md).

**When the product needs its secrets at runtime in a deployed environment.**
This pack does not route deployed environments through Doppler, deliberately;
see [two injectors](two-injectors.md). A team that wants **one** manager
end-to-end should look at what its cloud provider already offers, since that
one is reachable from the running service by identity rather than by a token.

**When the project has no real credential at all.** Plenty do not. A project
whose only configuration is non-secret — a log level, a runtime environment
name — reads it from `.config/mise.dev.toml`'s `[env]` block and needs no
injector. Reach for one when a real credential appears, not before.

## What the choice does not commit you to

**Not the application, and not any code.** The secrets contract's rule that
outranks the rest — a secret reaches a process as an environment variable,
injected at the boundary — means the injector is a prefix on a command line.
Replacing Doppler with a local-first manager, or with a cloud's secret manager,
changes the prefix and nothing downstream of it.

**And not a ranking.** `assets/contracts/secrets.md` deliberately declines to
say whether a hosted platform beats a local-first tool; the axis is **where the
secret lives and what onboarding a teammate costs**, and both answers are
legitimate. This page is the case for one end of that axis, not a verdict.
