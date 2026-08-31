# Cloudflare — local development map

Which of this provider's surfaces exist on a laptop, and what stands in
where none does.

## The map, at the scope this stack offers

| Surface | Locally |
| --- | --- |
| The identity-aware proxy | **Does not exist, and must not be simulated** |
| The identity assertion it passes | Injected as a fake through the project's own seam |
| Everything else Cloudflare sells | Out of this stack's scope entirely |

That is the whole map, and its shortness is the point rather than an
omission — see the scope fence in the `cloudflare` skill.

## Why simulating the proxy is the wrong instinct

A local stand-in for an identity-aware proxy proves that the stand-in
works. It cannot prove the thing that actually breaks in production —
that the origin is unreachable except through the real proxy — because
locally the origin is deliberately reachable. So the fidelity is not
merely imperfect; it is inverted, asserting the opposite of the property
under test.

The consequence is worth stating plainly: **the private plane is verified
in a deployed environment or not at all.** A local suite that goes green
has said nothing about it. That is not a gap to close with more local
machinery; it is a fact about what local can mean here.

## What runs locally instead

Local runs **reach the project directly**, on its own port, with no proxy
in front. The project still verifies an identity assertion — it must,
because trusting a header is what makes one forgeable — so the assertion
is injected as a fake at the same seam production's real one arrives
through.

That seam is not something this stack introduces. The product's identity
contract already requires a boundary where an asserted identity becomes an
application principal; the fake goes there, and nothing else in the
project knows the difference. If no such seam exists, that is a finding
about the project rather than about this stack: without one, the fake has
to be threaded through application code, and code that special-cases
"local" is code that never runs in production.

## The fidelity trap

The fake is a fake. Two things it does not exercise, which a deployed
environment must:

- **The policy.** Whether the right group is allowed, and whether anyone
  else is, is decided by configuration the laptop never sees.
- **Assertion validation against real signing keys.** A fake the project
  minted for itself proves the parsing, not the trust. Verification
  against the issuer's published keys is a deployed-environment
  behaviour.

Both belong to the pre-production environment, which is why the service
component treats a staging credential as a requirement rather than a
convenience.
