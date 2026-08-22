---
axis: project
platforms: [ cli ]
name: TypeScript · parseArgs CLI
languages: [ typescript ]
optional_languages: []
frameworks: []
dependencies: [ tsup, vitest ]
---

# cli — TypeScript · parseArgs CLI

A **shipped command-line tool** with no CLI framework: `node:util`'s
`parseArgs`, a bundler, and a test runner. Published to a package registry and
run by people, not by a deploy target. The project's registry `platforms:` is
`[ cli ]` — a terminal surface, so it has no screens, no `<platform>.md` flow
files and no canvas; what it *does* need is the design system's **Terminal UX**
section, which fixes output shape, color semantics, error format, and exit
codes.

**Pick this over the Effect CLI template when the tool is small enough that a
framework is the larger dependency.** A wrapper, an installer, a codemod, a
one-verb utility — anything whose argument surface is a flat set of flags
rather than a tree of subcommands with typed arguments. Where commands compose,
where handlers need dependency injection, or where the tool is one surface of
an Effect codebase, take `typescript-effect-cli` instead. Two `cli` templates
coexist deliberately; this is the axis on which to choose.

## Stack

- **`node:util`'s `parseArgs`** — the platform, so it costs no dependency and
  runs on whatever `engines.node` floor the package sets. It parses; it does
  not render help, validate, or coerce. That is the trade being taken.
- **`strict: true`, always.** An unknown flag becomes an **error naming
  itself** rather than a silent no-op, which is what makes a *retired* flag
  legible: a user whose script still passes it gets told, instead of watching
  the tool quietly do something else.
- **`multiple: true` for anything repeatable.** A repeated flag without it does
  not error — the last occurrence silently wins, and the dropped value is never
  mentioned. This is the defect that motivated the template: a framework
  lacking an array kind turned `--user a --user b` into `b` alone, in silence.
  Any flag a user could plausibly repeat needs a regression test proving both
  values survive.
- **Bundled with tsup** to a single `.mjs`. Shipping `.ts` sources directly
  would raise the Node floor to the version where type-stripping is on by
  default; the bundle is what keeps `engines.node` where it is.
- **Vitest** for unit tests, plus at least one pass that executes the **built**
  artifact.

## Contract surfaces

- **One table drives both parsing and help.** A flag defined in one place and
  documented in another drifts — the shape to avoid is a parser config beside a
  separately-written usage string. Derive the help text from the same rows the
  parser reads, so a flag cannot be parsed but undocumented, or documented but
  unparsed.
- **Commands are the flow contract.** A CLI flow's `index.md` describes the
  journey — trigger, actors, steps, acceptance — and its flags and exit codes
  are that contract's observable surface. There is no Screens section to carry
  them.
- **Exit codes and stderr are the error contract**, the way status codes and
  the error envelope are for a `service`. Pin them in the design system's
  Terminal UX section and hold the code to them; the execute code reviewer
  checks conformance there, since no UX reviewer renders a terminal.
- **An invocation that does nothing prints help and exits non-zero.** Silence
  plus a zero exit reads as success to both a human and a script.
- **A machine-readable mode** (`--json` or `--porcelain`) is a contract, not a
  convenience — anything scripting the tool depends on its stability.

## Testing

**Test the built artifact, not the source.** A packaging mistake — a missing
external, a wrong extension, a dependency that was a `devDependency` and got
inlined — is invisible to a test that imports `src/`. The suite that matters
runs the bundle the way a user runs it and asserts on stdout, stderr and the
exit code.

Runtime dependencies must be real `dependencies`: a bundler treating them as
external means npm installs them beside the bundle, whereas a `devDependency`
is silently inlined instead — which works locally and bloats what ships.

## Distribution

Ships through a **package registry**, not a deploy target: pair this with the
`deploy/npm-package` template, which carries the publish pipeline, provenance,
and versioning rules.

The **artifact filename and the command name are independent**, and conflating
them is a real trap: the `bin` *key* in `package.json` is what users type and
what a registry's trusted-publisher binding refers to, while the file it points
at is an implementation detail. Renaming the artifact is safe; renaming the key
is a breaking change.
