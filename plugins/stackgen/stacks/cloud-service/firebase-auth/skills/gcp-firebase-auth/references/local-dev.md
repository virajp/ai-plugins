# Local dev — Firebase Auth · Identity Platform

The **Firebase Emulator Suite's auth emulator** runs offline as part of the same
suite start, so sign-in works with no billing account and no shared environment.
It is part of the suite's single readiness signal, so it contributes nothing
extra to vwf's `local_stack` beyond being started with everything else
(`assets/contracts/local-stack.md`).

The provider's full emulator map is the `gcp` skill's local-development
reference.

## The gap that matters: no real provider handshake

**Federated sign-in is stubbed.** The emulator will produce a user for a chosen
provider without that provider ever being contacted, so:

- **Provider-specific token claims are never exercised.** Anything the product
  reads out of a token beyond the standard claims — a provider's email
  verification flag, a directory identifier, a tenant — is untested locally and
  may not be shaped as expected.
- **Consent, account-linking and error flows are not reproduced.** The user
  cancelling at the provider, an email already linked to another provider, a
  provider returning no email at all: these are the states that produce support
  tickets, and none of them happen locally.
- **Multi-factor flows are approximated**, not exercised end to end.

## What follows: keep verification behind a seam

The services layer exposes a verified-principal interface — subject identifier,
plus whatever the product genuinely needs — and everything downstream depends on
that rather than on a token. Tests inject a fake principal directly.

That is worth doing for its own sake, because it is what makes the issuer
replaceable, and it makes the untestable half above stop mattering for most of
the suite: only the thin verification adapter depends on the emulator, and the
rest of the product is tested against a principal you constructed on purpose —
including the cases the emulator cannot produce.

**Test the states, not the handshake.** A user with an unverified email, a
banned status, an expired token, a token for the wrong audience: all of these are
constructible against the fake, and all of them are what the product actually
has to handle.

## Hygiene

- Point the SDK at the emulator by **environment variable**, never a code branch.
- **Reset user state between runs**, not between assertions.
- **Do not test rules through the admin SDK** — it bypasses them. Rules are
  tested with client credentials against the emulator, which is the one thing
  the suite does reproduce faithfully.
- Keep the suite's version pinned alongside the SDK version.
