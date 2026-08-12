# The installer CLI

`@askviraj/ai-plugins` installs the `virajp-plugins` toolkit — the plugins and
the [statusline](../plugins/statusline.md) — across **four agents**: Claude
Code, Cursor, Oh-My-Pi and OpenCode. Three of them have a native plugin
marketplace, so the CLI registers `virajp-plugins` and lets the tool own the
installing — Claude Code and Oh-My-Pi through their own CLI, Cursor (which has
none) by writing the marketplace reference into its settings directly. OpenCode
has no plugin concept at all, so its bundle is copied into place. Which target
does what is [targets.md](./targets.md).

**npm is the only distribution channel**, so this needs Node — on every
platform, Windows included. There is no standalone binary, no Homebrew tap and
no Scoop bucket: the marketplace targets re-read a real rendered directory on
every later session, so the payload has to sit on disk beside the executable
rather than inside it.

```sh
# The default set + the statusline, for every agent found on your PATH
pnpx @askviraj/ai-plugins --all

# Named plugins, at whichever scope you ask for
pnpx @askviraj/ai-plugins --user typescript --project flutter

# See what a run would do, without writing anything
pnpx @askviraj/ai-plugins --all --dry-run

# Undo a previous install
pnpx @askviraj/ai-plugins --uninstall
```

Restart your agent afterward so the commands, hooks and dependencies load. The
examples use `pnpx`; `npx` works identically if you don't use pnpm.

## The flags

There is no install verb — **naming something is the request**. Everything below
either names what to install, or modifies how.

| Flag                  | What it does                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `--all`               | Install the default set at user scope: `vwf`, `devtools`                                            |
| `--user <name>`       | Install a plugin at user scope (repeatable)                                                         |
| `--project <name>`    | Install a plugin at project scope (repeatable)                                                      |
| `--platform <target>` | Target an agent: `claude`, `cursor`, `ohmypi`, `opencode` (repeatable). Defaults to every one found |
| `--statusline`        | Install the statusline, and consent to replacing one already there                                  |
| `--no-statusline`     | Skip the statusline                                                                                 |
| `--uninstall`         | Undo a previous install, from its receipt                                                           |
| `--dry-run`           | Show the full diff without writing anything                                                         |
| `--force`             | Act on a target whose tool is not on `PATH`                                                         |
| `-v`, `--version`     | Report this CLI's version and every plugin's, against the latest                                    |
| `-h`, `--help`        | Show this help                                                                                      |

An unknown flag is an **error naming itself**, printed with the usage text, and
exits 1. `--help` prints that same text on stdout and exits 0. Every other run
exits 0 when nothing failed and 1 when something did.

## Which plugins, and at what scope

**`--all` is a list, not a rule.** It installs whatever `defaultInstall` names
in [`templates/marketplace.yaml`](../../templates/marketplace.yaml), at user
scope — today that is `vwf` and `devtools`: the workflow plus exactly its hard
dependency. Changing the default set is an edit to that one list, and nothing
else in the CLI carries a second copy of it.

Every other plugin is installed **by name**, and a plugin declares no
install-time eligibility of its own: `--user <name>` puts it at user scope,
`--project <name>` at project scope, and nothing is pinned to either. Both flags
are repeatable and **every occurrence counts**, so
`--user vwf --user typescript` installs both. Mixing them in one run is fine; a
name given at both scopes resolves once, and project wins, being the narrower of
the two. A name the marketplace does not know is an error listing the names it
does.

**The three combine, and `--all` is a starting set rather than a mode.** Naming
plugins beside it adds to what it installs; it never replaces or suppresses
them. So `--all --user typescript --project flutter` installs the default set
plus `typescript` at user scope, and `flutter` at project scope, in one run.

> **`--project` means the directory you run the command in**, not the plugin's
> subject matter. It writes into `<cwd>/.claude/`, `<cwd>/.cursor/` and so on,
> so `--project flutter` run from your home directory enables Flutter for your
> home directory. `cd` to the repo you mean first. Nothing warns about this —
> the install succeeds, just somewhere else.

Dependencies come along. Claude Code expands them natively, so the CLI leaves
that to it; on the other three the planner expands them itself, which is why an
OpenCode install of `vwf` also installs `devtools`. A dependency inherits the
scope of whatever pulled it in.

Two things narrow what a given target actually receives, and both say so rather
than going quiet:

- **A plugin hosted in someone else's repo installs on Claude alone.** A `url`
  source has no rendered bundle, so the three targets that cannot fetch one skip
  it. The run reports it once, naming every target that skipped it, rather than
  once per target. **No plugin in this marketplace is url-sourced today** — the
  last one, the Karpathy guidelines, was vendored into `vwf` precisely because
  three of four targets silently went without it — so this narrows nothing at
  present. The rule stays because the skip path is still live code.
- **Cursor is project-scope only.** It has no locally-writable user-scope plugin
  install, so a user-scope request there is redirected to project scope with a
  note.

## Which agents

Omit `--platform` and the CLI installs for **every supported agent it finds on
your `PATH`**. Name one or more to narrow it; the flag is repeatable, and a name
that is not one of the four is an error listing them. If no supported agent is
found at all, the run says so and exits 1 rather than waiting for input that is
not coming.

A *selected* target whose tool is missing is **skipped with a note**, not failed
— a machine without Cursor should say so and move on. `--force` acts on it
anyway, which is the entire meaning of that flag: it does not override anything
else, least of all the tool gate below.

When `vwf` lands on `claude` or `opencode`, the CLI also wires **graphify**
(`graphify install --platform <target>` plus the git hook, both idempotent).
That is not a nicety — vwf enforces graphify at its own entry gate, so an
install that skipped it would produce a plugin that halts. It soft-skips
throughout, since failing there would undo an install that already succeeded.

## The external-tool gate

Plugins shell out: `vwf` drives `graphify` and `rtk`, the Context7 server runs
through `pnpm`, Flutter's language servers are system binaries. Each plugin
declares those in its own `requires:`, and the CLI checks the **union over the
dependency-expanded set** before writing anything. Anything missing is named,
with the command that installs it, and the run stops:

```text
missing required tool(s): graphify, rtk

Install them, then re-run:
  graphify         mise use -g pipx:graphifyy@latest
  rtk              brew install --formulae rtk
```

Installing `vwf` therefore needs five binaries on your `PATH` — `graphify`,
`mise`, `pnpm`, `rtk` and `uv`. The CLI never installs one for you.

**`--force` does not override this gate.** `--force` means something narrower:
act on a target whose own CLI is missing. A plugin's runtime tools are a fact
about the plugin rather than about the target, and there is no useful state on
the far side of installing `vwf` without `graphify`. A `--dry-run` reports the
missing tools and carries on, because the rest of the diff is still worth
seeing.

## The statusline

`--statusline` installs the bar; `--no-statusline` refuses it; unset defers to
`--all`, so the whole toolkit brings the whole toolkit. Which surfaces it
reaches depends on the selected targets — a script bar on Claude Code,
`omp config` keys on Oh-My-Pi, a TUI plugin on OpenCode. **Cursor exposes no
status surface at all**, so a run reaching only Cursor has nothing to install
and says so when you asked explicitly.

One rule belongs here rather than in the configuration reference:
**`--statusline` is the only consent to replace a statusline this installer did
not write, and `--all` is not consent.** With no terminal to ask in — a setup
script, CI, anything piping stdin — the run **fails** rather than guessing in
either direction. Declining is remembered as `"autoConfigure": false` in
`~/.config/statusline.json` and later runs stop asking; passing `--statusline`
clears it. The bar's own files land either way, so a declined machine is one
`--statusline` from a working statusline.

Everything else about it — what each surface draws, the caps hook, the
configuration layers — is in
**[docs/plugins/statusline.md](../plugins/statusline.md)**.

## Seeing what a run would do

`--dry-run` resolves the whole request and prints the diff to **stdout**, so it
can be piped or saved, while progress and the summary go to stderr. It writes
nothing, asks nothing, and reports the statusline at its most complete rather
than refusing a question it has decided not to ask.

## Undoing an install

Every install writes a **receipt** recording prior state — the previous contents
of each file, whether a config key existed and what it held, and the command
that undoes each command run. That is what lets `--uninstall` *restore* rather
than guess, and the invariant it exists to hold is that install-then-remove
leaves the tree and every touched config byte-identical. A statusline you
allowed the CLI to replace comes back exactly as it was.

Receipts live under `<config>/ai-plugins/receipts/`, one JSON file per target
plus one per statusline surface. `<config>` is `$XDG_CONFIG_HOME` when set,
`%APPDATA%` on Windows, and `~/.config` otherwise.

```sh
# Undo everything this installer did, on every agent found
pnpx @askviraj/ai-plugins --uninstall

# Undo it on one agent, leaving the others alone
pnpx @askviraj/ai-plugins --uninstall --platform opencode
```

Two things about uninstall are worth knowing:

- **It is per target, not per plugin.** The receipt is the record of what a
  target received, and `--uninstall` replays all of it. Plugin names on the
  command line do not narrow that — `--platform` is what narrows an uninstall. A
  target with no receipt is skipped rather than guessed at.
- **The statusline goes with it**, on any selected target whose receipt says the
  CLI installed one. `--no-statusline` alongside `--uninstall` leaves the bar
  alone.

A receipt is consumed once it has been replayed successfully, and deliberately
kept when a revert fails — a half-reverted install still has state to undo.

## Versions

`--version` reports this CLI's version against the one published on npm, the
statusline (bundled with the CLI, so always the same number), and every plugin
in this build against the marketplace manifest on `main`:

```text
@askviraj/ai-plugins  4.0.0  (latest)
  statusline      4.0.0  (bundled with the CLI)

Plugins (virajp-plugins):
  cicd            1.0.0  (latest)
  cloudflare      0.1.1  (latest)
  …
  typescript      2.0.1  (latest)
  vwf             16.0.0  (latest)
```

Every plugin in the build is listed; the run above is elided in the middle. The
name column is padded to the longest plugin name, so it widens or narrows as
plugins are added and removed. A plugin whose build version is behind `main`
carries a `→ <version> (update available)` annotation in place of `(latest)`.

What it deliberately does not report is the version a given agent has installed
right now. Because plugin content ships **inside** the npm package, a plugin's
version in this build is what an install would give you — one comparison answers
the question for all four targets, with no per-tool query and nothing to guess
at. A plugin this build has and `main` does not is annotated `(not on main yet)`
rather than left bare.

The remote half is best-effort: with no network you still get a useful answer
about what you have, followed by why the comparison is missing — and the run
**exits 1**, so a script checking for updates notices that it never actually
checked.

## There is no `--upgrade`

Plugin content ships inside the npm package — the marketplace source is an
absolute path into the installed package, and no adapter ever runs
`marketplace update` — so **re-running the install is the upgrade**. There is
nothing remote to fetch and no per-tool version to bump. The flag once existed
and did nothing that naming the plugins again did not already do; it is now an
error that names itself, rather than a silent no-op.

Claude is the one target that needs a nudge to notice. It caches plugin content
per version and answers "already installed" without re-checking, so the adapter
compares the version this build advertises against the one Claude records and
runs `claude plugin update` when they differ. You will see that line in the run
output, with the two versions. **Restart the agent afterward** — Claude applies
an update on the next start, not in the running session.

Every install path is idempotent, so the same command is safe in a setup script.

## A run that installs nothing

A bare invocation prints the help on stderr and exits 1, and so does one
carrying only modifiers. `--platform opencode` is the case that reads like a
request and is not: it says *where* to install, never *what*.

```text
nothing to install: pass --all, --statusline, or name plugins with --user/--project
```

The help comes with it because a run that installs nothing is a question about
the flags, and answering it with a single line of correction assumes the reader
already knows the other ten. `--statusline` on its own is a complete request —
it is not a plugin.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and what each
  plugin is for.
- [statusline.md](../plugins/statusline.md) — the bar this CLI also installs,
  its three surfaces, and its configuration reference.
- [vwf.md](../plugins/vwf.md) — the workflow `--all` installs, and the tools it
  requires on your `PATH`.
