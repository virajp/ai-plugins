# GitHub Actions — the gate sequence

## What runs, and when

Validation runs on **every push to the default branch and every pull request**.
Not on a schedule, not only on merge: a gate that runs after merge tells you
what already landed.

## The same task names the developer runs

The pipeline invokes the repo's task library — the identical task names someone
runs locally. This is the property that makes CI trustworthy rather than a
second opinion: a green local run and a red CI run should be impossible for
reasons other than environment.

The anti-pattern is a workflow that inlines commands. It works, and it becomes a
second definition of the gate that drifts from the first the moment either is
edited. See the same rule from the hook-runner's side in the `pre-commit` pack.

## Ordering: cheap first

Order the gates by cost, cheapest first, so the common failure reports in
seconds rather than after the slow job:

1. **Format and lint** — sub-second, and the most frequent failure.
2. **Generated-artifact checks** — anything committed that is derived from
   something else, proven regenerable. Cheap, and it fails as staleness rather
   than as a confusing downstream error later.
3. **Type checking**, where the language has it separately.
4. **Unit tests.**
5. **Integration and end-to-end tests**, which need the local stack up.
6. **Security and vulnerability scans**, which are slow and rarely the failure.

## Fail fast, but report everything cheap

Within one job, a failing step stops the job — correct, because later steps
generally depend on it. Across parallel jobs, let them all finish: cancelling
siblings on the first failure hides the other three problems and turns one fix
cycle into four.

## The local stack

Integration tests need backing services, composed and gated on a readiness
signal — the same `wait-on` mechanism the harness contract fixes, for the same
reason: a sleep is a guess that passes on a fast runner and fails on a slow one,
producing a flaky failure that costs more to diagnose than the test is worth.

## Concurrency

Cancel superseded runs **on a pull request** — pushing three times in a minute
should not run three full pipelines. Do **not** cancel on the default branch: a
cancelled run on `main` leaves a commit whose validation status is unknown,
which is indistinguishable from untested.

## What does not belong here

Deployment. The validation pipeline proves the code is good; shipping it is the
release path's job, with its own narrow trigger — see
[release triggering](release.md).
