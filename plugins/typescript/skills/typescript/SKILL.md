---
name: typescript
version: 0.2.0
category: development
description: TypeScript development — the always-on coding baseline plus deep
  references for Effect-TS patterns, Vitest testing, and the monorepo build
  pipeline. Auto-applies when editing any TypeScript file. Use when writing or
  reviewing any TypeScript code; read the reference matching your task.
license: MIT
user-invocable: false
paths:
  - "**/*.ts"
---

# TypeScript

The single entry point for TypeScript work. Each topic lives in its own
reference file — **read the one matching your task**. Start every change from
the always-on baseline.

| Topic                                                                               | When to read                                                                                                |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Coding standards](${CLAUDE_PLUGIN_ROOT}/skills/typescript/references/standards.md) | The always-on baseline: naming, import ordering, strict type safety, named functions, parameter conventions |
| [Effect-TS](${CLAUDE_PLUGIN_ROOT}/skills/typescript/references/effect.md)           | Effect.gen, Effect.Schema, Effect.Service, error handling, telemetry, logging, config, the HTTP boundary    |
| [Vitest](${CLAUDE_PLUGIN_ROOT}/skills/typescript/references/vitest.md)              | Writing/running tests: it.effect, the shared config, _testUtils, v8 coverage                                |
| [Build pipeline](${CLAUDE_PLUGIN_ROOT}/skills/typescript/references/build.md)       | The @/ path alias, barrels, the clean→check→build pipeline, project references, turbo                       |

For `package.json`, pnpm workspace, and `tsconfig` standards, see the
**package-json**, **pnpm**, and **tsconfig** skills.
