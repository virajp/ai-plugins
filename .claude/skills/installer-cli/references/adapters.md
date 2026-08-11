# Adapters

An **Adapter** (`cli/src/adapters/`) is install-time and effectful: a rendered
tree → the user's machine. Its build-time counterpart, a **Target**
(`build/src/targets/`), is pure. Keeping them apart is what keeps
format-preserving config mutation out of the renderer, and what let the OpenCode
installer shrink from a 1189-line renderer to a copier.

Which kind of adapter a target gets is **dictated by the target, not chosen**.

## Copy — OpenCode alone

OpenCode has no plugin concept: skills, agents and commands go into well-known
directories and the rest is config to merge.

**Copying is not idempotent on its own** — it writes what the render contains
and says nothing about what it used to — so the adapter prunes first, by three
rules that differ in *who else writes there*:

1. A plugin's own bundle (`virajp-plugins/<plugin>/`) is exclusively ours and is
   cleared wholesale, **per plugin**, so a partial install cannot delete a
   bundle it was not asked about.
2. A directory under the bundle root naming no known plugin is a **retired
   plugin** and goes.
3. The flat dirs (`agent/`, `command/`, `plugin/`) are **shared** — with
   OpenCode itself and with graphify — so a file there is removed only when the
   ownership record a previous run left says it was ours **and** this render no
   longer emits it.

Rule 3 catches the non-obvious case: a skill whose `invocation:` flips `user` →
`both` stops emitting its `command/` wrapper while the plugin stays installed.

## Marketplace — everyone else

Claude and Oh-My-Pi are driven through their own CLI (`plugin marketplace add` +
`plugin install`), because each owns bookkeeping this tool has no business
editing — Oh-My-Pi an npm-shaped tree with a lockfile. Cursor has no CLI, so its
adapter writes the reference itself.

**A marketplace adapter still has to answer where the bytes live.** Cursor
resolves from git, so it is done once the command returns. **Claude and Oh-My-Pi
both re-read the path they registered**, so it outlives the run — and pointing
it at `context.sourceRoot` pointed it at a `pnpm dlx` store path that
`pnpm store prune` reclaims. Both therefore copy the payload under
`~/.local/share/virajp/ai-plugins/` (XDG; `LOCALAPPDATA` on Windows), `claude`
and `ohmypi` beside each other, and register that. A `github` source would also
be durable, but `marketplace add` takes no ref, so every user would track `main`
instead of the version they installed.

**Oh-My-Pi was the late addition, because it looked exempt.** It copies each
installed bundle into `~/.omp/plugins/cache/`, so plugins already installed keep
working after the source is reclaimed — which is the whole of what that cache
buys. The registration still names the source, and `omp` re-reads it to install
anything *else*: with the path gone, `omp plugin discover` still lists every
plugin from its cached catalog while `omp plugin install <name>@virajp-plugins`
fails with "Plugin source directory does not exist". That is the same shape as
the url-sourced entry `marketplaceJson` already refuses to emit — a catalog
promising something the tool will never deliver — and it is invisible until the
first install of a plugin the user did not already have. The migration rides
`isStalePin`'s `managedBase` arm, which exists precisely for a pin that is a
package install moving to the managed directory.

## Scope

Scope is declared by `plugin.yaml` and honoured where the target supports it;
where it does not, the request **falls back rather than failing**. Only OpenCode
and Oh-My-Pi support both natively. Cursor is project-only — user-scope
marketplace installs are account-side, and the local file that once held them is
closed (`addGitHubPlugin` throws). The redirect logs a note; it is never silent.

## The dependency gate

`cli/src/deps.ts` checks the external-tool union over the
**dependency-expanded** set before anything is written, and it is **not
overridable by `--force`** — `--force` means something narrower (act on a target
whose own CLI is missing). There is no useful state on the far side of
installing vwf without graphify.

Each plugin declares its own `requires:`; the build projects it into
`plugins.json`. The old hand-maintained `PLUGIN_EXTRA_DEPS` map, whose entries
rolled their dependencies' tools up by hand, is gone — the derived union
reproduces every one of its entries exactly, and a test pins that.

`DEP_HINTS` stays CLI-side because it describes *this toolchain*, not the
plugin, so a tool with no hint still reports as missing rather than needing two
lists kept in sync.

## graphify

`cli/src/graphify.ts` runs `graphify install --platform <target>` plus
`graphify hook install` when vwf is installed, for the two targets graphify
supports (claude, opencode). Not optional: vwf enforces graphify at its own
entry gate, so an install that skips this produces a plugin that halts. It
**soft-skips throughout** — the hook needs a git work tree, and failing here
would undo an install that already succeeded.
