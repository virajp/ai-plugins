# GitHub Actions — pinning & caching

## Pin every third-party building block

**An unpinned action is remote code executing with the pipeline's
credentials**, re-resolved on every run. If its author's account is compromised,
or a tag is re-pointed, the next run executes different code with access to the
repository and whatever secrets that workflow holds. Nothing about the workflow
file changed, so nothing shows up in review.

Pin to an explicit version, and prefer an immutable reference where the
supply-chain posture warrants it — a tag can be moved; a commit digest cannot.
The trade is legibility: a digest says nothing about which version it is, so it
wants a comment naming the version, kept accurate.

**This applies to the toolchain installer too.** An unpinned install of the tool
that pins everything else is the pinning gap that matters most.

## Update pins deliberately

Pinned versions age, and an ageing pin accumulates unpatched issues. Update them
as their own change, reviewed on their own — never as an incidental edit inside
an unrelated pull request, where nobody is reading the diff for that.

## Cache what is expensive to fetch and safe to reuse

The candidates worth caching are dependency downloads and the toolchain
installation itself: both are network-bound, deterministic given a lockfile, and
identical across runs.

**Key the cache on the lockfile's hash.** A cache keyed on anything looser
serves stale dependencies, which produces a build that passes against packages
the repo no longer declares — the worst kind of green.

## What not to cache

**Build outputs**, unless the build is genuinely deterministic and the key
covers every input. A stale build artifact restored into a run means CI
validated something other than the current source, silently.

**Anything derived from a secret**, which puts it in a store with a different
access model than the secret had.

**Test databases and stack state.** The local stack is composed fresh so that
tests are independent; caching its state reintroduces exactly the cross-test
coupling that composing it fresh removed.

## Caching is a cost decision, not a default

A cache restore has its own time cost, and for a small dependency set it can be
slower than fetching. Measure before adding one. The cost that usually justifies
it is not the seconds — it is the flakiness of network fetches at scale, which
caching converts into a local read.
