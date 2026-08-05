# Effect Runtime: Composing & Running

The **effect** reference covers writing effects. This one covers assembling them
into an application and running it: wiring `Layer`s, owning a `ManagedRuntime`,
managing resources with `Scope`, retrying with `Schedule`, streaming, and
controlling time in tests. Everything here also assumes an **Effect codebase**
(see the applicability guard in the **effect** reference). Import these modules
from the `@/effect` barrel like the rest of the framework.

## Layer composition

A `Layer<ROut, E, RIn>` builds services (`ROut`) from requirements (`RIn`).
Compose the graph with three combinators — reach for them in this order:

- **`Layer.provide(dep)`** — feed `dep`'s outputs into a layer's requirements,
  hiding `dep` from the result. Use it to satisfy an inner dependency you don't
  want re-exported.
- **`Layer.merge(a, b)`** — put two independent layers side by side; both appear
  in the output.
- **`Layer.provideMerge(dep)`** — provide `dep` **and** keep it in the output.
  Use it only when a downstream layer also needs `dep`.

```typescript
// UserService needs Database; Database needs Config.
const AppLayer = UserService.Default.pipe(
  Layer.provide(DatabaseLive.pipe(Layer.provide(ConfigLive))),
);
```

- Build one top-level `AppLayer` (or `TestLayer`) per runnable surface; never
  `Effect.provide` a service layer ad hoc deep inside business logic.
- A `Layer.effect` / `Effect.Service` layer is **memoized** — provided once, its
  build effect runs once and every consumer shares the instance. Rely on this
  instead of hand-rolling singletons.
- Keep the `RIn` of `AppLayer` at `never` — a fully-wired app has no unmet
  requirements. A leftover requirement is a missing `Layer.provide`.

## App runtime: ManagedRuntime

An application owns **one** runtime built from its `AppLayer`. Use
`ManagedRuntime.make(layer)` at the process edge, run effects through it, and
`dispose()` on shutdown so every layer finalizer (connections, pools) releases.

```typescript
import {
  Effect,
  ManagedRuntime,
} from "@/effect";

const runtime = ManagedRuntime.make(AppLayer);

async function main() {
  await runtime.runPromise(program);
  await runtime.dispose();
}
```

- Prefer a long-lived `ManagedRuntime` over calling `Effect.runPromise` on a
  `Effect.provide(program, AppLayer)` per request — the latter rebuilds and
  tears down the whole layer graph every time.
- Reserve one-shot `Effect.runPromise(program.pipe(Effect.provide(AppLayer)))`
  for scripts and CLIs that run a single program and exit.
- The runtime is the only place `runPromise`/`runSync` is allowed — everything
  above it stays an `Effect`.

## Resource management: Scope & acquireRelease

Any resource with a lifecycle (connection, file handle, subscription) is
acquired with `Effect.acquireRelease(acquire, release)` — the release runs when
the enclosing `Scope` closes, even on interruption or failure.

```typescript
const dbConnection = Effect.acquireRelease(
  connect(config), // acquire
  connection => Effect.promise(() => connection.close()), // release, always runs
);
```

- Wrap resource-using logic in `Effect.scoped` to bound the lifetime to that
  block; or expose the resource **as a `Layer`**, so the `ManagedRuntime` owns
  the scope and `dispose()` releases it. Prefer the layer form for anything a
  service holds for its whole life.
- Acquire-use-release in one shot?
  `Effect.acquireUseRelease(acquire, use,
  release)`. For ad-hoc cleanup inside
  a scoped block, `Effect.addFinalizer`.
- Never release by hand in a `catch`/`finally` — that's exactly the leak
  `acquireRelease` prevents.

## Retries & repetition: Schedule

Retry failures with `Effect.retry(effect, policy)` and repeat successes with
`Effect.repeat(effect, policy)`, where `policy` is a `Schedule`. Never hand-roll
a retry loop.

```typescript
import {
  Effect,
  Schedule,
} from "@/effect";

// Exponential backoff, jittered, capped at 5 attempts.
const policy = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(5)),
);

const fetchUser = callApi(id).pipe(Effect.retry(policy));
```

- **`Schedule.exponential(base)`** with **`Schedule.jittered`** is the default
  for network/IO retries — jitter avoids thundering-herd retries.
- Bound every retry: `Schedule.intersect(Schedule.recurs(n))` (recurs both fire)
  or the `{ times: n }` retry option. An unbounded retry is a hang.
- `Effect.retryOrElse(effect, policy, onExhausted)` when you need a typed
  fallback after retries are spent.
- Retry **only** the errors worth retrying — filter with `Schedule.whileInput`/a
  predicate so a validation failure isn't retried like a timeout.
- `Effect.repeat` with `Schedule.spaced`/`fixed` drives periodic work (polling,
  heartbeats).

## Streams

Use `Stream` for a pull-based, backpressured sequence of values — anything you'd
otherwise hold in a giant array or drive with an async iterator. A `Stream` is
lazy: nothing happens until you **run** it.

```typescript
import {
  Effect,
  Stream,
} from "@/effect";

const total = Stream.fromIterable(userIds).pipe(
  Stream.mapEffect(id => fetchUser(id), { concurrency: 10 }),
  Stream.runFoldEffect(0, (sum, user) => Effect.succeed(sum + user.score)),
);
```

- Build with `Stream.fromIterable` / `Stream.fromEffect` /
  `Stream.acquireRelease` (a stream over a scoped resource — release runs when
  the stream ends).
- Transform with `Stream.map` / `Stream.mapEffect` (pass `{ concurrency }` for
  parallelism) / `Stream.filter` / `Stream.grouped`.
- **Run** to collapse to an `Effect`: `Stream.runForEach` (side effects),
  `Stream.runCollect` (a `Chunk` — only for bounded streams), `Stream.runDrain`,
  `Stream.runFold`. Reach for `Stream` over materializing everything when the
  source is large, unbounded, or benefits from bounded concurrency.

## Testing time: TestClock

Time-based code — `Effect.sleep`, `Effect.timeout`, `Effect.retry`/`repeat` with
a delayed `Schedule` — must be tested with `TestClock`, never real waits.
Advance a virtual clock so a five-minute timeout verifies instantly and
deterministically. `@effect/vitest`'s `it.effect` provides the `TestContext`
(which includes `TestClock`) automatically.

The pattern is **fork → adjust → assert**: fork the effect under test, advance
the clock past the scheduled time, then join and assert.

```typescript
import {
  Duration,
  Effect,
  Fiber,
  Option,
  TestClock,
} from "@/effect";
import {
  describe,
  it,
} from "@effect/vitest";
import { expect } from "vitest";

describe("timeout", () => {
  it.effect("returns None once the deadline passes", () =>
    Effect.gen(function*() {
      const fiber = yield* Effect.sleep(Duration.minutes(5)).pipe(
        Effect.timeout(Duration.minutes(1)),
        Effect.fork,
      );
      yield* TestClock.adjust(Duration.minutes(1));
      const result = yield* Fiber.join(fiber);
      expect(result).toStrictEqual(Option.none());
    }));
});
```

- Fork **before** adjusting — the effect must be suspended on the clock when you
  advance it, or the scheduled work never registers.
- `TestClock.adjust(duration)` runs everything scheduled at or before the new
  time; `TestClock.setTime` jumps to an absolute instant.
- Zero real time elapses, so a retry policy with minutes of backoff tests in
  milliseconds.
