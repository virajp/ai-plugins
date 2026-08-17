# The installer CLI — usage

`@askviraj/ai-plugins` installs the **statusline**, wires up **graphify**, and
**removes** what this toolkit put on your machine. It installs no plugins; see
[Installing plugins](#installing-plugins) for those.

```sh
# Install the statusline (the main bar and the subagent panel), and wire graphify
pnpx @askviraj/ai-plugins --statusline

# See what a run would do, without writing anything
pnpx @askviraj/ai-plugins --statusline --dry-run

# List everything the toolkit installed, and remove what you do not deselect
pnpx @askviraj/ai-plugins --uninstall
```

The examples use `pnpx`; if you do not use pnpm, `npx` works the same.

## The flags

| Flag              | Does                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| `--statusline`    | Install the statusline — **and consent** to replacing one already there    |
| `--no-statusline` | Skip the statusline                                                        |
| `--uninstall`     | List everything installed and remove what you do not deselect              |
| `--dry-run`       | Show the full diff without writing anything                                |
| `--force`         | Act even though Claude Code is not on `PATH`                               |
| `-v`, `--version` | This CLI, the statusline on disk, and each plugin's version against `main` |
| `-h`, `--help`    | The usage text                                                             |

**An invocation that installs nothing prints the help and exits 1.** A bare run
is the common case there.

Parsing is strict, so a flag that no longer exists reports itself by name rather
than being silently ignored. If you have `--all`, `--user`, `--project`,
`--platform` or `--upgrade` in a script, that script is from before the
Claude-first release; see [Installing plugins](#installing-plugins).

## Installing plugins

Plugins are installed by Claude Code itself, from this repo on GitHub:

```sh
# Once
claude plugin marketplace add virajp/ai-plugins

# Then, per plugin
claude plugin install vwf@virajp-plugins
```

Add `--scope project` to either command to keep the marketplace or the plugin to
one repo instead of your user profile.

**Installing `vwf` pulls in `devtools` automatically** — Claude resolves plugin
dependencies natively (2.1.143 and later), from the same marketplace, at the
same scope. That is what replaced the old `--all` flag; there is no default set
any more, and every other plugin is installed by name because which language,
cloud and capability plugins you want is a question about your product.

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
missing, and print the command to fix each one. **That gate is gone**, along
with the plugin installer it belonged to.

So after installing, run:

```text
/vwf:doctor
```

Doctor blocks on a missing **`mise`** or **`graphify`**, and both `/vwf:setup`
and `/vwf:execute` halt on either. It is not a complete substitute for the
retired gate: a missing language server is an ordinary finding, and `pnpm` and
`rtk` are not checked — `rtk`'s hook is guarded so its absence only degrades,
while a missing `pnpm` surfaces as the context7 MCP server failing to start.
Install all five.

## The statusline

The bar is installed whenever you ask for it. **Configuring Claude to use it**
is a separate step, and that step is gated on consent, because it displaces
whatever statusline you already had.

- `--statusline` **is** the consent. Passing it is how you say "yes, replace
  it".
- A statusline this tool installed is not foreign, so a repeat run never asks
  about its own bar.
- With **no terminal** to ask on, the run **fails** rather than guessing.
  Silently overwriting is the bug; silently skipping would make an unattended
  install report success with the bar unconfigured.
- A refusal is remembered, as `"autoConfigure": false` in
  `~/.config/statusline.json`. Passing `--statusline` again clears it.

The full configuration reference — segments, palettes, the two config layers —
is [docs/plugins/statusline.md](../plugins/statusline.md).

## Seeing what a run would do

`--dry-run` writes nothing and prints the complete diff. It composes with every
other flag, including `--uninstall`, which is the scriptable way to ask "what is
installed here?" without touching it.

## Undoing an install

`--uninstall` is **interactive**. It enumerates every piece of the toolkit it
can see from where it runs:

- **At user level** — the `virajp-plugins` marketplace registration, user-scoped
  plugin installs, and the statusline.
- **At repo level**, when run inside a repo — project-scoped plugin installs,
  and graphify's hook, graph and `.graphifyignore`.
- **Plus anything an older, multi-target install left behind** — the copied
  OpenCode plugin tree, the OpenCode and Oh-My-Pi statuslines. Those surfaces
  are discontinued; this is how they get removed cleanly rather than orphaned.
  It is kept for a release or two and then dropped.

Machine state starts **selected**; anything whose removal would edit a
**git-tracked** file in the current checkout starts **unselected**, shown `[ ]`.
You asked to uninstall, so re-naming each piece would turn a cleanup into a quiz
— but dirtying your working tree is not a cleanup, so `.graphifyignore` and
project-scope plugin rows read out of a committed `settings.json` have to be
asked for. The numbers you enter **toggle** a row, either way.

Each piece is removed through whatever owns it: `claude plugin uninstall` and
`claude plugin marketplace remove` for plugins, and for the statusline a
**restore from the receipt** rather than a delete, so the bar you had before
comes back.

With no terminal to ask on, it **fails** rather than guessing — unless there is
nothing to remove, in which case it says so and exits 0, because a run with
nothing to remove has nothing to guess about.

```sh
# Interactive: see the list, deselect what stays
pnpx @askviraj/ai-plugins --uninstall

# Non-interactive: just show me what is installed and what removing it would do
pnpx @askviraj/ai-plugins --uninstall --dry-run
```

**What an uninstall deliberately leaves**: `~/.config/statusline.json`. The
installer seeds it once and it becomes yours — it may hold your palette and your
layout, and throwing that away because you removed the bar would be the wrong
trade.

**What it never touches**: plugins enabled from another marketplace, a
statusline this tool did not install, and any directory another tool owns.

## Versions

```sh
pnpx @askviraj/ai-plugins --version
```

Three things, from three places:

- **This CLI** — the version of the package that is running. Under `pnpx` that
  is whatever was just downloaded.
- **The statusline on disk** — obtained by running the *installed* script and
  asking it. This is the number that tells you whether your bar is current; the
  CLI used to print its own version here and label it "bundled", which under
  `pnpx` described nothing you had. An install old enough to predate the flag
  reports `unknown (predates self-reporting)` rather than being guessed at.
- **Each plugin** — the local marketplace manifest against the one on `main`,
  since `main` is what you install from.

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

- [index.md](./index.md) — why the statusline ships here at all
- [targets.md](./targets.md) — what lands on disk, and where
- [internals.md](./internals.md) — the maintainer's map
