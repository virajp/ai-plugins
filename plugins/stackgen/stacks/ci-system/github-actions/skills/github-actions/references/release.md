# GitHub Actions — release triggering

vwf's delivery-pipeline contract, in Actions' vocabulary. The contract states
what a release must guarantee; this states how Actions is wired to guarantee it.
It cites, and does not restate.

## The trigger is a tag

`<project>-<env>-v<semver>`. The project segment is what makes a monorepo
releasable per project; the environment segment is what makes the same commit
promotable through `development`, `staging` and `production` without rebuilding.

A push-to-branch trigger is the thing this replaces, and the reason is that it
conflates two decisions: *this code is good* and *this code should ship*. A tag
separates them, so merging is not releasing.

## Validate the branch before publishing

**A tag can be pushed pointing at any commit, on any branch.** Nothing about the
tag's existence proves the commit it names was ever validated, reviewed or
merged.

So the release workflow verifies that the tagged commit is on the branch the
environment releases from, and refuses otherwise. Without that check, a tag on a
feature branch publishes unreviewed code with a version number that looks
official.

This is a real hole rather than a theoretical one: it is easy to create by
accident with a mistyped `git push --tags` from the wrong checkout.

## Tested before released

The release workflow runs the gates itself rather than trusting that they ran
somewhere earlier. It is more expensive and it is the only way the guarantee
holds: the run that validated the branch is not necessarily the commit being
tagged, and "there was a green check somewhere" is not a check.

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
