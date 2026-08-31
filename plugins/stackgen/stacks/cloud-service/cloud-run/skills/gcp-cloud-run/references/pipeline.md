# Pipeline — Cloud Run

Image → Artifact Registry → Cloud Run.

## The release runs behind a mise task

Every step of the release is a task, so **the same command runs locally and in
CI**. That is what keeps the deploy target swappable: the workflow calls the
task, and the task is the only thing that knows which provider is on the other
end. A workflow that shells out to a provider CLI directly has welded the
pipeline to the target.

## What the deploy must guarantee

vwf's delivery-pipeline contract states these as guarantees rather than as a
spelling, and this component satisfies them without redefining them:

- **Deliberate** — an explicit act naming one project and one environment, never
  a consequence of a branch push.
- **Branch-validated** — the commit being released is reachable from the branch
  that environment releases from.
- **Tested before release** — the released project's tests, and its dependents',
  have passed on that commit.
- **Staging is not a release** — promoting to staging does not imply production.
- **One digest promoted**, not rebuilt per environment. See
  [Artifact](artifact.md).

## What triggers it is not this component's decision

The trigger — a tag, a dispatch, an approval — belongs to the CI system pinned
on the project's `cicd` axis, behind `assets/contracts/release-trigger.md`. The
recommended default is a `<project>-<env>-v<semver>` tag, and it is a
recommendation, not this component's rule.

**This component defines no pipeline of its own.** The provider ships a build
service, and it is deliberately not part of this stack, so there is exactly one
place a pipeline is defined and exactly one place to look when a release
behaves unexpectedly. A second, unmaintained pipeline is how a green check comes
to mean nothing.

## Rollback

The rollback path is the same act as the deploy, naming an earlier digest — not
a rebuild of an earlier commit, which produces an artifact nobody tested. Keep
enough digests in the registry for that to be possible: the cleanup policy set
at repository creation should retain more than one release, which is easy to get
wrong in the direction of retaining none.

Traffic splitting between revisions belongs here too when the product wants a
staged rollout, but take it deliberately — it doubles the number of code
versions in production, and anything stateful behind the service has to tolerate
both at once.
