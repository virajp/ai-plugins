# Temporal — local stack

## The mechanism is fixed

**A docker-composed dev server behind a `wait-on` readiness gate** — vwf's one
non-negotiable harness mechanism, because the acceptance verifier needs a
deterministic ready signal rather than a guess.

The dev server bundles the engine and its datastore into one container, so the
local stack is one service rather than the production topology. That is the
right trade locally; it is not a rehearsal of the deployment.

## The time-skipping test framework is the payoff

This is the half that makes durable execution genuinely testable, and it is the
strongest practical argument for the engine.

**Time is skippable, so a workflow that waits fourteen days is tested in
milliseconds** — actually executed, with its real timer, its real branches and
its real compensation path, not mocked away.

That matters because long waits are exactly where hand-rolled orchestration goes
wrong, and exactly what is otherwise untestable. The usual alternative is to
extract the logic, test it synchronously, and never test the waiting — which
leaves the timer, the resume and the state after it completely unexercised.

Test the workflow body against the framework; test activities as ordinary units.

## What to test that teams skip

- **The compensation path.** It runs only on failure, so it never runs in a
  happy-path test, so it is usually written once and never executed until
  production. Force the failure and assert the compensation.
- **A replay against recorded history**, which is what catches a
  non-determinism bug before it meets an in-flight execution. This is the test
  that protects the constraint in [determinism & versioning](determinism.md),
  and it is the one most worth adding.
- **Already-started idempotency**, since starting twice is a normal race and the
  seam's required behaviour.

## What the local stack does not prove

It does not prove the **production** engine's configuration — retention, search
attribute registration, worker scaling, or the durability of the datastore
behind it. Those are verified against the deployed environment by
`/vwf:verify`, not here.

It also does not prove versioning behaviour against real in-flight executions,
because locally there are none. That risk is managed by the strategy decision,
not by testing.
