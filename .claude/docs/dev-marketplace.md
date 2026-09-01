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
mise run plugins:marketplace                    # both manifests + the symlink
claude plugin marketplace remove virajp-plugins # if you have the published one
claude plugin marketplace add ./.dev-marketplace
claude plugin install vwf@virajp-plugins --scope user
```

`claude plugin list` should then read:

```text
❯ stackgen@virajp-plugins   0.19.0   ✔ enabled
❯ vwf@virajp-plugins        19.9.1   ✔ enabled
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
claude plugin uninstall vwf@virajp-plugins
claude plugin install  vwf@virajp-plugins --scope user
```

**Not `claude plugin update`.** The install is a directory *copy* into
`~/.claude/plugins/cache/virajp-plugins/<plugin>/<version>/`, keyed by version,
and `update` compares versions only. With the source edited and the version
unchanged it reports `✔ vwf is already at the latest version` and copies nothing
— measured, not assumed. Uninstall-then-install re-copies. `update` becomes
correct again the moment the version bumps.

This is the
[`vwf-edits-do-not-reach-the-running-tools`](../memory/gaps/2026-08-26-vwf-edits-do-not-reach-the-running-tools.md)
gap. The dev marketplace does not close it; it makes the workaround one pair of
commands.

Restart Claude Code afterwards — a plugin's skills are read at session start.

## Going back to user mode

```sh
claude plugin marketplace remove virajp-plugins
claude plugin marketplace add ./     # or: virajp/ai-plugins
claude plugin install vwf@virajp-plugins --scope user
```

Do this before judging what a *user* gets, because in author mode your own
`claude plugin list` is not evidence about the published path. The hermetic
alternative is `.claude/agents/target-verifier.md`, which runs in its own config
directory and is unaffected by which mode you are in.

## Traps

- **`add .dev-marketplace` is rejected** — *"Invalid marketplace source
  format"*. Use `./.dev-marketplace` or an absolute path.
- **The `.dev-marketplace/plugins` symlink is load-bearing.** Every dev `source`
  is `./plugins/<name>`, resolved against the marketplace root. Claude rejects
  every other way of naming a local tree — an absolute path, a
  `{"source": "directory"|"local", "path": …}` object, and a parent-relative
  `../plugins/<name>` all fail with `source: Invalid input` — so the tree has to
  be reachable from *inside* `.dev-marketplace/`. `plugins:marketplace --check`
  asserts the link, because a checkout that wrote it as a text file resolves to
  nothing and reports as a plugin that is simply absent.
- **The dev manifest is committed and checked.** Edit a plugin manifest without
  re-running `plugins:marketplace` and the gate fails, same as for the published
  one.
- **Nothing here changes what users get.** The published manifest, its tags and
  `plugins:release` are untouched; the dissolution or any other work still
  reaches users only by merging to `main` and cutting the tag.
