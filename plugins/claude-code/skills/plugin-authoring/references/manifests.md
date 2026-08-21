# Manifests & the marketplace

## `plugin.json` — the manifest

One file per plugin at `<plugin>/.claude-plugin/plugin.json`, in Claude Code's
native format. Minimal form:

```json
{
  "$schema": "https://www.schemastore.org/claude-code-plugin-manifest.json",
  "name": "<plugin-name>",
  "version": "0.1.0",
  "description": "<one line>"
}
```

`$schema` is not decoration — it is what gives an editor the field list, and
that schema is the authority for the shape. Keep one key order across every
manifest in a marketplace: `$schema`, `name`, `version`, `description`,
`author`, `repository`, `keywords`, `dependencies`, `mcpServers`, `lspServers`.

**A manifest declares no install-time eligibility.** There is no `scope`, no
`optIn`, no `userOnly`, and no `requires`. Scope is whichever `--scope` the
user passes to `claude plugin install`; there is no default set to be in or out
of. In particular there is **no way to gate an install on a binary being
present** — a plugin that shells out to something has to surface its absence at
run time, as its own diagnostic, because nothing will refuse the install.

**Skills, agents and hooks are never listed here.** They are discovered by
directory convention, so the manifest names none of them and adding one is a
single file.

Optional blocks:

- **`lspServers`** — keyed by language id; each needs `command`, `args` and
  `extensions`, optionally `startupTimeout`.
- **`mcpServers`** — both transports are available, and the choice is
  load-bearing rather than stylistic. A **stdio** server is a child of the
  client: when it dies the connection stays dead for the rest of the session,
  and one process is spawned per session. An **http** server is a long-lived
  process you run yourself, so it reconnects, survives session restarts, and
  serves every client at once. Prefer stdio for a cheap stateless tool and http
  for anything holding a model, a store, or state shared across sessions.
- **`dependencies`** — objects of `{marketplace, name}`. When the parent is
  enabled, Claude auto-installs and auto-enables them at the same scope.
  A dependency may name another marketplace, but **cross-marketplace deps are
  blocked at install time** unless the **root** marketplace allowlists it via
  `allowCrossMarketplaceDependenciesOn` — and that is not transitive, only the
  installing marketplace's allowlist applies. Keeping deps inside your own
  marketplace avoids the whole question.
- **`keywords`** — projected to `tags` in the marketplace entry, which is the
  spelling that schema uses.

**Auto-enable is event-driven**, firing only when the parent is enabled — not
on a continuous reconcile. A dependency disabled on its own stays disabled;
re-enable it directly, or toggle the parent off and on.

## The marketplace entry

A marketplace is one `marketplace.json` holding a header and one entry per
plugin, each with a `source`. Two traps ride on it, both silent when wrong:

- **Sources resolve against the marketplace root**, not the repo root. A path
  spelled from the repo root can exist and still resolve nowhere the tool
  looks, so every install fails while the manifest reads fine. This is not a
  class a validator catches — the path exists, just not from that base.
- **Every entry must state its own `version`.** Omitting it does not leave the
  version unset: the tool falls back through a chain that resolves by accident,
  and the plugin lists as `0.0.0` with nothing failing.

**Generating the marketplace from the plugin manifests is worth the machinery**
— it makes it impossible for a plugin to be unregistered, orphaned, or to
disagree with its own entry, which is the exact drift a hand-written entry
beside a manifest creates. The cost is that the generated file is also
committed, so it needs a freshness gate of its own: a manifest edited without a
regenerate is invisible to every other check, and the committed manifest keeps
advertising the old version.

## Dependencies are one edit

Add the entry to `dependencies`. If the marketplace is generated, that is the
whole change — the entry follows. Resist url-sourced dependencies: they pin
every reader to whatever ref resolves, and they have no local tree, so anything
that needs to read the dependency's files at build or install time gets
nothing. **Vendoring** the handful of files you actually need, with provenance
and the version taken recorded beside them, is usually the better trade — the
provenance then ships with the code.
