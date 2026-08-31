# Local dev — Cloud Storage for Firebase

The **Firebase Emulator Suite's storage emulator** runs offline as part of the
same suite start, and it evaluates storage rules — which is the half that most
needs testing. It is covered by the suite's single readiness signal, so it
contributes nothing extra to vwf's `local_stack`
(`assets/contracts/local-stack.md`).

The provider's full emulator map is the `gcp` skill's local-development
reference.

## The gap that matters: lifecycle rules and storage classes are not simulated

**The two decisions with the longest-lived cost consequences are the two nothing
local exercises.** Expiry, tiering and the minimum-duration charges that make
aggressive tiering backfire are all invisible until they are real.

What follows is procedural: treat the lifecycle policy as an infrastructure
artifact, reviewed on its own terms rather than tested. Write down what each
rule is meant to achieve — how long user content lives, when an unclaimed upload
expires, what happens to an object whose record was deleted — and check the
policy against that statement, because no test will.

The orphan-expiry rule in particular deserves care: it is the one lifecycle rule
the product actively depends on for correctness rather than for cost, and it is
the one that will silently not be there.

## The other gaps

- **IAM is not enforced**, as everywhere on this provider, so a server-path
  permission error is a production-only error.
- **Resumable-upload interruption** is not something a local suite reproduces
  naturally. Test the resume path by constructing it, not by hoping a flaky
  connection appears.
- **Egress and CDN behaviour** do not exist locally at all, which means the
  service's dominant cost line is untestable by construction.

## What to test locally, and what it is worth

The rules, thoroughly. They are logic, they are the entire access-control layer
for the client-direct path, and the emulator reproduces them faithfully.
Positive cases, and — more importantly — negative ones: another user's prefix,
an oversized file, a disallowed content type, an unauthenticated request.

Then the product's own flow around the object: that a record is written, that an
unclaimed upload is recognizable, that a deleted record's object is handled the
way the blueprint says.

## Hygiene

- Point the SDK at the emulator by **environment variable**, never a code branch.
- **Reset stored objects between runs**, not between assertions.
- **Do not test rules through the admin SDK** — it bypasses them.
- Keep the suite's version pinned alongside the SDK version.
