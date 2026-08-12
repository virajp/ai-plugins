# Install targets

`@askviraj/ai-plugins` installs the same toolkit onto four agents — Claude Code,
Cursor, Oh-My-Pi and OpenCode — and does something different on each, because
each offers a different place to put a plugin. This page is what actually
happens per target and where the files land.

With no `--platform`, a run acts on every one of the four found on your `PATH`.

## Two kinds of adapter

An install is performed by an **adapter**, and which kind a target gets is
**dictated by the target, not chosen**:

- **copy** — OpenCode alone, which has no plugin concept at all. The rendered
  tree is copied into its config directory and a few config keys are merged.
- **marketplace** — Claude, Cursor and Oh-My-Pi, each of which has a real plugin
  marketplace and owns bookkeeping this tool has no business editing. The
  installer registers a marketplace and lets the tool do the installing.

| Target      | Adapter     | How it installs                              | Where the payload lands                                                            | Scopes        |
| ----------- | ----------- | -------------------------------------------- | ---------------------------------------------------------------------------------- | ------------- |
| Claude Code | marketplace | `claude plugin marketplace add` + `install`  | `~/.local/share/virajp/ai-plugins/claude/`                                         | user, project |
| Cursor      | marketplace | writes a git reference into settings         | nothing local — Cursor clones and caches it itself                                 | project only  |
| Oh-My-Pi    | marketplace | `omp plugin marketplace add` + `install`     | `~/.local/share/virajp/ai-plugins/ohmypi/`, then `omp`'s own plugin store          | user, project |
| OpenCode    | copy        | copies the rendered tree, merges config keys | `~/.config/opencode/virajp-plugins/` (user), `.opencode/virajp-plugins/` (project) | user, project |

## Claude Code

The installer copies the marketplace payload — the root `.claude-plugin/`
manifest beside the rendered `claude/` tree, keeping their relative positions,
because the manifest's plugin sources are `./claude/plugins/<name>` resolved
against the marketplace root — into `~/.local/share/virajp/ai-plugins/claude/`,
registers that directory as a marketplace, and then runs
`claude plugin install <name>@virajp-plugins` per plugin.

The payload is copied rather than registered where it was unpacked because the
documented way to run this is `pnpx`, whose store path is reclaimed the moment
the run ends; Claude re-reads the registered path on every later session. That
path is deliberately **fixed across versions**, so re-running the install
refreshes the content in place without re-registering anything.

Refreshing the directory is not the whole upgrade, though. Claude caches plugin
content per version under `plugins/cache/<marketplace>/<name>/<version>/` and
keeps serving the cached copy, and `plugin install` answers "already installed"
without re-resolving — so a newer payload would sit on disk while the old
version stayed live. The adapter therefore compares the version its manifest
advertises against the one Claude records in `installed_plugins.json` and runs
`plugin update` on a mismatch only. This is the one target that needs it: the
other three copy or register a tree that *is* the content, with no version-keyed
cache in between.

The marketplace is always registered at user scope — it is one machine-wide path
— while the plugins themselves land wherever you asked: `enabledPlugins` in
`~/.claude/settings.json` for user scope, `<cwd>/.claude/settings.json` for
project scope.

Two behaviours worth knowing:

- **Dependencies install themselves.** `claude plugin install` pulls in a
  plugin's dependencies, so the installer does not expand them — and an
  uninstall leaves them behind, which is what `claude plugin prune` is for.
- **A marketplace you configured is never re-pointed.** If `virajp-plugins`
  already names a source that is not one of this tool's own, the run installs
  from there and says so, rather than silently repointing you at a different
  copy.

## Cursor

The only adapter that installs nothing. Cursor's plugin sources are **git-only**
— there is no local-path variant — so the install writes a *reference* into
`<cwd>/.cursor/settings.json` under `plugins["virajp-plugins/<name>"]`, taking
the git coordinates straight out of the generated
`.cursor-plugin/marketplace.json`. Cursor then clones and caches the bundle
itself.

Two consequences follow, and neither is avoidable from here:

- A Cursor install resolves **over the network**, even though the rendered
  `cursor/` tree ships inside the package you just ran. The entries pin no ref,
  so Cursor reads the repository's default branch — this is the one target where
  "what you install is what CI validated" does not hold.
- **Project scope is the only writable surface.** A user-scope marketplace
  install in Cursor is account-side, and the local file that used to hold them
  is closed. A `--user` request is therefore installed at project scope instead,
  with a note; it is never silently dropped and never refused.

## Oh-My-Pi

`omp` owns its plugin state — an npm-shaped tree with a `package.json`, a
lockfile and an installed-plugin record — so the adapter drives the CLI rather
than writing any of it. The rendered `ohmypi/` tree is copied to
`~/.local/share/virajp/ai-plugins/ohmypi/` for the same durability reason as
Claude's, registered with `omp plugin marketplace add` (recorded in
`~/.omp/marketplaces.json`), and each plugin installed as
`<name>@virajp-plugins`.

On a re-install the adapter also runs `omp plugin marketplace update`. `omp`
caches the marketplace catalog it read when the marketplace was first added and
never re-reads it, so without the refresh `omp plugin list` keeps reporting the
version you first installed — and, more sharply, a plugin **added** in a later
release cannot be installed at all, failing with
`Plugin "<name>" not found in marketplace`. The plugin *content* refreshes
either way; it is `omp`'s records that go stale.

Project scope writes `<cwd>/.omp/plugins/`, user scope `~/.omp/plugins/`. Both
work natively, so unlike Cursor nothing is redirected.

Re-installing is a refresh: `omp` copies each bundle into its own cache, so an
already-installed plugin is reinstalled rather than skipped — otherwise it would
stay pinned to whatever content it was first installed with.

## OpenCode

OpenCode has no plugin or marketplace concept: skills, agents, commands and
plugins each live in a well-known directory under the config dir, and the rest
is config. So the rendered `opencode/` tree is copied in — the per-plugin
bundles into `~/.config/opencode/virajp-plugins/` (user scope) or
`<cwd>/.opencode/virajp-plugins/` (project scope), and the flat `agent/`,
`command/` and `plugin/` files into the config directory beside them, where
OpenCode discovers them globally.

Each plugin's `lsp` and `mcp` entries are merged into your `opencode.jsonc` (or
an existing `opencode.json`), and the bundle directory is appended to
`skills.paths`. Keys you already had are left alone.

Copying is not idempotent on its own — it writes what the render contains and
says nothing about what it used to contain — so the adapter prunes first, by
three rules that differ in who else writes there: a named plugin's own bundle is
cleared wholesale before the copy, a bundle directory naming no plugin this
build ships is removed as retired, and a file in the **shared** flat directories
is removed only when the ownership record left by a previous run says this tool
wrote it *and* the current render no longer emits it. That record is
`.ownership.json`, in the bundle root.

## Scope, and what falls back

Scope is what you ask for: `--user <name>` or `--project <name>`, repeatable,
and `--all` for the default set at user scope. No plugin is pinned to a scope —
every one of them installs at either, on request. A name given at both scopes
resolves once, at project scope, being the narrower of the two.

A target honours the requested scope where it supports it; where it does not,
**the request falls back rather than failing, and the run says so**. Cursor is
the only target that falls back today, project scope being its one writable
surface. Claude, Oh-My-Pi and OpenCode all support both natively.

## Where the marketplace manifests live

Three manifests are generated by `mise run plugins:build`, one per marketplace
target:

| Target   | Manifest                          | Plugin sources                 |
| -------- | --------------------------------- | ------------------------------ |
| Claude   | `.claude-plugin/marketplace.json` | `./claude/plugins/<name>`      |
| Cursor   | `.cursor-plugin/marketplace.json` | `git-subdir` → `cursor/<name>` |
| Oh-My-Pi | `ohmypi/.omp-plugin/…json`        | `./<name>`                     |

Two of them sit at the **repository root** rather than under their target's own
directory. That is where each tool looks when the marketplace is added from this
repo, and their sources are resolved relative to the marketplace root — which is
also why Claude's copied payload preserves the root-relative shape rather than
flattening it. OpenCode has no manifest here at all, having no marketplace to
register one with.

## Plugins hosted in another repo

A marketplace entry may point at a plugin that lives in its own repository
rather than shipping a rendered bundle here. **Only Claude's marketplace can
fetch one**: its manifest takes a URL source and the tool resolves it. The other
three cannot — OpenCode's adapter copies a rendered tree and there is none,
Cursor's manifest is generated from local plugins only, and Oh-My-Pi accepts a
URL and then silently drops the entry.

So such a plugin is **skipped** on those three rather than failing the run, and
the report names it once with the targets that could not take it, instead of
repeating a sentence per target and making one fact look like three problems.

**No plugin in this marketplace is url-sourced today** — the last one, the
Karpathy guidelines, was vendored into `vwf` for exactly this reason. The skip
path stays because it is live code; it currently narrows nothing.

## Receipts

Every install writes a **receipt**, one per target, at
`<config>/ai-plugins/receipts/<target>.json` — `XDG_CONFIG_HOME` when set,
`%APPDATA%` on Windows, `~/.config` otherwise.

A receipt records **prior state**, not just what was written: whether a file
existed and what was in it, the previous value of every config key touched and
whether the key existed at all, and — for the CLI-driven targets — the command
that undoes each install. `--uninstall` replays it in reverse, so it restores
rather than guesses, and one target's uninstall leaves the others intact.

Receipts are merged across runs rather than overwritten, so installing a second
plugin next week does not narrow the record of the first. The invariant behind
all of it — install then remove leaves every touched file byte-identical — and
the ownership rules that keep it true are contributor material, in
[`.claude/skills/installer-cli/references/receipts.md`](../../.claude/skills/installer-cli/references/receipts.md).

## Status surfaces

Three of the four targets have somewhere to put a status bar, each through its
own mechanism — a settings key on Claude, `omp config` keys on Oh-My-Pi, a TUI
plugin on OpenCode. **Cursor exposes no status surface at all**, so a run
targeting only Cursor has nothing to install. See [statusline](./statusline.md)
for the flag and the consent rules, and the
[statusline reference](../plugins/statusline.md) for what it draws and how to
configure it.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [`.claude/skills/installer-cli/`](../../.claude/skills/installer-cli/SKILL.md)
  — the maintainer doctrine for the adapters, the receipt invariant and
  packaging.
