# GitHub Actions — release triggering

The release-trigger contract (`assets/contracts/release-trigger.md`) states
the shape: the tag grammar, right-to-left parsing, the branch mapping, the
release task names, and how far a deploy path may be split. **Read it
first.** This states how Actions is wired to express it, and cites rather
than restates — both it and vwf's delivery-pipeline contract, which is what
the trigger contract serves.

## The trigger is a tag

A push-to-branch trigger is the thing this replaces, and the reason is that it
conflates two decisions: *this code is good* and *this code should ship*. A tag
separates them, so merging is not releasing.

In Actions that is a `push.tags` filter. The filter is a glob and cannot
express the grammar, so the first job re-matches the whole tag and fails on a
malformed one — the contract's "the filter is coarse; the pipeline
re-validates".

Give the release workflow **its own file**. Its trigger surface is the
narrowest in the repo, and a publish path sharing a file with validation has a
far larger surface of ways to fire unintentionally.

## Validate the branch before publishing

**A tag can be pushed pointing at any commit, on any branch.** Nothing about the
tag's existence proves the commit it names was ever validated, reviewed or
merged.

So the release workflow verifies that the tagged commit is on the branch the
environment releases from, and refuses otherwise. Two Actions-specific traps
make this fail quietly if missed:

- **The checkout must not be shallow.** Actions checks out one commit by
  default; an ancestry test against a branch it never fetched is not a check.
- **The comparison is against the remote ref**, not a local branch name the
  runner does not have.

## Tested before released

The release workflow runs the gates itself rather than trusting that they ran
somewhere earlier. It is more expensive and it is the only way the guarantee
holds: the run that validated the branch is not necessarily the commit being
tagged, and "there was a green check somewhere" is not a check.

Where the released project has dependents, the gate fans out over the project
**and its dependents** — resolved from the workspace's own dependency query,
never from a hand-maintained list. Every leg must pass before any deploy job
starts.

## Concurrency: never cancel a deploy

Group the release workflow's concurrency by the tag, and **do not cancel in
progress**. Cancelling a superseded validation run is right; cancelling a
half-finished deploy leaves an environment in a state nothing recorded.

## Splitting the deploy

The contract's rule — write the common half once, factor only the deploy —
lands in Actions as one caller workflow plus a reusable (`workflow_call`) one
that performs the deploy. The structural cost the contract warns about is
concrete here: **`jobs.<id>.uses` accepts no expressions**, so the reusable
workflow's path must be a literal. A second variant means a second job in the
caller guarded by a condition on the resolved project, and that guard list
grows with every project added. Emit one unless the projects genuinely differ
in something Actions itself must express.

Use an Actions **environment** on the deploy job. It holds the approval rule
and the scoped secrets together, so the credential is unavailable until the
approval exists — stronger than a conditional step, which is code editable in
the same pull request.

## Idempotent publishing

**Skip, do not fail, when the version is already published.** Tags get
re-pointed, dispatches get retried, runs get re-run — and a release workflow
that hard-fails on an already-published version reports a successful state as a
failure, which trains people to ignore it.

## The entry-point trap

Where a registry authorizes publishing by **workflow filename** — federated
publishing generally does — the file that runs the publish must be the file the
registry was told about. A second workflow that calls the release workflow as a
reusable job does **not** satisfy this: the registry sees the caller's name and
matches nothing.

The working shape is a **dispatch**: the second workflow triggers the release
workflow, so the release workflow is the entry point and its filename is the one
authorized. Note that a tag pushed by the pipeline's own token does not start a
workflow run — but dispatch events are an explicit exception to that rule, which
is what makes this shape work without a personal token.

## Keep the trigger surface still

The release workflow's triggers are the narrowest in the repo, and changes to
them are changes to who can publish. Where a registry binds authorization to
that file, renaming it silently breaks publishing — with an authorization error
that reads as a credentials problem.
