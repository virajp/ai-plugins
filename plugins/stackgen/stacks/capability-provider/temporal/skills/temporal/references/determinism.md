# Temporal — determinism & versioning, the constraint that bites

The one property that reshapes how the product is written. Everything else in
this pack is guidance; this is a rule the engine enforces by corrupting your
execution if you break it.

## The workflow body is replayed

On every resume — after a crash, a deploy, a worker restart — the workflow body
is **re-executed from its history**. The engine replays the code and expects it
to make the same decisions it made before, matching against the recorded events.

So anything non-deterministic corrupts the replay:

- **no clock reads** — `now()` returns a different value on replay
- **no random values** — same problem, louder
- **no network calls** — the response may differ, or the service may be down
- **no direct I/O** — reading a file or a database is a clock read wearing a
  different hat
- **no iteration over unordered collections**, where the order can vary between
  runs

**All of it goes in activities.** An activity's result is recorded in history,
so on replay the recorded value is returned rather than the work being redone.
That is the whole model: workflows decide, activities act.

## The second half: changing shape breaks in-flight executions

This is the part that causes production incidents, because it is invisible in
testing against an empty engine.

**A workflow already running was started against the old code.** Its history was
recorded against the old sequence of steps. Deploy a body with a different
shape — a step added, removed or reordered — and the replay no longer matches
history. The in-flight execution does not fail gracefully; it fails as a
non-determinism error, mid-process.

**"Deploy it and see" is how a production incident starts.**

## Decide the versioning strategy up front

Two workable answers, and the choice belongs in the blueprint, not in whoever is
deploying:

**Versioned in place.** The workflow body branches on a version marker, so old
executions continue on the old path while new ones take the new one. Correct for
long-running workflows that cannot be drained. Costs branch clutter that
accumulates and must eventually be cleaned up, which is its own scheduled work.

**Drained before the change ships.** Stop starting new executions, wait for
in-flight ones to complete, then deploy. Simple and clean, and only available
when workflows are short-lived relative to the deploy cadence.

**The deciding question is workflow duration against deploy frequency.** A
workflow that runs for a week in a product that deploys daily cannot be drained,
so it must be versioned — and knowing that before the first one is written is
much cheaper than discovering it.

## The practical guard

Keep workflow bodies **small and stable**: orchestration only, with the volatile
logic in activities where it can change freely. An activity's implementation can
be rewritten between deploys without touching any replay, because only its
recorded result matters. That is the seam that makes the versioning tax
affordable.
