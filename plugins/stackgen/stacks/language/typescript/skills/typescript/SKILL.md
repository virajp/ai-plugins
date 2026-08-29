---
name: typescript
version: 0.1.0
category: development
description: TypeScript and JavaScript development — the always-on coding
  baseline plus references for error semantics, the async model, testing, the
  build pipeline, config and observability wiring. Auto-applies when editing any
  TypeScript or JavaScript file.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
  - "**/*.cjs"
---

# TypeScript

The single entry point for TypeScript work. Each topic is its own reference —
**read the one matching your task**, not all of them. Start from the baseline.

**JavaScript gets the same baseline minus the type-level rules.** A `.js` file
you are asked to edit follows the naming, import-ordering and module-hygiene
standards as written, and is a migration candidate.

| Doing | Read |
| --- | --- |
| Anything — the always-on baseline | [Coding standards](references/standards.md) |
| Deciding how a failure travels | [Error semantics](references/error-handling.md) |
| Concurrency, cancellation, blocking work | [The async model](references/async-model.md) |
| Writing or running tests | [Testing](references/testing.md) |
| The build pipeline, aliases, barrels | [Build & run](references/build-and-run.md) |
| Reading configuration or secrets | [Config & env](references/config-and-env.md) |
| Emitting traces, metrics, logs | [Observability wiring](references/observability-wiring.md) |

For the manifest and workspace, see the **pnpm** skill; for compiler options,
**tsconfig**; for the lint gate, **eslint**. Effect-TS doctrine is its own skill
and layers on top of these standards rather than replacing them.
