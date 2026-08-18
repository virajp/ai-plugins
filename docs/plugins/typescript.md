# typescript plugin

The `typescript` plugin is the **language plugin for the Node/TS ecosystem** —
one plugin per toolchain, and this one declares two languages: `typescript` and
`javascript`. It packs opinionated standards for pnpm projects, all Effect-TS
doctrine, the TypeScript/JavaScript language server, every TypeScript **stack
template** vwf can offer, and the `npm`→pnpm/bun normalizing hook. Six skills
encode how to name, type, structure, lint, build, and test code; three more are
invoked by vwf rather than by you; the language server gives in-editor
diagnostics, hovers, and navigation. Each skill is single-package-first, with
clearly marked monorepo guidance. The `typescript` router auto-applies to every
TypeScript **and JavaScript** file you edit (a JS file gets the same baseline
minus the type-level rules); `effect` auto-applies to TypeScript only, since
Effect requires TypeScript with `strict` enabled.

Effect-TS used to live in a separate `effect` plugin. It does not any more: a
framework is not a plugin boundary, so it folded back in as a sibling skill.
Plain TypeScript reads the `typescript` skill alone; an Effect project reads
both, and neither installs anything extra.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

```sh
claude plugin install typescript@virajp-plugins
```

Add `--scope project` to scope it to one repo instead of every repo on your
machine; nothing pins it either way. There is no default install set any more —
installing `vwf` pulls in only `devtools`, so a language plugin like this one is
always installed by name.

There is no install-time gate on `mise` or `pnpm` any more — the language server
launches through both, so a missing binary now surfaces as a `/vwf:doctor`
blocking finding rather than a failed install. Run `/vwf:doctor` after
installing.

## Skills

Six skills auto-apply by file path — they load whenever you edit a matching
file, no action needed. `typescript` and `effect` are **routers**: a lean
`SKILL.md` that loads the always-on baseline and points to a library of
references read on demand, so editing a file never pulls the whole corpus into
context.

| Skill          | Standardizes                                                                                                                                                                                                                                    | Activation                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `typescript`   | The TypeScript entry point. Always-on baseline (naming, import ordering, strict type safety, named functions, parameter conventions) plus routed references: Vitest testing and the build pipeline. JS files get the baseline minus type rules. | Auto-applies on `**/*.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, `.cjs` |
| `effect`       | The Effect-TS entry point — a router that loads the reference matching your task. Layers on the `typescript` skill's coding standards; it never replaces them.                                                                                  | Auto-applies on `**/*.ts`, `.tsx`, `.mts`, `.cts`                                |
| `lint-format`  | The house lint/format gate: `@askviraj/linter` (bundled ESLint) for correctness and `dprint` for layout — both must pass before commit — plus how to run each, how to scope rule overrides, and common failure remedies.                        | Auto-applies on `**/dprint.json`, eslint config, and `**/.config/linter.yaml`    |
| `package-json` | package.json, single-package-first with a monorepo section: consent-gated new dependencies (never added without asking), pnpm-only, `"latest"` versions, ESM, the exports map, `workspace:*` links, standard build/check/clean/test scripts.    | Auto-applies on `**/package.json`                                                |
| `pnpm`         | Workspace config: supply-chain safety (`minimumReleaseAge`, `trustPolicy`), build allowlists, overrides, peer-dependency rules, `.npmrc` — plus a monorepo reference for `packages` globs, catalogs and `requiredScripts`.                      | Auto-applies on `**/pnpm-workspace.yaml` and `**/.npmrc`                         |
| `tsconfig`     | Config layout, single-package-first with a monorepo section: a strict shared `tsconfig.base.json`, per-project `tsconfig.json` with the `@/` path alias, a `tsconfig.build.json` emit variant, project references.                              | Auto-applies on `**/tsconfig.json` and `**/tsconfig.*.json`                      |

Three more skills exist but never auto-apply — they are the plugin's interface
to vwf, invoked by name rather than by a file edit:

| Skill                       | What it returns                                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typescript-stack-menu`     | The ten templates below, as a vwf menu payload — slug, axis, role, name, one-line summary. Nothing else; choosing is the user's job. Invoked by `/vwf:architecture` and `/vwf:setup`.                        |
| `typescript-stack-template` | One template as a vwf template payload — axis fields, per-capability harness mechanisms, and the conventions `plan` and `execute` read. Invoked after the user picks from the menu.                          |
| `typescript-ux-gate`        | The **UX gate for a web slice**: boots the project's own `dev` task, captures each changed screen in every reachable state, and runs a WCAG A/AA accessibility scan. Invoked by vwf's `execute-ux-reviewer`. |

`typescript-ux-gate` renders and scans; it does **not** judge. Conformance
against the design system stays the reviewer's call, so the two can never return
disagreeing verdicts. It answers `rendered: n/a` with a reason — no `dev` task,
no browser driver in the manifest, a server that would not boot — rather than
claiming a pass, and vwf carries that reason to the final human gate.

The `typescript` skill's reference library covers **Vitest** testing (the shared
config, `_testUtils`, v8 coverage, run wrappers) and the **build** pipeline (the
`@/` alias and `tsc-alias` rewriting, barrels, the
clean→check→build:ts→build:alias order, project references, turbo). Each loads
only when the routed topic is relevant.

The `effect` skill routes to three of its own:

| Reference          | When to read                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Effect-TS**      | `Effect.gen`, `Effect.Schema`, `Effect.Service`, error handling, telemetry, logging, config, the HTTP boundary     |
| **Effect runtime** | Composing & running Effect: Layer wiring, `ManagedRuntime`, `Scope`/`acquireRelease`, `Schedule` retries, `Stream` |
| **Testing Effect** | `it.effect`, providing test Layers, mocking a service, `TestClock` in tests                                        |

The Vitest reference is deliberately Effect-agnostic: the runner and its config
are the same whether or not the code under test uses Effect, and only the
assertions differ. For those, read **Testing Effect** alongside it.

The [`devtools`](./devtools.md) plugin carries its own `dprint` and `eslint`
skills, and both govern the same config files. That overlap is deliberate:
`devtools` owns the *gate's* shape — flat config only, formatter-versus-linter
separation, how an override is scoped — and `typescript:lint-format` owns which
rules a TypeScript repo runs and how it runs them.

## Stack templates

The plugin owns **ten** vwf stack templates across three axes. vwf itself ships
none — it states the axes and the role vocabulary, and this plugin supplies the
rows for TypeScript.

Project axis — one per role:

| Slug                         | Role        | Stack                                       |
| ---------------------------- | ----------- | ------------------------------------------- |
| `typescript-effect`          | `packages`  | TypeScript · Effect                         |
| `typescript-effect-hono`     | `service`   | TypeScript · Hono · Effect                  |
| `typescript-hono-refine`     | `fullstack` | TypeScript · Hono + Effect · React + Refine |
| `typescript-astro-react`     | `site`      | TypeScript · Astro (SSR) · React            |
| `typescript-effect-temporal` | `worker`    | TypeScript · Temporal · Effect              |
| `typescript-effect-cli`      | `frontend`  | TypeScript · Effect CLI — platform `cli`    |
| `typescript-pulumi`          | `iac`       | TypeScript · Pulumi                         |

Deploy and repo axes:

| Slug          | Axis     | What it pins                                                            |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `npm-package` | `deploy` | The registry as the host — for a project users install, not one you run |
| `pnpm-turbo`  | `repo`   | pnpm workspace + Turborepo                                              |
| `bun`         | `repo`   | bun as package manager, runtime, bundler and test runner                |

`typescript-effect` is the **shared kernel**: every domain schema and every
third-party integration lives in that package as an Effect service, so
downstream projects depend on an interface rather than a vendor SDK. That
placement rule is what the other project templates are written against.

**No `backing` template is here.** A language plugin does not decide the
datastore, the identity provider or the queue — those come from the
[capability](./datastore.md) and cloud plugins, and compose with any of these.

`typescript-pulumi` lives here rather than in an infrastructure plugin because
`iac` is a *role* vwf already owns and Pulumi programs are TypeScript: they use
the same type system, formatter, linter and test runner as everything else in
the workspace. vwf requires an `iac` project to be its own repo, and the
template scaffolds it that way.

## The npm-normalize hook

The plugin ships one `PreToolUse` / `Bash` hook. Exactly two JS/TS package
managers are allowed — **pnpm** and **bun** — so the hook resolves which one the
current directory uses and rewrites the command accordingly (`npx <pkg>` →
`pnpm dlx <pkg>` or `bunx <pkg>`; `npm ci` → `<pm> install --frozen-lockfile`).

Resolution, first hit wins:

1. **A lockfile**, walking up from the working directory — `bun.lock` /
   `bun.lockb` → bun, `pnpm-lock.yaml` → pnpm.
2. **`package_manager: bun` in `.config/vwf.yaml`** — for a project scaffolded
   but not yet installed, where no lockfile exists.
3. **pnpm**, the default.

The lockfile is ground truth because bun reuses npm's `workspaces` field, so
nothing else distinguishes the two reliably.

The hook lives here, not in `vwf`: rewriting a JS/TS command is a TypeScript
fact, and vwf names no technology. It is declared directly in `hooks/hooks.json`
as a `PreToolUse` / `Bash` rewrite, in Claude's own format — there is no
per-target projection any more, so what is written is what runs. Porting it to
another agent means porting the rewrite mechanism yourself; see readme.md's
[Other tools](../../readme.md#other-tools) section for what that involves.
`mise run typescript:test` table-tests the script through the system `sed` for
both package managers.

## Language server

The plugin ships one `lspServers` entry, `typescript-lsp`, backed by
`typescript-language-server`. It runs through `mise` and `pnpm dlx` — no global
install per session: on startup `dlx` resolves `typescript-language-server` on
demand and launches it over stdio.

```sh
mise x -- pnpm --package=typescript \
  --package=typescript-language-server dlx typescript-language-server --stdio
```

The workspace's own TypeScript is preferred when present; the `dlx`-provided one
is only the fallback.

The server maps these extensions to languages, so it covers TypeScript,
JavaScript, JSX, and TSX:

| Extension             | Language          |
| --------------------- | ----------------- |
| `.ts`, `.mts`, `.cts` | `typescript`      |
| `.js`, `.mjs`, `.cjs` | `javascript`      |
| `.tsx`                | `typescriptreact` |
| `.jsx`                | `javascriptreact` |

Startup is allowed up to 60 seconds (`startupTimeout: 60000`) to cover the
first-run `dlx` resolution. This is Claude Code's own `lspServers` manifest
entry — there is no rendered variant for another agent any more. Running it
under Cursor, OpenCode or Codex means porting the manifest yourself, per the
[Other tools](../../readme.md#other-tools) guidance.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that invokes the stack-adapter and
  UX-gate skills.
- [devtools plugin](./devtools.md) — mise, the task library, and the repo-level
  `dprint`/`eslint` gates this plugin's `lint-format` skill runs.
- [cicd plugin](./cicd.md) — the delivery pipeline that runs those gates.
