# What lands on disk

Two writers, and it is worth being clear about which puts what where.

| Written by                  | What                                                    |
| --------------------------- | ------------------------------------------------------- |
| `claude plugin install`     | the plugins: skills, agents, hooks, MCP and LSP servers |
| `pnpx @askviraj/ai-plugins` | the statusline, its caps hook, and graphify's wiring    |

The CLI's plugin flags (`--all`, `--user`, `--project`) do not add a third
writer: they **drive** `claude plugin` and never edit Claude's settings
themselves — Claude keeps bookkeeping beside what it writes, and hand-editing
would strand the two apart.

## The plugins

Claude Code writes these itself, whether you run its commands or let the CLI
sequence them. You register the marketplace once and install by name:

```sh
claude plugin marketplace add virajp/ai-plugins
claude plugin install vwf@virajp-plugins
```

The marketplace is **this repo on GitHub**. `.claude-plugin/marketplace.json` at
the repo root lists all 13 plugins, each with a `source` of `./plugins/<name>` —
resolved against the marketplace root, which is why that manifest sits at the
root rather than inside `plugins/`.

Where it lands is Claude's business, not this repo's, and the shape has changed
before. What is worth knowing:

- **Scope is yours to pick.** `--scope project` on either command keeps the
  registration or the install to one repo; without it, both are user-level.
- **Dependencies install themselves.** `claude plugin install vwf` pulls in
  `devtools` from the same marketplace at the same scope. An uninstall leaves a
  dependency behind, which is what `claude plugin prune` is for.
- **Upgrading is two commands**, and the first is easy to forget:
  `claude plugin marketplace update virajp-plugins` refreshes the catalog, then
  `claude plugin update <name>` takes the new version. Restart the agent
  afterwards.
- **Nothing is verified at install time.** Run `/vwf:doctor` after installing;
  it is what reports a missing required binary, as a blocking finding.

### Why this repo no longer copies a payload

Until the Claude-first release the CLI shipped the plugin content *inside* the
npm package and registered a copy of it as a local marketplace. One trap from
that era is worth keeping, because it is the reason git-serving is simpler
rather than merely smaller: Claude caches plugin content per version and answers
"already installed" without re-resolving, so a newer payload could sit on disk
while the old version stayed live. The installer had to compare its own
advertised version against Claude's bookkeeping and force an update. With one
copy on `main`, `marketplace update` is the whole of it.

## The statusline

```sh
pnpx @askviraj/ai-plugins --statusline
```

| Path                              | What                                                |
| --------------------------------- | --------------------------------------------------- |
| `~/.claude/scripts/statusline`    | the bar itself — one script, both surfaces          |
| `~/.claude/hooks/context-caps.js` | the `PostToolUse` hook that feeds it usage data     |
| `~/.claude/settings.json`         | four keys: two status lines, one env var, one hook  |
| `~/.config/statusline.json`       | the seeded default config — **yours** after that    |
| `~/.config/ai-plugins/receipts/`  | what the install touched, and what was there before |

One script drives both surfaces: a payload carrying a `tasks` array renders the
subagent panel, anything else the main two-line bar.

**Configuring Claude is gated on consent**, since it displaces whatever bar you
had — `--statusline` is that consent, and with no terminal to ask on the run
fails rather than guessing. See [usage.md](./usage.md#the-statusline).

Claude Code must be on `PATH`, or the run needs `--force`.

## graphify

Installed alongside the statusline, when `graphify` is on `PATH`:
`graphify
install` plus `graphify hook install`, for the `claude` platform. If
graphify is missing the run says so and carries on — vwf will report it as
blocking at first use, which is the honest place for it.

## Receipts

The statusline install writes a receipt recording **what was there before**, so
an uninstall restores rather than guesses. A plugin install writes none —
Claude's own settings are the record, and `--uninstall` reads them live. That is
the difference between removing the keys we know we set — safe only while that
inference holds — and putting your actual prior configuration back.

`--uninstall` reads those receipts, and also reads the receipts an **older,
multi-target install** left behind, so a machine carrying the discontinued
OpenCode plugin tree or the OpenCode and Oh-My-Pi statuslines can be cleaned
rather than orphaned. See [usage.md](./usage.md#undoing-an-install).

## Other agents

There is no Cursor, OpenCode or Oh-My-Pi install path, and no rendered tree for
them. Point your agent at this repo and ask it to adapt the plugin; the prompts
and the caveats are in the
[readme](https://github.com/virajp/ai-plugins#other-tools).

**Cursor never had a status surface** and still does not. The OpenCode TUI bar
and Oh-My-Pi's `omp config` segments were discontinued — `--uninstall` removes
them cleanly.

## See also

- [usage.md](./usage.md) — every flag, and the uninstall interaction
- [index.md](./index.md) — why the statusline ships in a CLI at all
- [internals.md](./internals.md) — the maintainer's map
