---
name: typescript
version: 0.3.0
category: development
description: TypeScript development — the always-on coding baseline plus deep
  references for Effect-TS patterns, Vitest testing, and the monorepo build
  pipeline. Auto-applies when editing any TypeScript or JavaScript file. Use
  when writing or reviewing any TypeScript or JavaScript code; read the
  reference matching your task.
license: MIT
invocation: model
tools: Read Grep Glob Edit Write Bash
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

The single entry point for TypeScript work. Each topic lives in its own
reference file — **read the one matching your task**. Start every change from
the always-on baseline.

**JavaScript files get this same baseline, minus the type-level rules.** New
code is written in TypeScript; a `.js`/`.jsx`/`.mjs`/`.cjs` file you are asked
to edit (a config file, a legacy module) follows the naming, import-ordering,
and module-hygiene standards as written, and is a migration candidate — not an
excuse to relax them. The **effect** skill never applies to JavaScript: Effect
requires TypeScript with `strict` enabled.

| Topic                                                                               | When to read                                                                                                |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Coding standards](<%= it.root %>/skills/typescript/references/standards.md) | The always-on baseline: naming, import ordering, strict type safety, named functions, parameter conventions |
| [Vitest](<%= it.root %>/skills/typescript/references/vitest.md)              | Writing/running tests: the shared config, _testUtils, v8 coverage, run wrappers                             |
| [Build pipeline](<%= it.root %>/skills/typescript/references/build.md)       | The @/ path alias, barrels, the clean→check→build pipeline, and (monorepo) project references + turbo       |

For `package.json`, pnpm workspace, and `tsconfig` standards, see the
**package-json**, **pnpm**, and **tsconfig** skills. For the lint/format gate
that must pass before commit, see the **lint-format** skill.

**Effect-TS doctrine is a sibling skill, not a separate plugin.** It lives in
this plugin's **effect** skill, which layers on top of these standards rather
than replacing them — so plain TypeScript gets this baseline alone, and an
Effect project gets both. If the code under test returns an `Effect`, read that
skill's testing reference alongside the Vitest one above: the runner is the
same, only the assertions differ.
