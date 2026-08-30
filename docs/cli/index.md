# The installer CLI

[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins) is
a small CLI with three jobs: install **plugins**, wire up **graphify**, and
**remove** what this toolkit put on your machine.

```sh
pnpx @askviraj/ai-plugins --all
```

The plugin half is a thin wrapper: it drives Claude Code's own commands, reading
this repo from GitHub, and they work just as well directly:

```sh
claude plugin marketplace add virajp/ai-plugins
claude plugin install vwf@virajp-plugins
```

**npm is the only distribution channel for the CLI**, so it needs Node on every
platform, Windows included. There is deliberately no standalone binary, no
Homebrew tap and no Scoop bucket.

## The pages

| Page                           | Covers                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| [usage.md](./usage.md)         | The end-user reference — every flag, and what uninstall removes                  |
| [targets.md](./targets.md)     | What lands on disk, and where — the plugins, graphify, the marketplace           |
| [internals.md](./internals.md) | The maintainer's map — the flow through the source, the build split, the tarball |

## The statusline has moved

Earlier versions of this CLI also installed a powerline statusline for Claude
Code. It now lives in [`claude-status`](https://claude-status.virajp.dev) —
`brew install virajp/tap/claude-status` — and nothing here installs it or cleans
up after the versions that did. `--statusline` prints that redirection and exits
1; that is the only thing the flag still does.

So if you installed the bar from here, an upgrade can leave your `settings.json`
naming a script this CLI no longer ships; installing that package re-points it.
The detail is in [usage.md](./usage.md#the-statusline-has-moved).

## Upgrading

The plugins upgrade through Claude:

```sh
claude plugin marketplace update virajp-plugins
claude plugin update vwf
```

The manifest is served from this repo's `main`, and every push to `main` is
validated in CI; each plugin's content comes from the `<name>-v<version>` tag
that manifest pins it to. So there is no separately published artifact to lag
behind, and a merge to `main` is not itself a release.

There is **no `--upgrade` flag**, and its absence is deliberate. It only ever
replayed a receipt to do what re-running the install already did — and plugin
content has left the npm package entirely, so there is nothing for it to replay.
Re-requesting an installed plugin reports it as satisfied and points at
`claude plugin update`; it never upgrades behind your back.

`--version` reports this CLI's own version against npm, and each plugin's
version on `main`. It no longer reads anything off disk: what you have installed
is `claude plugin list`, which answers it natively.

## After installing

Run **`/vwf:doctor`**. Nothing is gated at install time any more — the CLI used
to refuse an install when a required binary was missing, and that gate stayed
retired when the plugin flags returned.

Doctor is the nearest replacement but not an equivalent one: it **blocks** on a
missing `mise` or `graphify`, and `/vwf:setup` and `/vwf:execute` halt on
either; a missing `rtk` is reported as a **degradation**, and `pnpm` is not
checked at all. See [usage.md](./usage.md#nothing-is-gated-at-install-time) for
the full picture. Install all five binaries and do not lean on doctor to catch
them.

## Other agents

There is no Cursor, OpenCode or Oh-My-Pi install path any more. Point your agent
at this repo and ask it to adapt the plugin — the prompts, and an honest
statement of what is and is not promised, are in the repo's
[readme](https://github.com/virajp/ai-plugins#other-tools).

## Related

- [docs/plugins/](../plugins/) — the reference for each plugin.
