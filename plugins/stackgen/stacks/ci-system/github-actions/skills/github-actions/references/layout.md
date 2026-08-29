# GitHub Actions — resolution & layout

## The system is a recorded fact, never detected

Which CI system a repo uses is read from the project's configuration. **Never
detected from the filesystem, and never defaulted silently.** A repo that
happens to contain a `.github/` directory may be mirroring, may be migrating, or
may have a stale file nobody deleted — and generating a pipeline on that
evidence produces a second pipeline beside the real one.

Where the fact is absent, ask. An unanswered question is cheaper than a wrong
pipeline.

## Where workflows live

`.github/workflows/*.yml`, at the **repository** root — not at a project root
inside a monorepo, which is a common and silent mistake: Actions only reads the
repository root, so a workflow placed in a sub-project is never run and never
errors.

One workflow file per concern rather than one monolith. The concerns that
usually deserve their own file: validation on push and PR, release, and
scheduled maintenance. Splitting them keeps triggers narrow and makes a failing
run legible from its name alone.

## Multi-repo — a single project

The simple case: one validation workflow, one release workflow, triggers on the
whole repo. No path filtering, because everything in the repo is the project.

## Monorepo — three strategies, and the choice is the user's

**Root aggregator.** One workflow runs every project's gates. Simple, always
correct, and gets slower with every project added. The right answer while the
repo is small, and it stops being right without announcing it.

**Static fan-out.** One job per project, listed explicitly. Parallel, legible in
the UI, and every project runs on every change — so cost scales with projects
rather than with what changed.

**Change-filtered fan-out.** One job per project, each gated on whether that
project's paths changed. Cheapest and the most complex: the filter is a second
place the repo's structure is encoded, and a project whose filter is wrong is
silently never validated.

The trap worth naming for the third: **a shared dependency changing must
trigger every dependent project.** A filter listing only a project's own
directory misses the change to the library it imports, and the failure appears
later, in someone else's pull request.

## Release workflows sit apart

A release workflow's trigger surface is deliberately narrow and separate — see
[release triggering](release.md). Keeping it in its own file is not tidiness: a
publish path that shares a file with validation has a much larger surface of
ways to fire unintentionally.
