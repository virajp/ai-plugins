# CLI internals

> **This page is the map, not the rules.**
> [`.claude/skills/installer-cli/`](../../.claude/skills/installer-cli/SKILL.md)
> is authoritative for the receipt invariant, the adapter discipline, the
> packaging traps and every per-tool statusline fact — and it auto-applies the
> moment anyone edits `cli/` or `tools/`, so a contributor already has it in
> context. What follows is the orientation: the shapes, the flow between them,
> and where to go for the rule that governs each.

## The flow of a run

A run is a straight line — **`args` → the router → adapters → a receipt** — with
two pure stages in the middle that exist so the router stays a router.

**`args.ts` parses.** One table drives both `parseArgs` and the help text, so a
flag cannot be parsed but undocumented. The parser is `node:util`'s, and it has
to stay repeat-capable: three flags are repeatable, and the last parser that
could not express that dropped names silently. The whole flag surface is in the
skill's [SKILL.md](../../.claude/skills/installer-cli/SKILL.md); the end-user
view of the same flags is [usage.md](./usage.md).

**`index.ts` routes**: resolve, gate, execute, report, exit. It reads flags into
one `AdapterContext` (source root, `$HOME`, cwd, timestamp, logger, command
runner — all injected, so a test can point a whole install at a temp directory),
selects which targets the run reaches, and then does nothing itself. Every
sizeable decision below it is a call into a module that can be tested without a
machine to install onto.

**Resolve — `plan.ts`.** A request becomes one `AdapterPlan` per target: plugin
names at user scope, plugin names at project scope, dependencies expanded where
the target's own CLI will not do it. Every derived set — dependencies, the
`requires:` union, which plugins are local, what `--all` means — is read from
`plugins.json`, which the build projects from each `templates/<plugin>/`
manifest. There is no second copy to disagree with the manifests.

**Gate — `deps.ts`.** The external-tool union over the dependency-expanded set,
checked before anything is written, because a plugin whose tools are absent
installs cleanly and fails later somewhere with no visible link to the install.
What `--force` does and does not override is in
[adapters.md](../../.claude/skills/installer-cli/references/adapters.md).

**Execute — `executor.ts`.** One executor drives every target, so `--dry-run`
and a real run walk the same code. A failing target does not abort the others:
outcomes are collected per target and the run exits non-zero if any failed.

**Report — `progress.ts`.** A live step on stderr while adapters block in
`spawnSync`, and the final table after it, so stdout stays parseable for
`--dry-run | jq`.

**Receipt — `receipt.ts`.** Each adapter returns one, recording prior state so
`--uninstall` restores rather than guesses. What kinds of entry exist and how a
write must be attributed is the one thing in this CLI that has broken most
often; it is stated once, in
[receipts.md](../../.claude/skills/installer-cli/references/receipts.md), and
deliberately not restated here.

The **statusline is wired straight from the router**, not through an adapter: it
installs no bundle and is registered in no marketplace. It shares only the
receipt. That is why `statusline*.ts` sit at the top level beside `index.ts`
rather than under `adapters/`.

## Target vs Adapter

This is the architectural spine, and the two halves are deliberately kept apart.

| Half                                 | When         | Nature    | Does                                  |
| ------------------------------------ | ------------ | --------- | ------------------------------------- |
| **Target** (`renderer/src/targets/`) | build-time   | pure      | templates → the committed render tree |
| **Adapter** (`cli/src/adapters/`)    | install-time | effectful | that tree → the user's machine        |

Two things follow from the split. Format-preserving config mutation — splicing a
key into someone else's `settings.json` without reflowing their file — stays out
of the renderer, where it has no business. And installing became copying: the
OpenCode installer shrank from a **1189-line renderer** to a copier, because the
rendering it used to do on the user's machine, after release, now happens at
build time where CI validates it.

Which *kind* of adapter a target gets is dictated by the target rather than
chosen — copy for OpenCode, which has no plugin concept at all, and marketplace
for the other three, each of which owns bookkeeping this tool has no business
editing. The pruning rules, where each payload lives and how scope falls back
are in [adapters.md](../../.claude/skills/installer-cli/references/adapters.md);
what each target does on disk, from the user's side, is
[targets.md](./targets.md).

## The build split

`cli/src/` is the source. `bin/ai-plugins.mjs` is the tsup bundle, it is
**gitignored**, `mise run i:build` regenerates it, and **`bin/` is what npm
publishes**.

```text
cli/src/index.ts  →  tsup  →  bin/ai-plugins.mjs
```

Note the asymmetry with the rendered plugin trees, which are committed: a
rendered tree is meant to be diffed in review, a bundle diff is noise.

The split is load-bearing rather than stylistic — `@ai-plugins/schema` is a
private workspace package that would not resolve from an installed tarball, and
shipping the TypeScript directly would raise the Node floor. The externals rule,
the ESM/CJS split and the rest of the packaging traps are in
[packaging.md](../../.claude/skills/installer-cli/references/packaging.md).

`mise run i:test` bundles first and smoke-tests the **built artifact**, not the
source, because a packaging mistake only shows up there.

## What ships, and why it is ~12 MB

The published tarball is `package.json`'s `files` list: `bin`, `tools`, the four
rendered trees (`claude`, `cursor`, `ohmypi`, `opencode`), `plugins.json`, and
both root marketplace manifests (`.claude-plugin/`, `.cursor-plugin/`).

Every one of those is read at install time. An adapter resolves `<target>/`
through `context.sourceRoot`; Claude and Cursor read their marketplace manifest
from the package root; `plan.ts` and `deps.ts` read `plugins.json`.

**That size is the cost of the committed-render guarantee: what a user installs
is what CI validated.** The alternative — fetching a tree at install time — is
smaller and gives up the one property that makes a rendered tree reviewable.
[index.md](./index.md) covers the other half of the same trade, which is why
re-running the install *is* the upgrade.

## The map

| Path                     | Is                                                                         |
| ------------------------ | -------------------------------------------------------------------------- |
| `cli/src/args.ts`        | the flag surface on `util.parseArgs`, plus the usage renderer              |
| `cli/src/index.ts`       | the router — resolve, gate, execute, report, exit                          |
| `cli/src/plan.ts`        | a request → one `AdapterPlan` per target, derived from `plugins.json`      |
| `cli/src/deps.ts`        | the external-tool gate, derived from each plugin's `requires:`             |
| `cli/src/executor.ts`    | runs the plans, collects one outcome per target, renders the report        |
| `cli/src/progress.ts`    | the live step on stderr, off when stderr is not a TTY                      |
| `cli/src/adapters/`      | one per target, plus `tree.ts` (copying) and `support.ts` (the shared few) |
| `cli/src/config/`        | format-preserving edits to JSON/JSONC and TOML, and the deep merge         |
| `cli/src/receipt.ts`     | prior state, so uninstall restores rather than guesses                     |
| `cli/src/graphify.ts`    | `graphify install` + `hook install` when vwf is installed                  |
| `cli/src/version.ts`     | `--version` — the local manifest against the one on `main`                 |
| `cli/src/statusline*.ts` | the three statusline surfaces, each with its own receipt                   |
| `tools/statusline/`      | the script, its defaults, the caps hook, the OpenCode TUI plugin           |
| `cli/src/**/*.test.ts`   | vitest; `i:test` smoke-tests the **built** bundle, not the source          |

Two placement rules that look arbitrary and are not. `vitest.config.mts`
collects only `{schema,renderer,cli}/src/**/*.test.ts`, so a test file anywhere
else is silently never run — which is why the tests for the statusline *script*
and for the mempalace checkpoint *shell script* live under `cli/src/` even
though what they exercise is `tools/` and `templates/`. And `config/toml.ts` has
no consumer today; it stays as the third config format an adapter may meet.

## Where the rules live

| For                                                               | Read                                                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Any write path, any receipt entry                                 | [receipts.md](../../.claude/skills/installer-cli/references/receipts.md)     |
| Copy vs marketplace, pruning, scope fallback, the dependency gate | [adapters.md](../../.claude/skills/installer-cli/references/adapters.md)     |
| tsup externals, the tarball, `packageRoot()`, `--version`         | [packaging.md](../../.claude/skills/installer-cli/references/packaging.md)   |
| The three surfaces and their per-tool verified facts              | [statusline.md](../../.claude/skills/installer-cli/references/statusline.md) |
| The flag surface, the testing discipline, the derived sets        | [SKILL.md](../../.claude/skills/installer-cli/SKILL.md)                      |

Behaviour changes here must reconcile `readme.md`, `CLAUDE.md` and these pages
in the same commit — the skill names the `docs-reconciler` agent for that sweep.

## Related

- [usage.md](./usage.md) — the same flags, from the outside.
- [targets.md](./targets.md) — what each adapter does on disk.
- [statusline.md](./statusline.md) — why the bar ships in the CLI at all.
