# Local dev — Firestore

**The local stack is the Firebase Emulator Suite**, started by one task with its
own ready signal. It runs offline, with no billing account and no contention
over a shared environment, and it evaluates security rules — which makes it good
enough that tests running against it are meaningful.

## It satisfies `local_stack` without Docker

`assets/contracts/local-stack.md` is the harness contract, and its
non-negotiable is the **deterministic readiness signal** the acceptance verifier
gates on — never a fixed sleep. The suite has one.

So report `local_stack` as satisfied by the suite with its startup task. **Do not
wrap it in a compose file to look conventional**: that adds a layer, adds a
failure mode, and satisfies nothing the contract actually asks for. A product
that mixes this store with a service that has no emulator takes both — the suite
for this half, Compose for the rest, one task that starts both and one gate that
waits for both.

The provider's full emulator map is the `gcp` skill's local-development
reference.

## The fidelity gap that matters: composite indexes

**The emulator answers queries no production composite index supports.** A query
works all the way through development and fails on the first deploy, with an
error nobody saw coming because nothing local could have produced it.

The fix is procedural, not clever:

- **Commit the index definitions** alongside the code.
- **Deploy indexes ahead of the code that needs them** — index builds take time
  on real data, so this is a separate, earlier step rather than part of the same
  release.
- Treat a query added without a matching index entry as an incomplete change.

## The other gaps

- **IAM is not enforced.** Every permission error is a production-only error, so
  least privilege is verified in a real environment.
- **Quotas and rate limits** are not enforced. Anything whose correctness depends
  on backoff behaviour is untested until staging.
- **Contention** behaves differently. Transaction retries under real concurrency
  are not reproduced by a serial local suite, so an optimistic-concurrency path
  that has never actually conflicted has never actually been tested — write a
  test that forces the conflict rather than waiting for one.

Design the E2E suite so these are the *only* categories that can differ. When a
bug escapes to staging, check whether it belongs to one of them before assuming
the suite is at fault.

## Wiring and hygiene

- Point the SDK at the emulator by **environment variable**, never by a code
  branch. A branch is a production risk; an unset variable talks to the real
  service, which is loud.
- **Seed through the services layer**, not by writing documents directly — a seed
  that bypasses the write path creates documents the application could never have
  produced, and tests that pass against them prove nothing.
- **Reset state between runs**, not between assertions.
- **Test rules with client credentials**, including negative cases. Rules tested
  through the admin SDK are not tested at all — it bypasses them.
- Keep the suite's version pinned alongside the SDK version; the two drift, and
  a mismatch surfaces as behaviour nobody changed.
