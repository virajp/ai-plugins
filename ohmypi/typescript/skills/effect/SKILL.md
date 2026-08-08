---
name: effect
description: Effect-TS development — writing effects, composing and running
  them, and testing them. Auto-applies when editing any TypeScript file. Read the
  reference matching your task; the TypeScript coding baseline lives in the
  sibling `typescript` skill and still applies.
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
alwaysApply: false
---

# Effect-TS

Effect doctrine, split by task — **read the one matching yours**. This layers on
top of the `typescript` skill's coding standards, which apply to every
TypeScript file whether or not it uses Effect; nothing here replaces them.

| Topic                                                                              | When to read                                                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [Effect-TS](%%AI_PLUGINS_ROOT%%/skills/effect/references/effect.md)              | Effect.gen, Effect.Schema, Effect.Service, error handling, telemetry, logging, config, the HTTP boundary            |
| [Effect runtime](%%AI_PLUGINS_ROOT%%/skills/effect/references/effect-runtime.md) | Composing & running Effect: Layer wiring, ManagedRuntime, Scope/acquireRelease, Schedule retries, Stream, TestClock |
| [Testing Effect](%%AI_PLUGINS_ROOT%%/skills/effect/references/testing.md)        | `it.effect`, providing test Layers, mocking a service, TestClock in tests                                           |

For Vitest itself — config, coverage, `_testUtils`, how tests are run — see the
**typescript** plugin's `vitest` reference. That file is deliberately
Effect-agnostic: the runner and its config are the same whether or not the code
under test uses Effect, and only the assertions differ.

For `package.json`, pnpm workspace, `tsconfig`, and the lint/format gate, see
the **typescript** plugin's skills of those names.
