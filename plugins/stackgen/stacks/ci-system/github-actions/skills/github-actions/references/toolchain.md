# GitHub Actions — toolchain installation

## The rule that outranks the rest

**The pipeline installs the repo's toolchain manager, and nothing else.**

No per-language setup action. No `apt-get` or `brew install`. No `npm i -g`, no
`pipx`, no downloading a binary in a `run:` step. Every tool any job needs is
declared in the repo's mise config, and the pipeline's only setup step is the
one that installs mise.

## Why this is a hard rule and not a preference

Because the alternative silently produces **two** sources of truth for the
toolchain, and they drift.

A setup action pins a version in the workflow file. The repo's config pins one
too. They start equal and then someone updates one — and CI now validates
against a version no developer runs, or a developer works against a version CI
will reject. The failure surfaces as "works on my machine", which is exactly the
class of problem a pinned toolchain exists to eliminate.

With one source, a version change is one edit, reviewed once, and local and CI
cannot disagree.

## Run through the task library

Steps invoke tooling as `mise run <task>` where the repo has a task library, or
`mise exec -- <cmd>` where it does not. **Never a bare binary** the toolchain
step did not put on `PATH` — a bare invocation finds whatever the runner image
happens to ship, which is a version nobody chose and which changes when the
image does.

This is also what keeps the gate identical locally and in CI: the same task
name, the same command underneath. See [the gate sequence](gates.md).

## The CI environment variant

Set `MISE_ENV: ci` at the workflow level **when the repo defines a
`mise.ci.toml`**, and omit it when the repo has only a flat `mise.toml`.
Setting it against a repo with no variant is harmless but misleading; omitting
it against a repo with one means CI-only tools are silently absent and jobs fail
for a reason that reads as unrelated.

## How mise itself gets installed

This is the one thing the pipeline legitimately owns, and it is where pinning
applies — see [pinning & caching](pinning-caching.md). Install it via its
official action, pinned, or by a pinned installation script. Either is fine;
what is not fine is an unpinned install of the thing that pins everything else.

## The exception that is not one

A runner image ships tools preinstalled. Using them is tempting and wrong for
the same drift reason: the image's version is chosen by the platform, changes
without notice, and is not the version the repo declares.
