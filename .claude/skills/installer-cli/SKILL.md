---
name: installer-cli
description: Authoring discipline for the @askviraj/ai-plugins CLI — the
  read-only receipt path, the interactive uninstall, packaging, and the flag
  surface. Auto-applies when editing cli/ or tsup.config.ts.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "cli/**"
  - "tsup.config.ts"
---

# Installer CLI

`cli/src/` is the source; `bin/installer.mjs` is the tsup bundle, is
**gitignored**, and is what npm publishes. Shipping `cli/src/*.ts` directly
would raise `engines.node` from `>=18` to `>=22.18`, which is the whole reason
the bundle exists.

**The artifact is `installer.mjs`; the command is `ai-plugins`.**
`package.json`'s `bin` *key* is what users invoke and what npm's Trusted
Publisher is bound to — renaming the file did not touch it, and renaming the key
would break every documented invocation.

**This CLI does three things**: installs plugins, wires graphify, and removes
what the toolkit put on a machine. The plugin path (`install.ts`) is a **thin
wrapper** — it drives `claude plugin marketplace add virajp/ai-plugins` +
`claude plugin install`, served from this repo's `main`, and never edits
Claude's settings itself. What stays deliberately cut is everything thicker than
that: the copied payload, the adapters, the `requires:` gate, and any receipt
for a plugin install — Claude's settings are the record, and `--uninstall` reads
them live.

The statusline was the fourth thing. It has moved to `@askviraj/claude-status`,
and with it the whole `tools/` tree, the consent gate, and every write path this
CLI had.

## Nothing writes a receipt any more

**Both remaining install paths belong to another tool** — `claude` for plugins,
`graphify` for its own wiring — and each keeps its own records. There is nothing
of this CLI's own on disk to record, so `ReceiptBuilder` and `writeReceipt` are
gone and `receipt.ts` is read-only.

**Do not reintroduce a write path without reading
[receipts.md](references/receipts.md) first.** The receipt-completeness bug
class it documents was found in all four retired plugin adapters *and* in the
statusline — five independent rediscoveries of the same mistake — and the
merge-on-write that fixed it went with the last writer. A new writer that
overwrites its receipt wholesale reintroduces it immediately.

What survives, and must keep surviving: **`revert` still meets every `Entry`
kind**, including `tree` and `command`, which only the retired adapters ever
wrote. Dropping one turns an existing receipt into a file nothing can undo, and
the half-revert reports as a clean uninstall.

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

**The legacy-receipt reader is now the whole receipt story, and is deliberately
temporary.** Every receipt on disk records an install by an older version: this
toolkit's own statusline, a copied OpenCode tree, the OpenCode TUI bar,
Oh-My-Pi's `omp config` keys, a Cursor `settings.json` entry, the copied Claude
marketplace payload. Those surfaces are all discontinued, and without this
reader a machine carrying them is orphaned rather than cleaned, because nothing
else knows those paths. `uninstall.ts` states the drop condition and names
exactly what to delete when it comes.

**`statusline.json` joining `LEGACY_RECEIPTS` is load-bearing, not tidying.** A
machine on v5.2.0 has this toolkit's bar configured and that receipt recording
the bar it displaced. Take it out of that map and `--uninstall` stops finding
it: the user's own statusline never comes back, and `settings.json` is left
pointing at a script that no longer exists — while the run reports a clean
uninstall.

## Testing

- `mise run i:test` bundles first and smoke-tests **`bin/installer.mjs`, not
  `cli/src/index.ts`** — a packaging mistake only shows up in the built
  artifact, because in the repo everything resolves through the workspace.
- Its end-to-end section **seeds a v5.2.0-shaped `statusline.json` receipt** in
  a throwaway `HOME` (plus `XDG_CONFIG_HOME` and `XDG_DATA_HOME`, or a
  "hermetic" run writes into your own config) and asserts the built bundle finds
  it. It is seeded rather than produced because nothing in this version can
  produce one. **The restore itself is asserted in `uninstall.test.ts`**, not
  here: `--uninstall` refuses without a TTY, and allocating one portably is a
  BSD-vs-GNU `script` trap not worth paying for one assertion.
- **`vitest.config.mts` restricts collection to
  `{cli,scripts}/src/**/*.test.ts`.** A test file anywhere else is silently
  never run rather than failing — which is why the mempalace checkpoint *shell
  script* test lives at `cli/src/mempalace-checkpoint-script.test.ts` even
  though what it exercises is `plugins/`.
- `claude` is stubbed in `i:test` only because the runs need it to *exist*;
  nothing shells out to it — the plugin path is exercised as `--dry-run` only,
  which never spawns. Do not stub a tool to exercise its command sequence end to
  end — that tests this tool against our own fiction of its CLI. The install's
  command sequence is covered by `install.test.ts` with the injected fake exec.

## The flag surface

| Flag               | Notes                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `--all`            | install `DEFAULT_INSTALL` (`vwf`) at user scope; `devtools` arrives via Claude's dependency resolution                     |
| `--user <name>`    | install a plugin at user scope; **repeatable** (`multiple: true`)                                                          |
| `--project <name>` | install a plugin at project scope; repeatable. Project wins a name requested at both scopes                                |
| `--uninstall`      | enumerate → deselect → remove. Interactive; no TTY refuses once there is something to remove                               |
| `--dry-run`        | writes nothing, diff to stdout, progress to stderr. The scriptable half of `--uninstall`, and of a plugin install          |
| `--version`        | this CLI against npm, and the plugins available on `main`; exits 1 when the network is unreachable. Reads nothing off disk |
| `-h, --help`       | usage on stdout, exit 0 — **declared**, since `strict` rejects anything undeclared                                         |

**Retired, and each answers by name**: `--platform`, `--upgrade`,
`--statusline`, `--no-statusline`, `--force`. That legibility is the entire
point of `strict` being on — a user with one in a script is told, rather than
watching a run do less than they asked for. `--force` is worth a sentence of its
own: it existed only to install the bar on a machine where Claude was off
`PATH`, and every remaining install *is* a `claude` invocation, so there is no
case left where forcing means anything.

**The parser is `node:util`'s `parseArgs`, in `args.ts`, and repeatability is
why.** It was `citty` until `--user vwf --user devtools` was found to install
only `devtools`: citty's `ArgType` has no array kind, so a repeated flag cannot
be expressed and the last occurrence silently wins. `--user` and `--project` are
repeatable again via `multiple: true`, and `args.test.ts` carries the
both-survive regression test. `parseArgs` also **removed** a runtime dependency
rather than swapping one in.

Boolean negation was the one other thing citty did that the platform does not,
and it left with `--no-statusline` — there is no negated flag and no tri-state
left. Usage rendering stays ours.

**There is no `--upgrade`, and adding it back would be a mistake.** It replayed
a receipt to do what naming the plugins again did; upgrading is Claude's own
`claude plugin marketplace update` + `claude plugin update`, and the install
path reports an already-installed plugin as satisfied with a note pointing there
— never auto-updated.

**An invocation that installs nothing prints the help and exits 1.**

## References

| Reference                               | Covers                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| [receipts.md](references/receipts.md)   | entry kinds, the revert path, `RECEIPT_VERSION`, and the write-path bug class |
| [packaging.md](references/packaging.md) | tsup externals, the CJS/ESM split, the tarball, `packageRoot()`, distribution |

## Documentation

Behaviour changes here must reconcile `readme.md`, `CLAUDE.md` and `docs/cli/`
in the same commit. Delegate that sweep to the `docs-reconciler` agent.
