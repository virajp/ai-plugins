# installer/ — the `@virajp.dev/claude-plugins` CLI

The maintainer's context for this tree. The repo-wide rules, the branch model
and the release ritual are the root [`CLAUDE.md`](../CLAUDE.md); the end-user
reference is `docs/installer/` (`usage.md` for the flags, `targets.md` for what
lands where, `internals.md` for the source map — its path table is the full one,
and is not repeated here).

## What it is

`pnpx @virajp.dev/claude-plugins …` does **three things**: installs plugins,
wires graphify, and removes what the toolkit put on a machine.

- **Plugin installs are a thin wrapper.** `--all` / `--user <name>` /
  `--project <name>` drive Claude's own `claude plugin marketplace add` and
  `claude plugin install` against `virajp/claude-plugins`, reading the manifest
  on this repo's `main` (which pins each plugin to its own `<name>-v<version>`
  tag). It never edits Claude's settings itself. What stays deliberately cut is
  everything thicker than that: the copied payload, the adapters, the
  `requires:` gate, and any receipt for a plugin install — Claude's settings are
  the record, and `--uninstall` reads them live.
- **graphify's wiring** — `graphify install` + `hook install`.
- **`--uninstall`** — interactive; see below.

**The statusline is a separate package** — `claude-status`
(`brew install virajp/tap/claude-status`) — and it is what provides the caps
hook `/vwf:execute` depends on. Nothing here installs, configures or removes it;
`--statusline` survives only to say so, printing the redirect and exiting with
status 1. It was briefly retired outright, and that was wrong: `strict` answered
a user who had not heard about the move with `unknown option` and nowhere to go,
which is the one population that most needed the pointer. A machine upgrading
from a version that did configure the bar keeps a `statusLine` key naming a
script this CLI no longer deletes, and re-points it by installing
`claude-status`.

## Source and artifact

**`installer/src/` is the source; `bin/installer.mjs` is the tsup bundle, is
gitignored, and is what npm publishes** — `package.json`'s `files` is `bin`
alone, four files. `mise run i:build` regenerates it. Shipping
`installer/src/*.ts` directly would raise `engines.node` from `>=18` to
`>=22.18`, which is the whole reason the bundle exists.

**The artifact is `installer.mjs`; the command is `claude-plugins`.**
`package.json`'s `bin` *key* is what users invoke, and it is independent of both
the artifact filename and npm's Trusted Publisher, which binds to the package
name. Renaming it costs the documented invocations and nothing else.

Nothing is read from the package root except `package.json`, and only for its
`version`. Widening `files` needs its own justification: there is no bundled
asset left to restore.

## Nothing writes a receipt

**Both install paths belong to another tool** — `claude` for plugins, `graphify`
for its own wiring — and each keeps its own records. There is nothing of this
CLI's own on disk to record, so `ReceiptBuilder` and `writeReceipt` are gone and
`receipt.ts` is read-only.

**Do not reintroduce a write path without reading
[receipts.md](../.claude/docs/installer/receipts.md) first.** The
receipt-completeness bug class it documents was found in all four retired plugin
adapters, and again in the last write path this CLI had — five independent
rediscoveries of one mistake, which is why the merge-on-write that fixed it
lived in the single place every writer passed through rather than at each site.
That merge went with the last writer. A new writer that overwrites its receipt
wholesale reintroduces the bug immediately.

What survives, and must keep surviving: **`revert` still meets every `Entry`
kind**, including `tree` and `command`, which only the retired adapters ever
wrote. Dropping one turns an existing receipt into a file nothing can undo, and
the half-revert reports as a clean uninstall.

**The legacy-receipt reader is the whole receipt story, and is deliberately
kept.** Every receipt on disk records an install by an older version — the
copied Claude marketplace payload, or one of the discontinued OpenCode, Oh-My-Pi
and Cursor surfaces. Those surfaces are all gone, and without this reader a
machine carrying them is orphaned rather than cleaned, because nothing else
knows those paths. There is **no drop condition** — the one that used to be
written here was tied to a removal that has since happened, and the reader
outlived it. `uninstall.ts`'s module comment states why it is kept.

**`LEGACY_RECEIPTS` is a label lookup, not an allowlist.** `legacyItems`
enumerates every readable `*.json` in the receipt directory with no exclusion,
and reverts each the same way; a name absent from the map still gets a row,
under the generic `an install recorded in <name>`. Adding or removing an entry
changes a display label and the `filesOnly` flag — never whether a receipt is
found. The one remaining named entry is `claude.json`, and it is `filesOnly` —
replaying its `command` entries would uninstall each plugin a second time and
report the failure as a broken run; `uninstall.ts`'s comment on the map is
authoritative for that.

## `--uninstall` is interactive

Enumerate → present with defaults applied → remove through each piece's owner.
Four rules:

- **Enumeration is a pure read** returning plain data with no closures in it, so
  the list is testable against a fixture directory rather than only by
  performing it. Removal is a separate switch.
- **Machine state starts selected; git-tracked files do not.** The user asked to
  uninstall, so re-naming each piece would turn a cleanup into a quiz — but a
  row whose removal edits a file the checkout *tracks* would dirty their working
  tree, which is not a cleanup. Those start off (`Item.tracked`), and the
  numbers **toggle** rather than meaning "keep", since with two possible
  defaults there are two directions to move a row in. Found by a real install,
  not by a test: the enumeration and the removals were both right, and only the
  default was wrong.
- **Removal goes through the owner.** `claude plugin uninstall`, never an edit
  to `enabledPlugins` — Claude keeps bookkeeping beside that key and
  hand-editing strands the two apart. A receipted install leaves by **being
  reverted**, so the user gets their prior state back; a bare delete would leave
  them with nothing and no record of what it had been.
- **No TTY refuses rather than guesses** — but only once there is something to
  remove. A run that finds nothing has nothing to ask about, and failing it for
  want of a terminal would make the flag unusable in a script that is checking
  whether anything is left. `--dry-run` is the non-interactive path, and is what
  `i:test` drives.

**This CLI does no debris cleanup, and adding some back is a design decision
rather than a fix.** Every removal it performs is either owner-driven or
receipt-driven; nothing scans the machine for state that *looks* like ours and
deletes it. A path with no receipt and no owning tool is not this CLI's to
touch.

## The flag surface

| Flag               | Notes                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `--all`            | install `DEFAULT_INSTALL` (`vwf`) at user scope; `stackgen` arrives via Claude's dependency resolution                     |
| `--user <name>`    | install a plugin at user scope; **repeatable** (`multiple: true`)                                                          |
| `--project <name>` | install a plugin at project scope; repeatable. Project wins a name requested at both scopes                                |
| `--uninstall`      | enumerate → deselect → remove. Interactive; no TTY refuses once there is something to remove                               |
| `--statusline`     | installs nothing — reports where the bar moved and exits **1**. Composes: other installs still run, the notice prints last |
| `--dry-run`        | writes nothing, diff to stdout, progress to stderr. The scriptable half of `--uninstall`, and of a plugin install          |
| `--version`        | this CLI against npm, and the plugins available on `main`; exits 1 when the network is unreachable. Reads nothing off disk |
| `-h, --help`       | usage on stdout, exit 0 — **declared**, since `strict` rejects anything undeclared                                         |

**Retired, and each answers by name**: `--platform`, `--upgrade`, `--force`,
`--no-statusline`. That legibility is the entire point of `strict` being on — a
user with one in a script is told, rather than watching a run do less than they
asked for. `--force` is worth a sentence of its own: it existed only for the
status bar, so it could be configured on a machine where Claude was off `PATH`.
Every remaining install *is* a `claude` invocation, so there is no case left
where forcing means anything.

**The parser is `node:util`'s `parseArgs`, in `args.ts`, and repeatability is
why.** It was `citty` until a repeated `--user` was found to install only the
last name given: citty's `ArgType` has no array kind, so a repeated flag cannot
be expressed and the last occurrence silently wins. `--user` and `--project` are
repeatable again via `multiple: true`, and `args.test.ts` carries the
both-survive regression test. `parseArgs` also **removed** a runtime dependency
rather than swapping one in. Boolean negation was the one other thing citty did
that the platform does not, and it went with the last negated flag — there is no
`--no-` flag and no tri-state left anywhere in the surface. Usage rendering
stays ours.

**There is no `--upgrade`, and adding it back would be a mistake.** It replayed
a receipt to do what naming the plugins again did; upgrading is Claude's own
`claude plugin marketplace update` + `claude plugin update`, and the install
path reports an already-installed plugin as satisfied with a note pointing there
— never auto-updated.

**An invocation that installs nothing prints the help and exits 1** — with one
exception: `--statusline` alone is a *request*, not an empty invocation, so it
prints its own answer instead of the flag table with "nothing to do" under it.

## GitHub calls

**Every GitHub call sends `$GITHUB_API_TOKEN` when it is set**, because GitHub's
anonymous limit is per source IP and shared egress exhausts it between users.
The hint to set one appears **only** for a real rate limit: `429`, or `403` with
`x-ratelimit-remaining: 0`. A plain `403` is an authorization failure a
read-only token would not fix. The npm registry call is not GitHub and stays
tokenless — `fetchGithubJson` attaches the token, `fetchJson` never does.

## Testing

- `mise run i:test` bundles first and smoke-tests **`bin/installer.mjs`, not
  `installer/src/index.ts`** — a packaging mistake only shows up in the built
  artifact, because in the repo everything resolves through the workspace.
- Its end-to-end section **seeds a `cursor.json` legacy receipt** into a
  throwaway `HOME`'s receipt dir (plus `XDG_CONFIG_HOME` and `XDG_DATA_HOME`, or
  a "hermetic" run writes into your own config), carrying a `file` entry and a
  `configKey` entry with a `previous` value. It asserts the built bundle
  **finds** it, describes a **revert** rather than a delete, and **writes
  nothing** — receipt, artifact and the untouched config key are all re-checked
  afterwards. It is seeded rather than produced because nothing in this version
  writes a receipt. **The restore itself is asserted in `uninstall.test.ts`**,
  not here: `--uninstall` refuses without a TTY, and allocating one portably is
  a BSD-vs-GNU `script` trap not worth paying for one assertion.
- **`vitest.config.mts` restricts collection to
  `{installer,scripts}/src/**/*.test.ts`.** A test file anywhere else is
  silently never run rather than failing — which is why the mempalace checkpoint
  *shell script* test lives at
  `installer/src/mempalace-checkpoint-script.test.ts` even though what it
  exercises is `plugins/`.
- `claude` is stubbed in `i:test` only because the runs need it to *exist*;
  nothing shells out to it — the plugin path is exercised as `--dry-run` only,
  which never spawns. Do not stub a tool to exercise its command sequence end to
  end — that tests this tool against our own fiction of its CLI. The install's
  command sequence is covered by `install.test.ts` with the injected fake exec.

## References

| Reference                                              | Covers                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [receipts.md](../.claude/docs/installer/receipts.md)   | entry kinds, the revert path, `RECEIPT_VERSION`, and the write-path bug class |
| [packaging.md](../.claude/docs/installer/packaging.md) | tsup externals, the CJS/ESM split, the tarball, `packageRoot()`, distribution |

## Releasing and documenting

`installer-v<version>` tags trigger `release.yml` → npm publish; the ritual is
`/release`, and **`i:release` is never run without asking the user**.
`release.yml`'s trigger surface stays untouched — npm allows one Trusted
Publisher and validates the entry-point filename.

Behaviour changes here must reconcile `readme.md`, the root `CLAUDE.md`, this
file and `docs/installer/` in the same commit. Delegate that sweep to the
`docs-reconciler` agent.
