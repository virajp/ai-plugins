# Testing Effect

The Effect-specific layer on top of the **typescript** plugin's `vitest`
reference. That file owns the runner: config, coverage thresholds,
`_testUtils/`, and how suites are run. This one owns what changes when the code
under test returns an `Effect`.

## Import from `@effect/vitest`, not `vitest`

```typescript
import {
  describe,
  expect,
  it,
} from "@effect/vitest";
```

`@effect/vitest` re-exports Vitest's API and adds the Effect-aware variants. A
file mixing imports from both gets two different `it`s, and the plain one will
silently pass on an Effect it never ran — a test that constructs an effect and
never executes it asserts nothing, and reports green.

## `it.effect` runs the effect

```typescript
describe.sequential("/user", () => {
  it.effect("gets a user", () =>
    Effect.gen(function*() {
      const response = yield* TestAppInstance.call({
        method: "GET",
        path: `/user/${userId}`,
      });
      expect(response.status).toBe(StatusCodes.OK);
    }));
});
```

`it.effect` runs the returned effect and **fails the test on an unexpected error
channel** — you do not assert on success separately. The variants:

- `it.effect` — the default; runs with the test runtime and `TestClock`.
- `it.live` — runs with the live runtime when the test genuinely needs real time
  or real services.
- `it.scoped` — for effects requiring a `Scope`; the scope closes at test end,
  so acquire/release is exercised rather than leaked.
- `it.effect.each` / `.fails` — table cases and expected-failure assertions.

## Provide test Layers, don't stub methods

Mock a service by providing a mock `Layer`, not by monkey-patching:

```typescript
const program = UserService.get(userId).pipe(
  Effect.provide(UserService.Default.pipe(Layer.provide(mockDatastoreLayer))),
);
```

This keeps the dependency graph honest — the test wires the same way production
does, so a missing dependency fails at compile time rather than at runtime in
staging. A stubbed method proves the method was called; a provided layer proves
the composition works.

Build mock layers with `Layer.succeed` for a fixed value or `Layer.effect` when
the mock itself needs setup, and keep them in `_testUtils/` with the rest of the
test-only code.

## Time is controlled, not waited on

`it.effect` runs on `TestClock`, so anything time-dependent — retries with
`Schedule`, timeouts, debounce — advances explicitly:

```typescript
yield * TestClock.adjust("5 seconds");
```

A test that sleeps for real is a slow test **and** a flaky one. If a test needs
real time, that is what `it.live` is for, and it should be rare enough to
justify in a comment.

## Errors are values, so assert on them

An Effect's error channel is typed. Assert on the specific failure rather than
on "it threw":

```typescript
const result = yield * program.pipe(Effect.either);
expect(Either.isLeft(result)).toBe(true);
```

`Effect.either` or `Effect.exit` turns the failure into a value you can inspect,
which is how you verify the *coded* error a contract promises rather than merely
that something went wrong.
