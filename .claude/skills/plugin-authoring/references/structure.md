# Plugin structure — the manifest, the tree, the marketplace

**Repo-only doctrine.** How a plugin is packaged and registered is this repo's
business and is deliberately not distributed: nobody outside builds plugins
here. What *is* distributed — the rules deciding whether a skill, agent or hook
is valid — lives in stackgen's `plugins/stackgen/assets/artifact-doctrine.md`,
because stackgen generates those artifacts and gates them against it.

## The authored tree

Everything a plugin holds is discovered **by directory convention**, so adding
any of it is a single file and the manifest names none of it:

| Path                         | Is                                                       |
| ---------------------------- | -------------------------------------------------------- |
| `.claude-plugin/plugin.json` | the manifest — name, version, description, servers, deps |
| `skills/<name>/SKILL.md`     | a skill; auto-discovered                                 |
| `skills/<name>/references/`  | on-demand prose the SKILL.md points at                   |
| `agents/<name>.md`           | a subagent; auto-discovered                              |
| `hooks/hooks.json`           | hooks, plus the scripts beside them                      |
| `assets/`                    | shared doctrine and data the skills read                 |
| `stacks/`                    | pack and bundle data, on stackgen                        |
| `vendor/`                    | provenance for vendored third-party skills               |

**Discovery by path cuts both ways.** Registering nothing is the upside; the
downside is that a file in the wrong place is not an error — it is simply never
discovered, and nothing says so.

**Plugin hooks are never written to `settings.json`.** They are auto-discovered
from `hooks/hooks.json` and loaded in memory at session start. Verify what is
active with `/hooks`; inspecting `settings.json` shows nothing and proves
nothing. (This is the one place plugin structure and `.claude/` structure
genuinely differ — a repo's own hooks *do* live in `settings.json`.)

## Versions

A plugin's `version` is what an install pins to and what `claude plugin update`
compares — **bump it to ship a change**, or the marketplace keeps advertising
the old one and nobody's update does anything. Plugin and skill version numbers
are independent by design; a plugin may hold skills versioned on their own
cadence, so nothing cross-checks them.

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
`optIn`, no `userOnly`, and no `requires`. Scope is whichever `--scope` the user
passes to `claude plugin install`; there is no default set to be in or out of.
In particular there is **no way to gate an install on a binary being present** —
a plugin that shells out to something has to surface its absence at run time, as
its own diagnostic, because nothing will refuse the install.

**Skills, agents and hooks are never listed here.** They are discovered by
directory convention, so the manifest names none of them and adding one is a
single file.

Optional blocks:

- **`lspServers`** — keyed by language id; each needs `command`, `args` and
  `extensions`, optionally `startupTimeout`.
- **`mcpServers`** — keyed by name, declaring a transport. **Which transport,
  and why it is load-bearing rather than stylistic, is artifact doctrine** and
  lives in stackgen's `assets/artifact-doctrine.md` §5; this file covers only
  that the manifest block exists.
- **`dependencies`** — objects of `{marketplace, name}`. When the parent is
  enabled, Claude auto-installs and auto-enables them at the same scope. A
  dependency may name another marketplace, but **cross-marketplace deps are
  blocked at install time** unless the **root** marketplace allowlists it via
  `allowCrossMarketplaceDependenciesOn` — and that is not transitive, only the
  installing marketplace's allowlist applies. Keeping deps inside your own
  marketplace avoids the whole question.
- **`keywords`** — projected to `tags` in the marketplace entry, which is the
  spelling that schema uses.

**Auto-enable is event-driven**, firing only when the parent is enabled — not on
a continuous reconcile. A dependency disabled on its own stays disabled;
re-enable it directly, or toggle the parent off and on.

## The marketplace entry

A marketplace is one `marketplace.json` holding a header and one entry per
plugin, each with a `source`. Two traps ride on it, both silent when wrong:

- **Sources resolve against the marketplace root**, not the repo root. A path
  spelled from the repo root can exist and still resolve nowhere the tool looks,
  so every install fails while the manifest reads fine. This is not a class a
  validator catches — the path exists, just not from that base.
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
that needs to read the dependency's files at build or install time gets nothing.
**Vendoring** the handful of files you actually need, with provenance and the
version taken recorded beside them, is usually the better trade — the provenance
then ships with the code.
