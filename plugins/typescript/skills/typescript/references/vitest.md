# Vitest Testing Standards

Test every repo — single package or monorepo — with **Vitest**. The config shape
is the same everywhere; only the coverage scope and the run wrapper vary with
what the code needs. In a monorepo each package keeps its own
`vitest.config.ts`.

This reference is the **runner**: config, coverage, test-only files, and how
suites are run. It is deliberately framework-agnostic — what changes when the
code under test returns an `Effect` lives in the **effect** plugin's testing
reference, since the runner does not change, only the assertions.

## Config baseline

`vite-tsconfig-paths` resolves the `@/` alias in tests (no extra config — it
reads `tsconfig.json` `paths`, see the **tsconfig** skill and the **build**
reference). v8 coverage is scoped with `include` and held at 100%; tests run
sequentially (deterministic — avoids shared-state races, e.g. a shared backing
service):

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

- `global.ts` — `globalSetup`: one-time work (start/seed the local stack, env).
- `setup.ts` — `setupFiles`: per-test-file work (register mocks, reset state).
- helpers & stubs (`app.ts`, `auth.ts`, `stubs.ts`, …) and seed data (`seed/`,
  `data/`).

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

Use `describe.sequential` for suites that share state, and keep each test's
intent in its name — a failing test name should say what broke without opening
the file.

- Use `@faker-js/faker` for test data, so a test never depends on a value that
  looks meaningful but isn't.
- Capture the response in the test body and log it in `afterEach` +
  `onTestFailed`, so a CI failure is debuggable from the log alone.
- Assert on the specific failure, not merely that something failed.

## Mocking

Prefer injecting a test implementation over patching a module: a test that wires
dependencies the way production does catches a broken composition, while a
patched method only proves the method was called.

Keep every mock in `_testUtils/` so the boundary between source and test doubles
stays visible in the tree.

## Running tests

Run through **package.json scripts**, never bare `vitest run` — the scripts add
the wrappers a package needs. A package that talks to backing services needs its
local stack up (a `wait-on` readiness gate) and its secrets injected before the
runner starts:

```jsonc
{
  // a package needing the local stack + secrets
  "test:coverage": "wait-on --config waitOn.json && <secrets-runner> -- env RUNTIME_ENV=test vitest run --coverage",
  "test:users": "wait-on --config waitOn.json && <secrets-runner> -- env RUNTIME_ENV=test vitest run src/modules/user/",
  // a package needing neither
  "test": "vitest run",
  "test:coverage": "vitest run --coverage",
}
```

Which readiness gate and which secrets runner a repo uses is the **stack
plugin's** business, not this file's — the shape above is the constant.

Expose per-module scripts (`test:users`, `test:rides`, …) for fast focused runs.

## Variations by what the code needs

Coverage scope and the run wrapper vary with what the code does — in a monorepo
these map to packages:

| Kind of package | Coverage `include`                                | Notes                                                                                     |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| API backend     | `src/modules/**`                                  | local stack + secrets; a separate E2E suite via `--dir e2e` + `TEST_MODE=external`        |
| Background jobs | `src/modules/**`                                  | excludes code that runs in a foreign isolate (verified by replay) and type-only files     |
| Web UI          | `src/lib/**`, `src/components/**`, `src/pages/**` | adds `environment: "jsdom"` + `globals: true` for component tests; excludes render shells |
| Shared library  | the specific schema/util files                    | plain `vitest run`, no wrappers                                                           |

The constant everywhere: `vite-tsconfig-paths`, v8 coverage held at its
threshold via `include`, and `sequence.concurrent: false`.
