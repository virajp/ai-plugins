# The installer CLI — usage

`@askviraj/ai-plugins` installs **plugins** (by driving Claude Code's own
commands), wires up **graphify**, and **removes** what this toolkit put on your
machine.

```sh
# Install the default plugin set (vwf; devtools arrives as its dependency)
pnpx @askviraj/ai-plugins --all

# Install plugins by name, at either scope
pnpx @askviraj/ai-plugins --user vwf --user typescript
pnpx @askviraj/ai-plugins --project vwf

# See what a run would do, without writing anything
pnpx @askviraj/ai-plugins --all --dry-run

# List everything the toolkit installed, and remove what you do not deselect
pnpx @askviraj/ai-plugins --uninstall
```

The examples use `pnpx`; if you do not use pnpm, `npx` works the same.

## The flags

| Flag               | Does                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `--all`            | Install the default plugin set (`vwf`, user scope)                |
| `--user <name>`    | Install a plugin at user scope; repeatable                        |
| `--project <name>` | Install a plugin at project scope, for this repo only; repeatable |
| `--uninstall`      | List everything installed and remove what you do not deselect     |
| `--statusline`     | Report where the statusline moved; it is its own package now      |
| `--dry-run`        | Show the full diff without writing anything                       |
| `-v`, `--version`  | This CLI's version, and each plugin's version on `main`           |
| `-h`, `--help`     | The usage text                                                    |

**An invocation that installs nothing prints the help and exits 1.** A bare run
is the common case there. The one exception is `--statusline`: it installs
nothing either, but it is a question rather than an empty run, so it answers
with where the bar went and exits 1 without the flag table.

Parsing is strict, so a flag that no longer exists reports itself by name rather
than being silently ignored. **`--platform`, `--upgrade`, `--force` and
`--no-statusline` are the four on that list.** Upgrading is Claude's own
`claude plugin update`, and `--force` existed only for the statusline, which
installs from another package now.

## Installing plugins

The plugin flags are a thin wrapper over Claude Code's own commands — the CLI
sequences them and skips what is already installed, and this is all `--user vwf`
runs:

```sh
# Once
claude plugin marketplace add virajp/ai-plugins

# Then, per plugin
claude plugin install vwf@virajp-plugins
```

Either route works; the marketplace is this repo's `main` in both. The CLI never
edits Claude's settings itself — Claude's commands own that bookkeeping — so it
needs `claude` on `PATH`, and there is nothing it can do without one.

`--project` keeps a plugin to one repo (recorded in the repo's
`.claude/settings.json`, resolved from the directory you run in) instead of your
user profile. A name requested at both scopes installs once, at project scope.

**Installing `vwf` pulls in `devtools` automatically** — Claude resolves plugin
dependencies natively (2.1.143 and later), from the same marketplace, at the
same scope. That is why `--all` is just `vwf`; every other plugin is installed
by name because which language and cloud plugins you want is a question about
your product.

An already-installed plugin is reported as satisfied, never auto-updated — see
[Upgrading](#upgrading). **No receipt is written at all** — not for a plugin
install and not for anything else this CLI does. Claude's own settings are the
record for plugins, graphify keeps its own for the hook, and `--uninstall` reads
both live.

Restart your agent afterwards so the skills, hooks and MCP servers load.

### Upgrading

```sh
claude plugin marketplace update virajp-plugins
claude plugin update vwf
```

The marketplace is this repo's `main`, which CI validates on every push, so
there is no separately published artifact to fall behind.

## Nothing is gated at install time

The CLI used to refuse an install when a plugin's required binaries were
missing, and print the command to fix each one. **That gate is gone** and did
not return with the plugin flags: an install cannot now fail for a reason you
did not ask about.

So after installing, run:

```text
/vwf:doctor
```

Doctor blocks on a missing **`mise`** or **`graphify`**, and both `/vwf:setup`
and `/vwf:execute` halt on either. It is not a complete substitute for the
retired gate: a missing language server is an ordinary finding, a missing `rtk`
is reported as a **degradation** rather than a block — its hook is guarded, so
the run is correct and merely costs more — and `pnpm` is not checked at all,
surfacing only as the context7 MCP server failing to start. Install all five.

## The statusline has moved

Earlier versions installed a powerline statusline for Claude Code, and its
context-caps hook with it. Both now live in
[`claude-status`](https://claude-status.virajp.dev) —
`brew install virajp/tap/claude-status` — and this CLI neither installs nor
removes them. `--statusline` is kept only to say so: it prints that redirection
and exits 1. It composes — `--all --statusline` still installs the plugins and
prints the install report, then the notice last, and still exits 1.

**If you installed the bar from here, `--uninstall` no longer tidies up after
it.** A `statusline.json` receipt that version left is still read and reverted
like any other legacy receipt, which removes the script files it recorded — but
nothing unwires the `statusLine` and `subagentStatusLine` keys or the
context-caps hook entry, and no receipt is known to have recorded them. So an
upgrade can leave `settings.json` naming a script that is gone; installing
`claude-status` re-points it.

## Seeing what a run would do

`--dry-run` writes nothing and prints the complete diff. It composes with every
other flag, including `--uninstall`, which is the scriptable way to ask "what is
installed here?" without touching it.

## Undoing an install

`--uninstall` is **interactive**. It enumerates every piece of the toolkit it
can see from where it runs:

- **At user level** — the `virajp-plugins` marketplace registration and
  user-scoped plugin installs.
- **At repo level**, when run inside a repo — project-scoped plugin installs,
  and graphify's hook, graph and `.graphifyignore`.
- **Plus anything an older install left behind**, read from the receipts those
  versions wrote — the copied Claude marketplace payload, the copied OpenCode
  plugin tree, the Cursor registration, the statusline. Every one of those is
  discontinued; the reader is how a machine still carrying a receipt gets
  cleaned rather than orphaned. It is kept for a release or two and then
  dropped.

Machine state starts **selected**; anything whose removal would edit a
**git-tracked** file in the current checkout starts **unselected**, shown `[ ]`.
You asked to uninstall, so re-naming each piece would turn a cleanup into a quiz
— but dirtying your working tree is not a cleanup, so `.graphifyignore` and
project-scope plugin rows read out of a committed `settings.json` have to be
asked for. The numbers you enter **toggle** a row, either way.

Each piece is removed through whatever owns it: `claude plugin uninstall` and
`claude plugin marketplace remove` for plugins, `graphify hook uninstall` for
the hook, and for anything with a receipt a **restore from that receipt** rather
than a delete — so whatever the recorded install displaced comes back, rather
than leaving you with nothing at all and no record of what was there.

With no terminal to ask on, it **fails** rather than guessing — unless there is
nothing to remove, in which case it says so and exits 0, because a run with
nothing to remove has nothing to guess about.

```sh
# Interactive: see the list, deselect what stays
pnpx @askviraj/ai-plugins --uninstall

# Non-interactive: just show me what is installed and what removing it would do
pnpx @askviraj/ai-plugins --uninstall --dry-run
```

**What it never touches**: plugins enabled from another marketplace, any
directory another tool owns, and everything the retired statusline left —
`~/.config/statusline.json`, any repo's own `.config/statusline.json`, and
`~/.claude/usage/`. This CLI no longer writes, reads or reasons about any of
those, so it does not delete them either. They hold your palette, your layout
and a usage history you accumulated, and they are a plausible input to whatever
bar you configure next. Delete them by hand if you want the space back.

## Versions

```sh
pnpx @askviraj/ai-plugins --version
```

Two things, from two places:

- **This CLI** — the running package's version, against the latest on npm. Under
  `pnpx` the running one is whatever was just downloaded.
- **Each plugin** — what the marketplace manifest on `main` lists, since `main`
  is what you install from.

It reports nothing off your disk. What you actually have installed is
`claude plugin list`, which answers that natively — parsing Claude's bookkeeping
a second time to say the same thing would only be a second thing to drift.

It exits 1 if it could not reach the network. Note that the `main` side is read
from raw GitHub and can be **CDN-cached for a few minutes** after a release — if
a version looks stale immediately after one, wait and re-run before diagnosing.

If you are behind shared egress — a corporate NAT, a CI runner pool — GitHub's
anonymous rate limit is per source IP and can be exhausted by other people.
Setting `$GITHUB_API_TOKEN` to a read-only (public-repo) token makes the call
authenticated. Nothing suggests it until you actually hit a rate limit; the npm
registry call is not GitHub and never sends it.

## Other agents

There is no Cursor, OpenCode or Oh-My-Pi install path. Point your agent at this
repo and ask it to adapt the plugin — the prompts are in the
[readme](https://github.com/virajp/ai-plugins#other-tools), along with a plain
statement of what that route does not promise.

## See also

- [index.md](./index.md) — what the CLI is for, and how to upgrade
- [targets.md](./targets.md) — what lands on disk, and where
- [internals.md](./internals.md) — the maintainer's map
