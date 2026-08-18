# The installer CLI

[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins) is
a small CLI with three jobs: install the **statusline**, wire up **graphify**,
and **remove** what this toolkit put on your machine.

```sh
pnpx @askviraj/ai-plugins --statusline
```

It does **not** install plugins. Those come from Claude Code's own commands,
reading this repo from GitHub:

```sh
claude plugin marketplace add virajp/ai-plugins
claude plugin install vwf@virajp-plugins
```

**npm is the only distribution channel for the CLI**, so it needs Node on every
platform, Windows included. There is deliberately no standalone binary, no
Homebrew tap and no Scoop bucket.

## The pages

| Page                             | Covers                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------- |
| [usage.md](./usage.md)           | The end-user reference — every flag, uninstall, and what a receipt restores      |
| [targets.md](./targets.md)       | What lands on disk, and where — the statusline, the hook, graphify, the plugins  |
| [statusline.md](./statusline.md) | Why the statusline ships in the CLI rather than as a plugin                      |
| [internals.md](./internals.md)   | The maintainer's map — the flow through the source, the build split, the tarball |

## Why the statusline is not a plugin

Because no plugin mechanism can install a status bar. A Claude plugin can ship
skills, agents, hooks and MCP servers; the status line is a key in the user's
own `settings.json` pointing at an executable. Nothing in the plugin format
reaches it, so it needs an installer of its own — and that installer is the one
thing this package still is.

## Upgrading

Two different things, upgraded two different ways.

**The plugins** upgrade through Claude:

```sh
claude plugin marketplace update virajp-plugins
claude plugin update vwf
```

The marketplace is served from this repo's `main`, and every push to `main` is
validated in CI, so there is no separately published artifact to lag behind.

**The statusline** upgrades by re-running the CLI:

```sh
pnpx @askviraj/ai-plugins --statusline   # safe to re-run; this is the upgrade
```

There is **no `--upgrade` flag**, and its absence is deliberate. It only ever
replayed a receipt to do what re-running the install already did — and now that
plugin content has left the npm package entirely, there is nothing for it to
replay.

`--version` tells you what you actually have: this CLI's version, the version of
the statusline **on disk** (obtained by running the installed script, not by
assuming it matches the package you just downloaded), and each plugin's version
against `main`.

## After installing

Run **`/vwf:doctor`**. Nothing is gated at install time any more — the CLI used
to refuse an install when a required binary was missing, and that gate retired
with the plugin installer.

Doctor is the nearest replacement but not an equivalent one: it **blocks** on a
missing `mise` or `graphify`, and `/vwf:setup` and `/vwf:execute` halt on
either, while `pnpm` and `rtk` are not checked. See
[usage.md](./usage.md#nothing-is-gated-at-install-time) for the full picture.
Install all five binaries and do not lean on doctor to catch them.

## Other agents

There is no Cursor, OpenCode or Oh-My-Pi install path any more. Point your agent
at this repo and ask it to adapt the plugin — the prompts, and an honest
statement of what is and is not promised, are in the repo's
[readme](https://github.com/virajp/ai-plugins#other-tools).

## Related

- [docs/plugins/](../plugins/) — the reference for each plugin.
- [docs/plugins/statusline.md](../plugins/statusline.md) — the statusline's full
  configuration reference.
