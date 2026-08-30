# GitHub Actions — resolution & layout

## The system is a recorded fact, never detected

Which CI system a repo uses is read from the project's configuration. **Never
detected from the filesystem, and never defaulted silently.** A repo that
happens to contain a `.github/` directory may be mirroring, may be migrating, or
may have a stale file nobody deleted — and generating a pipeline on that
evidence produces a second pipeline beside the real one.

Where the fact is absent, ask. An unanswered question is cheaper than a wrong
pipeline.

## Read the repo before writing to it

Three things are read, not assumed:

- **The layout.** Whether this is one project or a workspace of several, and
  which packages a workspace holds — from the workspace manifest the repo's
  package manager keeps, never from a directory listing. **List what you found
  and have it confirmed**, because a package silently omitted is a package
  silently never validated.
- **The toolchain config**, including whether the repo defines a CI variant of
  it (see [toolchain installation](toolchain.md)) and which task names exist.
  Those task names become the step commands, so **a repo with no toolchain
  config is a stop, not a fallback** — scaffold one first. A pipeline whose
  steps invent commands is a pipeline nobody can run locally.
- **The workflows already there.** Never clobber one: pick a non-colliding
  name and say which existing files you left alone. A repo mid-migration is
  exactly the case where an overwrite destroys the thing being migrated from.

## What the user must still be told

The pipeline depends on things outside it, and they fail at run time rather
than at write time. Report them: every tool the steps need must be declared in
the repo's toolchain config; every task name the steps call must exist; and
every secret, federated-identity binding or registry the workflow references
must be configured in the CI system's own settings.

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
