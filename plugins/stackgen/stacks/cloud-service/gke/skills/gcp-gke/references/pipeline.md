# Pipeline — GKE

Image → Artifact Registry → cluster.

## The release runs behind a mise task

The task renders the environment's manifests and applies them, so **the same
command runs locally and in CI**. That is what keeps the target swappable: the
workflow calls the task, and the task is the only thing that knows a cluster is
on the other end.

Manifests are versioned in the repo and rendered per environment — never
maintained as three divergent copies, and never edited in the cluster. A change
applied by hand is a change nobody reviewed and nobody can reproduce, and on
this platform it survives until something else overwrites it.

## What the deploy must guarantee

vwf's delivery-pipeline contract states these as guarantees rather than as a
spelling, and this component satisfies them without redefining them:

- **Deliberate** — an explicit act naming one project and one environment, never
  a consequence of a branch push.
- **Branch-validated** — the commit being released is reachable from the branch
  that environment releases from.
- **Tested before release** — the released project's tests, and its dependents',
  have passed on that commit.
- **Staging is not a release.**
- **One digest promoted**, not rebuilt per environment. See
  [Artifact](artifact.md).

## What triggers it is not this component's decision

The trigger — a tag, a dispatch, an approval — belongs to the CI system pinned
on the project's `cicd` axis, behind `assets/contracts/release-trigger.md`. The
recommended default is a `<project>-<env>-v<semver>` tag, and it is a
recommendation, not this component's rule.

**Prefer one pipeline over a second one.** The provider ships both a build
service and a progressive-delivery service, and either can be made to define a
pipeline of its own. The delivery service earns its complexity only once
promotion across several environments is a routine event rather than an
occasional one — and even then it is driven *by* the release task rather than
replacing it. Two pipelines is how a green check comes to mean nothing.

## Rollback

Re-apply the previous manifest revision, which names the previous digest — not a
rebuild of an earlier commit, which produces an artifact nobody tested. That
only works if manifests are in version control and reference digests, which is
why both rules above are load-bearing rather than tidy.

Keep enough digests in the registry for it to be possible: the cleanup policy
set at repository creation should retain more than one release, which is easy to
get wrong in the direction of retaining none.
