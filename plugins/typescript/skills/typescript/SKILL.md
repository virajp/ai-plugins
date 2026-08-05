---
name: typescript
version: 0.2.1
category: development
description: TypeScript development — the always-on coding baseline plus deep
  references for Effect-TS patterns, Vitest testing, and the monorepo build
  pipeline. Auto-applies when editing any TypeScript file. Use when writing or
  reviewing any TypeScript code; read the reference matching your task.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
---

# TypeScript

The single entry point for TypeScript work. Each topic lives in its own
reference file — **read the one matching your task**. Start every change from
the always-on baseline.

| Topic                                                                               | When to read                                                                                                |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Coding standards](${CLAUDE_PLUGIN_ROOT}/skills/typescript/references/standards.md) | The always-on baseline: naming, import ordering, strict type safety, named functions, parameter conventions |
| [Vitest](${CLAUDE_PLUGIN_ROOT}/skills/typescript/references/vitest.md)              | Writing/running tests: the shared config, _testUtils, v8 coverage, run wrappers                             |
| [Build pipeline](${CLAUDE_PLUGIN_ROOT}/skills/typescript/references/build.md)       | The @/ path alias, barrels, the clean→check→build pipeline, and (monorepo) project references + turbo       |

For `package.json`, pnpm workspace, and `tsconfig` standards, see the
**package-json**, **pnpm**, and **tsconfig** skills. For the lint/format gate
that must pass before commit, see the **lint-format** skill.

**Effect-TS doctrine is not here.** It lives in the separate **effect** plugin,
which depends on this one — so plain TypeScript gets these standards without
Effect's, and an Effect project gets both. If the code under test returns an
`Effect`, read that plugin's testing reference alongside the Vitest one above:
the runner is the same, only the assertions differ.
