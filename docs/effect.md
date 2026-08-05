# effect plugin

The `effect` plugin carries all Effect-TS doctrine — how to write effects,
compose and run them, and test them. It was split out of the
[typescript](./typescript.md) plugin so plain TypeScript need not carry it: the
`typescript` plugin holds the language baseline that applies to every TypeScript
file, and this one layers Effect on top for the projects that use it.

It also ships the `packages` **stack template** and implements vwf's
stack-adapter contract, so `/vwf:architecture` can offer the Effect
shared-kernel composition when a product picks it.

## Install

Opt-in — it is excluded from `--all`. It depends on `typescript`, which is
installed alongside it automatically.

```sh
pnpx @askviraj/ai-plugins --user effect
```

## Skills

| Skill                   | What it does                                                                                                                                                                        | Activation                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `effect`                | The Effect entry point — a router that loads the reference matching your task. Layers on the `typescript` skill's coding standards; it never replaces them.                         | Auto-applies on `**/*.ts`, `.tsx`, `.mts`, `.cts` |
| `effect-stack-menu`     | Returns the Effect stack templates this plugin offers, as a vwf menu payload. Invoked by `/vwf:architecture` and `/vwf:setup` when `effect` is listed in the config's `stacks:`.    | Invoked by vwf                                    |
| `effect-stack-template` | Returns one template (`typescript-effect`) as a vwf template payload — axis fields, per-capability harness mechanisms, and conventions. Invoked after the user picks from the menu. | Invoked by vwf                                    |

The `effect` skill routes to three references, each loaded only when its topic
is relevant:

| Reference          | When to read                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Effect-TS**      | `Effect.gen`, `Effect.Schema`, `Effect.Service`, error handling, telemetry, logging, config, the HTTP boundary     |
| **Effect runtime** | Composing & running Effect: Layer wiring, `ManagedRuntime`, `Scope`/`acquireRelease`, `Schedule` retries, `Stream` |
| **Testing Effect** | `it.effect`, providing test Layers, mocking a service, `TestClock` in tests                                        |

For Vitest itself — config, coverage, `_testUtils`, how tests are run — see the
`typescript` plugin's `vitest` reference. That file is deliberately
Effect-agnostic: the runner and its config are the same whether or not the code
under test uses Effect, and only the assertions differ. The same holds for
`package.json`, pnpm workspace, `tsconfig`, and the lint/format gate — all in
the `typescript` plugin.

## Stack template

One template, on vwf's `project` axis:

| Slug                | Role       | Stack                  |
| ------------------- | ---------- | ---------------------- |
| `typescript-effect` | `packages` | TypeScript · Effect-TS |

It describes the **shared kernel** — every domain schema and every third-party
integration lives in this package as an Effect service, so downstream projects
depend on an interface rather than a vendor SDK.

Only the `packages` role is offered. Effect is the kernel and the DI mechanism,
not a server or a UI framework; a `service` template belongs to the plugin
owning that server framework, which composes Effect on top.

## See also

[typescript](./typescript.md) · [../readme.md](../readme.md)
