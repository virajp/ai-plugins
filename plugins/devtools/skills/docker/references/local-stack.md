# The local stack — Compose behind readiness gates

The `local_stack` harness capability exists so `e2e_local` has real backing
services to run against. vwf fixes its **mechanism** (Docker-composed services
behind `wait-on` readiness gates) while leaving its *task name* free, because
the acceptance verifier's reliability depends on a deterministic ready signal.

Everything below is the mechanism. **Which services appear in the file is the
backing axis's decision** — this reference never names one.

## Shape

One compose file at the repo root, holding only what `e2e_local` needs:
emulators, a datastore, a queue broker. Not the application under test — that
runs from the dev server or the test harness, against the stack.

Rules that hold regardless of which services are in it:

- **Every service declares a healthcheck.** A container that is *running* is not
  a container that is *ready*, and the gap between the two is where flaky E2E
  suites live.
- **Pin image tags to a version**, never `latest`. A local stack that drifts
  under the test suite produces failures nobody can reproduce.
- **Bind ports explicitly** and keep them out of the ephemeral range, so a
  developer can attach a client to the same instance the tests use.
- **Data is disposable.** Named volumes are fine for speed; the suite must not
  depend on anything surviving a `down -v`. A test that only passes on the
  second run is a test that depends on leftover state.

## The gate task

Bring the stack up and **block until it is actually ready** before a single test
runs. Two layers, and both are needed:

```sh
docker compose up -d --wait      # compose's own healthcheck barrier
pnpm dlx wait-on tcp:5432 http://localhost:8080/ready   # the app-level contract
```

`--wait` honours the healthchecks the compose file declares. `wait-on` covers
what a container healthcheck cannot see: the endpoint *your* code will call. A
datastore accepting connections is not the same as a migrated schema.

Wire both behind a mise task so the same command runs locally and in CI:

```sh
mise run local:up      # compose up --wait, then wait-on the app-level endpoints
mise run test:e2e      # depends on local:up
mise run local:down    # compose down -v
```

The task name is what gets recorded in `.config/vwf.yaml`'s `harness:` block.
Vary it if the repo's conventions differ; do not vary the mechanism.

## What is a finding, not a variant

- **A `sleep` in place of a readiness gate.** Long enough on a laptop, short
  enough on a loaded CI runner — this is the single most common cause of an
  E2E suite that fails only in CI.
- **A non-Docker container runtime.** vwf's stated mechanism is Compose; an
  alternative runtime is a deviation to raise, not to record.
- **Services the suite does not use.** A stack that boots six containers to test
  two is minutes of every run, forever.
- **Reaching a production or shared-staging service from `e2e_local`.** That is
  no longer a local stack, and its failures are someone else's deploy.

## When there is no local stack

A product whose `e2e_local` needs no backing services **needs no Docker at
all**, and adding a compose file to satisfy a checklist is exactly the
speculative work the minimalism doctrine rejects. Record `local_stack: n/a` in
the harness stamp and move on.
