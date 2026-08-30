# The local stack — the harness contract

**This is a harness contract, not a capability contract.** Its six
neighbours in this directory each state what any provider of one capability
*category* must satisfy. This one states the mechanism behind one vwf
*harness capability* — `local_stack` — which no component chooses and every
component with a backing service inherits. It is written here for the same
reason they are: it is doctrine that belongs above the instance, and
anything two components would both say belongs written once.

Components cite it. They do not restate it.

## Why the mechanism is fixed

vwf's harness contract lets a repo name the `local_stack` task whatever it
likes, but **not** change how it works: when a repo needs a local stack it
is Docker-composed services behind `wait-on` readiness gates.

The reason is the acceptance verifier. It needs a deterministic ready
signal before it runs anything, and a container that is *running* is not a
container that is *ready*. The gap between the two is where flaky E2E
suites live.

**Which services appear is the backing axis's decision.** This contract
never names one — the datastore, queue, identity or telemetry component
says what belongs in the file, and this says how the file behaves.

## What every stack satisfies

- **Every service declares a healthcheck.** Without one the barrier below
  has nothing to wait on and degrades to a guess.
- **Image tags are pinned to a version**, never a floating one. A stack
  that drifts under the suite produces failures nobody can reproduce.
- **Ports are bound explicitly**, outside the ephemeral range, so a
  developer can attach a client to the instance the tests use.
- **Data is disposable.** Named volumes are fine for speed; nothing may
  depend on state surviving a teardown. A test that only passes on the
  second run depends on leftovers.
- **Only what the suite uses.** A stack that boots six services to test two
  costs minutes of every run, forever.

## The gate is two layers, and both are needed

Bring the stack up and block until it is genuinely ready before a single
test runs:

1. **The compose runtime's own healthcheck barrier**, which honours the
   healthchecks declared above.
2. **A `wait-on` gate on the application-level endpoints**, which covers
   what a container healthcheck cannot see: the endpoint *your* code will
   call. A datastore accepting connections is not a migrated schema.

Both go behind the repo's own task, so the same command runs locally and in
CI, and that task name is what `.config/vwf.yaml`'s `harness:` block
records. **Vary the task name freely; never vary the mechanism.**

## Findings, not variants

- **A `sleep` in place of a readiness gate.** Long enough on a laptop,
  short enough on a loaded CI runner — the single most common cause of a
  suite that fails only in CI, and the worst kind of failure because it
  looks real.
- **A non-Docker container runtime.** vwf's stated mechanism is Compose; an
  alternative is a deviation to raise, not to record silently.
- **Reaching a production or shared-staging service** from the local
  suite. That is not a local stack, and its failures are someone else's
  deploy.

## When there is none

A product whose local E2E needs no backing services **needs no local stack
at all**, and adding one to satisfy a checklist is the speculative work
minimalism rejects. Record `local_stack: n/a` in the harness stamp and move
on.

## The line against the deploy artifact

Containers do two unrelated jobs and conflating them is the usual mistake.
This contract is the local stack. The **deploy artifact** — one image per
deployable, built once and promoted between environments — is a
`deploy-target` component's subject (`assets/kinds.md`), and a repo needs
either, both or neither. A product deploying to a managed cloud service
still runs its local stack from here.
