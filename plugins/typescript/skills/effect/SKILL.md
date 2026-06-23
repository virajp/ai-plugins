---
name: effect
version: 0.2.0
category: development
description: Opinionated Effect-TS patterns — Effect.gen, Effect.Schema,
  Effect.Service, a single error class, telemetry spans, structured logging, and
  Effect Config. Auto-applies when editing any TypeScript file. General language
  standards live in the `typescript` skill.
license: MIT
user-invocable: false
paths:
  - "**/*.ts"
---

# Effect-TS Coding Standards

**Effect is mandatory.** Every async operation is an `Effect`, never a `Promise`
— no bare `async`/`await`, `.then()`, or returned `Promise` in application code.
Sequential logic lives in `Effect.gen`; data shapes are `Effect.Schema`;
capabilities are `Effect.Service`. Code that does async work with raw promises
is non-conforming and must be migrated to Effect (the only exception is the thin
boundary where Effect meets a non-Effect runtime — see **HTTP boundary**).

> General TypeScript standards — naming, import ordering, strict type safety —
> live in the **typescript** skill. This skill covers the Effect layer on top.

## Imports

Import Effect and shared helpers from the project's **barrel** (`@/effect`), not
from `effect` directly — the barrel re-exports `Effect`, `Schema`, `Layer`,
`Context`, `Config`, etc. plus internal helpers (`withSpan`, schema parsers), so
imports stay one line and helpers travel with the framework. (General import
ordering is in the **typescript** skill.)

```typescript
/**
 * @file Auth service — token verification and user lookup.
 */

import {
  Context,
  Effect,
  Layer,
  withSpan,
} from "@/effect";
import {
  MyError,
  StatusCodes,
} from "@/utils";
import { getAuth } from "firebase-admin/auth";

import type { UserRecord } from "@/user/user.schema";
```

## Effect.Schema

- `PascalCase` + `Schema` suffix; derive the type from the schema:

```typescript
export const UserSchema = Schema.Struct({
  id: IdSchema,
  name: Schema.optionalWith(
    Schema.NonEmptyTrimmedString.pipe(
      Schema.minLength(5),
      Schema.maxLength(100),
    ),
    { default: () => "Rider" },
  ),
  email: Schema.optionalWith(Schema.NullOr(EmailSchema), {
    default: () => null,
  }),
  isAnonymous: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  status: Schema.optionalWith(UserStatusEnum, { default: () => "onboarding" }),
  rides: Schema.optionalWith(Schema.Array(Schema.NonEmptyTrimmedString), {
    default: () => [],
  }),
});

export type User = typeof UserSchema.Type;
```

- `Schema.NonEmptyTrimmedString` for most string fields.
- `Schema.Literal(...)` for enum-like values; `Schema.NullOr(...)` for nullable.
- `Schema.optionalWith(S, { default: () => ... })` for optional-with-default —
  prefer it over leaving fields `undefined`.

## Error handling

One error class for the whole codebase — never `throw` raw errors. Required
fields: `caller`, `code`, `level`, `status`, `error`, `state`.

```typescript
return yield * Effect.fail(
  new MyError({
    caller: "MyTemporal.startWorkflow",
    code: "WORKFLOW_START_FAILED",
    error,
    level: "ERROR",
    state: { workflowId: opts.workflowId },
    status: StatusCodes.INTERNAL_SERVER_ERROR,
  }),
);
```

- `caller` is always `"ClassName.methodName"` for error context.
- Levels: `WARN` for expected failures (not found, forbidden), `ERROR` for
  unexpected, `FATAL` for unrecoverable.
- Wrap throwing async calls with `Effect.tryPromise({ try, catch })` and map the
  failure to a `MyError` in `catch`.

## Effect.gen

`Effect.gen(function*() { ... })` for sequential operations; `yield*` to unwrap.
No `.run()`, `await`, or Promise interop inside a `gen` block.

```typescript
const getUserByToken = (idToken: string): Effect.Effect<UserRecord, MyError> =>
  Effect
    .gen(function*() {
      const decoded = yield* Effect.tryPromise({
        try: () => auth.verifyIdToken(idToken),
        catch: error => new MyError({/* … */}),
      });
      const user = yield* Effect.tryPromise({
        try: () => auth.getUser(decoded.uid),
        catch: error => new MyError({/* … */}),
      });
      if (user.disabled) {
        return yield* Effect.fail(new MyError({/* … */}));
      }
      return user;
    })
    .pipe(withSpan("getUserByToken", "/firebase/auth.ts"));
```

## Effect.Service

Capabilities are `Effect.Service` with `accessors: true`. Methods are closures
that capture yielded dependencies — call them by their closure reference, never
`ServiceClass.method()` from inside the service.

```typescript
export class MyTemporal extends Effect.Service<MyTemporal>()("MyTemporal", {
  accessors: true,
  effect: Effect.gen(function*() {
    const config = yield* AppConfig; // dependencies yielded here

    const startWorkflow = (
      opts: StartWorkflowOptions,
    ): Effect.Effect<void, MyError> =>
      Effect
        .gen(function*() {
          /* … */
        })
        .pipe(
          withSpan("MyTemporal.startWorkflow", "/_shared/temporal.service.ts"),
        );

    return { startWorkflow };
  }),
}) {}
```

- `Context.Tag` + `Layer.effect` is acceptable for thin, dependency-light tags;
  reach for `Effect.Service` by default.
- Pass objects as arguments when a function takes 3+ params or any is optional.

## Telemetry

Pipe `withSpan(name, filePath, attrs?)` onto every public method and handler.
Name it `"ClassName.methodName"`, point at the source file, and add `app.*`
attributes for the key identifiers:

```typescript
.pipe(withSpan("MyTemporal.startWorkflow", "/_shared/temporal.service.ts", {
  "app.workflow.id": opts.workflowId,
  "app.workflow.type": opts.workflowType,
}));
```

## Logging

`logInfo` / `logWarn` / `logError` / `logFatal`, `yield*`ed inside `Effect.gen`.
Always include `caller`, `message`, and `state`. Use `console.*` only for
system-level lifecycle messages (startup, shutdown).

```typescript
Effect.catchAll(error =>
  Effect.gen(function*() {
    yield* logError(error);
    return errorResponse(error);
  })
);
```

## Configuration

Parse env vars with Effect `Config` in a `_shared/config.ts`. Build a static
config export at module load; on failure, log and `process.exit(1)`.

```typescript
const config = await Effect.runPromise(
  Effect
    .gen(function*() {
      return {
        env: yield* Config.literal(
          "development",
          "staging",
          "production",
          "test",
        )("RUNTIME_ENV"),
        http2: yield* Config.boolean("HTTP2").pipe(
          Config.option,
          Config.map(Option.getOrUndefined),
        ),
        webhookSecret: yield* Config.withDefault(
          Config.string("WEBHOOK_SECRET"),
          "test-secret",
        ),
      } satisfies ConfigType;
    })
    .pipe(Effect.mapError(error => {
      console.error(`Failed to extract config: ${JSON.stringify(error)}`);
      process.exit(1);
    })),
);
```

## HTTP boundary

Effect runs at the edge only. Handlers return
`Effect.Effect<Response, never, R>` with all errors already caught via
`Effect.catchAll` into a typed failure response — the boundary
(`Effect.runPromise`) never sees an `E` channel.
