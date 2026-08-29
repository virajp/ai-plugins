---
name: effect
version: 0.1.0
category: development
description: Effect-TS development — writing effects, composing and running
  them, and testing them. Layers on top of the TypeScript baseline rather than
  replacing it. Auto-applies when editing TypeScript in an Effect codebase.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Effect-TS

Layers on the TypeScript baseline — read that skill's standards first; this
adds to them and replaces none of them.

**Effect requires TypeScript with `strict` enabled and never applies to
JavaScript.**

| Doing | Read |
| --- | --- |
| Writing and composing effects | [Effect](references/effect.md) |
| Running them — runtime, layers, the composition root | [Runtime](references/effect-runtime.md) |
| Testing code that returns an Effect | [Testing](references/testing.md) |
