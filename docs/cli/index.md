# The installer CLI

[`@askviraj/ai-plugins`](https://www.npmjs.com/package/@askviraj/ai-plugins) is
the CLI that installs this toolkit across **four agents** — Claude Code, Cursor,
Oh-My-Pi and OpenCode — plus the statusline that ships alongside it.

```sh
pnpx @askviraj/ai-plugins --all
```

**npm is the only distribution channel**, so the CLI needs Node on every
platform, Windows included. There is deliberately no standalone binary, no
Homebrew tap and no Scoop bucket.

## The pages

| Page                             | Covers                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| [usage.md](./usage.md)           | The end-user reference — every flag, the scopes, uninstall, and what a receipt restores |
| [targets.md](./targets.md)       | What each of the four targets actually does, and where files land on disk               |
| [statusline.md](./statusline.md) | Why the statusline ships in the CLI rather than as a plugin, and its three surfaces     |
| [internals.md](./internals.md)   | The maintainer's map — the flow through the source, the build split, the tarball        |

## Installing is upgrading

There is **no `--upgrade` flag**, and its absence is a design decision rather
than a gap.

Plugin content ships *inside* the npm package: the marketplace source each
adapter registers is an absolute path into the installed package, and no adapter
ever runs a `marketplace update`. So a newer package on disk *is* a newer set of
plugins, and **re-running the install is the upgrade**. The flag that used to
exist only ever replayed a receipt to do what naming the plugins again already
did.

Claude needs one extra step to notice, and the installer takes it for you: it
caches plugin content per version, so the adapter compares what this build
advertises against what Claude records and runs `claude plugin update` when they
differ. Restart the agent afterward — Claude applies an update on the next
start. See [usage.md](./usage.md).

That makes the install idempotent, which is what lets it sit unguarded in a
setup script:

```sh
pnpx @askviraj/ai-plugins --all   # safe to re-run; this is how you upgrade
```

The same property is what makes the ~12 MB published tarball worth its size:
what you install is the rendered tree CI validated, not a tree fetched later
from somewhere else. [internals.md](./internals.md) covers what is in it.

## Related

- [docs/plugins/](../plugins/) — the reference for each plugin the CLI installs.
- [docs/plugins/statusline.md](../plugins/statusline.md) — the statusline's full
  configuration reference.
