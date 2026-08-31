# Zero Trust Access — local dev

**There is no emulator, and the substitution is deliberate rather than a
shortfall.** The provider's local development map owns the general shape —
the `cloudflare` skill — including why simulating an identity-aware proxy
proves the opposite of the property under test. This is what it means for
this service.

## What runs locally

The project, directly, on its own port, with nothing in front of it. The
private plane does not exist and is not simulated.

The identity assertion the project verifies in production is **injected as
a fake** at the same seam the real one arrives through. That seam is not
something this stack introduces: the project already has a boundary where
an asserted identity becomes an application principal, because it has to
verify rather than trust the header. The fake goes there and nothing else
in the project knows the difference.

If no such seam exists, that is a finding about the project rather than
about this stack. Without one, the fake has to be threaded through
application code — and code that special-cases "local" is code that never
runs in production.

## The `local_stack` answer is `n/a`, honestly

There is no engine to compose behind a readiness gate, because there is
nothing to run. A product whose local end-to-end suite needs no backing
services needs no local stack at all, and this component adds none.

Nothing about the local task changes because this component is pinned. The
same command runs whether or not the deployed environment is fronted,
which is what makes the substitution cheap.

## What local therefore cannot tell you

Three things, and they are the three most likely to break:

- **Whether the origin is actually unreachable directly.** Locally it is
  deliberately reachable, so the local run asserts the opposite of the
  production property. This is the failure the provider's networking
  reference calls decorative, and no local suite will ever see it.
- **Whether the policy admits the right people.** The group, the rules and
  their ordering are configuration the laptop never reads.
- **Whether verification actually works.** A fake the project minted for
  itself proves the parsing, not the trust. Signature checking against the
  issuer's published keys and the audience check are deployed-environment
  behaviours.

**So the private plane is verified in a deployed environment or not at
all.** That is not a gap to close with more local machinery; it is what
local can mean here, and it is the reason the staging credential in the
service doctrine is a requirement rather than a convenience.
