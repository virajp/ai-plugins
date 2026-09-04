# Running the plugins you are editing

This repo ships a workflow plugin. Without a second marketplace, its author runs
the **last release** — so a plugin edited today reaches nobody, including them.
`.dev-marketplace/` is the fix: a marketplace that serves this working tree.

You want this if you are developing the plugins. If you are using them, you want
`readme.md` instead — nothing here is published.

## Why it is a second file rather than a flag

`.claude-plugin/marketplace.json` pins every plugin to a `<name>-v<version>`
tag. That is exactly right for users: a merge to `main` ships nothing until
`mise run plugins:release` cuts the tag, so unreleased work can live on
`develop`. It is exactly wrong for the author, who needs the unreleased tree.
One file cannot be both, so there are two — generated together, from the same
plugin manifests, differing only in each entry's `source`.

## Setup, once per machine

```sh
mise run plugins:marketplace                    # both manifests + the staging dir
claude plugin marketplace remove virajp-plugins # if you have the published one
claude plugin marketplace add ./.dev-marketplace
mise run plugins:local                          # stage the plugins and install vwf
```

`claude plugin list` should then read:

```text
❯ stackgen@virajp-plugins   0.19.0+1   ✔ enabled
❯ vwf@virajp-plugins        19.10.0+1  ✔ enabled
```

stackgen arrives on its own — vwf declares it as a dependency and the dev
marketplace carries the same `name`, so the edge resolves inside it.

**You register one marketplace or the other, never both.** They share a name,
and that is deliberate: a differently-named dev marketplace would send vwf's
`stackgen` edge back to the tagged marketplace, where the tag may not exist yet.
So the machine is in author mode or user mode, and `claude plugin list` tells
you which by the version it reports.

## After you change a plugin

```sh
mise run plugins:local
```

The install is a directory *copy* into
`~/.claude/plugins/cache/virajp-plugins/<plugin>/<version>/`, keyed by version,
and `claude plugin update` compares versions only. With the source edited and
the version unchanged it reports `✔ vwf is already at the latest version` and
copies nothing — measured, not assumed. So the dev marketplace does not serve
`plugins/` directly. Its sources point into `.dev-marketplace/plugins/`, the
**staged copies** `plugins:local` writes: each plugin whose tree differs from
its staged copy is re-copied with its `plugin.json` version rewritten to
**`X.Y.Z+N`** — the tracked version plus a build number that exists only here —
then the manifests are regenerated, the marketplace refreshed, and
`claude plugin update` runs and now sees a change. The tracked manifests stay
plain semver, nothing is committed per iteration, and `plugins:check` fails a
tracked manifest that carries a `+N`.

Three measured facts shape that design. The version has to be in the staged
`plugin.json`, not the marketplace entry: for a directory source Claude reads
the plugin's own manifest and ignores the entry's `version`, which is why the
old `.dev-marketplace/plugins` symlink to the tree could never work — it served
the tracked version. Claude compares versions as **strings**, so `+4` → `+5`
registers as an update even though semver ranks them equal. And it writes the
cache directory with the `+` as `-` (`vwf/19.10.0-1/`) **and reuses one it has
seen before without clearing it** — so `plugins:local` takes `N` past the
installed number as well as the staged one, and removes a pre-existing cache
directory for the version it is about to install.

This is the
[`vwf-edits-do-not-reach-the-running-tools`](../../docs/memory/gaps/2026-08-26-vwf-edits-do-not-reach-the-running-tools.md)
gap. The dev marketplace does not close it; `plugins:local` makes the workaround
one command.

Restart Claude Code afterwards — a plugin's skills are read at session start.

## Going back to user mode

```sh
claude plugin marketplace remove virajp-plugins
claude plugin marketplace add ./     # or: virajp/claude-plugins
claude plugin install vwf@virajp-plugins --scope user
```

Do this before judging what a *user* gets, because in author mode your own
`claude plugin list` is not evidence about the published path. The hermetic
alternative is `.claude/agents/target-verifier.md`, which runs in its own config
directory and is unaffected by which mode you are in.

## Traps

- **`add .dev-marketplace` is rejected** — *"Invalid marketplace source
  format"*. Use `./.dev-marketplace` or an absolute path.
- **`.dev-marketplace/plugins/` is a staging directory, not a symlink.** Every
  dev `source` is `./plugins/<name>`, resolved against the marketplace root.
  Claude rejects every other way of naming a local tree — an absolute path, a
  `{"source": "directory"|"local", "path": …}` object, and a parent-relative
  `../plugins/<name>` all fail with `source: Invalid input` — so the copies have
  to live *inside* `.dev-marketplace/`. A symlink to `../plugins` was the shape
  until 2026-09-03; `plugins:marketplace` replaces one it finds and `--check`
  fails on it, because under it `update` never sees an edit. An empty staging
  directory reports as plugins that are simply absent: run `plugins:local`.
- **The dev manifest is gitignored, and checked only once it exists.** Edit a
  plugin manifest without re-running `plugins:marketplace` and the gate fails on
  your machine — but CI, which never generates one, reports it as not
  applicable. So a fresh clone needs `mise run plugins:marketplace` before the
  `marketplace add` above, and that is the one setup step you cannot skip.
- **Nothing here changes what users get.** The published manifest, its tags and
  `plugins:release` are untouched; the dissolution or any other work still
  reaches users only by merging to `main` and cutting the tag.
