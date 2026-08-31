# The installer CLI

`@askviraj/ai-plugins`, run as `pnpx @askviraj/ai-plugins …`, does three things:
**plugin installs as a thin wrapper** (`--all` / `--user <name>` /
`--project <name>` drive Claude's own `plugin marketplace add` +
`plugin install`, reading the manifest on this repo's `main`), **graphify's
wiring**, and **`--uninstall`**. It never edits Claude's settings itself, and
writes **no receipt** — both install paths belong to a tool that keeps its own
records, and those records are what `--uninstall` reads live.

**The statusline is a separate package** — `claude-status`
(`brew install virajp/tap/claude-status`) — and it is what provides the caps
hook `/vwf:execute` depends on; see the contract stated in vwf's `execute`
skill. Nothing here installs, configures or removes it; `--statusline` survives
only to say so, printing the redirect and exiting 1. A machine upgrading from a
version that did keeps a `statusLine` key naming a script this CLI no longer
deletes, and re-points it by installing `claude-status`.

> **The user-facing reference is `docs/cli/`** — `usage.md` for the flags,
> `targets.md` for what lands where, `internals.md` for the source map. What
> follows is the shape a maintainer needs in context, not a second copy of them;
> `internals.md`'s path table is the fuller one.

**An invocation that installs nothing prints the help and exits 1** — except
`--statusline`, which installs nothing but is a request, so it answers with
where the bar went instead of the flag table. `strict` parsing is on, so a
retired flag — `--platform`, `--upgrade`, `--force`, `--no-statusline` — reports
itself by name rather than being a silent no-op; `--user` and `--project` are
repeatable (`multiple: true`), with the both-survive regression test that guards
the silent-drop bug the old parser had. `--force` is worth its own sentence: it
existed only to configure the statusline on a machine where Claude was off
`PATH`, and every remaining install *is* a `claude` invocation, so nothing is
left to force.

**`--uninstall` is interactive**: it enumerates what it can see (the marketplace
registration, user- and project-scoped plugin installs, graphify's hook and
graph), presents it **all selected** so the interaction is deselection, and
removes each piece through whatever owns it — `claude plugin uninstall` rather
than an edit to `enabledPlugins`. No TTY refuses rather than guesses, but only
once there is something to remove; `--dry-run` is the scriptable path.

**It also reads legacy receipts**, and that reader is now the whole receipt
story. It cleans up after the discontinued OpenCode, Oh-My-Pi and Cursor
surfaces — those lost their named entries once Claude Code was the only target,
but a receipt of theirs on disk is still read and reverted under a generic
label, since `LEGACY_RECEIPTS` supplies a display label and the `filesOnly`
flag, **never** the gate on what is found: `legacyItems` enumerates every
readable `*.json` in the receipt directory, so dropping an entry downgrades a
row's label and changes no behaviour — deliberately, since refusing to read a
receipt because its target was discontinued would strand exactly the machine
most in need of cleaning. Each is restored from its recorded prior state, so an
existing install migrates rather than being orphaned. The one remaining named
entry is `claude.json`, and it is `filesOnly` — replaying its `command` entries
would uninstall each plugin a second time and report the failure as a broken
run; `uninstall.ts`'s comment on the map is authoritative for that.

**Every GitHub call sends `$GITHUB_API_TOKEN` when it is set**, because GitHub's
anonymous limit is per source IP and shared egress exhausts it between users.
The hint to set one appears **only** for a real rate limit: `429`, or `403` with
`x-ratelimit-remaining: 0`. A plain `403` is an authorization failure a
read-only token would not fix. The npm registry call is not GitHub and stays
tokenless.

**`cli/` is the source; `bin/` is the build output, and `bin/` is what npm
publishes.** tsup bundles `cli/src/index.ts` → `bin/installer.mjs`; `bin/` is
gitignored and `i:build` regenerates it. **The artifact was renamed; the command
was not** — `package.json`'s `bin` *key* stays `ai-plugins`, which is what users
invoke and what npm's Trusted Publisher is bound to. The published tarball is
`bin` alone — **4 files**, where the four render trees once shipped ~12 MB
inside it. The committed-tree-validated-by-CI guarantee moved channel rather
than disappearing: what users install is `main`, and `plugins.yml` validates
`main` on every push.

| Path                     | Is                                                                  |
| ------------------------ | ------------------------------------------------------------------- |
| `cli/src/args.ts`        | the flag surface on `util.parseArgs`, plus the usage renderer       |
| `cli/src/index.ts`       | the router — resolve, gate, execute, report, exit                   |
| `cli/src/install.ts`     | the plugin installer — plan against Claude's settings, drive claude |
| `cli/src/uninstall.ts`   | enumerate → deselect → remove, plus the legacy-receipt reader       |
| `cli/src/receipt.ts`     | read-only: reverting the receipts older versions wrote              |
| `cli/src/github.ts`      | the token header and the rate-limit-only hint                       |
| `cli/src/graphify.ts`    | `graphify install` + `hook install`                                 |
| `cli/src/version.ts`     | `--version` — this CLI against npm, plugins on `main`               |
| `cli/src/config/json.ts` | format-preserving JSON/JSONC edits, and `restoreJsonKey`            |
| `cli/src/**/*.test.ts`   | vitest; `i:test` smoke-tests the **built** bundle, not the source   |

> **Working here:** the flag surface, the receipt rules, the interactive
> uninstall and the packaging traps are in `.claude/skills/installer-cli/`,
> which auto-applies while you edit `cli/`.
