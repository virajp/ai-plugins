# What lands on disk

Two writers, and it is worth being clear about which puts what where.

| Written by              | What                                                    |
| ----------------------- | ------------------------------------------------------- |
| `claude plugin install` | the plugins: skills, agents, hooks, MCP and LSP servers |
| `graphify`              | its own index and the git hooks that refresh it         |

**`pnpx @askviraj/ai-plugins` is not a third writer.** It sequences the other
two and writes nothing itself: the plugin flags (`--all`, `--user`, `--project`)
drive `claude plugin` and never edit Claude's settings directly — Claude keeps
bookkeeping beside what it writes, and hand-editing would strand the two apart —
and graphify's wiring is `graphify`'s own two commands.

This is why the CLI leaves **no receipt**. There is nothing of its own on disk
to record; what is there belongs to a tool that already tracks it.

## The plugins

Claude Code writes these itself, whether you run its commands or let the CLI
sequence them. You register the marketplace once and install by name:

```sh
claude plugin marketplace add virajp/ai-plugins
claude plugin install vwf@virajp-plugins
```

The marketplace is **this repo on GitHub**. `.claude-plugin/marketplace.json` at
the repo root lists all 8 plugins, each with a `source` of `./plugins/<name>` —
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

## graphify

Wired after every install, when `graphify` is on `PATH`: `graphify install` plus
`graphify hook install`, for the `claude` platform. If graphify is missing the
run says so and carries on — vwf will report it as blocking at first use, which
is the honest place for it.

## Receipts

**Nothing writes one any more.** The install paths belong to `claude` and
`graphify`, and both tools keep their own records — which is what `--uninstall`
reads live.

What is left is the **reader**, and it earns its place: a machine that installed
an earlier version still has receipts on disk, and each records what was there
*before* that install. `--uninstall` replays them, so what comes back is your
actual prior configuration rather than the keys this tool guesses it once set.

| Receipt       | Restores                              |
| ------------- | ------------------------------------- |
| `claude.json` | the copied Claude marketplace payload |

Only Claude Code is supported, so that is the one the reader **names**. It is a
label lookup rather than an allowlist, not a gate: **every readable `*.json` in
the receipt directory is enumerated and reverted**, whatever it is called — a
retired target's `opencode.json`, `cursor.json` or `ohmypi.json`, or the
`statusline.json` an older version wrote — just under a generic
`an install recorded in <name>`. Refusing to read one would strand the files it
records on exactly the machine that needs them cleaned.

Every one of those surfaces is discontinued. This reader is what lets a machine
carrying a receipt be cleaned rather than orphaned, and it is kept for a release
or two and then dropped. See [usage.md](./usage.md#undoing-an-install).

## Other agents

There is no Cursor, OpenCode or Oh-My-Pi install path, and no rendered tree for
them. Point your agent at this repo and ask it to adapt the plugin; the prompts
and the caveats are in the
[readme](https://github.com/virajp/ai-plugins#other-tools).

## See also

- [usage.md](./usage.md) — every flag, and the uninstall interaction
- [index.md](./index.md) — what the CLI is for, and how to upgrade
- [internals.md](./internals.md) — the maintainer's map
