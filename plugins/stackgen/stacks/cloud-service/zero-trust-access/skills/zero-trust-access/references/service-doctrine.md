# Zero Trust Access — service doctrine

The service's own usage rules: how the policy is shaped, what the fronted
project has to expose, and the two harness capabilities the proxy changes.

**There is no clause-by-clause contract satisfaction here, and that is
correct rather than missing.** The `access` category realizes no vwf
capability token today, so there is no neutral capability contract to
check this against — the taxonomy records that as a known vwf-side gap and
nothing here mints a token to fill it. What this component satisfies
instead is stated directly below.

## The policy shape

**Deny by default.** Nothing reaches the application until a rule admits
it, so the design question is never what to block — it is which rules to
add, and every one of them is a way in someone has to remember exists.

**Allow by group membership, sourced from the identity provider the
organisation already uses.** Not an email domain. A domain rule is not
authorization: every new hire is silently in scope the day they get an
address, and every departed one stays in scope until someone remembers to
subtract them. A group rule delegates both events to the system that
already handles them, which is the same argument the cost doctrine makes
about seats from the billing side — remove someone from the group and the
access and the seat close together.

**Know which kind of rule each one is.** Actions are not interchangeable
and the names invite conflation:

| Action | Does |
| --- | --- |
| Allow | Admits a matching user, after they authenticate |
| Block | Denies explicitly — evaluated ahead of Allow, so it short-circuits |
| Bypass | **Disables enforcement entirely** for matching traffic |
| Service Auth | Admits a machine on a credential, with no login |

Two consequences worth stating. **A Block rule is rarely needed**, because
denial is already the default; reach for it only to test a condition or to
deliberately short-circuit evaluation, and treat a design that leans on
Block for its safety as one whose Allow rules are too broad. And **Bypass
is not the way to admit automation** — it makes matching traffic public,
which is the property this whole arrangement exists to remove. Automation
takes Service Auth. Bypass is for something that genuinely must be
reachable by anyone, and the readiness path is the one plausible case.

**Keep the count of ways in as small as works, and know what each is
for.** An unexplained rule is not a rule anyone dares remove, so it stays
forever; the privilege review in the provider's identity reference exists
to catch exactly that.

## What the fronted project must expose

- **An origin unreachable except through the proxy.** The provider's rule,
  not this service's, and the failure that makes the whole arrangement
  decorative — the `cloudflare` skill's networking and private plane
  reference owns it, including which of the two mechanisms to reach for
  and why the connector can be made to validate the assertion itself.
- **Verification of the identity assertion, not trust in the header that
  carries it.** The proxy passes a signed assertion; the project checks
  the signature against the issuer's published keys and checks that the
  assertion was minted for **this** application rather than some other one
  in the same account. Skipping the second check is the subtle version of
  the mistake: a valid assertion for a different application is still a
  valid assertion.
- **The readiness endpoint** the `health` harness capability requires —
  see below, because a probe that cannot get past the proxy is not a
  health check.

## Health, and the green dashboard in front of a dead service

An uptime probe reaching the proxy measures **the proxy**. Unauthenticated,
it gets a login page and reports the service down; given a credential and
no thought, it reports the proxy up and says nothing about the
application. Either way the answer is about the wrong system.

There are two ways to make the probe measure the application, and the
requirement is to **pick one deliberately and record which**:

1. **A Bypass policy scoped to the readiness path alone.** Simplest, and
   the one case where making something publicly reachable is defensible —
   but scope it to the exact path, and make sure that path reveals nothing
   beyond liveness. A readiness endpoint that enumerates dependencies,
   versions or hostnames is a reconnaissance endpoint once it is public.
2. **A service token the probe presents.** Nothing becomes public, at the
   cost of a credential the monitoring system has to hold and rotate.

The silent version of this decision — nobody makes it, and the probe
quietly measures the proxy — is a green dashboard in front of a dead
service. That is the failure to design against.

## Pre-production, and the suite that fails at a login page

A pre-production environment behind the proxy needs a **service token the
test run can present**, injected like any other secret and catalogued by
name — never value — in `docs/blueprint/environment.md`.

Without it the staging suite does not fail informatively. It reaches a
login page, gets HTML where it expected the application, and reports an
application error: the diagnosis points at the product and the cause is
the proxy. Provisioning the credential at the same time the environment
goes behind the proxy is what prevents an afternoon of debugging the wrong
system.

Seats are not the mechanism here — a credential is not a seat, which is
also the cheaper answer.

## What this component stays silent on

**Where the fronted project actually runs.** Zero Trust Access fronts a
service; it does not host one. Any cloud's deploy bundle composes with
this one, and pairing them is vwf's job.
