# Plan: a develop-tracking marketplace for the authoring machine

**Status: draft, 2026-09-01 — awaiting approval.** Every host behaviour this
depends on was probed against the real `claude` CLI in a throwaway
`CLAUDE_CONFIG_DIR`; the results are §B and they are what the design is built
on, not assumptions.

This gives the authoring machine a marketplace that serves **`develop`'s
plugins**, so the toolkit can be used before it is published, without weakening
the tag discipline that holds work back from users.

The framing: **one manifest is serving two audiences that want opposite
things.** `.claude-plugin/marketplace.json` pins each plugin to a
`<name>-v<version>` tag, which is exactly right for users — a merge to `main`
ships nothing until `plugins:release` cuts the tag. It is exactly wrong for the
author, who needs the unreleased tree. Those cannot be the same file.

---

## A. What broke, and why it is not a tag problem

On 2026-09-01, after the devtools dissolution merged to `develop`, vwf stopped
loading on the authoring machine:

```text
vwf@virajp-plugins  19.2.0  ✘ failed to load
Error: Dependency "devtools@virajp-plugins" is not installed
```

Three facts compose into it:

1. **The installed vwf is `19.2.0`**, cached 2026-08-30 at commit `f41a3276`.
   That manifest still declares a `devtools` dependency. The repo has been at
   `19.9.x` for days; the machine never updated because updating requires a tag.
2. **`virajp-plugins` is registered as a `directory` source pointing at the repo
   root**, so the *manifest* it reads is whatever branch is checked out —
   `develop`. `forceRemoveDeletedPlugins: true` deleted `devtools` from the
   machine's registry the moment the dissolution landed.
3. **A stale plugin plus a vanished dependency is a failed load**, and there is
   no state in between.

**The obvious fix is the wrong one.** Cutting `vwf-v19.9.1` and
`stackgen-v0.19.0` would make the current manifest resolve, but it publishes the
dissolution to users as the price of unblocking one machine, and it leaves the
machine tracking *released* content again — the same wall, one release later.
`plugins:release` also refuses to run off `main` by design, so the "quick fix"
is really "merge everything to main first".

**The real defect is that this repo has no dogfooding path.** It ships a
workflow plugin whose author cannot run the unreleased version of it. That is
what this plan fixes; the tags stay exactly as they are.

---

## B. What the host actually allows

Probed against the real CLI, hermetically. Each row is a marketplace entry's
`source` field, installed into a scratch `CLAUDE_CONFIG_DIR`:

| `source`                                                  | Result                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `"/abs/path/to/plugins/stackgen"`                         | rejected — `This plugin's marketplace entry is invalid: source: Invalid input` |
| `{"source": "directory", "path": "/abs/…"}`               | rejected, same error                                                           |
| `{"source": "local", "path": "/abs/…"}`                   | rejected, same error                                                           |
| `"../plugins/vwf"`                                        | rejected — a source may not climb out of the marketplace root                  |
| `{"source": "git-subdir", …, "ref": "develop"}`           | **works** — installs from the pushed branch                                    |
| `"./plugins/vwf"`, with `plugins` a symlink into the tree | **works** — installs from the working tree                                     |

Two further behaviours, both load-bearing:

- **The dependency edge resolves by marketplace *name*.** vwf's manifest names
  `{"marketplace": "virajp-plugins", "name": "stackgen"}`. Installing vwf from a
  marketplace *named* `virajp-plugins` pulled stackgen automatically
  (`+ 1 dependency: stackgen`). A differently-named dev marketplace would send
  that edge back to the tagged one and fail on the missing tag. **The name must
  be identical**, which also means only one of the two can be registered at a
  time — dev mode or user mode, never both. That is a feature.
- **An install is a directory *copy* into
  `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`**, keyed by
  version. Not a symlink, not a live mount.

### The two candidate mechanisms, and why the local one wins

`ref: develop` also works and needs no symlink, so it deserves a straight
comparison:

|                              | `ref: develop`     | `./plugins/<name>` + symlink |
| ---------------------------- | ------------------ | ---------------------------- |
| Serves                       | **pushed** develop | the **working tree**         |
| Needs a push before it lands | yes                | no                           |
| Needs a symlink              | no                 | yes                          |
| Reaches uncommitted work     | no                 | yes                          |

The working tree wins because the failure this is fixing is *"I cannot run what
I just changed"*, and a mechanism that requires a push first only shortens that
loop rather than closing it. The symlink is the price; §H says what it costs.

---

## C. The design

```text
.dev-marketplace/
  .claude-plugin/marketplace.json    # generated; relative sources
  plugins -> ../plugins              # relative symlink into the authored tree
```

The dev manifest is the **same projection of the same two plugin manifests**,
differing in exactly one field per entry:

```jsonc
// .claude-plugin/marketplace.json — published, read from main by users
"source": { "source": "git-subdir", "url": "…", "path": "plugins/vwf", "ref": "vwf-v19.9.1" }

// .dev-marketplace/.claude-plugin/marketplace.json — the authoring machine only
"source": "./plugins/vwf"
```

Everything else — `name`, `description`, `version`, `tags`, `category`,
`author`, the `dependencies` array — is shared, because both files are
projections of the same source and a second projection that drifts in any other
field is a second source of truth.

**`name` is `virajp-plugins` in both**, per §B. The dev manifest's top-level
`description` states loudly that it is the local authoring marketplace and is
never published — the manifest is strict JSON with a `$schema`, so a comment is
not available and `description` is the only place to say it.

---

## D. Decisions

**D1 — the dev manifest is committed, not gitignored.** It is machine-
independent: relative sources, a relative symlink, no absolute path anywhere. So
the argument that decided the published manifest applies unchanged — *"the
manifest is generated **and** committed, so a plugin manifest edited without a
regenerate is invisible to every other check"*. Committing it means a fresh
clone is one `marketplace add` away from working, and `--check` can assert it
has not drifted. The cost is a second file in the tree claiming the name
`virajp-plugins`, which §H rates.

**D2 — the symlink is required, not stylistic.** §B proves `..` is rejected and
absolute paths are rejected, so a source cannot reach `plugins/` from a sibling
directory by any other means. The alternative — making the repo root itself the
dev marketplace — is impossible: that path already holds the published manifest,
and a directory has exactly one `.claude-plugin/marketplace.json`.

**D3 — one generator, two projections.** `scripts/src/marketplace.ts` already
builds every entry through one `entry()` function whose only variable part is
`source`. Dev mode changes that one field. A second generator file would
duplicate the header, the sort order and the field set, and the two would drift
on the first plugin that adds a field.

**D4 — no checker change.** `readPlugins()` globs `*/.claude-plugin/plugin.json`
against an **explicitly passed** `plugins/` root, so `plugins:check` never walks
`.dev-marketplace/` and cannot double-count a plugin through the symlink.
Verified by reading `scripts/src/plugins.ts:91`.

**D5 — dprint needs an exclude.** Its existing `plugins/**/*.md` exclude keeps
the authored plugin markdown unformatted (`CLAUDE.md` calls this out as a trap).
That glob does **not** match `.dev-marketplace/plugins/**/*.md`, so the
formatter could reach the same files through the symlink and reformat a tree
that is deliberately hand-folded. Add `.dev-marketplace/` to `excludes` and
verify by running the formatter, not by reasoning about whether dprint follows
symlinks.

---

## E. The work

Small enough to be one commit, in this order:

1. **`scripts/src/marketplace.ts`** — a `dev` projection: `entry()` takes the
   mode, emits `"./plugins/<dir>"` instead of the `git-subdir` object, and the
   header's `description` differs. `buildManifest` grows the same parameter.
   Unit tests alongside the existing ones: both projections from one fixture,
   asserting they differ in `source` **and nothing else**.
2. **`.config/mise/tasks/plugins/marketplace`** — a `--dev` flag writing
   `.dev-marketplace/.claude-plugin/marketplace.json`, and `--check` extended to
   cover it. Creating the symlink belongs here too, idempotently: the task is
   what makes a fresh clone work.
3. **`dprint.json`** — the `.dev-marketplace/` exclude (D5), verified by running
   `code:format`.
4. **`.gitignore`** — nothing, per D1. Confirm the symlink commits as a symlink
   (mode `120000`) rather than as a copied directory.
5. **Docs, in the same commit** per the repo's docs-ship-with-the-change rule:
   `CLAUDE.md`'s "**One file is generated**" sentence and its tree diagram
   become two; `.claude/docs/repo-shape.md` (the authored-tree section and the
   task list); `.claude/docs/plugins.md` (the generated-manifest section);
   `.claude/docs/ci-and-releases.md` (the branch model gains the dev-marketplace
   escape, and must say plainly that it changes nothing about tags); and
   `docs/how-to/` gains the setup and refresh loop from §F.

**Not a version bump.** No plugin's behaviour changes, so neither manifest's
`version` moves and no tag is implied. `plugins:marketplace --check` stays green
on the published file throughout.

---

## F. The loop, stated honestly

One time per machine:

```sh
mise run plugins:marketplace --dev
claude plugin marketplace remove virajp-plugins
claude plugin marketplace add /abs/path/to/ai-plugins/.dev-marketplace
claude plugin install vwf@virajp-plugins --scope user
```

After changing a plugin:

```sh
claude plugin uninstall vwf@virajp-plugins
claude plugin install  vwf@virajp-plugins --scope user
```

**Uninstall-then-install, not `plugin update`, and this is measured rather than
assumed.** With the source edited and the version unchanged, `plugin update`
reports `✔ vwf is already at the latest version (19.9.1)` and copies nothing —
the edit does not reach the cache. Uninstall-then-install does. `plugin update`
becomes correct again only when the version bumps, because the cache path is
keyed by version.

This is the repo's existing
[`2026-08-26-vwf-edits-do-not-reach-the-running-tools`](../memory/gaps/2026-08-26-vwf-edits-do-not-reach-the-running-tools.md)
gap, and this plan **does not close it** — it gives it a precise reproduction
and a one-line workaround. Worth a `code:reload`-style task wrapping the two
commands, but that is a convenience, not this plan.

---

## G. What this does not fix

- **Users still see nothing.** The published manifest still names `vwf-v19.9.1`
  and `stackgen-v0.19.0`, neither of which is tagged. The dissolution reaches
  users when `develop` merges to `main` and `plugins:release` runs — unchanged
  by this plan, and deliberately so.
- **Live editing.** §F. The install is a copy; there is no watch mode.
- **A second machine.** The `marketplace add` is per-machine local state. The
  committed manifest and task make it one command, not zero.

---

## H. Risks

**Two files in one repo claim the name `virajp-plugins`.** This is the real
cost, and §B makes it unavoidable — the dependency edge resolves by name. The
mitigations are that only one can be registered at a time, the directory name
says what it is, and the dev manifest's `description` says it again. The failure
mode to fear is someone registering the dev marketplace *on a user's machine*,
where the relative source would resolve against a directory with no `plugins/`
and simply fail to install — loudly, which is the good case.

**The symlink is the kind of thing tooling walks by accident.** D4 clears the
checker and D5 clears dprint, but gitleaks, pre-commit's own file globs and
`code:count` all walk the tree too, and a tool that follows the symlink sees
every plugin file twice. Each needs checking against a real run rather than by
reading its config.

**A committed symlink is a portability edge.** It is relative, so it survives a
clone on macOS and Linux; on a Windows checkout without developer mode git
writes it as a text file and the marketplace silently resolves to nothing. No
Windows support is claimed anywhere in this repo, so this is recorded rather
than handled.

**Registering the dev marketplace replaces the user-facing one on this
machine.** After the swap, the authoring machine can no longer verify what a
*user* gets by installing — which is exactly what
`.claude/agents/target-verifier.md` exists for. That agent runs hermetically in
its own config dir, so it is unaffected; the point is that the machine's own
`claude plugin list` stops being evidence about the published path, which the
`maintainer-machine-not-evidence` memory already warns about generally.

---

## I. Out of scope

- **Closing the edit-does-not-reach gap.** §F documents the workaround. A
  `code:reload` task, or asking the host for a version-independent refresh, is
  its own change.
- **Cutting the two pending tags.** A release decision, not a tooling one.
- **A `ref: develop` variant.** §B shows it works and §B's table says why the
  working-tree mechanism was chosen instead. If the symlink turns out to cost
  more than §H estimates, this is the fallback, and it needs no symlink.
- **Doing the same for the installer CLI.** `@askviraj/ai-plugins` is an npm
  package with its own tag family; `pnpm link` already covers local development
  and nothing about it is broken.
