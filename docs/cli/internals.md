# CLI internals

> **This page is the map, not the rules.**
> [`.claude/skills/installer-cli/`](../../.claude/skills/installer-cli/SKILL.md)
> is authoritative for the receipt invariant, the uninstall discipline and the
> packaging traps — and it auto-applies the moment anyone edits `cli/`, so a
> contributor already has it in context. What follows is the orientation: the
> shapes, the flow between them, and where to go for the rule that governs each.

## What this CLI is for

Three jobs: **plugins**, **graphify's wiring**, and an interactive
**`--uninstall`**. The plugin half is a thin wrapper — it drives
`claude plugin marketplace add` and `claude plugin install`, reading this repo's
`main`, and never edits Claude's settings itself.

That is a large reduction from what this page used to describe, in two steps.
The Claude-first release took four plugin adapters, the copied payload, a
dependency gate, a plan stage, an executor and a `--platform` flag, along with
the template layer and the four render trees they installed from. The statusline
moving to its own package took the rest of the write surface: the consent gate,
the whole `tools/` tree, and with them the last thing that wrote a receipt. If
you are looking for any of it, it is in git, not here.

## The flow of a run

A straight line — **`args` → the router → the installer** — with the router
doing as little as possible itself.

**`args.ts` parses.** One table drives both `parseArgs` and the help text, so a
flag cannot be parsed but undocumented. `strict` is on, so a retired flag
reports itself by name rather than being silently ignored — `--platform`,
`--upgrade` and `--force` all answer that way. `--user` and `--project` are
repeatable via `multiple: true` — the array kind the parser this replaced could
not express, which is how it once dropped names silently. The end-user view of
the same flags is [usage.md](./usage.md).

**`index.ts` routes**: resolve, execute, report, exit. It reads flags into one
`Context` (source root, `$HOME`, cwd, timestamp, logger, command runner — all
injected, so a test can point a whole install at a temp directory) and then does
nothing substantial itself.

**`install.ts` installs plugins.** The same planner/executor split as the
uninstall: `planInstall` is a pure read of Claude's settings (via
`claude-settings.ts`, shared with the enumeration) returning steps as plain
data, and `executeInstall` drives `claude` through the injected runner. Already
installed is a satisfied request, never an auto-update, and **no receipt is
written** — Claude's settings are the record `--uninstall` reads live.

**`uninstall.ts` removes.** `enumerate` is a pure read returning plain data —
that split is what makes the list testable against a fixture directory rather
than only by performing it. Removal is a separate switch, and every arm of it
goes through whatever owns the piece: `claude` for the plugins and the
marketplace registration, `graphify hook uninstall` plus a `delete` of the graph
and `.graphifyignore` for graphify's side, and for a receipt an older version
left, a **revert** through `receipt.ts`. **Nothing here edits a config file
directly** — `settings.json` is Claude's, and the only key this CLI ever writes
is one a receipt is restoring. That is also why `~/.config/statusline.json`, a
repo's own `.config/statusline.json` and `~/.claude/usage/` never appear: this
version neither writes nor reads them, so they are not its to remove.

**`report.ts` / `progress.ts`.** A live step on stderr while work blocks in
`spawnSync`, and the final table after it, so stdout stays parseable for
`--dry-run | jq`.

**`receipt.ts` — read-only now.** Nothing this version installs writes a
receipt; what survives is `readReceipt` and `revert`, for the receipts older
versions left on disk. **Every `Entry` kind stays reachable in `revert`** even
though none are written: dropping one turns an existing receipt into a file
nothing can undo, and the half-revert reports as a clean uninstall. The rules
are stated once, in
[receipts.md](../../.claude/skills/installer-cli/references/receipts.md), and
deliberately not restated here.

**`github.ts`.** The token header and the rate-limit-only hint. Two functions
worth knowing apart: `fetchGithubJson` attaches `$GITHUB_API_TOKEN` when set,
`fetchJson` never does — the npm registry is not GitHub.

## The build split

`cli/src/` is the source. `bin/installer.mjs` is the tsup bundle, it is
**gitignored**, `mise run i:build` regenerates it, and **`bin/` is what npm
publishes**.

```text
cli/src/index.ts  →  tsup  →  bin/installer.mjs
```

**The artifact is named `installer`; the command is still `ai-plugins`.**
`package.json`'s `bin` *key* is what users invoke and what npm's Trusted
Publisher is bound to, so it did not change with the filename —
`pnpx @askviraj/ai-plugins` keeps working exactly as before.

The split is load-bearing rather than stylistic: shipping the TypeScript
directly would raise `engines.node` from `>=18` to `>=22.18`. The externals
rule, the ESM/CJS split and the rest of the packaging traps are in
[packaging.md](../../.claude/skills/installer-cli/references/packaging.md).

`mise run i:test` bundles first and smoke-tests the **built artifact**, not the
source, because a packaging mistake only shows up there. Its end-to-end section
seeds a throwaway `HOME` with a **`cursor.json` legacy receipt** — one `file`
entry and one `configKey` entry — and asserts three things about
`--uninstall --dry-run`: that the built bundle, resolving `HOME` and both XDG
vars for real, **finds** it at the path it was written to; that it plans a
**revert** rather than a delete; and that it **writes nothing**, leaving the
receipt, the recorded file and the recorded config key exactly as seeded. No
version writes a receipt any more, so seeding one is the only way to exercise
the reader end to end at all. It then asserts that `--uninstall` **refuses
without a TTY**. The restore itself is left to `uninstall.test.ts`, against a
real temp filesystem — the E2E stops at the dry run because of that refusal, and
allocating a TTY portably is a BSD-vs-GNU `script` trap not worth paying for one
assertion.

## What ships: 4 files

`package.json`'s `files` list is `bin`, and nothing else.

It was ~12 MB until the Claude-first release, because the four rendered plugin
trees, `plugins.json` and both root marketplace manifests shipped inside it —
the cost of the committed-render guarantee, since every adapter read `<target>/`
through `context.sourceRoot` at install time.

**Nothing is read from the package root now except `package.json`**, and only
for its `version`. That is worth knowing before widening `files`: there is no
bundled asset left to restore, so an addition needs its own justification rather
than inheriting one.

The committed-and-CI-validated guarantee did not disappear; it moved channel.
What users install is `main`, and `plugins.yml` validates `main` on every push.

## The map

| Path                         | Is                                                                  |
| ---------------------------- | ------------------------------------------------------------------- |
| `cli/src/args.ts`            | the flag surface on `util.parseArgs`, plus the usage renderer       |
| `cli/src/index.ts`           | the router — resolve, execute, report, exit                         |
| `cli/src/context.ts`         | the injected run context, so a test can redirect a whole install    |
| `cli/src/install.ts`         | the plugin installer — plan against Claude's settings, drive claude |
| `cli/src/claude-settings.ts` | reading Claude's settings, shared by install and uninstall          |
| `cli/src/uninstall.ts`       | enumerate → deselect → remove, plus the legacy-receipt reader       |
| `cli/src/receipt.ts`         | reading and reverting the receipts older versions wrote             |
| `cli/src/github.ts`          | the token header and the rate-limit-only hint                       |
| `cli/src/graphify.ts`        | `graphify install` + `hook install`                                 |
| `cli/src/version.ts`         | `--version` — this CLI against npm, the plugins on `main`           |
| `cli/src/report.ts`          | the outcome table                                                   |
| `cli/src/progress.ts`        | the live step on stderr, off when stderr is not a TTY               |
| `cli/src/config/json.ts`     | format-preserving JSON/JSONC edits, and `restoreJsonKey`            |
| `scripts/src/`               | repo tooling — the marketplace generator and the plugin checker     |
| `cli/src/**/*.test.ts`       | vitest; `i:test` smoke-tests the **built** bundle, not the source   |

One placement rule that looks arbitrary and is not: `vitest.config.mts` collects
only `{cli,scripts}/src/**/*.test.ts`, so a test file anywhere else is
**silently never run** — which is why the test for the mempalace checkpoint
*shell script* lives under `cli/src/` even though what it exercises is
`plugins/`.

## Where the rules live

| For                                                       | Read                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Any receipt entry, and the revert path                    | [receipts.md](../../.claude/skills/installer-cli/references/receipts.md)   |
| tsup externals, the tarball, `packageRoot()`, `--version` | [packaging.md](../../.claude/skills/installer-cli/references/packaging.md) |
| The flag surface, the uninstall shape, testing discipline | [SKILL.md](../../.claude/skills/installer-cli/SKILL.md)                    |

Behaviour changes here must reconcile `readme.md`, `CLAUDE.md` and these pages
in the same commit — the skill names the `docs-reconciler` agent for that sweep.

## Related

- [usage.md](./usage.md) — the same flags, from the outside.
- [targets.md](./targets.md) — what lands on disk, and where.
