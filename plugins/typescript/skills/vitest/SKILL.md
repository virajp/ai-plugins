---
name: vitest
version: 0.1.0
category: development
description: Opinionated Vitest + @effect/vitest testing standards for Effect
  TypeScript projects (single-package or monorepo) — the shared config
  (vite-tsconfig-paths, v8 coverage to 100%), it.effect tests, the _testUtils
  layout, and running via package.json scripts. Auto-applies when editing test
  files or vitest.config.ts.
license: MIT
user-invocable: false
paths:
  - "**/vitest.config.ts"
  - "**/*.test.ts"
---

# Vitest Testing Standards

Test every repo — single package or monorepo — with **Vitest +
`@effect/vitest`**. The config shape is the same everywhere; only the coverage
scope and the run wrapper vary with what the code needs. In a monorepo each
package keeps its own `vitest.config.ts`.

## Config baseline

`vite-tsconfig-paths` resolves the `@/` alias in tests (no extra config — it
reads `tsconfig.json` `paths`, see the **tsconfig**/**build** skills). v8
coverage is scoped with `include` and held at 100%; tests run sequentially
(deterministic — avoids shared-state races, e.g. a shared emulator):

```typescript
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      include: ["src/modules/**"], // only meaningful source counts
      provider: "v8",
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    sequence: { concurrent: false },
    testTimeout: 30000,
  },
});
```

Scope coverage with `include`/`exclude` so type-only files, generated output,
and render shells don't dilute the metric — never lower the thresholds to pass.

## Test-only files (`_testUtils/`)

Everything that exists **only** for tests lives in a `src/_testUtils/` folder —
never mixed into source. It holds Vitest's two entry points plus shared helpers,
stubs, and fixtures (code or non-code):

- `global.ts` — `globalSetup`: one-time work (start/seed the emulator, env).
- `setup.ts` — `setupFiles`: per-test-file work (register mocks, reset state).
- helpers & stubs (`app.ts`, `auth.ts`, `firebase.ts`, `stubs.ts`, …) and seed
  data (`seed/`, `data/`).

Wire the entry points in `vitest.config.ts` and exclude the whole folder from
coverage:

```typescript
test: {
  globalSetup: "./src/_testUtils/global.ts",
  setupFiles: ["./src/_testUtils/setup.ts"],
  coverage: { exclude: ["src/_testUtils/**"] /* … */ },
}
```

## Writing tests

Use `it.effect()` from `@effect/vitest` for Effect programs (it runs the Effect
and fails the test on an unexpected error channel). Use `describe.sequential`
for suites that share state:

```typescript
import {
  describe,
  expect,
  it,
} from "@effect/vitest";

describe.sequential("/user", () => {
  it.effect("gets a user", () =>
    Effect.gen(function*() {
      const response = yield* TestAppInstance.call({
        method: "GET",
        path: `/user/${userId}`,
        authToken: TestAppInstance.getAuthToken(0),
      });
      expect(response.status).toBe(StatusCodes.OK);
    }));
});
```

- Import test utilities from `@effect/vitest`, **not** `vitest` directly.
- Use `@faker-js/faker` for test data.
- Capture the response in `beforeEach`/test body and log it in `afterEach` +
  `onTestFailed` for debuggable failures.

## Mocking services

Provide a mock `Layer` for an `Effect.Service` rather than stubbing methods ad
hoc:

```typescript
const program = UserService.get(userId).pipe(
  Effect.provide(UserService.Default.pipe(Layer.provide(mockFirestoreLayer))),
);
```

## Running tests

Run through **package.json scripts**, never bare `vitest run` — the scripts add
the wrappers a package needs. Service and worker need the Firebase emulator
(`wait-on`) and secrets (`doppler run --`), plus `RUNTIME_ENV=test`:

```jsonc
{
  // service / worker — emulator + secrets
  "test:coverage": "wait-on --config waitOn.json && doppler run -- env RUNTIME_ENV=test vitest run --coverage",
  "test:users": "wait-on --config waitOn.json && doppler run -- env RUNTIME_ENV=test vitest run src/modules/user/",
  // web / common — no emulator or secrets
  "test": "vitest run",
  "test:coverage": "vitest run --coverage",
}
```

Expose per-module scripts (`test:users`, `test:rides`, …) for fast focused runs.

## Variations by what the code needs

Coverage scope and the run wrapper vary with what the code does — in a monorepo
these map to packages:

| Package   | Coverage `include`                                | Notes                                                                                                       |
| --------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `service` | `src/modules/**`                                  | emulator + doppler; `e2e/` suite via `--dir e2e` + `TEST_MODE=external`                                     |
| `worker`  | `src/modules/**`                                  | excludes `*.workflow.ts` (runs in the Temporal V8 isolate — verified by replay) and type-only `*.schema.ts` |
| `web`     | `src/lib/**`, `src/components/**`, `src/pages/**` | adds `environment: "jsdom"` + `globals: true` for React-island tests; excludes `.astro` shells              |
| `common`  | the specific schema/util files                    | plain `vitest run`, no wrappers                                                                             |

The constant everywhere: `vite-tsconfig-paths`, v8 coverage held at its
threshold via `include`, `sequence.concurrent: false`, and `it.effect` for any
Effect code.
