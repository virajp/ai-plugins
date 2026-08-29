# Container image — promotion & release

## One digest, promoted

The image built from a commit is the image that reaches production. It is
**promoted** between environments — retagged, never rebuilt — so the
artifact the tests ran against is the artifact that ships.

A rebuild per environment is the failure this rule exists to prevent, and it
is quiet: every test still passes, because the tests ran against a
*different* image that was built the same way. Anything that changed in
between — a floating base tag, a transitive dependency, a build-arg default
— reaches production untested.

The corollary is that the image can contain nothing environment-specific.
That constraint is what makes promotion possible at all; see
[Config & secrets](config-and-secrets.md).

## The registry is a stop, not a decision

Push to whichever registry the host can pull from. Nothing in this target
depends on which one, and keeping it that way is part of what makes the host
swappable. Two things do matter:

- **The tag is derived, not typed.** Tag by commit and by release version,
  and treat the digest as the identity. A tag that can be moved is not an
  identity.
- **Retention is decided rather than defaulted.** Images accumulate. Decide
  what is kept and for how long before the bill or the quota decides for
  you.

## Release goes through the repo's own task

The release is wrapped in the repo's task library, so the same command runs
locally and in CI. That indirection is the whole mechanism for swapping the
host later: the pipeline calls the task, and the task knows the provider's
CLI. A pipeline that calls the provider directly has to be rewritten to
move.

## The pipeline is not written here

Deploys obey **vwf's delivery-pipeline contract** — tag-triggered, shaped
`<project>-<env>-v<semver>`, branch-validated, and gated on the tagged
project's tests plus its dependents'. That contract is cited, not restated,
and it is the **CI system's** job to implement.

No build service of the host's is part of this stack. There is exactly one
place a pipeline is defined, and a host-side build trigger would silently
become a second one.
