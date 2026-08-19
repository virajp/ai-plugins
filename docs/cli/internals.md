# CLI internals

> **This page is the map, not the rules.**
> [`.claude/skills/installer-cli/`](../../.claude/skills/installer-cli/SKILL.md)
> is authoritative for the receipt invariant, the uninstall discipline, the
> packaging traps and every statusline fact — and it auto-applies the moment
> anyone edits `cli/` or `tools/`, so a contributor already has it in context.
> What follows is the orientation: the shapes, the flow between them, and where
> to go for the rule that governs each.

## What this CLI is for

Four jobs: **plugins**, the **Claude statusline**, **graphify's wiring**, and an
interactive **`--uninstall`**. The plugin half is a thin wrapper — it drives
`claude plugin marketplace add` and `claude plugin install`, reading this repo's
`main`, and never edits Claude's settings itself.

That is still a large reduction from what this page used to describe. Four
plugin adapters, the copied payload, a dependency gate, a plan stage, an
executor and a `--platform` flag are all gone, along with the template layer and
the four render trees they installed from — none of them returned with the
plugin flags. If you are looking for any of it, it is in git, not here.

## The flow of a run

A straight line — **`args` → the router → the installer → a receipt** — with the
router doing as little as possible itself.

**`args.ts` parses.** One table drives both `parseArgs` and the help text, so a
flag cannot be parsed but undocumented. `strict` is on, so a retired flag
reports itself by name rather than being silently ignored. `--user` and
`--project` are repeatable via `multiple: true` — the array kind the parser this
replaced could not express, which is how it once dropped names silently. The
end-user view of the same flags is [usage.md](./usage.md).

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

**`statusline.ts` installs.** Copies the script and the caps hook, splices four
keys into `settings.json` without reflowing the user's file, and seeds
`~/.config/statusline.json`. Consent for the config step is
`statusline-consent.ts`, whose `resolveConsent` is a pure function so every
branch is testable without a terminal.

**`uninstall.ts` removes.** `enumerate` is a pure read returning plain data —
that split is what makes the list testable against a fixture directory rather
than only by performing it. Removal is a separate switch, and goes through
whatever owns each piece.

**`report.ts` / `progress.ts`.** A live step on stderr while work blocks in
`spawnSync`, and the final table after it, so stdout stays parseable for
`--dry-run | jq`.

**`receipt.ts`.** Records prior state so removal restores rather than guesses.
What kinds of entry exist and how a write must be attributed is the one thing in
this CLI that has broken most often; it is stated once, in
[receipts.md](../../.claude/skills/installer-cli/references/receipts.md), and
deliberately not restated here.

**`github.ts`.** The token header and the rate-limit-only hint. Two functions
worth knowing apart: `fetchGithubJson` attaches `$GITHUB_API_TOKEN` when set,
`fetchJson` never does — the npm registry is not GitHub.

## The build split

`cli/src/` is the source. `bin/ai-plugins.mjs` is the tsup bundle, it is
**gitignored**, `mise run i:build` regenerates it, and **`bin/` is what npm
publishes**.

```text
cli/src/index.ts  →  tsup  →  bin/ai-plugins.mjs
```

The split is load-bearing rather than stylistic: shipping the TypeScript
directly would raise `engines.node` from `>=18` to `>=22.18`. The externals
rule, the ESM/CJS split and the rest of the packaging traps are in
[packaging.md](../../.claude/skills/installer-cli/references/packaging.md).

`mise run i:test` bundles first and smoke-tests the **built artifact**, not the
source, because a packaging mistake only shows up there. Its end-to-end section
installs over a *foreign* statusline, installs again, and asserts the receipt
still records the foreign bar — that repeat-run claim is the bug class the
section exists for, and it compares file contents rather than filenames.

## What ships: 7 files, ~41 KB

`package.json`'s `files` list is `bin` + `tools`.

It was ~12 MB until the Claude-first release, because the four rendered plugin
trees, `plugins.json` and both root marketplace manifests shipped inside it —
the cost of the committed-render guarantee, since every adapter read `<target>/`
through `context.sourceRoot` at install time.

**What is actually read from the package root now is three files**, all under
`tools/statusline/`:

| File              | Read for                                    |
| ----------------- | ------------------------------------------- |
| `statusline`      | copied to `~/.claude/scripts/statusline`    |
| `context-caps.js` | copied to `~/.claude/hooks/context-caps.js` |
| `statusline.json` | parsed, to seed `~/.config/statusline.json` |

Check that table before widening `files` — and before narrowing it, because a
missing bundled asset throws at install time with a path the user cannot act on.

The committed-and-CI-validated guarantee did not disappear; it moved channel.
What users install is `main`, and `plugins.yml` validates `main` on every push.

## The map

| Path                            | Is                                                                  |
| ------------------------------- | ------------------------------------------------------------------- |
| `cli/src/args.ts`               | the flag surface on `util.parseArgs`, plus the usage renderer       |
| `cli/src/index.ts`              | the router — resolve, execute, report, exit                         |
| `cli/src/context.ts`            | the injected run context, so a test can redirect a whole install    |
| `cli/src/install.ts`            | the plugin installer — plan against Claude's settings, drive claude |
| `cli/src/claude-settings.ts`    | reading Claude's settings, shared by install and uninstall          |
| `cli/src/uninstall.ts`          | enumerate → deselect → remove, plus the legacy-receipt reader       |
| `cli/src/statusline.ts`         | the Claude bar and the caps hook                                    |
| `cli/src/statusline-consent.ts` | the consent gate; `resolveConsent` is pure                          |
| `cli/src/receipt.ts`            | prior state, so uninstall restores rather than guesses              |
| `cli/src/github.ts`             | the token header and the rate-limit-only hint                       |
| `cli/src/graphify.ts`           | `graphify install` + `hook install`                                 |
| `cli/src/version.ts`            | `--version` — this CLI, the installed script, the plugins on `main` |
| `cli/src/report.ts`             | the outcome table                                                   |
| `cli/src/progress.ts`           | the live step on stderr, off when stderr is not a TTY               |
| `cli/src/config/json.ts`        | format-preserving edits to JSON/JSONC, and the deep merge           |
| `tools/statusline/`             | the script, its defaults, the caps hook                             |
| `scripts/src/`                  | repo tooling — the marketplace generator and the plugin checker     |
| `cli/src/**/*.test.ts`          | vitest; `i:test` smoke-tests the **built** bundle, not the source   |

One placement rule that looks arbitrary and is not: `vitest.config.mts` collects
only `{cli,scripts}/src/**/*.test.ts`, so a test file anywhere else is
**silently never run** — which is why the tests for the statusline *script* and
for the mempalace checkpoint *shell script* live under `cli/src/` even though
what they exercise is `tools/` and `plugins/`.

## Where the rules live

| For                                                       | Read                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Any write path, any receipt entry                         | [receipts.md](../../.claude/skills/installer-cli/references/receipts.md)     |
| tsup externals, the tarball, `packageRoot()`, `--version` | [packaging.md](../../.claude/skills/installer-cli/references/packaging.md)   |
| The consent gate, the script, the config layers           | [statusline.md](../../.claude/skills/installer-cli/references/statusline.md) |
| The flag surface, the uninstall shape, testing discipline | [SKILL.md](../../.claude/skills/installer-cli/SKILL.md)                      |

Behaviour changes here must reconcile `readme.md`, `CLAUDE.md` and these pages
in the same commit — the skill names the `docs-reconciler` agent for that sweep.

## Related

- [usage.md](./usage.md) — the same flags, from the outside.
- [targets.md](./targets.md) — what lands on disk, and where.
- [statusline.md](./statusline.md) — why the bar ships in the CLI at all.
