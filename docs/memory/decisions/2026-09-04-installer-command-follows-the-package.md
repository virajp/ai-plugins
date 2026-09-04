# Decision — the installer command follows the package

**Date** 2026-09-04 · **Branch** `develop` (worktree
`2026-09-04-rename-to-claude-plugins`) · **Supersedes** the *artifact vs
command* rule in
[`docs/plans/archived/02-rename-installer.md`](../../plans/archived/02-rename-installer.md)
and the passages that carried it in `installer/CLAUDE.md`,
`.claude/docs/installer/packaging.md`, `docs/installer/internals.md` and
`tsup.config.ts`.

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`).

## What was decided before, and where

When the bundle was renamed from `bin/index.mjs` to `bin/installer.mjs`, the
doctrine written down was: *the artifact is `installer.mjs`; the command is
`ai-plugins`; the `bin` key is never renamed, because it is what users invoke
and what npm's Trusted Publisher is bound to.* Four surfaces repeated it.

## What changed

The repo is now `github.com/virajp/claude-plugins` and the installer is
published as `@virajp.dev/claude-plugins`, starting again at `1.0.0`. The `bin`
key becomes **`claude-plugins`** with it — the one-time command change is taken.

## Why

- **A command that matches neither the package nor the repo is worse than a
  one-time rename.** Users type the package name under `pnpx`; a bin key that
  still said `ai-plugins` would be a third name to remember for no benefit.
- **Half of the old rationale was wrong.** npm binds a Trusted Publisher to the
  **package name**, not to the `bin` key. Renaming the key never touched the
  publish path; renaming the package does, and that is handled below.

## What stayed

- The marketplace name **`virajp-plugins`**. It is keyed into every existing
  install's dependency edge and cache path; renaming it would force every user
  to re-add.
- The on-disk names on user machines: the receipts dir
  `<config>/ai-plugins/receipts`, the payload path
  `~/.local/share/virajp/ai-plugins/`, the mempalace state dir
  `$XDG_STATE_HOME/ai-plugins/mempalace`, and the mempalace wing `ai-plugins`.
  Renaming any of them strands existing state; a migration would be its own
  plan.
- `docs/memory/**` and `docs/plans/archived/**` — historical records, left
  naming the old package.

## The sunset mechanism

`@askviraj/ai-plugins` is sunset, not removed. `sunset/` holds a standalone
package — `package.json`, one dependency-free `ai-plugins.mjs`, a `readme.md` —
that is not a workspace member and is never built. Published once as `7.0.0`, it
ignores every argument, prints a pointer to the new package and repo on stderr,
writes nothing to stdout, and exits `1`. It is then `npm deprecate`d and never
published again.

## The manual first publish

npm cannot bind a Trusted Publisher to a package name that has never been
published. So `@virajp.dev/claude-plugins@1.0.0` is published **by hand**
(`mise run i:build && mise run i:publish` under the user's login), the publisher
is added on npmjs.com afterwards, and only then does `mise run i:release` tag
`installer-v1.0.0` — `release.yml` finds the version already on npm, skips the
publish, and that skip is what proves the wiring. The sunset stub is published
by hand after that, then deprecated.
