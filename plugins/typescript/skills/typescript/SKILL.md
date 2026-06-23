---
name: typescript
version: 0.1.0
category: development
description: Stack-neutral TypeScript coding standards — naming, import
  ordering, strict type safety, named functions, and parameter conventions.
  Auto-applies when editing any TypeScript file. Effect-specific patterns live
  in the `effect` skill.
license: MIT
user-invocable: false
paths:
  - "**/*.ts"
---

# TypeScript Coding Standards

Language-level conventions for every `.ts` file. Framework-specific patterns
layer on top — see the **effect** skill for the Effect-TS layer, and the
**tsconfig**/**build** skills for compiler config and the `@/` path alias.

## Naming

- `camelCase`: variables, functions, methods, parameters, directories.
- `PascalCase`: classes, interfaces, types, enums.
- Singular module names: `user`, `ride`, `route`, `place`.
- Files follow `module.responsibility.ts`: `user.service.ts`, `user.routes.ts`,
  `user.schema.ts`.
- Private/internal directories use a leading underscore: `_shared`, `_server`,
  `_testUtils`.
- Boolean variables use auxiliary verbs: `isLoading`, `hasError`, `canAccess`.

## Imports

Three groups, a blank line between each, alphabetised within each group:

1. External dependencies (`hono`, `firebase-admin`, …).
2. Internal modules via the `@/` path alias (see the **tsconfig**/**build**
   skills).
3. `import type` for type-only imports — always `import type`, never inline.

Use destructured imports.

```typescript
import { getAuth } from "firebase-admin/auth";
import { Hono } from "hono";

import { StatusCodes } from "@/utils";

import type { UserRecord } from "@/user/user.schema";
```

## Type safety

- Strict mode always; explicit return types on **all** exported functions.
- Prefer named `function` declarations over arrow functions — better stack
  traces.
- `import type` for anything not used at runtime (`verbatimModuleSyntax` is on —
  see the **tsconfig** skill).
- Avoid `any`; prefer `unknown` plus narrowing.

## Functions

- Pass an **object** as the argument when a function takes 3+ params or any
  param is optional — named, order-independent, and self-documenting.

```typescript
export function saveUser(
  opts: { id: string; name: string; email?: string; },
): void {}
```
