# Doppler — local stack

## There is nothing to compose, and that is the finding

Doppler is **hosted-only**, and it is not a service the product talks to — it is
a command that runs before the product does. So the kind's usual answer, a real
engine behind a `wait-on` readiness gate, has nothing to point at.
`pack.yaml` records `local_stack: n/a` honestly rather than inventing a task
name.

What the kind asks for in that case is **a seam and a fake, with the gap
named**. Here they are.

## The seam is the plain process environment

Every task must run **identically without Doppler**. That is not a nicety; it is
load-bearing three times over:

- **CI runs the same tasks** under its own injector, and never installs the CLI.
- **The acceptance verifier** runs the harness's task names, unwrapped.
- **A contributor with no seat** — or no network — can still get the suite green.

This is what the "wrap the task, not the application" rule buys, and it is the
reason that rule outranks the mechanism. A task that only works when wrapped is
a task exactly one of the three above can run.

**The check is one command:** run the repo's test task with no injector and see
what fails. If the failure is a missing credential, that is correct. If the
failure is the task itself — a missing binary, a `doppler` invocation inside a
task file — the seam is broken and it is broken for CI too.

## The fake is a documented set of non-secret defaults

For everything the test suite needs that is not a real credential, supply values
from `.config/mise.dev.toml`'s `[env]` block rather than from the injector. Log
levels, runtime environment names, local service URLs and throwaway
local-stack credentials are configuration, not secrets, and routing them through
Doppler is what turns a seat into a prerequisite for running the tests.

**Throwaway credentials for the local stack stay throwaway and stay in the
repo.** A composed Postgres's password is not a secret; putting it in Doppler
gains nothing and costs a contributor their ability to start.

## The gap, stated

**A test that needs a real third-party credential cannot run without a seat.**
There is no local Doppler and no offline mode, so that class of test is gated on
org membership. Two honest ways to live with it, and they should be chosen
deliberately rather than by accident:

- **Keep those tests out of the default suite**, behind their own task name, so
  the unwrapped run is still green and the gap is visible in the task list
  rather than as a failure a newcomer has to diagnose.
- **Fake the third party at its own boundary** for the default suite, and run
  the credentialed version where the credential is already available.

What must not happen is the default suite silently requiring the injector: it
converts "you are not in the org yet" into a wall of failing tests, and it makes
the CI-runs-the-same-task guarantee false at the same time.
