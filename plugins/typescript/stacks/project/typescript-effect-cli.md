---
axis: project
platforms: [ cli ]
name: TypeScript · Effect CLI
languages: [ typescript ]
optional_languages: []
frameworks: [ effect ]
dependencies: [ effect-cli, effect-platform, vitest ]
---

# cli — TypeScript · Effect CLI

A **shipped command-line tool**: TypeScript ·
[`@effect/cli`](https://effect.website/docs/guides/cli) on
`@effect/platform-node`, published to a package registry and run by people, not
by a deploy target. The project's registry `platforms:` is `[ cli ]` — a
terminal surface, so it has no screens, no `<platform>.md` flow files and no
canvas; what it *does* need is the design system's **Terminal UX** section,
which fixes output shape, color semantics, error format, and exit codes.

`cli` sits under the `frontend` role because a CLI runs on the user's machine,
like an app — not because it has a GUI. It is a platform but **not a screen
platform**, which is what exempts it from the design system's screen mandates
while still requiring Terminal UX. Internal dev scripts are not this: a repo's
own task runner is tooling, and gets no project entry.

## Stack

- **`@effect/cli`** — commands are declarative values, not imperative parsing. A
  command pairs a name with its typed flags and positional arguments and a
  handler returning an `Effect`; subcommands compose onto a root command.
  `--help`, `--version`, shell completions, and the interactive wizard come from
  the framework, so they never drift from the command definitions.
- **`@effect/platform` + `@effect/platform-node`** — filesystem, process, and
  terminal access as Effect services, with `NodeContext.layer` provided at the
  entrypoint and `NodeRuntime.runMain` as the process boundary. Nothing calls
  `node:fs` or `process.exit` directly; that is what keeps handlers testable.
- **The same DI as the backend templates** — integrations and side effects are
  `Layer`-provided services, so a handler under test runs against a stub layer
  with no process, network, or disk.
- **Tooling**: Vitest + `@effect/vitest` for unit tests and one end-to-end pass
  that executes the built binary and asserts on stdout/stderr/exit code; the
  repo axis supplies the package manager, formatter, and lint config.

> **Effect v4 renames these.** `@effect/cli` folds into `effect/unstable/cli`,
> with `Options` → `Flag` and `Args` → `Argument`. The shape above is unchanged;
> only the import paths and two module names move. Check the installed major
> before writing code.

## Contract surfaces

- **Commands are the flow contract.** A CLI flow's `index.md` describes the
  journey — trigger, actors, steps, acceptance — and its commands, flags, and
  exit codes are that contract's observable surface. There is no Screens section
  to carry them.
- **Exit codes and stderr are the error contract**, the way status codes and the
  error envelope are for a `service`. Pin them in the design system's Terminal
  UX section and hold the code to them; the execute code reviewer checks
  conformance there, since no UX reviewer renders a terminal.
- **A machine-readable mode** (`--json` or `--porcelain`) is a contract, not a
  convenience — anything scripting the tool depends on its stability.

## Distribution

Ships through a **package registry**, not a deploy target: pair this with the
`deploy/npm-package` template (`assets/stacks/deploy/npm-package.md`), which
carries the publish pipeline, provenance, and versioning rules.
